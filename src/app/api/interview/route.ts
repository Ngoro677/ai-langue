import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import type { InterviewRole, InterviewTech } from '@/components/InterviewSelectModal';

const TECH_LABELS: Record<InterviewTech, string> = {
  react: 'React',
  next: 'Next.js',
  angular: 'Angular',
  vue: 'Vue.js',
  'php-laravel': 'PHP (Laravel)',
  node: 'Node.js',
  nest: 'Nest.js',
  express: 'Express',
  fastapi: 'FastAPI',
  'ia-base': 'Machine Learning, Deep Learning, LLM',
};

function buildInterviewPrompt(role: InterviewRole, techs: InterviewTech[]): string {
  const techList = techs.map((t) => TECH_LABELS[t] || t).join(', ');
  const roleDesc =
    role === 'frontend'
      ? `poste FRONTEND développeur. Technologies ciblées : ${techList}`
      : role === 'backend'
        ? `poste BACKEND développeur. Technologies ciblées : ${techList}`
        : role === 'fullstack'
          ? `poste FULLSTACK développeur. Stack : ${techList}`
          : `poste en INTELLIGENCE ARTIFICIELLE / Machine Learning. Sujets : ${techList}`;

  return `Tu es un RECRUTEUR technique professionnel qui conduit un entretien oral pour un ${roleDesc}.

RÔLE:
- Tu poses des questions d'entretien techniques adaptées au poste et aux technologies choisies.
- Tu évalues les réponses du candidat de manière bienveillante mais exigeante.
- Tu enchaînes avec des questions de suivi (approfondissement, cas pratiques, comportemental).
- Tu peux donner un court feedback sur une réponse, puis passer à la question suivante.

RÈGLES:
- Réponds UNIQUEMENT en français.
- Réponds en 1 à 3 phrases courtes maximum (mode vocal, conversation naturelle).
- Pas de listes à puces, pas de paragraphes longs.
- Alterne entre : poser une question, faire un suivi, donner un micro-feedback.
- Sois professionnel, courtois et encourageant.
- Adapte le niveau des questions (junior à senior) selon les réponses du candidat.`;
}

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
    const {
      message,
      history = [],
      role = 'frontend',
      techs = [],
      inactivityRelance = false,
    } = body as {
      message?: string;
      history?: { role: string; content: string }[];
      role?: InterviewRole;
      techs?: InterviewTech[];
      inactivityRelance?: boolean;
    };

    const question = inactivityRelance
      ? "Le candidat n'a pas parlé depuis 2 minutes. Envoie UNIQUEMENT une phrase courte et bienveillante pour le relancer à répondre. Reste professionnel et encourageant."
      : message;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 });
    }

    // Utiliser GROQ_API_KEY ou AGENT_AUDIO_KEY en fallback (pour cohérence avec .env)
    const groqApiKey = process.env.GROQ_API_KEY || process.env.AGENT_AUDIO_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY ou AGENT_AUDIO_KEY non configurée dans .env' },
        { status: 500 }
      );
    }

    const model = process.env.GROQ_MODEL || process.env.AGENT_AUDIO_MODEL || 'llama-3.3-70b-versatile';

    const chatModel = new ChatGroq({
      apiKey: groqApiKey,
      model,
      temperature: 0.6,
    });

    const systemPrompt = buildInterviewPrompt(role, Array.isArray(techs) ? techs : []);

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ...(Array.isArray(history) && history.length > 0
        ? history.slice(-10).map((m: { role: string; content: string }) =>
            [m.role === 'assistant' ? 'ai' : 'human', m.content] as [string, string]
          )
        : []),
      ['human', '{question}'],
    ]);

    const chain = RunnableSequence.from([
      prompt,
      chatModel,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({ question });
    const cleaned = cleanResponse(response);

    return NextResponse.json({ response: cleaned });
  } catch (error) {
    console.error('Erreur API interview:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Une erreur est survenue', details: msg },
      { status: 500 }
    );
  }
}
