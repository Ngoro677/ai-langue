'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { translations } from '@/lib/i18n/translations';
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
    const { t, language } = useI18n();
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

    // Mapping des titres aux clés de traduction
    const getProjectTranslation = (key: string): { title: string; description: string } => {
        try {
            const langTranslations = translations[language];
            const projetTranslations = (langTranslations as Record<string, unknown>)?.projet as Record<string, unknown>;
            const projets = projetTranslations?.projets as Record<string, { title?: string; description?: string }> | undefined;
            const project = projets?.[key];
            if (project && typeof project === 'object' && 'title' in project && 'description' in project) {
                return {
                    title: project.title || '',
                    description: project.description || ''
                };
            }
        } catch {
            // Fallback si la traduction n'existe pas
        }
        // Fallback vers le français
        try {
            const frTranslations = translations.fr;
            const projetTranslations = (frTranslations as Record<string, unknown>)?.projet as Record<string, unknown>;
            const projets = projetTranslations?.projets as Record<string, { title?: string; description?: string }> | undefined;
            const project = projets?.[key];
            if (project && typeof project === 'object' && 'title' in project && 'description' in project) {
                return {
                    title: project.title || '',
                    description: project.description || ''
                };
            }
        } catch {
            // Ignore
        }
        return { title: '', description: '' };
    };

    // Images pour les projets Web avec détails
    const webProjects: Project[] = [
        { image: 'DasboardIlodesk.png', titleKey: 'dashboardIlodesk', url: 'https://ilodesk.com', technologies: ['ReactJS', 'Dotnet', 'SQL Server', 'Typescript', 'Zustand','Git', 'Redis'] },
        { image: 'Ilomad-site.png', titleKey: 'ilomadWebsite', url: 'https://ilomad.com', technologies: ['Next', 'PHP', 'MySQL', 'Tailwind' , 'Git', 'Zustand'] },
        { image: 'SmartDasboard.png', titleKey: 'smartDashboard', url: 'https://smartrhpro.com', technologies: ['ReactJS', 'TypeScript', 'Stripe', 'Chart.js', 'Zustand','NestJs' , 'Git', 'Redis'] },
        { image: 'Design.png', titleKey: 'ilofund', url: 'https://demo.ilofund.com', technologies: ['Next', 'TypeScript', 'Tailwind', 'Git', 'Zustand','NextAuth', 'Node.js', 'PostgreSQL'] },
        { image: 'digitheque.png', titleKey: 'digitheque', url: 'https://digitheque.mg', technologies: ['Next.js', 'Prisma', 'Tailwind' , 'Git', 'Zustand'] },
        { image: 'Ilodesk.png', titleKey: 'ilodeskPlatform', url: 'https://ilodesk.com', technologies: ['ReactJS', 'Typescript', 'Tailwind' , 'Git'] },
        { image: 'folio.png', titleKey: 'portfolio', url: 'https://sarobidy-dev.vercel.app', technologies: ['ReactJS', 'Framer Motion', 'CSS3', 'Gsap'] },
        { image: 'Sarakodev.png', titleKey: 'sarakodev', url: 'https://sarakodev.com', technologies: ['ExpressJs', 'Next', 'PosteGre', 'AWS' , 'Git', 'Zustand'] },
    ].map(project => {
        const translation = getProjectTranslation(project.titleKey);
        return {
            image: project.image,
            url: project.url,
            technologies: project.technologies,
            title: translation.title,
            description: translation.description
        } as Project;
    });

    //deuxieme image

    const webProjects2: Project[] = [
        { image: '178845027_10706545.png', titleKey: 'cagnoteProjet', url: 'https://demo.ilofund.com', technologies: ['Next', 'TypeScript', 'NodeJs', 'API', 'Docker', 'LLMs', 'Python', 'FastApi'] },
        { image: 'MaqueteProjet.png', titleKey: 'gestionDepartement', url: 'https://smartrhpro.com', technologies: ['NodeJs', 'ReactJS', 'Blender', 'Git', 'Zustand', 'Typescript'] },
        { image: 'Ca2e.png', titleKey: 'ca2ePlatform', url: 'https://www.univ-fianarantsoa.mg/Centre/details/11', technologies: ['Laravel', 'React', 'MySQL', 'Redis'] },
        { image: 'Gta.png', titleKey: 'gestionTempsTravail', url: 'https://smartrhpro.com', technologies: ['NodeJs', 'ReactJS', 'Blender', 'Git', 'Zustand', 'Typescript'] },
        { image: 'Congé.png', titleKey: 'congeManager', url: 'https://smartrhpro.com', technologies: ['ReactJS', 'Express', 'PostgreSQL', 'JWT', 'Git', 'Zustand'] },
        { image: 'raitra.png', titleKey: 'raitra', url: 'https://raitra.com', technologies: ['ReactJS', 'Node.js', 'Postegre' , 'Git'] },
   ].map(project => {
        const translation = getProjectTranslation(project.titleKey);
        return {
            image: project.image,
            url: project.url,
            technologies: project.technologies,
            title: translation.title,
            description: translation.description
        } as Project;
    });

    // Images pour les projets Mobile
    const mobileProjects: Project[] = [
        { image: 'Mobilité Pnud.png', titleKey: 'mobiliteUrbaine', url: 'Application Mobile', technologies: ['React Native', 'Firebase', 'Maps API', 'Redux', 'Typescript'] },
        { image: 'Ca2eMobile.png', titleKey: 'pointageCa2eMobile', url: 'Application Mobile', technologies: ['React Native', 'ExpressJs', 'NodeJs', 'REST API', 'PostgreSql'] },
        { image: 'design.png', titleKey: 'mobileDesign', url: 'design', technologies: ['Figma', 'Adobe illustrator', 'Principle'] },
        { image: '178845027_10706545.png', titleKey: 'mobileApp', url: 'Application Mobile', technologies: ['React Native', 'TypeScript', 'GraphQL'] },
        { image: '178845027_10706545HKHHK.png', titleKey: 'customMobile', url: 'Application Mobile', technologies: ['React Native', 'Firebase', 'Bloc', 'Material'] },
        { image: 'Deis.png', titleKey: 'deisMobile', url: 'Application Mobile', technologies: ['React-Native', 'TypeScript', 'Firebasa'] },
        { image: 'portofolio.png', titleKey: 'portfolioMobile', url: 'Application Mobile', technologies: ['React Native', 'Navigation', 'AsyncStorage', 'Netlify'] }
    ].map(project => {
        const translation = getProjectTranslation(project.titleKey);
        return {
            image: project.image,
            url: project.url,
            technologies: project.technologies,
            title: translation.title,
            description: translation.description
        } as Project;
    });

    // Images pour les projets IA
    const iaProjects: Project[] = [
        { image: 'IA.png', titleKey: 'analyseCriminelle', url: 'application IA', technologies: ['Python', 'TensorFlow', 'OpenCV', 'Docker', 'FastApi', 'React'] },
        { image: 'AnalyseOCR.png', titleKey: 'analyseOCR', url: 'https://smartrhpro.com', technologies: ['Python', 'Nest', 'OpenCV', 'Docker', 'FastApi', 'React', 'NodeJs'] },
        { image: 'AnalyseKYC.png', titleKey: 'analyseKYC', url: 'https://demo.ilofund.com', technologies: ['Python', 'TensorFlow', 'NodeJs', 'Docker', 'FastApi', 'Next', 'LLMS'] }
    ].map(project => {
        const translation = getProjectTranslation(project.titleKey);
        return {
            image: project.image,
            url: project.url,
            technologies: project.technologies,
            title: translation.title,
            description: translation.description
        } as Project;
    });

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
