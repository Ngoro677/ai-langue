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

// Créer des liens HTML cliquables vers les sections du portfolio
function createSectionLink(text: string, sectionId: string, language: 'fr' | 'en' | 'mga' = 'fr'): string {
  const sectionLabels = {
    fr: {
      projet: 'section Projets',
      techno: 'section Technologies',
      accueil: 'section Accueil',
    },
    en: {
      projet: 'Projects section',
      techno: 'Technologies section',
      accueil: 'Home section',
    },
    mga: {
      projet: 'fizarana Tetikasa',
      techno: 'fizarana Teknologia',
      accueil: 'fizarana Fandraisana',
    },
  };
  
  // Utiliser un data attribute pour identifier la section et permettre à React de gérer le clic
  return `<a href="#${sectionId}" data-section-id="${sectionId}" class="section-link text-yellow-400 hover:text-yellow-300 underline font-semibold cursor-pointer transition-colors">${text}</a>`;
}

// Créer un lien de téléchargement pour le CV
function createCVLink(language: 'fr' | 'en' | 'mga' = 'fr'): string {
  const linkTexts = {
    fr: 'Télécharger le CV',
    en: 'Download CV',
    mga: 'Ampidino ny CV',
  };
  
  return `<a href="/cv.pdf" download="CV_Sarobidy_Fifaliantsoa.pdf" class="cv-link text-yellow-400 hover:text-yellow-300 underline font-semibold cursor-pointer transition-colors">${linkTexts[language]}</a>`;
}

