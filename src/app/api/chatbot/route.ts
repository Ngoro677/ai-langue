import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
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

// Dictionnaire de synonymes pour améliorer la recherche
const synonyms: { [key: string]: string[] } = {
  'competence': ['compétence', 'competence', 'compétences', 'compétences', 'savoir', 'sait', 'technologie', 'technologies', 'skill', 'skills'],
  'projet': ['projet', 'projets', 'travail', 'travaux', 'réalisation', 'réalisations', 'realisation'],
  'contact': ['contact', 'contacter', 'email', 'mail', 'téléphone', 'telephone', 'phone', 'adresse'],
  'experience': ['expérience', 'experience', 'année', 'annee', 'ans', 'années', 'annees', 'carrière', 'carriere'],
  'technologie': ['technologie', 'technologies', 'tech', 'outil', 'outils', 'langage', 'langages', 'framework', 'frameworks'],
};

// Recherche simple par mots-clés pour le RAG avec synonymes
function searchByKeywords(query: string, documents: string[], k: number = 3): string[] {
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Étendre les mots-clés avec leurs synonymes
  const expandedKeywords: string[] = [];
  queryWords.forEach(word => {
    expandedKeywords.push(word);
    // Chercher des synonymes
    Object.keys(synonyms).forEach(key => {
      if (synonyms[key].some(syn => normalizeText(syn) === word || word.includes(key))) {
        synonyms[key].forEach(syn => expandedKeywords.push(normalizeText(syn)));
        expandedKeywords.push(key);
      }
    });
  });
  
  // Score chaque document basé sur les mots-clés
  const scoredDocs = documents.map((doc, index) => {
    const normalizedDoc = normalizeText(doc);
    let score = 0;
    
    expandedKeywords.forEach((keyword) => {
      if (keyword.length > 2) {
        // Correspondance exacte
        if (normalizedDoc.includes(keyword)) {
          score += 3;
        }
        // Correspondance partielle
        const matches = (normalizedDoc.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2;
      }
    });
    
    // Bonus si le titre de section correspond
    if (doc.includes('##') && queryWords.some(qw => normalizedDoc.includes(qw))) {
      score += 5;
    }
    
    return { doc, score, index };
  });
  
  // Trier par score et retourner les top k (minimum score > 0)
  const relevantDocs = scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  
  // Si aucun document pertinent, retourner les documents de compétences par défaut pour certaines requêtes
  if (relevantDocs.length === 0) {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('competence') || lowerQuery.includes('compétence') || lowerQuery.includes('technologie') || lowerQuery.includes('sait')) {
      const competenceDocs = documents.filter(doc => 
        normalizeText(doc).includes('competence') || normalizeText(doc).includes('technologie')
      );
      return competenceDocs.slice(0, k);
    }
  }
  
  return relevantDocs.length > 0 
    ? relevantDocs.map((item) => item.doc)
    : documents.slice(0, k); // Fallback si vraiment rien ne correspond
}

// Cache pour les embeddings et documents
let documentsCache: Array<{ content: string; embedding?: number[] }> = [];

// Initialisation du LLM (OpenAI ou alternative)
let chatModel: ChatOpenAI;

