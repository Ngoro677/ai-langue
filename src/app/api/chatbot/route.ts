import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getKnowledgeDocuments } from '@/lib/knowledgeBase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';

// Normaliser le texte (supprimer accents pour meilleure correspondance)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^\w\s]/g, ' '); // Remplacer les caractères spéciaux par des espaces
}

// Nettoyer les réponses pour supprimer les markdown et formater proprement
function cleanResponse(response: string): string {
  return response
    .split('\n')
    .map(line => {
      line = line.replace(/^##+\s*/g, '').replace(/^#\s+/g, '');
      return line;
    })
    .join('\n')
    .replace(/##\s*/g, '')
    .replace(/^#\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^-\s+/gm, '• ')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
}

// Détection de langue automatique
function detectLanguage(text: string): 'fr' | 'en' | 'mga' {
  const normalized = normalizeText(text);
  
  const mgaKeywords = ['ahoana', 'inona', 'iza', 'aiza', 'firy', 'manao', 'tena', 'tsara', 'mazoto', 'afaka', 'miarahaba', 'miala', 'azafady', 'misaotra', 'manambady', 've', 'izy'];
  const enKeywords = ['what', 'how', 'where', 'when', 'why', 'who', 'can', 'do', 'does', 'is', 'are', 'hello', 'hi', 'skill', 'skills', 'capable', 'good', 'expert'];
  const frKeywords = ['bonjour', 'salut', 'comment', 'quoi', 'qui', 'où', 'quand', 'pourquoi', 'peux', 'peut', 'est', 'sont', 'compétence', 'capacité', 'doué', 'capable'];
  
  const mgaScore = mgaKeywords.filter(kw => normalized.includes(kw)).length;
  const enScore = enKeywords.filter(kw => normalized.includes(kw)).length;
  const frScore = frKeywords.filter(kw => normalized.includes(kw)).length;
  
  if (mgaScore > enScore && mgaScore > frScore) return 'mga';
  if (enScore > frScore) return 'en';
  return 'fr';
}

// Vérifier si une question est hors du scope du portfolio (questions personnelles uniquement)
function isOutOfScope(question: string): boolean {
  const normalized = normalizeText(question);
  const originalLower = question.toLowerCase();
  
  // Exclure les questions sur l'expérience professionnelle qui sont pertinentes
  const isExperienceQuestion = normalized.match(/(experience|experiences|annee|annees|ans|years|traikefa|combien.*ans|how many years)/i);
  
  // Mots-clés personnels/privés
  const personalKeywords = [
    'marie', 'mariee', 'married', 'marry', 'spouse', 'wife', 'husband', 'conjoint', 'conjointe', 'manambady',
    'fils', 'fille', 'enfant', 'enfants', 'child', 'children', 'son', 'daughter', 'zaza', 'zanaka',
    'age', 'âge', 'old', 'how old', 'taona', 'firy taona',
    'famille', 'family', 'parents', 'mere', 'pere', 'mother', 'father', 'ray', 'reny',
    'adresse', 'address', 'domicile', 'residence', 'toerana', 'toeram-ponenana',
    'salaire', 'salary', 'revenu', 'income', 'karama', 'combien.*gagne', 'how much.*earn',
    'hobby', 'loisir', 'passe-temps', 'passion personnelle', 'fialamboly',
    'météo', 'weather', 'actualité', 'news', 'politique', 'sport', 'cuisine', 'recette',
    'film', 'movie', 'musique', 'music', 'livre', 'book'
  ];
  
  const isPersonalQuestion = personalKeywords.some(keyword => {
    const regex = new RegExp(keyword.replace(/\*/g, '.*'), 'i');
    return regex.test(normalized) || regex.test(originalLower);
  });
  
  if (!isExperienceQuestion && isPersonalQuestion) {
    return true;
  }
  
  return false;
}

// Dictionnaire de synonymes pour améliorer la recherche
const synonyms: { [key: string]: string[] } = {
  'competence': ['compétence', 'competence', 'compétences', 'savoir', 'sait', 'technologie', 'technologies', 'skill', 'skills', 'doué', 'bon en', 'expert', 'expertise', 'capable', 'capacité', 'capacités'],
  'projet': ['projet', 'projets', 'travail', 'travaux', 'réalisation', 'réalisations', 'work', 'works'],
  'contact': ['contact', 'contacter', 'email', 'mail', 'téléphone', 'telephone', 'phone', 'adresse', 'address'],
  'experience': ['expérience', 'experience', 'expériences', 'experiences', 'année', 'annee', 'ans', 'années', 'annees', 'carrière', 'carriere', 'year', 'years', 'travaille', 'travail', 'entreprise', 'entreprises'],
  'diplome': ['diplôme', 'diplome', 'diplômes', 'diplomes', 'formation', 'formations', 'éducation', 'education', 'parcours', 'académique', 'academique'],
  'technologie': ['technologie', 'technologies', 'tech', 'outil', 'outils', 'langage', 'langages', 'framework', 'frameworks'],
};

// Recherche améliorée par mots-clés pour le RAG avec synonymes
function searchByKeywords(query: string, documents: string[], k: number = 8): string[] {
  const normalizedQuery = normalizeText(query);
  const originalQuery = query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  
  const queryPhrases = [
    normalizedQuery,
    ...queryWords.slice(0, 3).map((_, i) => queryWords.slice(i, i + 3).join(' '))
  ];
  
  const expandedKeywords: string[] = [];
  queryWords.forEach(word => {
    expandedKeywords.push(word);
    Object.keys(synonyms).forEach(key => {
      if (synonyms[key].some(syn => normalizeText(syn) === word || word.includes(key))) {
        synonyms[key].forEach(syn => expandedKeywords.push(normalizeText(syn)));
        expandedKeywords.push(key);
      }
    });
  });
  
  const scoredDocs = documents.map((doc, index) => {
    const normalizedDoc = normalizeText(doc);
    const originalDoc = doc.toLowerCase();
    let score = 0;
    
    queryPhrases.forEach(phrase => {
      if (phrase.length > 5 && normalizedDoc.includes(phrase)) {
        score += 10;
      }
    });
    
    expandedKeywords.forEach((keyword) => {
      if (keyword.length > 2) {
        if (normalizedDoc.includes(keyword)) {
          score += 4;
        }
        const matches = (normalizedDoc.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 2;
      }
    });
    
    if (doc.includes('##')) {
      const sectionTitle = doc.split('##')[1]?.split('\n')[0]?.toLowerCase() || '';
      if (queryWords.some(qw => sectionTitle.includes(normalizeText(qw)))) {
        score += 8;
      }
    }
    
    const projectNames = ['ilodesk', 'digitheque', 'sarakodev', 'raitra', 'ca2e', 'congé', 'gta', 'smart dashboard', 'portfolio', 'ilomad'];
    projectNames.forEach(projectName => {
      if (originalQuery.includes(projectName) && originalDoc.includes(projectName)) {
        score += 15;
      }
    });
    
    const companyNames = ['ilomad', 'takalou', 'ca2e', 'paositra', 'malagasy', 'e-atiala'];
    companyNames.forEach(companyName => {
      if (originalQuery.includes(companyName) && originalDoc.includes(companyName)) {
        score += 15;
      }
    });
    
    const techNames = ['react', 'next.js', 'angular', 'node.js', 'nestjs', 'typescript', 'javascript', 'tailwind', 'figma', 'adobe'];
    techNames.forEach(techName => {
      if (originalQuery.includes(techName) && originalDoc.includes(techName)) {
        score += 12;
      }
    });
    
    return { doc, score, index };
  });
  
  const relevantDocs = scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  
  return relevantDocs.length > 0 
    ? relevantDocs.map((item) => item.doc)
    : documents.slice(0, k);
}

// Cache pour les embeddings et documents
let documentsCache: Array<{ content: string; embedding?: number[] }> = [];

// Fonction pour rechercher des documents pertinents avec RAG (embeddings OpenAI uniquement ; sans clé = recherche par mots-clés)
async function searchRelevantDocs(query: string, k: number = 8): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const knowledgeDocs = getKnowledgeDocuments();
  
  if (!apiKey) {
    const relevantDocs = searchByKeywords(query, knowledgeDocs, k);
    return relevantDocs.join('\n\n');
  }

  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    });

    if (documentsCache.length === 0) {
      const documents = knowledgeDocs.map((content) => ({ content }));
      
      const embeddingPromises = documents.map(async (doc) => {
        try {
          const embedding = await embeddings.embedQuery(doc.content);
          return { ...doc, embedding };
        } catch (error) {
          console.error('Erreur lors de la création de l\'embedding:', error);
          return doc;
        }
      });
      
      documentsCache = await Promise.all(embeddingPromises);
    }

    const queryEmbedding = await embeddings.embedQuery(query);

    const scoredDocs = documentsCache.map((doc) => {
      if (!doc.embedding) {
        return { doc: doc.content, score: 0 };
      }
      
      const dotProduct = queryEmbedding.reduce(
        (sum, val, i) => sum + val * (doc.embedding![i] || 0),
        0
      );
      const queryMagnitude = Math.sqrt(
        queryEmbedding.reduce((sum, val) => sum + val * val, 0)
      );
      const docMagnitude = Math.sqrt(
        doc.embedding!.reduce((sum, val) => sum + val * val, 0)
      );
      
      const score = dotProduct / (queryMagnitude * docMagnitude);
      return { doc: doc.content, score };
    });

    const topDocs = scoredDocs
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score > 0.3)
      .slice(0, k)
      .map((item) => item.doc);

    if (topDocs.length < 3) {
      const keywordDocs = searchByKeywords(query, knowledgeDocs, Math.max(3, k - topDocs.length));
      const combinedDocs = [...topDocs, ...keywordDocs.filter(doc => !topDocs.includes(doc))];
      return combinedDocs.slice(0, k).join('\n\n');
    }

    return topDocs.join('\n\n');
  } catch (error) {
    console.error('Erreur lors de la recherche avec embeddings:', error);
    const relevantDocs = searchByKeywords(query, knowledgeDocs, k);
    return relevantDocs.join('\n\n');
  }
}

