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
function createSectionLink(text: string, sectionId: string): string {
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
  
  // Exclure les salutations de la détection hors scope (pattern complet)
  const greetingPattern = /^(bonjour|salut|hello|hi|bonsoir|bonne.*soir|bonne.*nuit|good.*evening|good.*night|miarahaba|manao ahoana|bon.*jour|bon.*soir|salama|hey|hola|ciao|repond.*moi|reponds.*moi|oui|yes|ok|d'accord)$/i;
  const isGreeting = greetingPattern.test(normalized) || greetingPattern.test(originalLower.trim());
  if (isGreeting) {
    return false; // Les salutations sont toujours acceptées
  }
  
  // Accepter les questions sur les capacités du chatbot (parler malgache, etc.)
  const isChatbotCapabilityQuestion = normalized.match(/(parler.*malagasy|parler.*malgache|speak.*malagasy|tu.*sais|you.*know|capable.*parler|can.*speak|mahay.*miteny|afaka.*miteny|intelligent|inteligent|smart)/i);
  if (isChatbotCapabilityQuestion) {
    return false; // Les questions sur les capacités du chatbot sont acceptées
  }
  
  // Accepter les questions de suivi courtes
  const isFollowUp = normalized.match(/^(autre|other|encore|more|plus|suivant|next|et|and|ary|quoi.*autre|what.*else|autre.*chose|other.*thing)$/i);
  if (isFollowUp) {
    return false; // Les questions de suivi sont acceptées
  }
  
  // Si la question est très courte et ne contient aucun mot-clé du portfolio, probablement hors scope
  // Mais seulement si ce n'est pas une question de suivi ou sur le chatbot
  if (question.trim().length < 10 && !hasPortfolioKeyword && !isFollowUp && !isChatbotCapabilityQuestion) {
    return true;
  }
  
  return false;
}

// Normaliser les questions pour une meilleure compréhension
function normalizeQuestion(question: string): string {
  const normalized = normalizeText(question);
  const originalLower = question.toLowerCase().trim();
  
  // PRIORITÉ ABSOLUE 1: Variantes de salutations (DOIT être vérifié AVANT le scope)
  const greetingPattern = /^(bonjour|salut|hello|hi|bonsoir|bonne.*soir|bonne.*nuit|good.*evening|good.*night|miarahaba|manao ahoana|bon.*jour|bon.*soir|salama|hey|hola|ciao|repond.*moi|reponds.*moi|oui|yes|ok|d'accord)$/i;
  if (greetingPattern.test(normalized) || greetingPattern.test(originalLower)) {
    return 'bonjour';
  }
  
  // PRIORITÉ 1: Demandes de CV
  if (normalized.match(/(cv|curriculum|resume|montrer.*cv|voir.*cv|telecharger.*cv|download.*cv|afficher.*cv|show.*cv|envoyer.*cv|send.*cv)/i) ||
      originalLower.includes('curriculum vitae') || originalLower.includes('curriculum vitæ')) {
    return 'cv';
  }
  
  // Vérifier si c'est hors scope (APRÈS avoir vérifié les salutations)
  if (isOutOfScope(question)) {
    return 'outOfScope';
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
  if (normalized.match(/(vraiment.*experience|vraiment.*ans|vraiment.*annee|exactement.*experience|exactement.*ans|how many years|combien.*ans|combien.*annee|ou.*travaille|ou.*travail|quelles.*entreprises|quelles.*experience|quelles.*experiences|ses.*experiences|ses.*experiences|parle.*experience|parle.*experiences|experience.*professionnelle|experiences.*professionnelles)/i)) {
    return 'experience';
  }
  
  // PRIORITÉ 7.5: Questions sur les diplômes et formations
  if (normalized.match(/(diplome|diplôme|diplomes|diplômes|formation|formations|parcours.*academique|parcours.*académique|education|éducation|master|licence|bacc|baccalaureat|baccalauréat|eni|ecole|école|lycee|lycée|ses.*diplomes|ses.*diplômes|quels.*diplomes|quels.*diplômes)/i)) {
    return 'diplomes';
  }
  
  // PRIORITÉ 7.6: Questions sur les prix et distinctions
  if (normalized.match(/(prix|distinction|distinctions|recompense|récompense|hackathon|pnud|certificat|award|awards|ses.*prix|ses.*distinctions)/i)) {
    return 'prix';
  }
  
  // PRIORITÉ 7.7: Questions sur les informations légales (cookies, mentions légales, etc.)
  if (normalized.match(/(information.*legal|informations.*legal|legal|legale|legales|mention.*legal|mentions.*legal|cookie|cookies|donnee.*personnel|données.*personnel|donnee.*personnelle|données.*personnelles|propriete.*intellectuel|propriété.*intellectuel|propriete.*intellectuelle|propriété.*intellectuelle|copyright|confidentialite|confidentialité|vie.*prive|vie.*privée|rgpd|gdpr|politique.*confidentialite|politique.*confidentialité|politique.*cookie|politique.*cookies)/i)) {
    return 'legal';
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
  
  // PRIORITÉ 10: Questions de suivi (amélioré)
  if (normalized.match(/^(et|and|ary|autre|other|encore|more|plus|suivant|next|quoi.*autre|what.*else|autre.*chose|other.*thing)$/i)) {
    return 'followup';
  }
  
  // PRIORITÉ 11: Questions sur les capacités du chatbot (parler malgache, etc.)
  if (normalized.match(/(parler.*malagasy|parler.*malgache|speak.*malagasy|tu.*sais.*parler|you.*know.*speak|capable.*parler|can.*speak|mahay.*miteny|afaka.*miteny|intelligent|inteligent|smart)/i)) {
    return 'chatbotCapabilities';
  }
  
  return question;
}

// Dictionnaire de synonymes amélioré pour améliorer la recherche
const synonyms: { [key: string]: string[] } = {
  'competence': ['compétence', 'competence', 'compétences', 'compétences', 'savoir', 'sait', 'technologie', 'technologies', 'skill', 'skills', 'doué', 'doux', 'doué en', 'bon en', 'expert', 'expertise', 'capable', 'capacité', 'capacités', 'capabilities'],
  'projet': ['projet', 'projets', 'travail', 'travaux', 'réalisation', 'réalisations', 'realisation', 'work', 'works'],
  'contact': ['contact', 'contacter', 'email', 'mail', 'téléphone', 'telephone', 'phone', 'adresse', 'address'],
  'experience': ['expérience', 'experience', 'expériences', 'experiences', 'année', 'annee', 'ans', 'années', 'annees', 'carrière', 'carriere', 'year', 'years', 'travaille', 'travail', 'entreprise', 'entreprises', 'employeur', 'employeurs', 'poste', 'postes', 'emploi', 'emplois', 'stage', 'stages', 'freelance', 'ilomad', 'takalou', 'ca2e', 'paositra', 'malagasy'],
  'diplome': ['diplôme', 'diplome', 'diplômes', 'diplomes', 'formation', 'formations', 'éducation', 'education', 'parcours', 'académique', 'academique', 'master', 'licence', 'bacc', 'baccalauréat', 'baccalaureat', 'eni', 'école', 'ecole', 'lycée', 'lycee', 'lrr'],
  'technologie': ['technologie', 'technologies', 'tech', 'outil', 'outils', 'langage', 'langages', 'framework', 'frameworks'],
  'capable': ['capable', 'capacité', 'capacités', 'peut', 'peux', 'sait faire', 'est capable', 'capable de', 'can do', 'capabilities'],
  'doué': ['doué', 'doué en', 'bon en', 'expert', 'expertise', 'talent', 'talented'],
  'prix': ['prix', 'distinction', 'distinctions', 'récompense', 'recompense', 'récompenses', 'recompenses', 'hackathon', 'pnud', 'certificat', 'certificats', 'award', 'awards'],
  'legal': ['legal', 'legale', 'legales', 'légale', 'légales', 'information legal', 'informations legal', 'information legale', 'informations legales', 'mention legal', 'mentions legal', 'mention legale', 'mentions legales', 'cookie', 'cookies', 'donnee personnel', 'données personnel', 'donnee personnelle', 'données personnelles', 'propriete intellectuel', 'propriété intellectuel', 'propriete intellectuelle', 'propriété intellectuelle', 'copyright', 'confidentialite', 'confidentialité', 'vie prive', 'vie privée', 'rgpd', 'gdpr', 'politique confidentialite', 'politique confidentialité', 'politique cookie', 'politique cookies'],
};

// Recherche améliorée par mots-clés pour le RAG avec synonymes et correspondance de phrases
function searchByKeywords(query: string, documents: string[], k: number = 8): string[] {
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
    const projectNames = ['ilodesk', 'digitheque', 'sarakodev', 'raitra', 'ca2e', 'congé', 'gta', 'smart dashboard', 'portfolio', 'ilomad', 'smart-rh', 'smartrh'];
    projectNames.forEach(projectName => {
      if (originalQuery.includes(projectName) && originalDoc.includes(projectName)) {
        score += 15; // Bonus très élevé pour correspondance de nom de projet
      }
    });
    
    // Bonus pour correspondance d'entreprises
    const companyNames = ['ilomad', 'takalou', 'ca2e', 'paositra', 'malagasy', 'e-atiala'];
    companyNames.forEach(companyName => {
      if (originalQuery.includes(companyName) && originalDoc.includes(companyName)) {
        score += 15; // Bonus très élevé pour correspondance d'entreprise
      }
    });
    
    // Bonus pour correspondance de technologies spécifiques
    const techNames = ['react', 'next.js', 'angular', 'node.js', 'nestjs', 'typescript', 'javascript', 'tailwind', 'figma', 'adobe', 'express', 'fastapi', 'postgresql', 'docker'];
    techNames.forEach(techName => {
      if (originalQuery.includes(techName) && originalDoc.includes(techName)) {
        score += 12; // Bonus élevé pour correspondance de technologie
      }
    });
    
    // Bonus pour correspondance de diplômes et formations
    const educationTerms = ['master', 'licence', 'bacc', 'diplome', 'diplôme', 'formation', 'eni', 'ecole', 'école', 'lycee', 'lycée', 'lrr'];
    educationTerms.forEach(term => {
      if (originalQuery.includes(term) && originalDoc.includes(term)) {
        score += 12; // Bonus élevé pour correspondance de terme éducatif
      }
    });
    
    // Bonus pour correspondance d'informations légales
    const legalTerms = ['legal', 'legale', 'legales', 'légale', 'légales', 'cookie', 'cookies', 'mention legal', 'mentions legal', 'donnee personnel', 'données personnelles', 'propriete intellectuelle', 'propriété intellectuelle', 'copyright', 'confidentialite', 'confidentialité', 'rgpd', 'gdpr'];
    legalTerms.forEach(term => {
      if (originalQuery.includes(term) && originalDoc.includes(term)) {
        score += 15; // Bonus très élevé pour correspondance d'information légale
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
  // Support pour OPEN_EPI_KEY (nom personnalisé) et OPENAI_API_KEY (nom standard)
  const apiKey = process.env.OPEN_EPI_KEY || process.env.OPENAI_API_KEY;
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
    bonjour: (greeting?: string) => {
      const greetingLower = greeting?.toLowerCase().trim() || '';
      const isEvening = greetingLower.includes('soir') || greetingLower.includes('evening') || greetingLower.includes('bonsoir');
      const isSalut = greetingLower === 'salut' || greetingLower.includes('salut');
      const isOui = greetingLower === 'oui' || greetingLower === 'yes' || greetingLower === 'ok';
      const isRepond = greetingLower.includes('repond');
      
      let salutation = "Bonjour";
      if (isEvening) salutation = "Bonsoir";
      else if (isSalut) salutation = "Salut";
      else if (isOui || isRepond) salutation = "Bonjour";
      
      const responses = [
        `${salutation} ! Je suis votre assistant IA. Je peux répondre à vos questions sur le portfolio de Sarobidy FIFALIANTSOA, ses projets, ses compétences techniques, son expérience professionnelle, ses diplômes et ses distinctions. Comment puis-je vous aider ?`,
        `${salutation} ! Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur les compétences, projets et expériences de Sarobidy FIFALIANTSOA.`,
        `${salutation} ! Je suis là pour répondre à vos questions sur le portfolio de Sarobidy FIFALIANTSOA. Que souhaitez-vous savoir ?`,
        `${salutation} ! Bienvenue ! Je peux vous aider avec toutes les informations sur Sarobidy FIFALIANTSOA : ses compétences, projets, expériences professionnelles, diplômes et distinctions.`
      ];
      
      // Utiliser un index basé sur le hash du message pour varier les réponses
      const index = greetingLower.length % responses.length;
      return responses[index];
    },
    competences: "Sarobidy FIFALIANTSOA est un développeur Fullstack avec 3+ ans d'expérience professionnelle. Voici ses compétences principales :\n\n• Frontend : React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend : Node.js, NestJS, Express, FastAPI, Laravel, .NET\n• Bases de données : PostgreSQL, MySQL, SQL Server, Redis, Qdrant\n• IA/ML : LangChain, LLM\n• Design : Figma, Adobe XD, Adobe Photoshop, Adobe Illustrator\n• Outils : Git, GitHub, GitLab, Jest, Jira, Docker\n\nIl est spécialisé en JavaScript et TypeScript, avec une expertise en développement d'applications web modernes, design UI/UX, et intégration de systèmes IA.",
    capabilities: "Oui, il est très capable ! Sarobidy FIFALIANTSOA est capable de :\n\n• Développer des applications web complètes (frontend et backend)\n• Créer des interfaces utilisateur modernes et responsives\n• Concevoir des maquettes et prototypes avec Figma et Adobe\n• Intégrer des systèmes d'intelligence artificielle (RAG, chatbots)\n• Optimiser les performances des applications\n• Développer des applications mobiles\n• Créer des dashboards et interfaces d'administration\n• Travailler en équipe avec des outils de collaboration\n• Gérer des projets de A à Z\n• Automatiser des processus métier via IA\n\nIl maîtrise React, Next.js, Angular, NestJS, TypeScript, et bien d'autres technologies.",
    language: "Sarobidy FIFALIANTSOA est le plus fort en JavaScript et TypeScript. Il est spécialisé dans ces langages avec 3+ ans d'expérience professionnelle. Il maîtrise également les frameworks modernes basés sur JavaScript comme React, Next.js, Angular, Node.js et NestJS.",
    projets: (lang: 'fr' | 'en' | 'mga' = 'fr') => {
      const link = createSectionLink('section Projets', 'projet');
      return `Voici les projets réalisés par Sarobidy FIFALIANTSOA :\n\n**Projets Web :**\n• Dashboard Ilodesk - Plateforme de gestion avec ReactJS, TypeScript, .NET, SQL Server\n• Ilodesk Platform - Solution complète avec ReactJS, TypeScript, Tailwind\n• Smart Dashboard - Dashboard intelligent avec ReactJS, NestJS, Stripe, Chart.js\n• Digitheque - Application Next.js avec Prisma et Tailwind\n• Portfolio - Site portfolio avec ReactJS, Framer Motion, GSAP\n• Ilomad Website - Site web avec Next.js, PHP, MySQL\n• Sarakodev - Plateforme avec Express, Next.js, PostgreSQL, AWS\n• Raitra - Application ReactJS avec Node.js et PostgreSQL\n• CA2E Platform - Plateforme Laravel avec React et MySQL\n• Congé Manager - Gestionnaire de congés avec ReactJS, Express, PostgreSQL\n• GTA Project - Projet Next.js avec Blender\n\n**Projets Mobile :**\n• Mobilité PNUD - Application mobile avec React Native, Firebase, Maps API\n• CA2E Mobile - Application mobile avec React Native, Express.js, SQLite\n• DEIS Mobile - Application mobile avec Ionic, Angular, SQLite\n• Portfolio Mobile - Application mobile avec React Native\n\n**Projets IA :**\n• AI Project - Projet d'intelligence artificielle avec Python, TensorFlow, OpenCV, FastAPI\n\nCliquez ici pour voir tous les projets : ${link}`;
    },
    technologies: (lang: 'fr' | 'en' | 'mga' = 'fr') => {
      const link = createSectionLink('section Technologies', 'techno');
      return `Sarobidy FIFALIANTSOA maîtrise les technologies suivantes :\n\n• Frontend : React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend : Node.js, NestJS, Express, FastAPI, Laravel, .NET\n• Bases de données : PostgreSQL, MySQL, SQL Server, Redis, Qdrant\n• IA/ML : LangChain, LLM\n• Design : Figma, Adobe XD, Adobe Photoshop, Adobe Illustrator\n• Outils : Git, GitHub, GitLab, Jest, Jira, Docker\n• Cloud : AWS\n• Autres : Docker, Stripe, Chart.js\n\nCliquez ici pour voir toutes les technologies : ${link}`;
    },
    frontendBackend: "Sarobidy FIFALIANTSOA est un développeur Fullstack, ce qui signifie qu'il est compétent à la fois en frontend et en backend. Il excelle particulièrement en :\n\n• Frontend : React, Next.js, Angular avec TypeScript et Tailwind CSS\n• Backend : Node.js, NestJS, Express, FastAPI\n\nIl a une solide expérience dans les deux domaines et peut développer des applications complètes de bout en bout.",
    experience: "Sarobidy FIFALIANTSOA a 3+ ans d'expérience professionnelle dans le développement web et mobile. Voici ses expériences principales :\n\n• DEVELOPPEUR FULLSTACK & UI/UX Designer chez ILOMAD (Mai 2024 - Nov 2025)\n• DEVELOPPEUR FULLSTACK Freelance chez Takalou Sarl (Mars 2023 - Avril 2024)\n• DEVELOPPEUR FULLSTACK en stage chez CA2E & E-atiala (Juillet 2022 - Février 2023)\n• DEVELOPPEUR FULLSTACK en stage puis CDD chez Paositra Malagasy (Février 2022 - Juin 2022)\n\nIl a développé des applications web et mobiles, intégré des systèmes IA, et créé des interfaces utilisateur modernes.",
    diplomes: "Sarobidy FIFALIANTSOA a suivi les formations suivantes :\n\n• Master en informatique - Ecole Nationale d'Informatique (ENI) - Génie Logiciel et base de données\n• Diplôme Licence en informatique - Ecole Nationale d'Informatique (ENI) - Génie Logiciel et base de données\n• Bacc série C - Lycée LRR",
    prix: "Sarobidy FIFALIANTSOA a reçu la distinction suivante :\n\n• 2023 | 1 prix : Deuxième place au hackathon organisé par PNUD (certificat)",
    cv: (lang: 'fr' | 'en' | 'mga' = 'fr') => {
      const cvLink = createCVLink(lang);
      return `Le CV de Sarobidy FIFALIANTSOA est disponible en format PDF. Vous pouvez le télécharger en cliquant sur le lien suivant : ${cvLink}\n\nLe CV contient toutes les informations détaillées sur son parcours professionnel, ses compétences, ses projets, ses expériences, ses diplômes et ses distinctions.`;
    },
    outOfScope: "Désolé, je ne peux répondre qu'aux questions concernant le portfolio professionnel de Sarobidy FIFALIANTSOA.\n\nJe peux vous aider avec :\n• Ses compétences techniques et savoir-faire\n• Ses projets réalisés (web, mobile, IA)\n• Son expérience professionnelle détaillée\n• Les technologies qu'il maîtrise\n• Ses diplômes et formations\n• Ses prix et distinctions\n• Comment le contacter professionnellement\n• Son CV\n• Les informations légales du site (cookies, mentions légales, etc.)\n\nPour toute autre question, je vous invite à consulter directement le portfolio ou à le contacter via les informations de contact disponibles.",
    followup: "Souhaitez-vous en savoir plus sur un point spécifique ? Posez-moi une question plus précise !",
    legal: "Voici les informations légales du site portfolio de Sarobidy FIFALIANTSOA :\n\n**Mentions Légales :**\nCe portfolio est la propriété de Sarobidy FIFALIANTSOA. Tous les projets présentés sont des réalisations personnelles ou professionnelles.\n\n**Propriété Intellectuelle :**\nL'ensemble du contenu de ce site (textes, images, logos, graphismes) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable.\n\n**Données Personnelles :**\nAucune donnée personnelle n'est collectée automatiquement sur ce site. Les informations de contact fournies volontairement sont utilisées uniquement pour répondre aux demandes.\n\n**Cookies :**\nCe site utilise des cookies pour améliorer votre expérience de navigation et compter les visiteurs. Les cookies utilisés sont des cookies de session et de comptage des visiteurs (stockage local). Aucun cookie de tracking tiers n'est utilisé. Vous pouvez accepter ou refuser les cookies via la bannière de consentement.\n\n**Copyright :**\n© 2026 Sarobidy FIFALIANTSOA. Tous droits réservés.\n\nPour plus d'informations, consultez la page \"Informations légales\" du portfolio ou contactez Sarobidy FIFALIANTSOA via email (sarobidy.fifaliantsoa@ilomad.com) ou téléphone (+261 34 46 536 09).",
  },
  en: {
    bonjour: "Hello! I am your AI assistant. I can answer your questions about Sarobidy FIFALIANTSOA's portfolio, his projects, his technical skills, his professional experience, his education and his distinctions. How can I help you?",
    competences: "Sarobidy FIFALIANTSOA is a Fullstack developer with 3+ years of professional experience. Here are his main skills:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS, Express, FastAPI, Laravel, .NET\n• Databases: PostgreSQL, MySQL, SQL Server, Redis, Qdrant\n• AI/ML: LangChain, LLM\n• Design: Figma, Adobe XD, Adobe Photoshop, Adobe Illustrator\n• Tools: Git, GitHub, GitLab, Jest, Jira, Docker\n\nHe specializes in JavaScript and TypeScript, with expertise in modern web application development, UI/UX design, and AI system integration.",
    capabilities: "Yes, he is very capable! Sarobidy FIFALIANTSOA is capable of:\n\n• Developing complete web applications (frontend and backend)\n• Creating modern and responsive user interfaces\n• Designing mockups and prototypes with Figma and Adobe\n• Integrating artificial intelligence systems (RAG, chatbots)\n• Optimizing application performance\n• Developing mobile applications\n• Creating dashboards and administration interfaces\n• Working in teams with collaboration tools\n• Managing projects from A to Z\n• Automating business processes via AI\n\nHe masters React, Next.js, Angular, NestJS, TypeScript, and many other technologies.",
    language: "Sarobidy FIFALIANTSOA is strongest in JavaScript and TypeScript. He specializes in these languages with 3+ years of professional experience. He also masters modern JavaScript-based frameworks like React, Next.js, Angular, Node.js, and NestJS.",
    projets: (lang: 'fr' | 'en' | 'mga' = 'en') => {
      const link = createSectionLink('Projects section', 'projet');
      return `Here are the projects developed by Sarobidy FIFALIANTSOA:\n\n**Web Projects:**\n• Dashboard Ilodesk - Management platform with ReactJS, TypeScript, .NET, SQL Server\n• Ilodesk Platform - Complete solution with ReactJS, TypeScript, Tailwind\n• Smart Dashboard - Smart dashboard with ReactJS, NestJS, Stripe, Chart.js\n• Digitheque - Next.js application with Prisma and Tailwind\n• Portfolio - Portfolio site with ReactJS, Framer Motion, GSAP\n• Ilomad Website - Website with Next.js, PHP, MySQL\n• Sarakodev - Platform with Express, Next.js, PostgreSQL, AWS\n• Raitra - ReactJS application with Node.js and PostgreSQL\n• CA2E Platform - Laravel platform with React and MySQL\n• Congé Manager - Leave manager with ReactJS, Express, PostgreSQL\n• GTA Project - Next.js project with Blender\n\n**Mobile Projects:**\n• Mobilité PNUD - Mobile application with React Native, Firebase, Maps API\n• CA2E Mobile - Mobile application with React Native, Express.js, SQLite\n• DEIS Mobile - Mobile application with Ionic, Angular, SQLite\n• Portfolio Mobile - Mobile application with React Native\n\n**AI Projects:**\n• AI Project - Artificial intelligence project with Python, TensorFlow, OpenCV, FastAPI\n\nClick here to see all projects: ${link}`;
    },
    technologies: (lang: 'fr' | 'en' | 'mga' = 'en') => {
      const link = createSectionLink('Technologies section', 'techno');
      return `Sarobidy FIFALIANTSOA masters the following technologies:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS, Express, FastAPI, Laravel, .NET\n• Databases: PostgreSQL, MySQL, SQL Server, Redis, Qdrant\n• AI/ML: LangChain, LLM\n• Design: Figma, Adobe XD, Adobe Photoshop, Adobe Illustrator\n• Tools: Git, GitHub, GitLab, Jest, Jira, Docker\n• Cloud: AWS\n• Others: Docker, Stripe, Chart.js\n\nClick here to see all technologies: ${link}`;
    },
    frontendBackend: "Sarobidy FIFALIANTSOA is a Fullstack developer, meaning he is competent in both frontend and backend. He particularly excels in:\n\n• Frontend: React, Next.js, Angular with TypeScript and Tailwind CSS\n• Backend: Node.js, NestJS, Express, FastAPI\n\nHe has solid experience in both domains and can develop complete end-to-end applications.",
    experience: "Sarobidy FIFALIANTSOA has 3+ years of professional experience in web and mobile development. Here are his main experiences:\n\n• FULLSTACK DEVELOPER & UI/UX Designer at ILOMAD (May 2024 - November 2025)\n• FULLSTACK DEVELOPER Freelance at Takalou Sarl (March 2023 - April 2024)\n• FULLSTACK DEVELOPER Intern at CA2E & E-atiala (July 2022 - February 2023)\n• FULLSTACK DEVELOPER Intern then Fixed-Term Contract at Paositra Malagasy (February 2022 - June 2022)\n\nHe has developed web and mobile applications, integrated AI systems, and created modern user interfaces.",
    diplomes: "Sarobidy FIFALIANTSOA has completed the following education:\n\n• Master in Computer Science - National School of Computer Science (ENI) - Software Engineering and Databases\n• Bachelor's Degree in Computer Science - National School of Computer Science (ENI) - Software Engineering and Databases\n• High School Diploma (Bacc série C) - LRR High School",
    prix: "Sarobidy FIFALIANTSOA has received the following distinction:\n\n• 2023 | 1 award: Second place at the hackathon organized by PNUD (certificate)",
    cv: (lang: 'fr' | 'en' | 'mga' = 'en') => {
      const cvLink = createCVLink(lang);
      return `Sarobidy FIFALIANTSOA's CV is available in PDF format. You can download it by clicking on the following link: ${cvLink}\n\nThe CV contains all detailed information about his professional background, skills, projects, experiences, education and distinctions.`;
    },
    outOfScope: "Sorry, I can only answer questions about Sarobidy FIFALIANTSOA's professional portfolio.\n\nI can help you with:\n• His technical skills and capabilities\n• His completed projects (web, mobile, AI)\n• His detailed professional experience\n• The technologies he masters\n• His education and diplomas\n• His awards and distinctions\n• How to contact him professionally\n• His CV\n• Legal information about the site (cookies, legal notices, etc.)\n\nFor any other questions, I invite you to check the portfolio directly or contact him via the available contact information.",
    followup: "Would you like to know more about a specific point? Ask me a more specific question!",
    legal: "Here is the legal information about Sarobidy FIFALIANTSOA's portfolio site:\n\n**Legal Notices:**\nThis portfolio is the property of Sarobidy FIFALIANTSOA. All projects presented are personal or professional achievements.\n\n**Intellectual Property:**\nAll content on this site (texts, images, logos, graphics) is protected by copyright. Any reproduction, even partial, is prohibited without prior authorization.\n\n**Personal Data:**\nNo personal data is automatically collected on this site. Contact information provided voluntarily is used only to respond to requests.\n\n**Cookies:**\nThis site uses cookies to improve your browsing experience and count visitors. The cookies used are session cookies and visitor counting cookies (local storage). No third-party tracking cookies are used. You can accept or refuse cookies via the consent banner.\n\n**Copyright:**\n© 2026 Sarobidy FIFALIANTSOA. All rights reserved.\n\nFor more information, consult the \"Legal Information\" page of the portfolio or contact Sarobidy FIFALIANTSOA via email (sarobidy.fifaliantsoa@ilomad.com) or phone (+261 34 46 536 09).",
  },
  mga: {
    bonjour: "Miarahaba! Izaho dia ny mpanampy IA. Afaka mamaly ny fanontaniana momba ny portfolio an'i Sarobidy FIFALIANTSOA, ny tetikasany, ny fahaizany ara-teknika, ny traikefany ara-piasana, ny fianarany ary ny fankasitrahany aho. Ahoana no maha-afaka namampy anao aho?",
    competences: "Sarobidy FIFALIANTSOA dia mpamorona Fullstack miaraka amin'ny traikefa ara-piasana 3+ taona. Ity ny fahaizany fototra:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS, Express, FastAPI, Laravel, .NET\n• Bazy angona: PostgreSQL, MySQL, SQL Server, Redis, Qdrant\n• IA/ML: LangChain, LLM\n• Design: Figma, Adobe XD, Adobe Photoshop, Adobe Illustrator\n• Fitaovana: Git, GitHub, GitLab, Jest, Jira, Docker\n\nManokana amin'ny JavaScript sy TypeScript izy, miaraka amin'ny fahaizana amin'ny fampandrosoana application web maoderina, design UI/UX, ary ny fampifandraisana rafitra IA.",
    capabilities: "Eny, tena afaka izy! Sarobidy FIFALIANTSOA afaka:\n\n• Mamorona application web feno (frontend sy backend)\n• Mamorona interface mpampiasa maoderina sy responsive\n• Mamorona maquette sy prototype amin'ny Figma sy Adobe\n• Mampiditra rafitra IA (RAG, chatbots)\n• Manatsara ny performance amin'ny application\n• Mamorona application mobile\n• Mamorona dashboard sy interface fitantanana\n• Miara-miasa amin'ny fitaovana fiaraha-miasa\n• Mitantana tetikasa hatrany A ka Z\n• Mampandeha ny fizotran'ny orinasa amin'ny alalan'ny IA\n\nMahay React, Next.js, Angular, NestJS, TypeScript, ary teknologia hafa maro.",
    language: "Sarobidy FIFALIANTSOA dia matanjaka indrindra amin'ny JavaScript sy TypeScript. Manokana amin'ireo fiteny ireo izy miaraka amin'ny traikefa ara-piasana 3+ taona. Mahay koa ny frameworks maoderina miorina amin'ny JavaScript toy ny React, Next.js, Angular, Node.js, ary NestJS.",
    projets: (lang: 'fr' | 'en' | 'mga' = 'mga') => {
      const link = createSectionLink('fizarana Tetikasa', 'projet');
      return `Ireto ny tetikasa namboarin'i Sarobidy FIFALIANTSOA:\n\n**Tetikasa Web:**\n• Dashboard Ilodesk - Platform fitantanana miaraka amin'ny ReactJS, TypeScript, .NET, SQL Server\n• Ilodesk Platform - Vahaolana feno miaraka amin'ny ReactJS, TypeScript, Tailwind\n• Smart Dashboard - Dashboard manan-tsaina miaraka amin'ny ReactJS, NestJS, Stripe, Chart.js\n• Digitheque - Application Next.js miaraka amin'ny Prisma sy Tailwind\n• Portfolio - Tranokala portfolio miaraka amin'ny ReactJS, Framer Motion, GSAP\n• Ilomad Website - Tranokala miaraka amin'ny Next.js, PHP, MySQL\n• Sarakodev - Platform miaraka amin'ny Express, Next.js, PostgreSQL, AWS\n• Raitra - Application ReactJS miaraka amin'ny Node.js sy PostgreSQL\n• CA2E Platform - Platform Laravel miaraka amin'ny React sy MySQL\n• Congé Manager - Mpitantana fialan-tsasatra miaraka amin'ny ReactJS, Express, PostgreSQL\n• GTA Project - Tetikasa Next.js miaraka amin'ny Blender\n\n**Tetikasa Mobile:**\n• Mobilité PNUD - Application mobile miaraka amin'ny React Native, Firebase, Maps API\n• CA2E Mobile - Application mobile miaraka amin'ny React Native, Express.js, SQLite\n• DEIS Mobile - Application mobile miaraka amin'ny Ionic, Angular, SQLite\n• Portfolio Mobile - Application mobile miaraka amin'ny React Native\n\n**Tetikasa IA:**\n• AI Project - Tetikasa IA miaraka amin'ny Python, TensorFlow, OpenCV, FastAPI\n\nTsindrio eto ho hitanao ny tetikasa rehetra: ${link}`;
    },
    technologies: (lang: 'fr' | 'en' | 'mga' = 'mga') => {
      const link = createSectionLink('fizarana Teknologia', 'techno');
      return `Sarobidy FIFALIANTSOA mahay ireo teknologia manaraka:\n\n• Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx\n• Backend: Node.js, NestJS, Express, FastAPI, Laravel, .NET\n• Bazy angona: PostgreSQL, MySQL, SQL Server, Redis, Qdrant\n• IA/ML: LangChain, LLM\n• Design: Figma, Adobe XD, Adobe Photoshop, Adobe Illustrator\n• Fitaovana: Git, GitHub, GitLab, Jest, Jira, Docker\n• Cloud: AWS\n• Hafa: Docker, Stripe, Chart.js\n\nTsindrio eto ho hitanao ny teknologia rehetra: ${link}`;
    },
    frontendBackend: "Sarobidy FIFALIANTSOA dia mpamorona Fullstack, izany hoe mahay amin'ny frontend sy backend. Matanjaka indrindra amin'ny:\n\n• Frontend: React, Next.js, Angular miaraka amin'ny TypeScript sy Tailwind CSS\n• Backend: Node.js, NestJS, Express, FastAPI\n\nManana traikefa mafy amin'ny sehatra roa izy ary afaka mamorona application feno hatrany A ka Z.",
    experience: "Sarobidy FIFALIANTSOA dia manana traikefa ara-piasana 3+ taona amin'ny fampandrosoana web sy mobile. Ireto ny traikefany fototra:\n\n• MPAMORONA FULLSTACK & UI/UX Designer tao amin'ny ILOMAD (Mey 2024 - Novambra 2025)\n• MPAMORONA FULLSTACK Freelance tao amin'ny Takalou Sarl (Martsa 2023 - Avrily 2024)\n• MPAMORONA FULLSTACK stage tao amin'ny CA2E & E-atiala (Jolay 2022 - Febroary 2023)\n• MPAMORONA FULLSTACK stage avy eo CDD tao amin'ny Paositra Malagasy (Febroary 2022 - Jona 2022)\n\nNamboarina application web sy mobile izy, nampiditra rafitra IA, ary namorona interface mpampiasa maoderina.",
    diplomes: "Sarobidy FIFALIANTSOA dia nahazo ireo fianarana manaraka:\n\n• Master amin'ny informatika - Ecole Nationale d'Informatique (ENI) - Génie Logiciel sy base de données\n• Diplôme Licence amin'ny informatika - Ecole Nationale d'Informatique (ENI) - Génie Logiciel sy base de données\n• Bacc série C - Lycée LRR",
    prix: "Sarobidy FIFALIANTSOA dia nahazo ny fankasitrahana manaraka:\n\n• 2023 | 1 loka: Faharoa amin'ny hackathon nataon'ny PNUD (certificat)",
    cv: (lang: 'fr' | 'en' | 'mga' = 'mga') => {
      const cvLink = createCVLink(lang);
      return `Ny CV an'i Sarobidy FIFALIANTSOA dia azo ampidina amin'ny format PDF. Afaka ampidina izany amin'ny alalan'ny tsindrio ny rohy manaraka: ${cvLink}\n\nNy CV dia ahitana ny vaovao rehetra momba ny lalana niadidiny ara-piasana, ny fahaizany, ny tetikasany, ny traikefany, ny fianarany ary ny fankasitrahany.`;
    },
    outOfScope: "Miala tsiny, afaka mamaly fotsiny ny fanontaniana momba ny portfolio ara-piasana an'i Sarobidy FIFALIANTSOA aho.\n\nAfaka manampy anao amin'ny:\n• Ny fahaizany ara-teknika sy ny fahaizany\n• Ny tetikasany vita (web, mobile, IA)\n• Ny traikefany ara-piasana amin'ny antsipiriany\n• Ny teknologia izay mahay\n• Ny fianarany sy ny diplômes\n• Ny loka sy ny fankasitrahany\n• Ny fomba mifandraisa aminy ara-piasana\n• Ny CV\n• Ny vaovao ara-dalàna momba ny tranokala (cookies, mentions légales, sns)\n\nHo an'ny fanontaniana hafa, asaovy mijery ny portfolio mivantana na mifandraisa aminy amin'ny alalan'ny vaovao contact misy.",
    followup: "Eny mazava! Ity ny vaovao hafa azoko omena momba an'i Sarobidy FIFALIANTSOA:\n\n• Ny fahaizany ara-teknika amin'ny antsipiriany\n• Ny tetikasany web, mobile sy IA\n• Ny lalana niadidiny ara-piasana feno\n• Ny teknologia izay mahay\n• Ny fianarany sy ny diplômes\n• Ny loka sy ny fankasitrahany\n• Ny fomba mifandraisa aminy\n• Ny fampidinana ny CV\n• Ny vaovao ara-dalàna momba ny tranokala\n\nInona no tianao hahalala indrindra?",
    chatbotCapabilities: "Eny, afaka miteny malagasy aho! Afaka mamaly ny fanontanianao amin'ny frantsay, anglisy na malagasy aho. Aza miady saina mametraka fanontaniana amin'ny fiteny tianao.\n\nAfaka manampy anao amin'ny vaovao rehetra momba ny portfolio an'i Sarobidy FIFALIANTSOA: ny fahaizany, ny tetikasany, ny traikefany, ny diplômes, ary bebe kokoa. Ahoana no maha-afaka namampy anao aho?",
    legal: "Ity ny vaovao ara-dalàna momba ny tranokala portfolio an'i Sarobidy FIFALIANTSOA:\n\n**Mentions Légales :**\nIty portfolio ity dia an'i Sarobidy FIFALIANTSOA. Ny tetikasa rehetra aseho dia asa manokana na ara-piasana.\n\n**Propriété Intellectuelle :**\nNy votoaty rehetra amin'ity tranokala ity (soratra, sary, logo, sary) dia voaaro amin'ny lalàna momba ny zon'ny mpamorona. Ny famoahana indray, na ampahany, dia voarara raha tsy misy alalana aloha.\n\n**Données Personnelles :**\nTsy misy angona manokana voangona ho azy amin'ity tranokala ity. Ny vaovao contact omena an-tsitrapo dia ampiasaina fotsiny mba hamaly ny fangatahana.\n\n**Cookies :**\nIty tranokala ity dia mampiasa cookies mba hanatsara ny fahitanao ary handrefesana ny mpitsidika. Ny cookies ampiasaina dia cookies session sy cookies fandrefesana mpitsidika (local storage). Tsy misy cookies tracking fahatelo ampiasaina. Afaka manaiky na mandà ny cookies ianao amin'ny alalan'ny bannière consentement.\n\n**Copyright :**\n© 2026 Sarobidy FIFALIANTSOA. Ny zon'ny rehetra dia voaaro.\n\nHo hahalala bebe kokoa, jereo ny pejy \"Informations légales\" amin'ny portfolio na mifandraisa amin'i Sarobidy FIFALIANTSOA amin'ny alalan'ny email (sarobidy.fifaliantsoa@ilomad.com) na telefaona (+261 34 46 536 09).",
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
    
    // Gérer les questions spécifiques - Salutations (PRIORITÉ ABSOLUE)
    const greetingPattern = /^(bonjour|salut|hello|hi|bonsoir|bonne.*soir|bonne.*nuit|good.*evening|good.*night|miarahaba|manao ahoana|salama|hey|hola|ciao|repond.*moi|reponds.*moi|oui|yes|ok|d'accord)$/i;
    const isGreeting = normalizedQ === 'bonjour' || greetingPattern.test(message.trim());
    if (isGreeting) {
      const bonjourResponse = typeof multilingualResponses[responseLang].bonjour === 'function' 
        ? multilingualResponses[responseLang].bonjour(message)
        : multilingualResponses[responseLang].bonjour;
      return NextResponse.json({ 
        response: bonjourResponse 
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
    
    if (normalizedQ === 'diplomes') {
      const diplomesResponse = cleanResponse(multilingualResponses[responseLang].diplomes);
      return NextResponse.json({ 
        response: diplomesResponse 
      });
    }
    
    if (normalizedQ === 'prix') {
      const prixResponse = cleanResponse(multilingualResponses[responseLang].prix);
      return NextResponse.json({ 
        response: prixResponse 
      });
    }
    
    if (normalizedQ === 'legal') {
      const legalResponse = multilingualResponses[responseLang].legal || multilingualResponses['fr'].legal;
      return NextResponse.json({ 
        response: legalResponse 
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

    // Support pour OPEN_EPI_KEY (nom personnalisé) et OPENAI_API_KEY (nom standard)
    const apiKey = process.env.OPEN_EPI_KEY || process.env.OPENAI_API_KEY;

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

      // Vérifier si c'est une salutation AVANT de vérifier le scope (double vérification)
      const normalizedQForAPI = normalizeQuestion(message);
      const greetingPatternForAPI = /^(bonjour|salut|hello|hi|bonsoir|bonne.*soir|bonne.*nuit|good.*evening|good.*night|miarahaba|manao ahoana|salama|hey|hola|ciao|repond.*moi|reponds.*moi|oui|yes|ok|d'accord)$/i;
      if (normalizedQForAPI === 'bonjour' || greetingPatternForAPI.test(message.trim())) {
        const bonjourResponse = typeof multilingualResponses[responseLang].bonjour === 'function' 
          ? multilingualResponses[responseLang].bonjour(message)
          : multilingualResponses[responseLang].bonjour;
        return NextResponse.json({ 
          response: bonjourResponse 
        });
      }

      // Vérifier si la question est hors scope AVANT d'appeler l'API (sauf salutations)
      if (isOutOfScope(message)) {
        const outOfScopeResponse = multilingualResponses[responseLang].outOfScope;
        return NextResponse.json({ 
          response: outOfScopeResponse 
        });
      }

      // Rechercher des documents pertinents avec RAG (augmenter à 8 pour plus de contexte)
      const relevantDocs = await searchRelevantDocs(message, 8);

      // Déterminer la langue de réponse
      const langInstructions = {
        fr: 'Réponds TOUJOURS en français. Utilise un langage professionnel et courtois. Sois naturel et amical dans tes réponses, surtout pour les salutations.',
        en: 'Réponds TOUJOURS en anglais (English). Use professional and courteous language. Be natural and friendly in your responses, especially for greetings.',
        mga: 'Réponds TOUJOURS en malgache. Ampiasao ny fiteny malagasy, tsara sy mahalala fomba. Mampiasa fiteny tsotra sy namana, indrindra amin\'ny fiarahabana.',
      };

      // Créer le prompt avec contexte RAG
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `Tu es un assistant IA professionnel, amical et intelligent qui aide les visiteurs du portfolio de Sarobidy FIFALIANTSOA.

IMPORTANT - Règles à suivre:

1. SALUTATIONS ET INTERACTIONS NATURELLES:
   - Accueille toujours chaleureusement les visiteurs avec des salutations (bonjour, bonsoir, salut, hello, salama, etc.)
   - Réponds naturellement aux salutations en présentant brièvement ce que tu peux faire
   - Sois amical, professionnel et naturel, pas robotique
   - Adapte ta réponse selon le contexte de la conversation

2. QUESTIONS SUR TON PROPRE FONCTIONNEMENT:
   - Si on te demande si tu peux parler malgache/malagasy, réponds OUI et explique que tu peux répondre en français, anglais ou malgache
   - Si on te demande si tu es intelligent, réponds de manière humble mais confiante
   - Si on te pose des questions sur tes capacités, réponds naturellement et positivement

3. QUESTIONS DE SUIVI:
   - Si on demande "autre ?", "encore ?", "plus ?", "autre chose ?", propose d'autres sujets pertinents sur le portfolio
   - Sois proactif et suggère des sujets intéressants (projets, compétences, expériences, etc.)

4. PORTÉE DES QUESTIONS:
   - Tu dois PRINCIPALEMENT répondre aux questions concernant le portfolio professionnel de Sarobidy FIFALIANTSOA
   - Questions acceptées: compétences techniques, projets, expérience professionnelle, technologies maîtrisées, contact professionnel, CV, diplômes, formations, prix et distinctions, expériences détaillées, salutations, questions sur tes propres capacités, questions de suivi, informations légales du site (cookies, mentions légales, propriété intellectuelle, données personnelles, copyright, confidentialité, RGPD)
   - Questions refusées UNIQUEMENT: vie personnelle (mariage, enfants, âge), salaire, hobbies personnels non liés au travail, questions complètement hors sujet (météo, actualité générale, etc.)

2. UTILISATION DU CONTEXTE:
   - Utilise ABSOLUMENT les informations du contexte ci-dessous pour répondre
   - Ne donne JAMAIS de réponses génériques si le contexte contient des informations spécifiques
   - Cite les technologies, projets et compétences EXACTEMENT comme mentionnés dans le contexte
   - Si la question demande des détails spécifiques (nom de projet, technologie précise, entreprise, dates, etc.), cherche DANS LE CONTEXTE et cite exactement ce qui est mentionné
   - Si l'information demandée n'existe PAS dans le contexte, réponds "Désolé, je n'ai pas cette information dans le portfolio. Je peux vous aider avec ses compétences, projets, expérience, technologies, diplômes, prix ou comment le contacter."
   - Pour les questions sur un projet spécifique, cite TOUTES les informations disponibles dans le contexte (technologies, description, URL)
   - Pour les questions sur une technologie, cite TOUS les projets qui l'utilisent si mentionnés dans le contexte
   - Pour les questions sur l'expérience professionnelle, cite les entreprises, dates, responsabilités et résultats EXACTEMENT comme dans le contexte
   - Pour les questions sur les diplômes, cite les diplômes, établissements et spécialités EXACTEMENT comme dans le contexte

3. GESTION DU CV:
   - Si on demande le CV, réponds que le CV est disponible en format PDF et peut être téléchargé
   - Pour le lien CV, utilise: <a href="/cv.pdf" download="CV_Sarobidy_Fifaliantsoa.pdf" class="cv-link text-yellow-400 hover:text-yellow-300 underline font-semibold cursor-pointer transition-colors">Télécharger le CV</a>

4. FORMAT DE RÉPONSE:
   - ${langInstructions[responseLang]}
   - Sois courtois, professionnel, naturel, amical et INTELLIGENT
   - Comprends le contexte de la conversation et adapte tes réponses
   - Pour les salutations, réponds de manière chaleureuse et présente brièvement ce que tu peux faire
   - Pour les questions de suivi ("autre ?", "encore ?"), sois proactif et suggère des sujets pertinents
   - Pour les questions sur tes capacités, réponds naturellement et positivement
   - Réponds directement à la question posée, mais sois aussi proactif pour aider
   - Si le contexte ne contient pas l'information exacte, dis "Désolé, je n'ai pas cette information dans le portfolio."
   - Pour les salutations simples (bonjour, bonsoir, salut, salama), réponds naturellement sans être trop formel
   - Varie tes réponses pour éviter la répétition

5. EXEMPLES DE BONNES RÉPONSES:
   - Pour "quelles sont ses compétences?": Liste les technologies et outils spécifiques du contexte avec leurs niveaux de maîtrise si disponibles
   - Pour "quels projets a-t-il réalisés?": Cite les projets mentionnés dans le contexte avec leurs technologies, descriptions et URLs si disponibles
   - Pour "quel projet utilise React?": Liste TOUS les projets du contexte qui utilisent React avec leurs détails
   - Pour "parle-moi du projet Ilodesk": Donne TOUTES les informations disponibles dans le contexte sur ce projet (description, technologies, URL)
   - Pour "est-il capable de...": Réponds avec les capacités listées dans le contexte
   - Pour "combien d'années d'expérience?": Utilise l'information d'expérience du contexte (3+ ans d'expérience professionnelle)
   - Pour "où a-t-il travaillé?" ou "quelles sont ses expériences?": Cite TOUTES les expériences professionnelles avec entreprises, dates, responsabilités et stacks utilisées
   - Pour "quel est son parcours académique?" ou "quels sont ses diplômes?": Cite TOUS les diplômes avec établissements et spécialités
   - Pour "a-t-il reçu des prix?" ou "distinctions?": Cite le prix du hackathon PNUD 2023
   - Pour "montrer le CV" ou "télécharger le CV": Fournis le lien de téléchargement
   - Pour "quelles technologies maîtrise-t-il?": Liste TOUTES les technologies mentionnées dans le contexte, organisées par catégorie (Frontend, Backend, Design, etc.)
   - Pour "quelles sont ses coordonnées?" ou "comment le contacter?": Cite LinkedIn, GitHub, Website, Email, Téléphone
   - Pour "informations légales?", "cookies?", "mentions légales?", "données personnelles?": Donne TOUTES les informations légales disponibles dans le contexte (cookies, mentions légales, propriété intellectuelle, données personnelles, copyright)

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

