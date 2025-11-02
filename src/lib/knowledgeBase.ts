// Base de connaissances du portfolio pour le système RAG

export const portfolioKnowledge = `
# Portfolio de Fifaliantsoa Sarobidy

## Informations Personnelles
- Nom: Fifaliantsoa Sarobidy
- Profession: Développeur Web et Mobile Full-stack
- Localisation: Madagascar, Fianarantsoa
- Téléphone: +261 34 46 536 09
- Email: sarobidy.fifaliantsoa@ilomad.com

## Compétences
- Développeur fullstack avec plus de 4 ans d'expérience
- Spécialisé en JavaScript (React, Next.js, Node.js, Angular, NestJS)
- Designeur UI/UX
- Technologies: React, Next.js, Angular, NestJS, TypeScript, Tailwind CSS
- Outils: Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD
- Base de données et services: Redis, Qdrant, LangChain
- Outils de développement: Git, GitHub, GitLab, Jest
- Gestion de projet: Jira
- Communication: Microsoft Teams

## Technologies Maîtrisées
- Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Zustand, NgRx
- Backend: Node.js, NestJS
- Bases de données: Redis, Qdrant
- IA/ML: LangChain
- Design: Figma, Adobe Illustrator, Adobe Photoshop, Adobe XD
- Tests: Jest
- Versioning: Git, GitHub, GitLab
- Autres: Jira, Microsoft Teams

## Expérience Professionnelle
- Développeur fullstack avec plus de 4 ans d'expérience dans le développement web et mobile
- Expertise en JavaScript et frameworks modernes
- Expérience en design UI/UX
- Connaissance des architectures modernes et des meilleures pratiques de développement

## Domaines d'Expertise
- Développement d'applications web modernes avec React et Next.js
- Développement d'applications mobiles
- Design d'interfaces utilisateur
- Architecture de systèmes
- Intégration de systèmes IA (RAG, LangChain)
- Optimisation des performances
- Développement responsive et cross-platform

## Projets et Réalisations
Le portfolio contient plusieurs projets réalisés dans différents domaines:
- Applications web et mobiles
- Dashboards et interfaces d'administration
- Projets de design et maquettage
- Solutions intégrant l'intelligence artificielle
- Applications pour différentes industries (gestion, mobilité, etc.)

## Philosophie de Travail
- Approche moderne et professionnelle
- Focus sur l'expérience utilisateur
- Code propre et maintenable
- Collaboration efficace en équipe
- Apprentissage continu des nouvelles technologies
`;

export function getKnowledgeDocuments(): string[] {
  // Diviser la base de connaissances en chunks pour le RAG
  const chunks = portfolioKnowledge
    .split('\n##')
    .map((chunk, index) => (index === 0 ? chunk : '##' + chunk))
    .filter((chunk) => chunk.trim().length > 0);
  
  return chunks;
}

