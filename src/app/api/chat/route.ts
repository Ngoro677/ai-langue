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

function cleanResponse(response: string): string {
  return response
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body as { message?: string; history?: { role: string; content: string }[] };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 });
    }

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
      ['system', SYSTEM_PROMPT],
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

    const response = await chain.invoke({ question: message });
    const cleaned = cleanResponse(response);

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