// Réponse pour les questions hors scope
function getOutOfScopeResponse(language: 'fr' | 'en' | 'mga'): string {
  const responses = {
    fr: "Désolé, je ne peux répondre qu'aux questions concernant le portfolio professionnel de Sarobidy FIFALIANTSOA.\n\nJe peux vous aider avec :\n• Ses compétences techniques et savoir-faire\n• Ses projets réalisés (web, mobile, IA)\n• Son expérience professionnelle détaillée\n• Les technologies qu'il maîtrise\n• Ses diplômes et formations\n• Ses prix et distinctions\n• Comment le contacter professionnellement\n• Son CV\n• Les informations légales du site\n\nPour toute autre question, je vous invite à consulter directement le portfolio ou à le contacter via les informations de contact disponibles.",
    en: "Sorry, I can only answer questions about Sarobidy FIFALIANTSOA's professional portfolio.\n\nI can help you with:\n• His technical skills and capabilities\n• His completed projects (web, mobile, AI)\n• His detailed professional experience\n• The technologies he masters\n• His education and diplomas\n• His awards and distinctions\n• How to contact him professionally\n• His CV\n• Legal information about the site\n\nFor any other questions, I invite you to check the portfolio directly or contact him via the available contact information.",
    mga: "Miala tsiny, afaka mamaly fotsiny ny fanontaniana momba ny portfolio ara-piasana an'i Sarobidy FIFALIANTSOA aho.\n\nAfaka manampy anao amin'ny:\n• Ny fahaizany ara-teknika sy ny fahaizany\n• Ny tetikasany vita (web, mobile, IA)\n• Ny traikefany ara-piasana amin'ny antsipiriany\n• Ny teknologia izay mahay\n• Ny fianarany sy ny diplômes\n• Ny loka sy ny fankasitrahany\n• Ny fomba mifandraisa aminy ara-piasana\n• Ny CV\n• Ny vaovao ara-dalàna momba ny tranokala\n\nHo an'ny fanontaniana hafa, asaovy mijery ny portfolio mivantana na mifandraisa aminy amin'ny alalan'ny vaovao contact misy.",
  };
  return responses[language];
}

