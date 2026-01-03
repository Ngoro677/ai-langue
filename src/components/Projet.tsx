'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import ScrollReveal from './ScrollReveal';
import StaggerReveal from './StaggerReveal';
import NetworkBackground from './NetworkBackground';

interface Project {
    image: string;
    title: string;
    url: string;
    technologies: string[];
    type?: string;
    description?: string;
}

export default function Projet() {
    const { t } = useI18n();
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const [hoverDirection, setHoverDirection] = useState<'left' | 'right' | null>(null);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [hoveredProject, setHoveredProject] = useState<string | null>('web-0'); // Premier projet actif par défaut
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalAnimating, setIsModalAnimating] = useState(false);
    const webScrollRef = useRef<HTMLDivElement>(null);
    const webScrollRef1 = useRef<HTMLDivElement>(null);
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const iaScrollRef = useRef<HTMLDivElement>(null);

    // Images pour les projets Web avec détails
    const webProjects = [
        { image: 'DasboardIlodesk.png', title: 'Dashboard Ilodesk', url: 'https://ilodesk.com', technologies: ['ReactJS', 'Dotnet', 'SQL Server', 'Typescript', 'Zustand','Git', 'Redis'], description: 'Dashboard administratif complet pour la gestion et le suivi des activités. Interface moderne avec visualisation de données en temps réel, gestion des utilisateurs et rapports détaillés.' },
        { image: 'Ilodesk.png', title: 'Ilodesk Platform', url: 'https://ilodesk.com', technologies: ['ReactJS', 'Typescript', 'Tailwind' , 'Git'], description: 'Plateforme complète de gestion intégrée offrant une solution tout-en-un pour les entreprises. Interface intuitive avec design moderne et expérience utilisateur optimisée.' },
        { image: 'SmartDasboard.png', title: 'Smart Dashboard', url: 'https://smartrhpro.com', technologies: ['ReactJS', 'TypeScript', 'Stripe', 'Chart.js', 'Zustand','NestJs' , 'Git', 'Redis'], description: 'Tableau de bord intelligent pour la gestion des ressources humaines. Système de paiement intégré avec Stripe, visualisation de données avancée et gestion complète du personnel.' },
        { image: 'digitheque.png', title: 'Digitheque', url: 'https://digitheque.mg', technologies: ['Next.js', 'Prisma', 'Tailwind' , 'Git', 'Zustand'], description: 'Bibliothèque numérique moderne permettant l\'accès et la gestion de ressources documentaires. Interface responsive avec recherche avancée et système de catégorisation intelligent.' },
        { image: 'folio.png', title: 'Portfolio', url: 'https://sarobidy-dev.vercel.app', technologies: ['ReactJS', 'Framer Motion', 'CSS3', 'Gsap'], description: 'Portfolio personnel moderne avec animations fluides et design contemporain. Présentation interactive des projets et compétences avec expérience utilisateur immersive.' },
        { image: 'Ilomad-site.png', title: 'Ilomad Website', url: 'https://ilomad.com', technologies: ['Next', 'PHP', 'MySQL', 'Tailwind' , 'Git', 'Zustand'], description: 'Site web corporatif pour Ilomad avec présentation des services et solutions. Design professionnel avec intégration backend PHP et base de données MySQL.' },
        { image: 'Sarakodev.png', title: 'Sarakodev', url: 'https://sarakodev.com', technologies: ['ExpressJs', 'Next', 'PosteGre', 'AWS' , 'Git', 'Zustand'], description: 'Plateforme de développement et collaboration pour développeurs. Infrastructure cloud sur AWS avec base de données PostgreSQL et API RESTful performante.' },
        { image: 'Design.png', title: 'Ilofund', url: 'https://demo.ilofund.mg', technologies: ['Next', 'TypeScript', 'Tailwind', 'Git', 'Zustand','NextAuth', 'Node.js', 'PostgreSQL'], description: 'Plateforme de financement participatif avec Next, TypeScript, Tailwind et Zustand. Interface moderne avec gestion des projets et des investisseurs.' },
    ];

    //deuxieme image

    const webProjects2 = [
        { image: 'raitra.png', title: 'Raitra', url: 'https://raitra.com', technologies: ['ReactJS', 'Node.js', 'Postegre' , 'Git'], description: 'Plateforme web moderne pour la gestion et le suivi. Application full-stack avec React en frontend et Node.js en backend, base de données PostgreSQL pour une performance optimale.' },
        { image: 'MaqueteProjet.png', title: 'Project Mockup', url: 'design', technologies: ['Adobe XD', 'Sketch', 'Photoshop'], description: 'Maquettes et prototypes de projets avec outils de design professionnels. Création d\'interfaces utilisateur avec workflow de design optimisé et collaboration facilitée.' },
        { image: 'Ca2e.png', title: 'CA2E Platform', url: 'https://www.univ-fianarantsoa.mg', technologies: ['Laravel', 'React', 'MySQL', 'Redis'], description: 'Plateforme académique pour l\'université avec gestion des cours et étudiants. Système complet avec Laravel backend, interface React moderne et cache Redis pour performance.' },
        { image: 'Congé.png', title: 'Congé Manager', url: 'https://smartrhpro.com', technologies: ['ReactJS', 'Express', 'PostgreSQL', 'JWT', 'Git', 'Zustand'], description: 'Système de gestion des congés et absences pour entreprises. Application sécurisée avec authentification JWT, gestion des demandes et approbations en temps réel.' },
        { image: 'Gta.png', title: 'GTA Project', url: 'https://smartrhpro.com', technologies: ['Next', 'Next', 'Blender', 'Git', 'Zustand', 'Typescript'], description: 'Projet innovant combinant web et 3D avec intégration Blender. Application Next.js avec rendu 3D interactif et expérience utilisateur immersive.' },
        { image: '178845027_10706545.png', title: 'Custom Project', url: 'design', technologies: ['ReactJS', 'TypeScript', 'Laravel', 'API', 'Docker'], description: 'Projet sur mesure avec architecture microservices. Stack moderne avec React/TypeScript, API Laravel, containerisation Docker pour déploiement scalable.' },
        { image: 'MaqueteProjet.png', title: 'UI Design', url: 'design', technologies: ['Figma', 'Adobe XD', 'Sketch', 'Principle'], description: 'Design d\'interface utilisateur avec prototypage interactif. Création de design systems complets avec animations et transitions fluides pour une expérience utilisateur optimale.' }
    ];

    // Images pour les projets Mobile
    const mobileProjects = [
        { image: 'Mobilité Pnud.png', title: 'Mobilité PNUD', url: 'Application Mobile', technologies: ['React Native', 'Firebase', 'Maps API', 'Redux', 'Typescript'], description: 'Application mobile pour la gestion de la mobilité PNUD. Intégration de cartes interactives, synchronisation Firebase et gestion d\'état avec Redux.' },
        { image: 'Ca2eMobile.png', title: 'CA2E Mobile', url: 'Application Mobile', technologies: ['React Native', 'ExpressJs', 'SQLite', 'REST API'], description: 'Application mobile académique avec accès aux cours et ressources. Base de données locale SQLite, synchronisation avec API REST et interface native optimisée.' },
        { image: 'design.png', title: 'Mobile Design', url: 'design', technologies: ['Figma', 'Adobe illustrator', 'Principle'], description: 'Design d\'applications mobiles avec prototypage interactif. Création d\'interfaces natives avec animations et transitions pour iOS et Android.' },
        { image: '178845027_10706545.png', title: 'Mobile App', url: 'Application Mobile', technologies: ['React Native', 'TypeScript', 'GraphQL'], description: 'Application mobile moderne avec GraphQL pour requêtes optimisées. Architecture TypeScript pour type-safety et performance maximale.' },
        { image: '178845027_10706545HKHHK.png', title: 'Custom Mobile', url: 'Application Mobile', technologies: ['React Native', 'Firebase', 'Bloc', 'Material'], description: 'Application mobile personnalisée avec architecture Bloc. Design Material Design, authentification Firebase et gestion d\'état réactive.' },
        { image: 'Deis.png', title: 'DEIS Mobile', url: 'Application Mobile', technologies: ['Ionic', 'Angular', 'SQLite'], description: 'Application mobile cross-platform avec Ionic et Angular. Base de données SQLite locale, interface hybride performante pour iOS et Android.' },
        { image: 'portofolio.png', title: 'Portfolio Mobile', url: 'Application Mobile', technologies: ['React Native', 'Navigation', 'AsyncStorage', 'Netlify'], description: 'Application mobile portfolio avec navigation fluide. Stockage local AsyncStorage, déploiement Netlify et présentation interactive des projets.' }
    ];

    // Images pour les projets IA
    const iaProjects = [
        { image: 'IA.png', title: 'AI Project', url: 'application IA', technologies: ['Python', 'TensorFlow', 'OpenCV', 'Docker', 'FastApi', 'React'], description: 'Application d\'intelligence artificielle avec traitement d\'images et machine learning. Backend Python avec TensorFlow, API FastAPI, interface React moderne et containerisation Docker.' }
    ];

    const scrollProjects = (direction: 'left' | 'right', section: string) => {
        let scrollRef;
        if (section === 'web') scrollRef = webScrollRef;
        else if (section === 'web1') scrollRef = webScrollRef1;
        else if (section === 'mobile') scrollRef = mobileScrollRef;
        else if (section === 'ia') scrollRef = iaScrollRef;

        if (scrollRef?.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const openModal = (project: Project, projectType: string = 'web') => {
        setSelectedProject({...project, type: projectType});
        setIsModalOpen(true);
        // Délai pour permettre l'animation d'entrée
        setTimeout(() => {
            setIsModalAnimating(true);
        }, 10);
    };

    const closeModal = () => {
        setIsModalAnimating(false);
        // Délai pour permettre l'animation de sortie
        setTimeout(() => {
            setIsModalOpen(false);
            setSelectedProject(null);
        }, 300);
    };

  return (
        <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
            {/* Network Background Animation */}
            <NetworkBackground 
                nodeCount={60}
                connectionDistance={180}
                color="#fbbf24"
                nodeColor="#fbbf24"
            />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Projet Web */}
                <ScrollReveal direction="up" delay={0.2} duration={0.8}>
                <div
                    className="mb-16"
                    onMouseEnter={() => setHoveredSection('web')}
                    onMouseLeave={() => {
                        setHoveredSection(null);
                        setHoverDirection(null);
                    }}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const width = rect.width;
                        if (x < width / 2) {
                            setHoverDirection('left');
                        } else {
                            setHoverDirection('right');
                        }
                    }}
                >
                    <h2 className="text-2xl font-bold text-white mb-8">
                        {t('projet.projetWeb')}
                    </h2>

                    <StaggerReveal direction="left" staggerDelay={0.05} className="relative"
                        onMouseEnter={() => setHoveredRow('web1')}
                        onMouseLeave={() => setHoveredRow(null)}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            if (x < width / 2) {
                                setHoverDirection('left');
                            } else {
                                setHoverDirection('right');
                            }
                        }}
                    >
                        <div
                            ref={webScrollRef}
                            className="flex gap-6 ilo overflow-x-auto scrollbar-hide pb-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {webProjects.map((project, index) => (
                                <div key={index} className="flex-shrink-0">
                                    <div 
                                        className={`w-64 ilo bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 relative group cursor-pointer ${
                                            hoveredProject === `web-${index}` 
                                                ? 'h-66 transform -translate-y-4 shadow-2xl z-10' 
                                                : 'h-36 hover:shadow-xl'
                                        }`}
                                        onMouseEnter={() => setHoveredProject(`web-${index}`)}
                                        onMouseLeave={() => setHoveredProject(null)}
                                    >
                                        <img
                                            src={`/images/Capture/${project.image}`}
                                            alt={`Projet Web ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                        
                                        {/* Titre visible en permanence en bas */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2">
                                            <h3 className="text-white font-semibold text-sm truncate">{project.title}</h3>
                                        </div>

                                        {/* Détails en bas au hover */}
                                        <div className={`absolute bottom-0 left-0 right-0 bg-gray-900 transform transition-all duration-300 ${
                                            hoveredProject === `web-${index}` ? 'translate-y-0' : 'translate-y-full'
                                        }`}>
                                            {/* Icônes d'interaction */}
                                            <div className="flex justify-center space-x-3 py-3">
                                                <div 
                                                    className="w-8 h-8 border border-white ilo flex items-center justify-center cursor-pointer hover:bg-yellow-400 hover:text-black transition-all duration-300"
                                                    onClick={() => openModal(project as Project)}
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 104 0 2 2 0 00-4 0" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Titre et URL */}
                                            <div className="text-center px-4 pb-3">
                                                <h3 className="text-white font-bold text-lg mb-1">{project.title}</h3>
                                                <p className="text-gray-300 text-sm">{project.url}</p>
                                            </div>
                                            
                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-1 justify-center px-4 pb-4">
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span key={techIndex} className="bg-gray-700 text-white text-xs px-2 py-1 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bouton de navigation Web - Droite (survol droite) */}
                        {hoveredSection === 'web' && hoveredRow === 'web1' && hoverDirection === 'right' && (
                            <button
                                onClick={() => scrollProjects('right', 'web')}
                                className="absolute bg-yellow-500 right-4 top-0 transform -translate-y-1/2 z-50 border border-white hover:bg-yellow-500 text-white p-2 ilo shadow-lg transition-all duration-300 opacity-90 hover:opacity-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Bouton de navigation Web - Gauche (survol gauche) */}
                        {hoveredSection === 'web' && hoveredRow === 'web1' && hoverDirection === 'left' && (
                            <button
                                onClick={() => scrollProjects('left', 'web')}
                                className="absolute bg-yellow-500 left-4 top-0 transform -translate-y-1/2 z-50 border border-white hover:bg-yellow-500 text-white p-2 ilo shadow-lg transition-all duration-300 opacity-90 hover:opacity-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </StaggerReveal>

                    
                    <StaggerReveal direction="right" staggerDelay={0.05} className="relative"
                        onMouseEnter={() => setHoveredRow('web2')}
                        onMouseLeave={() => setHoveredRow(null)}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            if (x < width / 2) {
                                setHoverDirection('left');
                            } else {
                                setHoverDirection('right');
                            }
                        }}
                    >
                        <div
                            ref={webScrollRef1}
                            className="flex mt-5 gap-6 ilo overflow-x-auto scrollbar-hide pb-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {webProjects2.map((project, index) => (
                                <div key={index} className="flex-shrink-0">
                                    <div 
                                        className={`w-64 ilo bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 relative group cursor-pointer ${
                                            hoveredProject === `web2-${index}` 
                                                ? 'h-66 transform -translate-y-4 shadow-2xl z-10' 
                                                : 'h-36 hover:shadow-xl'
                                        }`}
                                        onMouseEnter={() => setHoveredProject(`web2-${index}`)}
                                        onMouseLeave={() => setHoveredProject(null)}
                                    >
                                        <img
                                            src={`/images/Capture/${project.image}`}
                                            alt={`Projet Web ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                        
                                        {/* Titre visible en permanence en bas */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2">
                                            <h3 className="text-white font-semibold text-sm truncate">{project.title}</h3>
                                        </div>

                                        {/* Détails en bas au hover */}
                                        <div className={`absolute bottom-0 left-0 right-0 bg-gray-900 transform transition-all duration-300 ${
                                            hoveredProject === `web2-${index}` ? 'translate-y-0' : 'translate-y-full'
                                        }`}>
                                            {/* Icônes d'interaction */}
                                            <div className="flex justify-center space-x-3 py-3">
                                                <div 
                                                    className="w-8 h-8 border border-white ilo flex items-center justify-center cursor-pointer hover:bg-yellow-400 hover:text-black transition-all duration-300"
                                                    onClick={() => openModal(project)}
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 104 0 2 2 0 00-4 0" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Titre et URL */}
                                            <div className="text-center px-4 pb-3">
                                                <h3 className="text-white font-bold text-lg mb-1">{project.title}</h3>
                                                <p className="text-gray-300 text-sm">{project.url}</p>
                                            </div>
                                            
                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-1 justify-center px-4 pb-4">
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span key={techIndex} className="bg-gray-700 text-white text-xs px-2 py-1 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bouton de navigation Web2 - Droite (survol droite) */}
                        {hoveredSection === 'web' && hoveredRow === 'web2' && hoverDirection === 'right' && (
                            <button
                                onClick={() => scrollProjects('right', 'web1')}
                                className="absolute bg-yellow-500 right-4 top-0 transform -translate-y-1/2 z-50 border border-white hover:bg-yellow-500 text-white p-2 ilo shadow-lg transition-all duration-300 opacity-90 hover:opacity-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Bouton de navigation Web2 - Gauche (survol gauche) */}
                        {hoveredSection === 'web' && hoveredRow === 'web2' && hoverDirection === 'left' && (
                            <button
                                onClick={() => scrollProjects('left', 'web1')}
                                className="absolute left-4 top-0 transform -translate-y-1/2 z-50 border border-white hover:bg-yellow-500 text-white p-2 ilo bg-yellow-500 shadow-lg transition-all duration-300 opacity-90 hover:opacity-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </StaggerReveal>
                    
                </div>
                </ScrollReveal>

                {/* Projet Mobile */}
                <ScrollReveal direction="up" delay={0.3} duration={0.8}>
                <div
                    className="mb-16"
                    onMouseEnter={() => setHoveredSection('mobile')}
                    onMouseLeave={() => {
                        setHoveredSection(null);
                        setHoverDirection(null);
                    }}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const width = rect.width;
                        if (x < width / 2) {
                            setHoverDirection('left');
                        } else {
                            setHoverDirection('right');
                        }
                    }}
                >
                    <h2 className="text-2xl font-bold text-white mb-8">
                        {t('projet.projetMobile')}
                    </h2>

                    <StaggerReveal direction="left" staggerDelay={0.05} className="relative"
                        onMouseEnter={() => setHoveredRow('mobile')}
                        onMouseLeave={() => setHoveredRow(null)}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            if (x < width / 2) {
                                setHoverDirection('left');
                            } else {
                                setHoverDirection('right');
                            }
                        }}
                    >
                        <div
                            ref={mobileScrollRef}
                            className="flex ilo gap-6 overflow-x-auto scrollbar-hide pb-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {mobileProjects.map((project, index) => (
                                <div key={index} className="flex-shrink-0">
                                    <div 
                                        className={`w-64 ilo bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 relative group cursor-pointer ${
                                            hoveredProject === `mobile-${index}` 
                                                ? 'h-66 transform -translate-y-4 shadow-2xl z-10' 
                                                : 'h-36 hover:shadow-xl'
                                        }`}
                                        onMouseEnter={() => setHoveredProject(`mobile-${index}`)}
                                        onMouseLeave={() => setHoveredProject(null)}
                                    >
                                        <img
                                            src={`/images/CapturePhone/${project.image}`}
                                            alt={`Projet Mobile ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />

                                        {/* Titre visible en permanence en bas */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2">
                                            <h3 className="text-white font-semibold text-sm truncate">{project.title}</h3>
                                        </div>

                                        {/* Détails en bas au hover */}
                                        <div className={`absolute bottom-0 left-0 right-0 bg-gray-900 transform transition-all duration-300 ${
                                            hoveredProject === `mobile-${index}` ? 'translate-y-0' : 'translate-y-full'
                                        }`}>
                                            {/* Icônes d'interaction */}
                                            <div className="flex justify-center space-x-3 py-3">
                                                <div 
                                                    className="w-8 h-8 border border-white ilo flex items-center justify-center cursor-pointer hover:bg-yellow-400 hover:text-black transition-all duration-300"
                                                    onClick={() => openModal(project)}
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 104 0 2 2 0 00-4 0" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Titre et URL */}
                                            <div className="text-center px-4 pb-3">
                                                <h3 className="text-white font-bold text-lg mb-1">{project.title}</h3>
                                                <p className="text-gray-300 text-sm">{project.url}</p>
                                            </div>
                                            
                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-1 justify-center px-4 pb-4">
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span key={techIndex} className="bg-gray-700 text-white text-xs px-2 py-1 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bouton de navigation Mobile - Droite (survol droite) */}
                        {hoveredSection === 'mobile' && hoveredRow === 'mobile' && hoverDirection === 'right' && (
                            <button
                                onClick={() => scrollProjects('right', 'mobile')}
                                className="absolute bg-yellow-500 right-4 top-0 transform -translate-y-1/2 z-50 border border-white hover:bg-yellow-500 text-white p-2 ilo shadow-lg transition-all duration-300 opacity-90 hover:opacity-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Bouton de navigation Mobile - Gauche (survol gauche) */}
                        {hoveredSection === 'mobile' && hoveredRow === 'mobile' && hoverDirection === 'left' && (
                            <button
                                onClick={() => scrollProjects('left', 'mobile')}
                                className="absolute left-4 top-0 transform -translate-y-1/2 z-50 border border-white hover:bg-yellow-500 text-white p-2 ilo bg-yellow-500 shadow-lg transition-all duration-300 opacity-90 hover:opacity-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </StaggerReveal>
                </div>
                </ScrollReveal>

                {/* Projet IA */}
                <ScrollReveal direction="up" delay={0.4} duration={0.8}>
                <div
                    className="mb-16"
                    onMouseEnter={() => setHoveredSection('ia')}
                    onMouseLeave={() => setHoveredSection(null)}
                >
                    <h2 className="text-2xl font-bold text-white mb-8">
                        {t('projet.projetIA')}
                    </h2>

                    <div className="relative">
                        <div
                            ref={iaScrollRef}
                            className="flex ilo gap-6 overflow-x-auto scrollbar-hide pb-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {iaProjects.map((project, index) => (
                                <div key={index} className="flex-shrink-0">
                                    <div 
                                        className={`w-64 ilo bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 relative group cursor-pointer ${
                                            hoveredProject === `ia-${index}` 
                                                ? 'h-66 transform -translate-y-4 shadow-2xl z-10' 
                                                : 'h-36 hover:shadow-xl'
                                        }`}
                                        onMouseEnter={() => setHoveredProject(`ia-${index}`)}
                                        onMouseLeave={() => setHoveredProject(null)}
                                    >                                   
                                        <img
                                            src={`/images/Capture/${project.image}`}
                                            alt={`Projet IA ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />

                                        {/* Titre visible en permanence en bas */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 py-2">
                                            <h3 className="text-white font-semibold text-sm truncate">{project.title}</h3>
                                        </div>

                                        {/* Détails en bas au hover */}
                                        <div className={`absolute bottom-0 left-0 right-0 bg-gray-900 transform transition-all duration-300 ${
                                            hoveredProject === `ia-${index}` ? 'translate-y-0' : 'translate-y-full'
                                        }`}>
                                            {/* Icônes d'interaction */}
                                            <div className="flex justify-center space-x-3 py-3">
                                                <div 
                                                    className="w-8 h-8 border border-white ilo flex items-center justify-center cursor-pointer hover:bg-yellow-400 hover:text-black transition-all duration-300"
                                                    onClick={() => openModal(project)}
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 104 0 2 2 0 00-4 0" />
                                                    </svg>
                                                </div>
                                                <div className="w-8 h-8 border border-white ilo flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Titre et URL */}
                                            <div className="text-center px-4 pb-3">
                                                <h3 className="text-white font-bold text-lg mb-1">{project.title}</h3>
                                                <p className="text-gray-300 text-sm">{project.url}</p>
                                            </div>
                                            
                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-1 justify-center px-4 pb-4">
                                                {project.technologies.map((tech, techIndex) => (
                                                    <span key={techIndex} className="bg-gray-700 text-white text-xs px-2 py-1 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
                </ScrollReveal>

            </div>

            {/* Modal Popup */}
            {isModalOpen && selectedProject && (
                <div className={`fixed inset-0 backdrop-blur-[3px] flex items-center justify-center z-9999 p-4 transition-all duration-300 ${
                    isModalAnimating ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={closeModal}
                >
                    <div className={`border border-white bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-b-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
                        isModalAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
                    }`}>
                        {/* Close Button */}
                        <div className="flex justify-end p-4">
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 cursor-pointer ilo flex items-center justify-center bg-gray-700 transition-colors"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Project Image */}
                        <div className="px-6 pb-4">
                            <img
                                src={`/images/${selectedProject.image.includes('Mobilité') || selectedProject.image.includes('Ca2eMobile') || selectedProject.image.includes('design') || selectedProject.image.includes('Deis') || selectedProject.image.includes('portofolio') ? 'CapturePhone' : 'Capture'}/${selectedProject.image}`}
                                alt={selectedProject.title}
                                className="w-full h-64 object-cover rounded-lg"
                            />
                        </div>

                        {/* Project Details */}
                        <div className="px-6 pb-6">
                            <h3 className="text-white text-2xl font-bold mb-4">{selectedProject.title}</h3>
                            
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                {selectedProject.description || t('projet.description', { title: selectedProject.title })}
                            </p>

                            <div className="space-y-2 mb-6">
                                <p className="text-gray-400 text-sm">
                                    <span className="text-white font-semibold">{t('projet.client')}:</span> {selectedProject.title}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    <span className="text-white font-semibold">{t('projet.annee')}:</span> 2024
                                </p>
                                {selectedProject.url && selectedProject.url.startsWith('http') && (
                                    <p className="text-gray-400 text-sm">
                                        <span className="text-white font-semibold">{t('projet.url')}:</span> {selectedProject.url}
                                    </p>
                                )}
                            </div>

                            {/* All Technologies */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {selectedProject.technologies.map((tech, techIndex) => (
                                    <span key={techIndex} className="bg-gray-700 ilo text-white text-sm px-3 py-1 rounded-full">
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between">
                                {selectedProject.url && selectedProject.url.startsWith('http') ? (
                                    <button 
                                        onClick={() => window.open(selectedProject.url, '_blank')}
                                        className="flex bouton-ilo items-center gap-2 border border-white text-white px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-white transition-all duration-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {t('projet.visiter')}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}
    </section>
  );
}
