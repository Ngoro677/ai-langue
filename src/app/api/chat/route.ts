import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const SYSTEM_PROMPT = `Tu es un assistant pédagogique pour l'apprentissage de trois langues UNIQUEMENT : français, anglais et malagasy.

RÔLE:
- Aider l'utilisateur à pratiquer et apprendre le français, l'anglais et le malagasy par le dialogue.
- Enseigner le vocabulaire, les verbes (conjugaison, temps), les expressions courantes.
- Corriger gentiment les fautes dans les messages de l'utilisateur (orthographe, grammaire, conjugaison) et proposer la forme correcte avec une brève explication si utile.
- Répondre de manière claire, encourageante et adaptée au niveau de l'utilisateur.
- Si l'utilisateur envoie un message vocal retranscrit avec des erreurs, interpréter l'intention et corriger la phrase si nécessaire en indiquant "Tu voulais peut-être dire : [phrase corrigée]".

RÈGLES:
- Ne répondre QUE sur l'apprentissage de ces trois langues. Pour toute autre langue ou sujet hors apprentissage, rediriger poliment vers le français, l'anglais ou le malagasy.
- Adapter ta langue de réponse selon la langue utilisée par l'utilisateur (FR / EN / MG). Si le message mélange les langues, répondre dans la langue principale du message.
- Pour les exercices ou exemples, utiliser des phrases courtes et utiles au quotidien.
- Sois concis tout en restant pédagogique. Utilise des listes à puces (•) quand tu donnes plusieurs éléments (verbes, mots de vocabulaire, etc.).
- Ne pas inventer de faits hors linguistique.`;


function buildConversationModePrompt(preferredLang: string): string {
  const langRule =
    preferredLang === 'en'
      ? 'RÉPONDS UNIQUEMENT EN ANGLAIS. Toutes tes réponses doivent être en anglais.'
      : preferredLang === 'mg'
        ? 'RÉPONDS UNIQUEMENT EN MALAGASY. Toutes tes réponses doivent être en malgache.'
        : 'RÉPONDS UNIQUEMENT EN FRANÇAIS. Toutes tes réponses doivent être en français.';
  return `Tu es un partenaire de dialogue pour pratiquer FR/EN/MG. MODE CONVERSATION (prioritaire) :
- ${langRule}
- Réponds UNIQUEMENT en 1 à 2 phrases courtes maximum. Pas de paragraphes, pas de listes.
- Si l'utilisateur a une faute de frappe ou grammaire simple : corrige brièvement avant ta réponse, ex. "Tu voulais dire : [phrase correcte]. [Ta réponse]"
- Garde les corrections ultra-courtes et efficaces. Pas d'explication longue.
- Débat et échange rapide : réplique concise, comme dans une vraie conversation.`;
}

function buildVoiceModeAddon(preferredLang: string): string {
  const langRule =
    preferredLang === 'en'
      ? 'Réponds en ANGLAIS uniquement.'
      : preferredLang === 'mg'
        ? 'Réponds en MALAGASY uniquement.'
        : 'Réponds en FRANÇAIS uniquement.';
  return `
CONTRRAINTE MODE VOCAL (prioritaire) : ${langRule} Réponds UNIQUEMENT en une seule phrase courte, comme dans une conversation téléphonique. Maximum 1 à 2 phrases courtes. Pas de listes à puces, pas de paragraphes, pas de tirets. Une réplique orale brève pour enchaîner vite.`;
}

function cleanResponse(response: string, voiceMode = false): string {
  let out = response
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
  if (voiceMode) {
    const parts = out.split(/(?<=[.!?])\s+/);
    const first = parts[0]?.trim() ?? '';
    const second = parts[1]?.trim();
    const end = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
    out = second ? `${end(first)} ${end(second)}` : (first ? end(first) : out.slice(0, 120));
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [], voiceMode = false, conversationMode = false, preferredLanguage = 'fr', inactivityRelance = false } = body as {
      message?: string;
      history?: { role: string; content: string }[];
      voiceMode?: boolean;
      conversationMode?: boolean;
      preferredLanguage?: 'fr' | 'en' | 'mg';
      inactivityRelance?: boolean;
    };

    const lang = preferredLanguage === 'en' || preferredLanguage === 'mg' ? preferredLanguage : 'fr';
    const question = inactivityRelance
      ? `L'utilisateur n'a pas parlé depuis 2 minutes. Envoie UNIQUEMENT une phrase courte et bienveillante pour le relancer à parler. Réponds dans la langue: ${lang === 'en' ? 'anglais' : lang === 'mg' ? 'malgache' : 'français'}.`
      : (message ?? '');

    if (typeof question !== 'string' || (!inactivityRelance && !question.trim())) {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 });
    }
    const systemPrompt = conversationMode
      ? buildConversationModePrompt(lang)
      : voiceMode
        ? SYSTEM_PROMPT + buildVoiceModeAddon(lang)
        : SYSTEM_PROMPT;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY non configurée dans .env' },
        { status: 500 }
      );
    }

    const chatModel = new ChatGroq({
      apiKey: groqApiKey,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.6,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ...(Array.isArray(history) && history.length > 0
        ? history.slice(-12).map((m: { role: string; content: string }) => [m.role === 'assistant' ? 'ai' : 'human', m.content] as [string, string])
        : []),
      ['human', '{question}'],
    ]);

    const chain = RunnableSequence.from([
      prompt,
      chatModel,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({ question });
    const cleaned = cleanResponse(response, voiceMode || conversationMode);

    return NextResponse.json({ response: cleaned });
  } catch (error) {
    console.error('Erreur API chat:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Une erreur est survenue', details: msg },
      { status: 500 }
    );
  }
}