// Nettoyer les réponses pour supprimer les markdown et formater proprement
function cleanResponse(response: string): string {
  return response
    .split('\n') // Séparer par lignes
    .map(line => {
      // Supprimer les ## et # au début de chaque ligne
      line = line.replace(/^##+\s*/g, '').replace(/^#\s+/g, '');
      return line;
    })
    .join('\n')
    .replace(/##\s*/g, '') // Supprimer les ## restants
    .replace(/^#\s+/gm, '') // Supprimer les # seuls
    .replace(/\*\*(.+?)\*\*/g, '$1') // Supprimer le gras markdown
    .replace(/\*(.+?)\*/g, '$1') // Supprimer l'italique markdown
    .replace(/`(.+?)`/g, '$1') // Supprimer les backticks
    .replace(/^-\s+/gm, '• ') // Remplacer - par • pour les listes
    .replace(/\n\n\n+/g, '\n\n') // Réduire les sauts de ligne multiples
    .trim();
}

// Détection de langue automatique
function detectLanguage(text: string): 'fr' | 'en' | 'mga' {
  const normalized = normalizeText(text);
  
  // Mots-clés malgaches
  const mgaKeywords = ['ahoana', 'inona', 'iza', 'aiza', 'firy', 'manao', 'tena', 'tsara', 'mazoto', 'afaka', 'miarahaba', 'miala', 'azafady', 'misaotra', 'manambady', 've', 'izy'];
  // Mots-clés anglais
  const enKeywords = ['what', 'how', 'where', 'when', 'why', 'who', 'can', 'do', 'does', 'is', 'are', 'hello', 'hi', 'skill', 'skills', 'capable', 'good', 'expert', 'married', 'wife', 'husband'];
  // Mots-clés français
  const frKeywords = ['bonjour', 'salut', 'comment', 'quoi', 'qui', 'où', 'quand', 'pourquoi', 'peux', 'peut', 'est', 'sont', 'compétence', 'capacité', 'doué', 'capable', 'marié', 'mariée'];
  
  const mgaScore = mgaKeywords.filter(kw => normalized.includes(kw)).length;
  const enScore = enKeywords.filter(kw => normalized.includes(kw)).length;
  const frScore = frKeywords.filter(kw => normalized.includes(kw)).length;
  
  // Si la question commence par "et?" ou similaire, garder la langue précédente
  if (normalized.trim() === 'et' || normalized.trim() === 'and' || normalized.trim() === 'ary') {
    return 'fr'; // Par défaut, mais sera remplacé par la langue de la session
  }
  
  if (mgaScore > enScore && mgaScore > frScore) return 'mga';
  if (enScore > frScore) return 'en';
  return 'fr';
}

// Vérifier si une question est hors du scope du portfolio
function isOutOfScope(question: string): boolean {
  const normalized = normalizeText(question);
  const originalLower = question.toLowerCase();
  
  // Exclure les questions sur l'expérience professionnelle qui sont pertinentes
  const isExperienceQuestion = normalized.match(/(experience|experiences|annee|annees|ans|years|traikefa|vraiment.*experience|vraiment.*ans|combien.*ans|how many years)/i);
  
  // Patterns spécifiques malgaches pour mariage
  const isManambady = originalLower.includes('manambady');
  
  // Mots-clés personnels/privés en français, anglais et malgache
  const personalKeywords = [
    // Mariage / État civil
    'marie', 'mariee', 'married', 'marry', 'spouse', 'wife', 'husband', 'conjoint', 'conjointe',
    // Enfants / Famille
    'fils', 'fille', 'enfant', 'enfants', 'child', 'children', 'son', 'daughter', 'zaza', 'zanaka',
    'anakavavy', 'anakalahy',
    // Âge
    'age', 'âge', 'old', 'how old', 'taona', 'firy taona',
    // Famille
    'famille', 'family', 'parents', 'mere', 'pere', 'mother', 'father', 'ray', 'reny', 'havana',
    // Adresse personnelle
    'adresse', 'address', 'domicile', 'residence', 'toerana', 'toeram-ponenana',
    // Salaire / Finances
    'salaire', 'salary', 'revenu', 'income', 'karama', 'combien.*gagne', 'how much.*earn',
    // Hobbies personnels
    'hobby', 'loisir', 'passe-temps', 'passion personnelle', 'fialamboly',
    // Questions générales non liées au portfolio
    'météo', 'weather', 'actualité', 'news', 'politique', 'sport', 'cuisine', 'recette',
    'film', 'movie', 'musique', 'music', 'livre', 'book'
  ];
  
  // Détecter les questions personnelles
  const isPersonalQuestion = isManambady || personalKeywords.some(keyword => {
    const regex = new RegExp(keyword.replace(/\*/g, '.*'), 'i');
    return regex.test(normalized) || regex.test(originalLower);
  });
  
  // Si c'est une question personnelle (sauf expérience professionnelle), c'est hors scope
  if (!isExperienceQuestion && isPersonalQuestion) {
    return true;
  }
  
  // Détecter les questions complètement hors sujet (pas de mots-clés liés au portfolio)
  const portfolioKeywords = [
    'projet', 'project', 'competence', 'skill', 'technologie', 'technology', 'tech',
    'experience', 'expérience', 'portfolio', 'sarobidy', 'fifaliantsoa',
    'developpeur', 'developer', 'developpement', 'development', 'code', 'programmation',
    'react', 'next', 'angular', 'node', 'javascript', 'typescript', 'frontend', 'backend',
    'fullstack', 'full-stack', 'design', 'ui', 'ux', 'figma', 'adobe',
    'contact', 'email', 'telephone', 'phone', 'contacter', 'reach'
  ];
  
  const hasPortfolioKeyword = portfolioKeywords.some(keyword => 
    normalized.includes(keyword) || originalLower.includes(keyword)
  );
  
  // Si la question est très courte et ne contient aucun mot-clé du portfolio, probablement hors scope
  if (question.trim().length < 10 && !hasPortfolioKeyword) {
    return true;
  }
  
  return false;
}

// Normaliser les questions pour une meilleure compréhension
function normalizeQuestion(question: string): string {
  const normalized = normalizeText(question);
  const originalLower = question.toLowerCase();
  
  // Vérifier d'abord si c'est hors scope
  if (isOutOfScope(question)) {
    return 'outOfScope';
  }
  
  // PRIORITÉ 1: Demandes de CV
  if (normalized.match(/(cv|curriculum|resume|montrer.*cv|voir.*cv|telecharger.*cv|download.*cv|afficher.*cv|show.*cv|envoyer.*cv|send.*cv)/i) ||
      originalLower.includes('curriculum vitae') || originalLower.includes('curriculum vitæ')) {
    return 'cv';
  }
  
  // PRIORITÉ 2: Variantes de salutations
  if (normalized.match(/^(bonjour|salut|hello|hi|miarahaba|manao ahoana)/i)) {
    return 'bonjour';
  }
  
  // PRIORITÉ 3: Questions sur les projets web
  if (normalized.match(/(projet web|projets web|ses projets|ses projet|show projects|montrer projet|voir projet|list projects|web projects|projet mobile|projets mobile|projet ia|projets ia)/i) ||
      originalLower.includes('ses projets') || originalLower.includes('projets web') || originalLower.includes('projet web')) {
    return 'projets';
  }
  
  // PRIORITÉ 4: Questions sur les technologies
  if (normalized.match(/(technologies|technologie|tech|outils|tools|techno|frameworks|langages|languages|stack)/i)) {
    return 'technologies';
  }
  
  // PRIORITÉ 5: Questions sur les compétences
  if (normalized.match(/(ses competence|ses competences|ses compétences|compétence|competence|skill|skills|fahaizana)/i) || 
      originalLower.includes('ses compétences') || originalLower.includes('ses competences')) {
    return 'competences';
  }
  
  // PRIORITÉ 6: Questions sur le langage de programmation
  if (normalized.match(/(plus fort|meilleur|langage|language|programmation|programming|langue de program|best language|strongest language|favorite language)/i)) {
    return 'language';
  }
  
  // PRIORITÉ 7: Questions sur l'expérience professionnelle (vraiment, exactement, etc.)
  if (normalized.match(/(vraiment.*experience|vraiment.*ans|vraiment.*annee|exactement.*experience|exactement.*ans|how many years|combien.*ans|combien.*annee)/i)) {
    return 'experience';
  }
  
  // PRIORITÉ 8: Questions frontend/backend
  if (normalized.match(/(backend ou frontend|frontend ou backend|backend|frontend|prefer|prefere|specialise|specialized|meilleur|better)/i)) {
    return 'frontendBackend';
  }
  
  // PRIORITÉ 9: Questions sur les capacités - amélioration pour détecter "Es t'il doué?", "Est-il doué?", "est ce qu'il est capable?", etc.
  if (normalized.match(/(est ce qu.il est capable|peut il|capable de faire|capable de|doué en quoi|doué|bon en quoi|expert|expertise|what can he|what is he good at|skills|capabilities|est il dou|es t.il dou|est il bon|es t.il bon)/i) ||
      originalLower.includes('est ce qu\'il est capable') || originalLower.includes('est-ce qu\'il est capable') || 
      originalLower.includes('est ce qu il est capable') || originalLower.includes('est-ce qu il est capable')) {
    return 'capabilities';
  }
  
  // PRIORITÉ 10: Questions de suivi
  if (normalized.match(/^(et|and|ary)$/i)) {
    return 'followup';
  }
  
  return question;
}

// Dictionnaire de synonymes amélioré pour améliorer la recherche
const synonyms: { [key: string]: string[] } = {
  'competence': ['compétence', 'competence', 'compétences', 'compétences', 'savoir', 'sait', 'technologie', 'technologies', 'skill', 'skills', 'doué', 'doux', 'doué en', 'bon en', 'expert', 'expertise', 'capable', 'capacité', 'capacités', 'capabilities'],
  'projet': ['projet', 'projets', 'travail', 'travaux', 'réalisation', 'réalisations', 'realisation', 'work', 'works'],
  'contact': ['contact', 'contacter', 'email', 'mail', 'téléphone', 'telephone', 'phone', 'adresse', 'address'],
  'experience': ['expérience', 'experience', 'année', 'annee', 'ans', 'années', 'annees', 'carrière', 'carriere', 'year', 'years'],
  'technologie': ['technologie', 'technologies', 'tech', 'outil', 'outils', 'langage', 'langages', 'framework', 'frameworks'],
  'capable': ['capable', 'capacité', 'capacités', 'peut', 'peux', 'sait faire', 'est capable', 'capable de', 'can do', 'capabilities'],
  'doué': ['doué', 'doué en', 'bon en', 'expert', 'expertise', 'talent', 'talented'],
};

// Recherche améliorée par mots-clés pour le RAG avec synonymes et correspondance de phrases
function searchByKeywords(query: string, documents: string[], k: number = 5): string[] {
  const normalizedQuery = normalizeText(query);
  const originalQuery = query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Détecter les phrases complètes dans la requête
  const queryPhrases = [
    normalizedQuery,
    ...queryWords.slice(0, 3).map((_, i) => queryWords.slice(i, i + 3).join(' ')) // Phrases de 3 mots
  ];
  
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
  
  // Score chaque document basé sur les mots-clés et phrases
  const scoredDocs = documents.map((doc, index) => {
    const normalizedDoc = normalizeText(doc);
    const originalDoc = doc.toLowerCase();
    let score = 0;
    
    // Bonus pour correspondance de phrase complète (très important)
    queryPhrases.forEach(phrase => {
      if (phrase.length > 5 && normalizedDoc.includes(phrase)) {
        score += 10; // Bonus élevé pour correspondance de phrase
      }
    });
    
    // Score pour chaque mot-clé
    expandedKeywords.forEach((keyword) => {
      if (keyword.length > 2) {
        // Correspondance exacte (plus de poids)
        if (normalizedDoc.includes(keyword)) {
          score += 4;
        }
        // Correspondance partielle
        const matches = (normalizedDoc.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 2;
      }
    });
    
    // Bonus si le titre de section correspond (##)
    if (doc.includes('##')) {
      const sectionTitle = doc.split('##')[1]?.split('\n')[0]?.toLowerCase() || '';
      if (queryWords.some(qw => sectionTitle.includes(normalizeText(qw)))) {
        score += 8; // Bonus élevé pour correspondance de titre de section
      }
    }
    
    // Bonus pour correspondance de noms de projets spécifiques
    const projectNames = ['ilodesk', 'digitheque', 'sarakodev', 'raitra', 'ca2e', 'congé', 'gta', 'smart dashboard', 'portfolio', 'ilomad'];
    projectNames.forEach(projectName => {
      if (originalQuery.includes(projectName) && originalDoc.includes(projectName)) {
        score += 15; // Bonus très élevé pour correspondance de nom de projet
      }
    });
    
    // Bonus pour correspondance de technologies spécifiques
    const techNames = ['react', 'next.js', 'angular', 'node.js', 'nestjs', 'typescript', 'javascript', 'tailwind', 'figma', 'adobe'];
    techNames.forEach(techName => {
      if (originalQuery.includes(techName) && originalDoc.includes(techName)) {
        score += 12; // Bonus élevé pour correspondance de technologie
      }
    });
    
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
    if (lowerQuery.includes('competence') || lowerQuery.includes('compétence') || lowerQuery.includes('technologie') || lowerQuery.includes('sait') || lowerQuery.includes('skill')) {
      const competenceDocs = documents.filter(doc => 
        normalizeText(doc).includes('competence') || normalizeText(doc).includes('technologie') || normalizeText(doc).includes('skill')
      );
      return competenceDocs.slice(0, k);
    }
    // Fallback pour projets
    if (lowerQuery.includes('projet') || lowerQuery.includes('project')) {
      const projetDocs = documents.filter(doc => 
        normalizeText(doc).includes('projet') || normalizeText(doc).includes('project')
      );
      return projetDocs.slice(0, k);
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
async function searchRelevantDocs(query: string, k: number = 5): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const knowledgeDocs = getKnowledgeDocuments();
  
  // Si pas de clé API, utiliser recherche par mots-clés améliorée
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

    // Trier par score et retourner les top k (avec seuil minimum pour la qualité)
    const topDocs = scoredDocs
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score > 0.3) // Seuil minimum de similarité pour éviter les résultats non pertinents
      .slice(0, k)
      .map((item) => item.doc);

    // Si pas assez de documents avec un bon score, utiliser recherche par mots-clés en complément
    if (topDocs.length < 3) {
      const keywordDocs = searchByKeywords(query, knowledgeDocs, Math.max(3, k - topDocs.length));
      const combinedDocs = [...topDocs, ...keywordDocs.filter(doc => !topDocs.includes(doc))];
      return combinedDocs.slice(0, k).join('\n\n');
    }

    return topDocs.join('\n\n');
  } catch (error) {
    console.error('Erreur lors de la recherche avec embeddings:', error);
    // Fallback vers recherche par mots-clés
    const relevantDocs = searchByKeywords(query, knowledgeDocs, k);
    return relevantDocs.join('\n\n');
  }
}

// Réponses multilingues pour les questions spécifiques
const multilingualResponses = {
  fr: {
    bonjour: "Bonjour ! Je suis votre assistant IA. Je peux répondre à vos questions sur le portfolio de Fifaliantsoa Sarobidy, ses projets, ses compétences techniques et son expérience. Comment puis-je vous aider ?",
    competences: "Fifaliantsoa Sarobidy est un développeur fullstack avec plus de 4 ans d'expérience. Voici ses compétences principales :\n\n• Frontend : React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend : Node.js, NestJS\n• Bases de données : Redis, Qdrant\n• IA/ML : LangChain\n• Design : Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD\n• Outils : Git, GitHub, GitLab, Jest, Jira, Microsoft Teams\n\nIl est spécialisé en JavaScript et TypeScript, avec une expertise en développement d'applications web modernes, design UI/UX, et intégration de systèmes IA.",
    capabilities: "Oui, il est très capable ! Fifaliantsoa Sarobidy est capable de :\n\n• Développer des applications web complètes (frontend et backend)\n• Créer des interfaces utilisateur modernes et responsives\n• Concevoir des maquettes et prototypes avec Figma et Adobe\n• Intégrer des systèmes d'intelligence artificielle (RAG, chatbots)\n• Optimiser les performances des applications\n• Développer des applications mobiles\n• Créer des dashboards et interfaces d'administration\n• Travailler en équipe avec des outils de collaboration\n• Gérer des projets de A à Z\n\nIl maîtrise React, Next.js, Angular, NestJS, TypeScript, et bien d'autres technologies.",
    language: "Fifaliantsoa Sarobidy est le plus fort en JavaScript et TypeScript. Il est spécialisé dans ces langages avec plus de 4 ans d'expérience. Il maîtrise également les frameworks modernes basés sur JavaScript comme React, Next.js, Angular, Node.js et NestJS.",
    projets: (lang: 'fr' | 'en' | 'mga' = 'fr') => {
      const link = createSectionLink('section Projets', 'projet', lang);
      return `Voici les projets réalisés par Fifaliantsoa Sarobidy :\n\n**Projets Web :**\n• Dashboard Ilodesk - Plateforme de gestion avec ReactJS, TypeScript, .NET, SQL Server\n• Ilodesk Platform - Solution complète avec ReactJS, TypeScript, Tailwind\n• Smart Dashboard - Dashboard intelligent avec ReactJS, NestJS, Stripe, Chart.js\n• Digitheque - Application Next.js avec Prisma et Tailwind\n• Portfolio - Site portfolio avec ReactJS, Framer Motion, GSAP\n• Ilomad Website - Site web avec Next.js, PHP, MySQL\n• Sarakodev - Plateforme avec Express, Next.js, PostgreSQL, AWS\n• Raitra - Application ReactJS avec Node.js et PostgreSQL\n• CA2E Platform - Plateforme Laravel avec React et MySQL\n• Congé Manager - Gestionnaire de congés avec ReactJS, Express, PostgreSQL\n• GTA Project - Projet Next.js avec Blender\n\n**Projets Mobile :**\n• Mobilité PNUD - Application mobile avec React Native, Firebase, Maps API\n• CA2E Mobile - Application mobile avec React Native, Express.js, SQLite\n• DEIS Mobile - Application mobile avec Ionic, Angular, SQLite\n• Portfolio Mobile - Application mobile avec React Native\n\n**Projets IA :**\n• AI Project - Projet d'intelligence artificielle avec Python, TensorFlow, OpenCV, FastAPI\n\nCliquez ici pour voir tous les projets : ${link}`;
    },
    technologies: (lang: 'fr' | 'en' | 'mga' = 'fr') => {
      const link = createSectionLink('section Technologies', 'techno', lang);
      return `Fifaliantsoa Sarobidy maîtrise les technologies suivantes :\n\n• Frontend : React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend : Node.js, NestJS, Express\n• Bases de données : Redis, Qdrant, PostgreSQL, MySQL, SQL Server\n• IA/ML : LangChain\n• Design : Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD\n• Outils : Git, GitHub, GitLab, Jest, Jira, Microsoft Teams\n• Cloud : AWS\n• Autres : Docker, Stripe, Chart.js\n\nCliquez ici pour voir toutes les technologies : ${link}`;
    },
    frontendBackend: "Fifaliantsoa Sarobidy est un développeur fullstack, ce qui signifie qu'il est compétent à la fois en frontend et en backend. Il excelle particulièrement en :\n\n• Frontend : React, Next.js, Angular avec TypeScript et Tailwind CSS\n• Backend : Node.js et NestJS\n\nIl a une solide expérience dans les deux domaines et peut développer des applications complètes de bout en bout.",
    experience: "Oui, c'est exact. Fifaliantsoa Sarobidy a plus de 4 ans d'expérience dans le développement web et mobile. Il a acquis cette expérience en travaillant sur divers projets professionnels, en développant des applications web complètes, des interfaces utilisateur modernes, et en intégrant des systèmes d'intelligence artificielle. Son expertise couvre le développement frontend et backend, ainsi que le design UI/UX.",
    cv: (lang: 'fr' | 'en' | 'mga' = 'fr') => {
      const cvLink = createCVLink(lang);
      return `Le CV de Fifaliantsoa Sarobidy est disponible en format PDF. Vous pouvez le télécharger en cliquant sur le lien suivant : ${cvLink}\n\nLe CV contient toutes les informations détaillées sur son parcours professionnel, ses compétences, ses projets et ses expériences.`;
    },
    outOfScope: "Désolé, je ne peux répondre qu'aux questions concernant le portfolio professionnel de Fifaliantsoa Sarobidy.\n\nJe peux vous aider avec :\n• Ses compétences techniques et savoir-faire\n• Ses projets réalisés (web, mobile, IA)\n• Son expérience professionnelle\n• Les technologies qu'il maîtrise\n• Comment le contacter professionnellement\n• Son CV\n\nPour toute autre question, je vous invite à consulter directement le portfolio ou à le contacter via les informations de contact disponibles.",
    followup: "Souhaitez-vous en savoir plus sur un point spécifique ? Posez-moi une question plus précise !",
  },
  en: {
    bonjour: "Hello! I am your AI assistant. I can answer your questions about Fifaliantsoa Sarobidy's portfolio, his projects, his technical skills and his experience. How can I help you?",
    competences: "Fifaliantsoa Sarobidy is a fullstack developer with more than 4 years of experience. Here are his main skills:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS\n• Databases: Redis, Qdrant\n• AI/ML: LangChain\n• Design: Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD\n• Tools: Git, GitHub, GitLab, Jest, Jira, Microsoft Teams\n\nHe specializes in JavaScript and TypeScript, with expertise in modern web application development, UI/UX design, and AI system integration.",
    capabilities: "Yes, he is very capable! Fifaliantsoa Sarobidy is capable of:\n\n• Developing complete web applications (frontend and backend)\n• Creating modern and responsive user interfaces\n• Designing mockups and prototypes with Figma and Adobe\n• Integrating artificial intelligence systems (RAG, chatbots)\n• Optimizing application performance\n• Developing mobile applications\n• Creating dashboards and administration interfaces\n• Working in teams with collaboration tools\n• Managing projects from A to Z\n\nHe masters React, Next.js, Angular, NestJS, TypeScript, and many other technologies.",
    language: "Fifaliantsoa Sarobidy is strongest in JavaScript and TypeScript. He specializes in these languages with more than 4 years of experience. He also masters modern JavaScript-based frameworks like React, Next.js, Angular, Node.js, and NestJS.",
    projets: (lang: 'fr' | 'en' | 'mga' = 'en') => {
      const link = createSectionLink('Projects section', 'projet', lang);
      return `Here are the projects developed by Fifaliantsoa Sarobidy:\n\n**Web Projects:**\n• Dashboard Ilodesk - Management platform with ReactJS, TypeScript, .NET, SQL Server\n• Ilodesk Platform - Complete solution with ReactJS, TypeScript, Tailwind\n• Smart Dashboard - Smart dashboard with ReactJS, NestJS, Stripe, Chart.js\n• Digitheque - Next.js application with Prisma and Tailwind\n• Portfolio - Portfolio site with ReactJS, Framer Motion, GSAP\n• Ilomad Website - Website with Next.js, PHP, MySQL\n• Sarakodev - Platform with Express, Next.js, PostgreSQL, AWS\n• Raitra - ReactJS application with Node.js and PostgreSQL\n• CA2E Platform - Laravel platform with React and MySQL\n• Congé Manager - Leave manager with ReactJS, Express, PostgreSQL\n• GTA Project - Next.js project with Blender\n\n**Mobile Projects:**\n• Mobilité PNUD - Mobile application with React Native, Firebase, Maps API\n• CA2E Mobile - Mobile application with React Native, Express.js, SQLite\n• DEIS Mobile - Mobile application with Ionic, Angular, SQLite\n• Portfolio Mobile - Mobile application with React Native\n\n**AI Projects:**\n• AI Project - Artificial intelligence project with Python, TensorFlow, OpenCV, FastAPI\n\nClick here to see all projects: ${link}`;
    },
    technologies: (lang: 'fr' | 'en' | 'mga' = 'en') => {
      const link = createSectionLink('Technologies section', 'techno', lang);
      return `Fifaliantsoa Sarobidy masters the following technologies:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS, Express\n• Databases: Redis, Qdrant, PostgreSQL, MySQL, SQL Server\n• AI/ML: LangChain\n• Design: Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD\n• Tools: Git, GitHub, GitLab, Jest, Jira, Microsoft Teams\n• Cloud: AWS\n• Others: Docker, Stripe, Chart.js\n\nClick here to see all technologies: ${link}`;
    },
    frontendBackend: "Fifaliantsoa Sarobidy is a fullstack developer, meaning he is competent in both frontend and backend. He particularly excels in:\n\n• Frontend: React, Next.js, Angular with TypeScript and Tailwind CSS\n• Backend: Node.js and NestJS\n\nHe has solid experience in both domains and can develop complete end-to-end applications.",
    experience: "Yes, that's correct. Fifaliantsoa Sarobidy has more than 4 years of experience in web and mobile development. He has gained this experience by working on various professional projects, developing complete web applications, modern user interfaces, and integrating artificial intelligence systems. His expertise covers frontend and backend development, as well as UI/UX design.",
    cv: (lang: 'fr' | 'en' | 'mga' = 'en') => {
      const cvLink = createCVLink(lang);
      return `Fifaliantsoa Sarobidy's CV is available in PDF format. You can download it by clicking on the following link: ${cvLink}\n\nThe CV contains all detailed information about his professional background, skills, projects and experiences.`;
    },
    outOfScope: "Sorry, I can only answer questions about Fifaliantsoa Sarobidy's professional portfolio.\n\nI can help you with:\n• His technical skills and capabilities\n• His completed projects (web, mobile, AI)\n• His professional experience\n• The technologies he masters\n• How to contact him professionally\n• His CV\n\nFor any other questions, I invite you to check the portfolio directly or contact him via the available contact information.",
    followup: "Would you like to know more about a specific point? Ask me a more specific question!",
  },
  mga: {
    bonjour: "Miarahaba! Izaho dia ny mpanampy IA. Afaka mamaly ny fanontaniana momba ny portfolio an'i Fifaliantsoa Sarobidy, ny tetikasany, ny fahaizany ara-teknika ary ny traikefany aho. Ahoana no maha-afaka namampy anao aho?",
    competences: "Fifaliantsoa Sarobidy dia mpamorona fullstack miaraka amin'ny traikefa mihoatra ny 4 taona. Ity ny fahaizany fototra:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS\n• Bazy angona: Redis, Qdrant\n• IA/ML: LangChain\n• Design: Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD\n• Fitaovana: Git, GitHub, GitLab, Jest, Jira, Microsoft Teams\n\nManokana amin'ny JavaScript sy TypeScript izy, miaraka amin'ny fahaizana amin'ny fampandrosoana application web maoderina, design UI/UX, ary ny fampifandraisana rafitra IA.",
    capabilities: "Eny, tena afaka izy! Fifaliantsoa Sarobidy afaka:\n\n• Mamorona application web feno (frontend sy backend)\n• Mamorona interface mpampiasa maoderina sy responsive\n• Mamorona maquette sy prototype amin'ny Figma sy Adobe\n• Mampiditra rafitra IA (RAG, chatbots)\n• Manatsara ny performance amin'ny application\n• Mamorona application mobile\n• Mamorona dashboard sy interface fitantanana\n• Miara-miasa amin'ny fitaovana fiaraha-miasa\n• Mitantana tetikasa hatrany A ka Z\n\nMahay React, Next.js, Angular, NestJS, TypeScript, ary teknologia hafa maro.",
    language: "Fifaliantsoa Sarobidy dia matanjaka indrindra amin'ny JavaScript sy TypeScript. Manokana amin'ireo fiteny ireo izy miaraka amin'ny traikefa mihoatra ny 4 taona. Mahay koa ny frameworks maoderina miorina amin'ny JavaScript toy ny React, Next.js, Angular, Node.js, ary NestJS.",
    projets: (lang: 'fr' | 'en' | 'mga' = 'mga') => {
      const link = createSectionLink('fizarana Tetikasa', 'projet', lang);
      return `Ireto ny tetikasa namboarin'i Fifaliantsoa Sarobidy:\n\n**Tetikasa Web:**\n• Dashboard Ilodesk - Platform fitantanana miaraka amin'ny ReactJS, TypeScript, .NET, SQL Server\n• Ilodesk Platform - Vahaolana feno miaraka amin'ny ReactJS, TypeScript, Tailwind\n• Smart Dashboard - Dashboard manan-tsaina miaraka amin'ny ReactJS, NestJS, Stripe, Chart.js\n• Digitheque - Application Next.js miaraka amin'ny Prisma sy Tailwind\n• Portfolio - Tranokala portfolio miaraka amin'ny ReactJS, Framer Motion, GSAP\n• Ilomad Website - Tranokala miaraka amin'ny Next.js, PHP, MySQL\n• Sarakodev - Platform miaraka amin'ny Express, Next.js, PostgreSQL, AWS\n• Raitra - Application ReactJS miaraka amin'ny Node.js sy PostgreSQL\n• CA2E Platform - Platform Laravel miaraka amin'ny React sy MySQL\n• Congé Manager - Mpitantana fialan-tsasatra miaraka amin'ny ReactJS, Express, PostgreSQL\n• GTA Project - Tetikasa Next.js miaraka amin'ny Blender\n\n**Tetikasa Mobile:**\n• Mobilité PNUD - Application mobile miaraka amin'ny React Native, Firebase, Maps API\n• CA2E Mobile - Application mobile miaraka amin'ny React Native, Express.js, SQLite\n• DEIS Mobile - Application mobile miaraka amin'ny Ionic, Angular, SQLite\n• Portfolio Mobile - Application mobile miaraka amin'ny React Native\n\n**Tetikasa IA:**\n• AI Project - Tetikasa IA miaraka amin'ny Python, TensorFlow, OpenCV, FastAPI\n\nTsindrio eto ho hitanao ny tetikasa rehetra: ${link}`;
    },
    technologies: (lang: 'fr' | 'en' | 'mga' = 'mga') => {
      const link = createSectionLink('fizarana Teknologia', 'techno', lang);
      return `Fifaliantsoa Sarobidy mahay ireo teknologia manaraka:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS, Express\n• Bazy angona: Redis, Qdrant, PostgreSQL, MySQL, SQL Server\n• IA/ML: LangChain\n• Design: Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD\n• Fitaovana: Git, GitHub, GitLab, Jest, Jira, Microsoft Teams\n• Cloud: AWS\n• Hafa: Docker, Stripe, Chart.js\n\nTsindrio eto ho hitanao ny teknologia rehetra: ${link}`;
    },
    frontendBackend: "Fifaliantsoa Sarobidy dia mpamorona fullstack, izany hoe mahay amin'ny frontend sy backend. Matanjaka indrindra amin'ny:\n\n• Frontend: React, Next.js, Angular miaraka amin'ny TypeScript sy Tailwind CSS\n• Backend: Node.js sy NestJS\n\nManana traikefa mafy amin'ny sehatra roa izy ary afaka mamorona application feno hatrany A ka Z.",
    experience: "Eny, marina izany. Fifaliantsoa Sarobidy dia manana traikefa mihoatra ny 4 taona amin'ny fampandrosoana web sy mobile. Nahazo io traikefa io izy amin'ny alalan'ny fiasana amin'ny tetikasa ara-piasana samihafa, fampandrosoana application web feno, interface mpampiasa maoderina, ary fampifandraisana rafitra IA. Ny fahaizany dia ahitana fampandrosoana frontend sy backend, ary koa design UI/UX.",
    cv: (lang: 'fr' | 'en' | 'mga' = 'mga') => {
      const cvLink = createCVLink(lang);
      return `Ny CV an'i Fifaliantsoa Sarobidy dia azo ampidina amin'ny format PDF. Afaka ampidina izany amin'ny alalan'ny tsindrio ny rohy manaraka: ${cvLink}\n\nNy CV dia ahitana ny vaovao rehetra momba ny lalana niadidiny ara-piasana, ny fahaizany, ny tetikasany ary ny traikefany.`;
    },
    outOfScope: "Miala tsiny, afaka mamaly fotsiny ny fanontaniana momba ny portfolio ara-piasana an'i Fifaliantsoa Sarobidy aho.\n\nAfaka manampy anao amin'ny:\n• Ny fahaizany ara-teknika sy ny fahaizany\n• Ny tetikasany vita (web, mobile, IA)\n• Ny traikefany ara-piasana\n• Ny teknologia izay mahay\n• Ny fomba mifandraisa aminy ara-piasana\n• Ny CV\n\nHo an'ny fanontaniana hafa, asaovy mijery ny portfolio mivantana na mifandraisa aminy amin'ny alalan'ny vaovao contact misy.",
    followup: "Te hahalala bebe kokoa momba ny zavatra iray manokana ve ianao? Anontanio aho fanontaniana mazava kokoa!",
  },
};

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
    
    // Normaliser la question pour détecter les questions spéciales
    const normalizedQ = normalizeQuestion(message);
    
    // Vérification supplémentaire pour "Es t'il doué?" et variantes
    const isDoueQuestion = /es\s*t['']?il\s+dou[eé]|est\s*il\s+dou[eé]|est\s*ce\s*qu['']?il\s+est\s+dou[eé]/i.test(message);
    
    // Gérer les questions spécifiques
    const isBonjour = normalizedQ === 'bonjour' || 
                      /^(bonjour|salut|hello|hi|miarahaba|manao ahoana)/i.test(message);
    if (isBonjour) {
      return NextResponse.json({ 
        response: multilingualResponses[responseLang].bonjour 
      });
    }
    
    // Gérer les questions spécifiques avec réponses précises
    if (normalizedQ === 'cv') {
      const cvResponse = multilingualResponses[responseLang].cv(responseLang);
      return NextResponse.json({ 
        response: cvResponse 
      });
    }
    
    if (normalizedQ === 'projets') {
      const projetsResponse = multilingualResponses[responseLang].projets(responseLang);
      return NextResponse.json({ 
        response: projetsResponse 
      });
    }
    
    if (normalizedQ === 'technologies') {
      const technologiesResponse = multilingualResponses[responseLang].technologies(responseLang);
      return NextResponse.json({ 
        response: technologiesResponse 
      });
    }
    
    if (normalizedQ === 'competences') {
      const competencesResponse = cleanResponse(multilingualResponses[responseLang].competences);
      return NextResponse.json({ 
        response: competencesResponse 
      });
    }
    
    if (normalizedQ === 'language') {
      const languageResponse = cleanResponse(multilingualResponses[responseLang].language);
      return NextResponse.json({ 
        response: languageResponse 
      });
    }
    
    if (normalizedQ === 'frontendBackend') {
      const frontendBackendResponse = cleanResponse(multilingualResponses[responseLang].frontendBackend);
      return NextResponse.json({ 
        response: frontendBackendResponse 
      });
    }
    
    if (normalizedQ === 'experience') {
      const experienceResponse = cleanResponse(multilingualResponses[responseLang].experience);
      return NextResponse.json({ 
        response: experienceResponse 
      });
    }
    
    // Gérer les questions hors scope - Vérifier AVANT les autres questions
    if (normalizedQ === 'outOfScope') {
      const outOfScopeResponse = multilingualResponses[responseLang].outOfScope;
      return NextResponse.json({ 
        response: outOfScopeResponse 
      });
    }
    
    if (normalizedQ === 'capabilities' || normalizedQ === 'followup' || isDoueQuestion) {
      // Pour les questions de suivi, utiliser le contexte précédent si disponible
      if (normalizedQ === 'followup') {
        return NextResponse.json({ 
          response: multilingualResponses[responseLang].followup 
        });
      }
      if (normalizedQ === 'capabilities' || isDoueQuestion) {
        const capabilitiesResponse = cleanResponse(multilingualResponses[responseLang].capabilities);
        return NextResponse.json({ 
          response: capabilitiesResponse 
        });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Si pas de clé API OpenAI, utiliser une réponse basique
    if (!apiKey) {
      const basicResponse = generateBasicResponse(message, responseLang);
      const cleanedResponse = cleanResponse(basicResponse);
      return NextResponse.json({ response: cleanedResponse });
    }

    try {
      // Initialiser le modèle de chat
      if (!chatModel) {
        chatModel = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: 'gpt-4o-mini', // Utiliser un modèle plus récent et performant
          temperature: 0.3, // Réduire la température pour des réponses plus précises et cohérentes
        });
      }

      // Rechercher des documents pertinents avec RAG (augmenter à 8 pour plus de contexte)
      const relevantDocs = await searchRelevantDocs(message, 8);

      // Déterminer la langue de réponse
      const langInstructions = {
        fr: 'Réponds TOUJOURS en français. Utilise un langage professionnel et courtois.',
        en: 'Réponds TOUJOURS en anglais (English). Use professional and courteous language.',
        mga: 'Réponds TOUJOURS en malgache. Ampiasao ny fiteny malagasy, tsara sy mahalala fomba.',
      };

      // Vérifier si la question est hors scope AVANT d'appeler l'API
      if (isOutOfScope(message)) {
        const outOfScopeResponse = multilingualResponses[responseLang].outOfScope;
        return NextResponse.json({ 
          response: outOfScopeResponse 
        });
      }

      // Créer le prompt avec contexte RAG
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Tu es un assistant IA professionnel qui aide les visiteurs du portfolio de Fifaliantsoa Sarobidy.

IMPORTANT - Règles strictes à suivre:

1. PORTÉE DES QUESTIONS:
   - Tu dois UNIQUEMENT répondre aux questions concernant le portfolio professionnel de Fifaliantsoa Sarobidy
   - Si une question est hors sujet (vie personnelle, questions générales non liées au portfolio, etc.), réponds poliment "Désolé, je ne peux répondre qu'aux questions concernant le portfolio professionnel de Fifaliantsoa Sarobidy."
   - Questions acceptées: compétences techniques, projets, expérience professionnelle, technologies maîtrisées, contact professionnel, CV
   - Questions refusées: vie personnelle, famille, âge, salaire, hobbies personnels, questions générales non liées au portfolio

2. UTILISATION DU CONTEXTE:
   - Utilise ABSOLUMENT les informations du contexte ci-dessous pour répondre
   - Ne donne JAMAIS de réponses génériques si le contexte contient des informations spécifiques
   - Cite les technologies, projets et compétences EXACTEMENT comme mentionnés dans le contexte
   - Si la question demande des détails spécifiques (nom de projet, technologie précise, etc.), cherche DANS LE CONTEXTE et cite exactement ce qui est mentionné
   - Si l'information demandée n'existe PAS dans le contexte, réponds "Désolé, je n'ai pas cette information dans le portfolio. Je peux vous aider avec ses compétences, projets, expérience, technologies ou comment le contacter."
   - Pour les questions sur un projet spécifique, cite TOUTES les informations disponibles dans le contexte (technologies, description, URL)
   - Pour les questions sur une technologie, cite TOUS les projets qui l'utilisent si mentionnés dans le contexte

3. GESTION DU CV:
   - Si on demande le CV, réponds que le CV est disponible en format PDF et peut être téléchargé
   - Pour le lien CV, utilise: <a href="/cv.pdf" download="CV_Sarobidy_Fifaliantsoa.pdf" class="cv-link text-yellow-400 hover:text-yellow-300 underline font-semibold cursor-pointer transition-colors">Télécharger le CV</a>

4. FORMAT DE RÉPONSE:
   - ${langInstructions[responseLang]}
   - Sois courtois, professionnel et concis
   - Réponds directement à la question posée
   - Si le contexte ne contient pas l'information exacte, dis "Désolé, je n'ai pas cette information dans le portfolio."
   - NE RÉPÈTE PAS que tu es là pour aider - réponds directement avec les informations du contexte

5. EXEMPLES DE BONNES RÉPONSES:
   - Pour "quelles sont ses compétences?": Liste les technologies et outils spécifiques du contexte avec leurs niveaux de maîtrise si disponibles
   - Pour "quels projets a-t-il réalisés?": Cite les projets mentionnés dans le contexte avec leurs technologies, descriptions et URLs si disponibles
   - Pour "quel projet utilise React?": Liste TOUS les projets du contexte qui utilisent React avec leurs détails
   - Pour "parle-moi du projet Ilodesk": Donne TOUTES les informations disponibles dans le contexte sur ce projet (description, technologies, URL)
   - Pour "est-il capable de...": Réponds avec les capacités listées dans le contexte
   - Pour "combien d'années d'expérience?": Utilise l'information d'expérience du contexte (plus de 4 ans)
   - Pour "montrer le CV" ou "télécharger le CV": Fournis le lien de téléchargement
   - Pour "quelles technologies maîtrise-t-il?": Liste TOUTES les technologies mentionnées dans le contexte, organisées par catégorie (Frontend, Backend, Design, etc.)

6. EXEMPLES DE QUESTIONS À REFUSER:
   - "Est-il marié?" → "Désolé, je ne peux répondre qu'aux questions professionnelles."
   - "Quel est son âge?" → "Désolé, je ne peux répondre qu'aux questions professionnelles."
   - "Quelle est la météo?" → "Désolé, je ne peux répondre qu'aux questions sur le portfolio."

Contexte du portfolio (informations pertinentes):
{context}`,
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

      // Nettoyer la réponse pour supprimer les markdown
      const cleanedResponse = cleanResponse(response);

      return NextResponse.json({ response: cleanedResponse });
    } catch (error) {
      console.error('Erreur avec OpenAI:', error);
      
      // Fallback vers une réponse basique
      const basicResponse = generateBasicResponse(message, responseLang);
      const cleanedResponse = cleanResponse(basicResponse);
      return NextResponse.json({ response: cleanedResponse });
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
function generateBasicResponse(message: string, language: 'fr' | 'en' | 'mga' = 'fr'): string {
  // Vérifier d'abord si c'est hors scope
  if (isOutOfScope(message)) {
    return multilingualResponses[language].outOfScope;
  }
  
  const normalizedMessage = normalizeText(message);
  const knowledgeDocs = getKnowledgeDocuments();
  
  // Rechercher des documents pertinents même en mode fallback
  const relevantDocs = searchByKeywords(message, knowledgeDocs, 5);
  
  // Réponses multilingues pour le fallback
  const fallbackResponses = {
    fr: {
      competence: "Fifaliantsoa Sarobidy possède les compétences suivantes :\n\n",
      contact: "Vous pouvez contacter Fifaliantsoa Sarobidy via:\n- Email: sarobidy.fifaliantsoa@ilomad.com\n- Téléphone: +261 34 46 536 09\n- Localisation: Madagascar, Fianarantsoa",
      projet: "Le portfolio contient plusieurs projets réalisés dans différents domaines:\n- Applications web et mobiles\n- Dashboards et interfaces d'administration\n- Projets de design et maquettage\n- Solutions intégrant l'intelligence artificielle\n- Applications pour différentes industries (gestion, mobilité, etc.)\n\nVous pouvez consulter la section \"Projets\" du portfolio pour plus de détails.",
      experience: "Fifaliantsoa Sarobidy est un développeur fullstack avec plus de 4 ans d'expérience dans le développement web et mobile. Il a une expertise en JavaScript et frameworks modernes, ainsi qu'en design UI/UX. Il connaît les architectures modernes et les meilleures pratiques de développement.",
      default: "Merci pour votre question. Je suis ici pour vous aider à en savoir plus sur le portfolio de Fifaliantsoa Sarobidy. Pour des informations spécifiques, n'hésitez pas à me poser des questions sur ses compétences, projets, expérience, ou comment le contacter.",
    },
    en: {
      competence: "Fifaliantsoa Sarobidy has the following skills:\n\n",
      contact: "You can contact Fifaliantsoa Sarobidy via:\n- Email: sarobidy.fifaliantsoa@ilomad.com\n- Phone: +261 34 46 536 09\n- Location: Madagascar, Fianarantsoa",
      projet: "The portfolio contains several projects completed in different domains:\n- Web and mobile applications\n- Dashboards and administration interfaces\n- Design and mockup projects\n- Solutions integrating artificial intelligence\n- Applications for different industries (management, mobility, etc.)\n\nYou can check the \"Projects\" section of the portfolio for more details.",
      experience: "Fifaliantsoa Sarobidy is a fullstack developer with more than 4 years of experience in web and mobile development. He has expertise in JavaScript and modern frameworks, as well as UI/UX design. He knows modern architectures and best development practices.",
      default: "Thank you for your question. I am here to help you learn more about Fifaliantsoa Sarobidy's portfolio. For specific information, feel free to ask me questions about his skills, projects, experience, or how to contact him.",
    },
    mga: {
      competence: "Fifaliantsoa Sarobidy manana ny fahaizana manaraka:\n\n",
      contact: "Afaka mifandraisa amin'i Fifaliantsoa Sarobidy amin'ny:\n- Email: sarobidy.fifaliantsoa@ilomad.com\n- Telefaona: +261 34 46 536 09\n- Toerana: Madagasikara, Fianarantsoa",
      projet: "Ny portfolio dia misy tetikasa maromaro vita tamin'ny sehatra samihafa:\n- Application web sy mobile\n- Dashboard sy interface fitantanana\n- Tetikasa design sy maquette\n- Vahaolana mampiditra IA\n- Application ho an'ny indostria samihafa (fitantanana, fivezivezena, sns)\n\nAfaka mijery ny fizarana \"Tetikasa\" amin'ny portfolio ho hahalala bebe kokoa.",
      experience: "Fifaliantsoa Sarobidy dia mpamorona fullstack miaraka amin'ny traikefa mihoatra ny 4 taona amin'ny fampandrosoana web sy mobile. Manana fahaizana amin'ny JavaScript sy frameworks maoderina, ary koa amin'ny design UI/UX. Mahay ny rafitra maoderina sy ny fomba tsara amin'ny fampandrosoana.",
      default: "Misaotra amin'ny fanontanianao. Eto aho mba hanampy anao hahalala bebe kokoa momba ny portfolio an'i Fifaliantsoa Sarobidy. Ho an'ny vaovao manokana, aza miangana anontanio aho momba ny fahaizany, ny tetikasany, ny traikefany, na ny fomba mifandraisa aminy.",
    },
  };
  
  // Construire une réponse basée sur les documents trouvés
  if (relevantDocs.length > 0) {
    // Extraire les informations pertinentes des documents
    const context = relevantDocs.join('\n\n');
    
    // Détecter le type de question pour personnaliser la réponse
    const normalizedQ = normalizeQuestion(message);
    
    // Utiliser les réponses précises si disponibles
    if (normalizedQ === 'competences' && multilingualResponses[language].competences) {
      return multilingualResponses[language].competences;
    }
    
    if (normalizedQ === 'capabilities' && multilingualResponses[language].capabilities) {
      return multilingualResponses[language].capabilities;
    }
    
    if (normalizedQ === 'language' && multilingualResponses[language].language) {
      return multilingualResponses[language].language;
    }
    
    if (normalizedQ === 'frontendBackend' && multilingualResponses[language].frontendBackend) {
      return multilingualResponses[language].frontendBackend;
    }
    
    // Pour les compétences, utiliser une réponse structurée sans répétitions
    if (normalizedMessage.includes('competence') || normalizedMessage.includes('technologie') || normalizedMessage.includes('skill')) {
      return multilingualResponses[language].competences || fallbackResponses[language].competence;
    }
    
    if (normalizedMessage.includes('contact') || normalizedMessage.includes('email') || normalizedMessage.includes('telephone') || normalizedMessage.includes('phone')) {
      return fallbackResponses[language].contact;
    }

    if (normalizedMessage.includes('projet') || normalizedMessage.includes('realisation') || normalizedMessage.includes('travail') || normalizedMessage.includes('project')) {
      return fallbackResponses[language].projet;
    }

    if (normalizedMessage.includes('experience') || normalizedMessage.includes('annee') || normalizedMessage.includes('ans') || normalizedMessage.includes('year')) {
      return fallbackResponses[language].experience;
    }

    // Réponse générique basée sur le contexte trouvé
    const genericPrefix = language === 'fr' 
      ? 'Voici des informations pertinentes:\n\n'
      : language === 'en'
      ? 'Here is relevant information:\n\n'
      : 'Ity no vaovao azo ampifandraisana:\n\n';
    
    const genericSuffix = language === 'fr'
      ? '\n\nPour plus de détails, n\'hésitez pas à poser une question plus spécifique.'
      : language === 'en'
      ? '\n\nFor more details, feel free to ask a more specific question.'
      : '\n\nHo hahalala bebe kokoa, aza miangana anontanio fanontaniana mazava kokoa.';
    
    return `${genericPrefix}${context.substring(0, 500)}${context.length > 500 ? '...' : ''}${genericSuffix}`;
  }

  // Réponse de secours si vraiment rien n'est trouvé
  return fallbackResponses[language].default;
}