// Fonction pour rechercher des documents pertinents avec RAG
async function searchRelevantDocs(query: string, k: number = 3): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const knowledgeDocs = getKnowledgeDocuments();
  
  // Si pas de clé API, utiliser recherche par mots-clés
  if (!apiKey) {
    const relevantDocs = searchByKeywords(query, knowledgeDocs, k);
    return relevantDocs.join('\n\n');
  }

  try {
    // Essayer d'utiliser les embeddings OpenAI pour une meilleure recherche
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    });

    // Si le cache n'est pas initialisé, créer les embeddings
    if (documentsCache.length === 0) {
      const documents = knowledgeDocs.map((content) => ({
        content,
      }));
      
      // Créer les embeddings pour tous les documents
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

    // Créer l'embedding pour la requête
    const queryEmbedding = await embeddings.embedQuery(query);

    // Calculer la similarité cosinus
    const scoredDocs = documentsCache.map((doc) => {
      if (!doc.embedding) {
        return { doc: doc.content, score: 0 };
      }
      
      // Similarité cosinus
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

    // Trier par score et retourner les top k
    const topDocs = scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((item) => item.doc);

    return topDocs.join('\n\n');
  } catch (error) {
    console.error('Erreur lors de la recherche avec embeddings:', error);
    // Fallback vers recherche par mots-clés
    const relevantDocs = searchByKeywords(query, knowledgeDocs, k);
    return relevantDocs.join('\n\n');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message invalide' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Si pas de clé API OpenAI, utiliser une réponse basique
    if (!apiKey) {
      const basicResponse = generateBasicResponse(message);
      return NextResponse.json({ response: basicResponse });
    }

    try {
      // Initialiser le modèle de chat
      if (!chatModel) {
        chatModel = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
        });
      }

      // Rechercher des documents pertinents avec RAG (augmenter à 5 pour plus de contexte)
      const relevantDocs = await searchRelevantDocs(message, 5);

      // Créer le prompt avec contexte RAG
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Tu es un assistant IA professionnel qui aide les visiteurs du portfolio de Fifaliantsoa Sarobidy.

IMPORTANT: Tu dois absolument utiliser les informations du contexte ci-dessous pour répondre aux questions. Ne donne pas de réponses génériques si le contexte contient des informations spécifiques.

Contexte du portfolio (informations pertinentes):
{context}

Instructions strictes:
- Réponds TOUJOURS en français
- Sois courtois et professionnel
- Utilise UNIQUEMENT les informations fournies dans le contexte ci-dessus pour répondre
- Si la question concerne les compétences, technologies ou savoir-faire, cite les technologies et outils spécifiques mentionnés dans le contexte
- Si la question concerne les projets, parle des types de projets mentionnés dans le contexte
- Si la question concerne l'expérience, utilise les détails d'expérience mentionnés dans le contexte
- Si le contexte ne contient pas l'information exacte demandée, dis-le honnêtement mais propose ce qui est disponible dans le contexte
- Reste concis mais informatif et spécifique
- NE RÉPÈTE PAS simplement que tu es là pour aider - réponds directement à la question posée avec les informations du contexte`,
        ],
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

      return NextResponse.json({ response });
    } catch (error) {
      console.error('Erreur avec OpenAI:', error);
      
      // Fallback vers une réponse basique
      const basicResponse = generateBasicResponse(message);
      return NextResponse.json({ response: basicResponse });
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

// Fonction de fallback pour générer des réponses basiques sans API en utilisant la base de connaissances
function generateBasicResponse(message: string): string {
  const normalizedMessage = normalizeText(message);
  const knowledgeDocs = getKnowledgeDocuments();
  
  // Rechercher des documents pertinents même en mode fallback
  const relevantDocs = searchByKeywords(message, knowledgeDocs, 5);
  
  // Construire une réponse basée sur les documents trouvés
  if (relevantDocs.length > 0) {
    // Extraire les informations pertinentes des documents
    const context = relevantDocs.join('\n\n');
    
    // Détecter le type de question pour personnaliser la réponse
    if (normalizedMessage.includes('competence') || normalizedMessage.includes('technologie') || normalizedMessage.includes('sait') || normalizedMessage.includes('skill')) {
      // Extraire spécifiquement les sections sur les compétences
      const competenceInfo = relevantDocs
        .filter(doc => {
          const normDoc = normalizeText(doc);
          return normDoc.includes('competence') || 
                 normDoc.includes('technologie') || 
                 normDoc.includes('maitrise') ||
                 normDoc.includes('outil');
        })
        .join('\n\n');
      
      if (competenceInfo) {
        // Extraire toutes les informations de compétences
        const lines = competenceInfo
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return trimmed && 
                   !trimmed.startsWith('#') && 
                   (trimmed.startsWith('-') || trimmed.includes(':')) &&
                   trimmed.length > 5;
          });
        
        // Construire une réponse détaillée
        let response = 'Fifaliantsoa Sarobidy possède les compétences suivantes :\n\n';
        
        // Extraire les technologies frontend
        const frontendLines = lines.filter(l => 
          normalizeText(l).includes('react') || 
          normalizeText(l).includes('next') || 
          normalizeText(l).includes('angular') ||
          normalizeText(l).includes('typescript') ||
          normalizeText(l).includes('frontend')
        );
        if (frontendLines.length > 0) {
          response += frontendLines.slice(0, 5).join('\n') + '\n\n';
        }
        
        // Extraire les technologies backend
        const backendLines = lines.filter(l => 
          normalizeText(l).includes('node') || 
          normalizeText(l).includes('nestjs') || 
          normalizeText(l).includes('backend')
        );
        if (backendLines.length > 0) {
          response += backendLines.slice(0, 3).join('\n') + '\n\n';
        }
        
        // Extraire les outils de design
        const designLines = lines.filter(l => 
          normalizeText(l).includes('figma') || 
          normalizeText(l).includes('adobe') || 
          normalizeText(l).includes('design')
        );
        if (designLines.length > 0) {
          response += designLines.slice(0, 3).join('\n') + '\n\n';
        }
        
        // Si on n'a pas trouvé assez, utiliser toutes les lignes pertinentes
        if (frontendLines.length + backendLines.length + designLines.length < 5) {
          const otherLines = lines
            .filter(l => !frontendLines.includes(l) && !backendLines.includes(l) && !designLines.includes(l))
            .slice(0, 5);
          if (otherLines.length > 0) {
            response += otherLines.join('\n') + '\n\n';
          }
        }
        
        // Ajouter un résumé si disponible dans le contexte
        const summaryLines = context
          .split('\n')
          .filter(l => l.includes('Développeur fullstack') || l.includes('année'))
          .slice(0, 2);
        
        if (summaryLines.length > 0) {
          response += '\n' + summaryLines.join('\n');
        }
        
        return response || `Fifaliantsoa Sarobidy est un développeur full-stack avec plus de 4 ans d'expérience, spécialisé en JavaScript (React, Next.js, Angular, NestJS), TypeScript, et design UI/UX. Il maîtrise également des outils modernes comme LangChain, Redis, Qdrant, et des outils de design comme Figma et Adobe Creative Suite.`;
      }
    }
    
    if (normalizedMessage.includes('contact') || normalizedMessage.includes('email') || normalizedMessage.includes('telephone') || normalizedMessage.includes('phone')) {
      return 'Vous pouvez contacter Fifaliantsoa Sarobidy via:\n- Email: sarobidy.fifaliantsoa@ilomad.com\n- Téléphone: +261 34 46 536 09\n- Localisation: Madagascar, Fianarantsoa';
    }

    if (normalizedMessage.includes('projet') || normalizedMessage.includes('realisation') || normalizedMessage.includes('travail')) {
      return 'Le portfolio contient plusieurs projets réalisés dans différents domaines:\n- Applications web et mobiles\n- Dashboards et interfaces d\'administration\n- Projets de design et maquettage\n- Solutions intégrant l\'intelligence artificielle\n- Applications pour différentes industries (gestion, mobilité, etc.)\n\nVous pouvez consulter la section "Projets" du portfolio pour plus de détails.';
    }

    if (normalizedMessage.includes('experience') || normalizedMessage.includes('annee') || normalizedMessage.includes('ans')) {
      return 'Fifaliantsoa Sarobidy est un développeur fullstack avec plus de 4 ans d\'expérience dans le développement web et mobile. Il a une expertise en JavaScript et frameworks modernes, ainsi qu\'en design UI/UX. Il connaît les architectures modernes et les meilleures pratiques de développement.';
    }

    // Réponse générique basée sur le contexte trouvé
    return `Voici des informations pertinentes:\n\n${context.substring(0, 500)}${context.length > 500 ? '...' : ''}\n\nPour plus de détails, n'hésitez pas à poser une question plus spécifique.`;
  }

  // Réponse de secours si vraiment rien n'est trouvé
  return `Merci pour votre question. Je suis ici pour vous aider à en savoir plus sur le portfolio de Fifaliantsoa Sarobidy. Pour des informations spécifiques, n'hésitez pas à me poser des questions sur ses compétences, projets, expérience, ou comment le contacter.`;
}