export async function POST(request: NextRequest) {
  try {
    const { message, language } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message invalide' },
        { status: 400 }
      );
    }

    // Détecter la langue de la question ou utiliser celle fournie
    const detectedLang = detectLanguage(message);
    const responseLang = (language || detectedLang) as 'fr' | 'en' | 'mga';

    // Vérifier si la question est hors scope (questions personnelles uniquement)
    if (isOutOfScope(message)) {
      return NextResponse.json({ 
        response: getOutOfScopeResponse(responseLang)
      });
    }

    // Utiliser GROQ en priorité, sinon OpenAI
    const groqApiKey = process.env.GROQ_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!groqApiKey && !openaiApiKey) {
      return NextResponse.json(
        { error: 'Clé API non configurée. Ajoutez GROQ_API_KEY ou OPENAI_API_KEY dans votre fichier .env (ou .env.local)' },
        { status: 500 }
      );
    }

    try {
      const chatModel = groqApiKey
        ? new ChatGroq({
            apiKey: groqApiKey,
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.7,
          })
        : new ChatOpenAI({
            openAIApiKey: openaiApiKey,
            modelName: 'gpt-4o-mini',
            temperature: 0.7,
          });

      // Rechercher des documents pertinents avec RAG
      const relevantDocs = await searchRelevantDocs(message, 10);

      // Instructions de langue pour le prompt
      const langInstructions = {
        fr: 'Réponds TOUJOURS en français. Utilise un langage professionnel, naturel et amical. Sois courtois et engageant.',
        en: 'Answer ALWAYS in English. Use professional, natural and friendly language. Be courteous and engaging.',
        mga: 'Mamaly FOANA amin\'ny fiteny malagasy. Ampiasao ny fiteny malagasy tsara sy mahalala fomba. Mampiasa fiteny tsotra sy namana.',
      };

      // Créer le prompt système intelligent pour OpenAI
      const systemPrompt = `Tu es un assistant IA intelligent, professionnel et amical qui aide les visiteurs du portfolio de Sarobidy FIFALIANTSOA.

TON RÔLE:
- Comprendre intelligemment toutes les questions des utilisateurs, même si elles sont formulées de manière informelle ou avec des fautes
- Répondre de manière naturelle, professionnelle et engageante
- Utiliser TOUJOURS les informations du contexte fourni ci-dessous pour répondre
- Adapter ta réponse selon le contexte de la conversation

RÈGLES IMPORTANTES:

1. COMPRÉHENSION INTELLIGENTE:
   - Comprends les questions même si elles sont mal formulées, avec des fautes d'orthographe, ou de manière informelle
   - Détecte l'intention derrière chaque question, même si elle n'est pas explicite
   - Pour les questions ambiguës, demande une clarification polie ou propose plusieurs interprétations
   - Comprends les questions de suivi et le contexte de la conversation

2. UTILISATION DU CONTEXTE:
   - Utilise ABSOLUMENT les informations du contexte ci-dessous pour répondre
   - Ne donne JAMAIS de réponses génériques si le contexte contient des informations spécifiques
   - Cite les technologies, projets, entreprises, dates et compétences EXACTEMENT comme mentionnés dans le contexte
   - Si l'information demandée n'existe PAS dans le contexte, dis clairement: "Désolé, je n'ai pas cette information précise dans le portfolio. Je peux vous aider avec [liste des sujets disponibles]."
   - Pour les questions sur un projet spécifique, cite TOUTES les informations disponibles (technologies, description, URL, dates)
   - Pour les questions sur une technologie, cite TOUS les projets qui l'utilisent si mentionnés dans le contexte
   - Pour les questions sur l'expérience, cite les entreprises, dates, responsabilités et résultats EXACTEMENT comme dans le contexte

3. GESTION DES LIENS ET RÉFÉRENCES:
   - Pour les sections du portfolio, utilise ce format: <a href="#projet" data-section-id="projet" class="section-link text-yellow-400 hover:text-yellow-300 underline font-semibold cursor-pointer transition-colors">section Projets</a>
   - Pour le CV, utilise ce format: <a href="/cv.pdf" download="CV_Sarobidy_Fifaliantsoa.pdf" class="cv-link text-yellow-400 hover:text-yellow-300 underline font-semibold cursor-pointer transition-colors">Télécharger le CV</a>
   - Adapte le texte du lien selon la langue (fr/en/mga)

4. FORMAT DE RÉPONSE:
   ${langInstructions[responseLang]}
   - Sois naturel, pas robotique
   - Varie tes formulations pour éviter la répétition
   - Utilise des listes à puces (•) pour organiser l'information
   - Sois concis mais complet
   - Pour les salutations, réponds chaleureusement et présente brièvement ce que tu peux faire
   - Pour les questions de suivi ("autre ?", "encore ?", "plus ?"), sois proactif et suggère des sujets pertinents

5. EXEMPLES DE BONNES RÉPONSES:
   - Question: "quelles sont ses compétences?" → Liste toutes les technologies et outils du contexte avec leurs niveaux de maîtrise
   - Question: "quels projets a-t-il fait?" → Cite tous les projets du contexte avec leurs technologies et descriptions
   - Question: "il utilise react?" → Liste TOUS les projets du contexte qui utilisent React avec leurs détails
   - Question: "parle-moi du projet Ilodesk" → Donne TOUTES les informations disponibles sur ce projet (description, technologies, URL, dates)
   - Question: "combien d'années d'expérience?" → Utilise l'information du contexte (3+ ans d'expérience professionnelle)
   - Question: "où a-t-il travaillé?" → Cite TOUTES les expériences professionnelles avec entreprises, dates et responsabilités
   - Question: "montrer le CV" → Fournis le lien de téléchargement avec le format HTML correct
   - Question: "bonjour" → Salue chaleureusement et présente brièvement ce que tu peux faire

6. QUESTIONS HORS SCOPE (déjà filtrées, mais au cas où):
   - Si on te pose une question personnelle (mariage, âge, enfants, salaire, etc.), réponds poliment que tu ne peux répondre qu'aux questions professionnelles

CONTEXTE DU PORTFOLIO (informations pertinentes):
{context}`;

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', '{question}'],
      ]);

      const chain = RunnableSequence.from([
        {
          context: () => relevantDocs,
          question: (input: { question: string }) => input.question,
        },
        prompt,
        chatModel,
        new StringOutputParser(),
      ]);

      const response = await chain.invoke({
        question: message,
      });

      // Nettoyer la réponse pour supprimer les markdown excessifs
      const cleanedResponse = cleanResponse(response);

      return NextResponse.json({ response: cleanedResponse });
    } catch (error) {
      console.error('Erreur avec le modèle de chat (Groq/OpenAI):', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Message d'erreur multilingue
      const errorResponses = {
        fr: `Désolé, une erreur est survenue lors du traitement de votre question. Veuillez réessayer. (Erreur: ${errorMessage})`,
        en: `Sorry, an error occurred while processing your question. Please try again. (Error: ${errorMessage})`,
        mga: `Miala tsiny, nisy olana niseho rehefa nandramana ny fanontanianao. Andramo indray azafady. (Olana: ${errorMessage})`,
      };
      
      return NextResponse.json(
        { 
          response: errorResponses[responseLang],
          error: errorMessage 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur générale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Une erreur est survenue', details: errorMessage },
      { status: 500 }
    );
  }
}
