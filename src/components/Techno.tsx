import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import NetworkBackground from './NetworkBackground';
import ScrollReveal from './ScrollReveal';
import StaggerReveal from './StaggerReveal';

interface Skill {
  name: string;
  level: number;
  icon: string;
  color: string;
  iconType?: 'local' | 'cdn' | 'emoji';
}

// Fonction helper pour obtenir l'icône d'une technologie
const getTechIcon = (techName: string): { icon: string; type: 'local' | 'cdn' | 'emoji' } => {
  const iconMap: { [key: string]: string } = {
    // Frontend
    'HTML': '/images/IconTechno/317755_badge_html_html5_achievement_award_icon.png',
    'HTML5': '/images/IconTechno/317755_badge_html_html5_achievement_award_icon.png',
    'CSS': '/images/IconTechno/4202020_css3_html_logo_social_social media_icon.png',
    'CSS3': '/images/IconTechno/4202020_css3_html_logo_social_social media_icon.png',
    'JS / TS': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    'JavaScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    'TypeScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    'TailwindCss': '/images/IconTechno/tailwind.png',
    'Tailwind CSS': '/images/IconTechno/tailwind.png',
    'React': '/images/IconTechno/React.png',
    'Next': 'https://cdn.simpleicons.org/nextdotjs/000000',
    'Next.js': 'https://cdn.simpleicons.org/nextdotjs/000000',
    'Angular': '/images/IconTechno/angular-icon-1-logo-png-transparent.png',
    'Zustand': '/images/IconTechno/zustand.png',
    'NgRx': '/images/IconTechno/ngrx-logo-png_seeklogo-352739.png',
    'Styled component': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/styledcomponents/styledcomponents-original.svg',
    'Optimisation SEO': 'https://cdn.simpleicons.org/google/4285F4',
    
    // Backend
    'ExpressJs': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
    'Express': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
    'Laravel': 'https://cdn.simpleicons.org/laravel/FF2D20',
    'NestJs': '/images/IconTechno/nestjs_logo_icon_169927.png',
    'NestJS': '/images/IconTechno/nestjs_logo_icon_169927.png',
    'Dotnet': 'https://cdn.simpleicons.org/dotnet/512BD4',
    '.NET': 'https://cdn.simpleicons.org/dotnet/512BD4',
    'FastApi': 'https://cdn.simpleicons.org/fastapi/009688',
    'FastAPI': 'https://cdn.simpleicons.org/fastapi/009688',
    'Sql Server': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
    'SQL Server': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
    'Postgres': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    'PostgreSQL': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    'Qdrant': '/images/IconTechno/qdrant-logo-png_seeklogo-497959.png',
    'Redis': '/images/IconTechno/re310r405-redis-logo-redis-original-wordmark-logo-free-icon-of-devicon.png',
    
    // Design
    'AdobeXD': '/images/IconTechno/Xd.png',
    'Adobe XD': '/images/IconTechno/Xd.png',
    'Figma': '/images/IconTechno/Figma.png',
    'Adobe Photoshop': '/images/IconTechno/Ps.png',
    'Photoshop': '/images/IconTechno/Ps.png',
    'Adobe Illustrator': '/images/IconTechno/Adobe Illustrator.png',
    'Illustrator': '/images/IconTechno/Adobe Illustrator.png',
    
    // Outils
    'Git hub': '/images/IconTechno/Github-Logo-Transparent.png',
    'GitHub': '/images/IconTechno/Github-Logo-Transparent.png',
    'Git lab': '/images/IconTechno/gitlab-logo.png',
    'GitLab': '/images/IconTechno/gitlab-logo.png',
    'Jira': '/images/IconTechno/Jira.png',
    'Jest': '/images/IconTechno/Jest.png',
    'LangChain': '/images/IconTechno/langChain.jpg',
    'LLM': 'https://cdn.simpleicons.org/openai/412991',
    'Docker': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  };
  
  const icon = iconMap[techName];
  if (icon) {
    return {
      icon,
      type: icon.startsWith('/images/') ? 'local' : 'cdn'
    };
  }
  
  // Fallback vers emoji si aucune icône trouvée
  return {
    icon: '❓',
    type: 'emoji'
  };
};

export default function TechSkills() {
  const { t } = useI18n();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const frontendSkills: Skill[] = [
    { name: 'HTML', level: 100, icon: getTechIcon('HTML').icon, color: 'from-orange-500 to-orange-600', iconType: getTechIcon('HTML').type },
    { name: 'CSS', level: 100, icon: getTechIcon('CSS').icon, color: 'from-blue-500 to-blue-600', iconType: getTechIcon('CSS').type },
    { name: 'JS / TS', level: 98, icon: getTechIcon('JavaScript').icon, color: 'from-yellow-500 to-yellow-600', iconType: getTechIcon('JavaScript').type },
    { name: 'TailwindCss', level: 97, icon: getTechIcon('TailwindCss').icon, color: 'from-cyan-500 to-cyan-600', iconType: getTechIcon('TailwindCss').type },
    { name: 'React', level: 96, icon: getTechIcon('React').icon, color: 'from-blue-400 to-blue-500', iconType: getTechIcon('React').type },
    { name: 'Next', level: 96, icon: getTechIcon('Next').icon, color: 'from-gray-800 to-black', iconType: getTechIcon('Next').type },
    { name: 'Angular', level: 90, icon: getTechIcon('Angular').icon, color: 'from-red-600 to-red-700', iconType: getTechIcon('Angular').type },
    { name: 'Zustand', level: 85, icon: getTechIcon('Zustand').icon, color: 'from-purple-500 to-purple-600', iconType: getTechIcon('Zustand').type },
    { name: 'NgRx', level: 80, icon: getTechIcon('NgRx').icon, color: 'from-purple-600 to-purple-700', iconType: getTechIcon('NgRx').type },
    { name: 'Styled component', level: 80, icon: getTechIcon('Styled component').icon, color: 'from-pink-500 to-pink-600', iconType: getTechIcon('Styled component').type },
    { name: 'Optimisation SEO', level: 86, icon: getTechIcon('Optimisation SEO').icon, color: 'from-green-500 to-green-600', iconType: getTechIcon('Optimisation SEO').type }
  ];

  const backendSkills: Skill[] = [
    { name: 'ExpressJs', level: 85, icon: getTechIcon('ExpressJs').icon, color: 'from-gray-700 to-gray-800', iconType: getTechIcon('ExpressJs').type },
    { name: 'Laravel', level: 80, icon: getTechIcon('Laravel').icon, color: 'from-red-500 to-red-600', iconType: getTechIcon('Laravel').type },
    { name: 'NestJs', level: 75, icon: getTechIcon('NestJs').icon, color: 'from-red-600 to-pink-600', iconType: getTechIcon('NestJs').type },
    { name: 'Dotnet', level: 75, icon: getTechIcon('Dotnet').icon, color: 'from-purple-600 to-purple-700', iconType: getTechIcon('Dotnet').type },
    { name: 'FastApi', level: 70, icon: getTechIcon('FastApi').icon, color: 'from-teal-500 to-teal-600', iconType: getTechIcon('FastApi').type },
    { name: 'Sql Server', level: 70, icon: getTechIcon('Sql Server').icon, color: 'from-gray-600 to-gray-700', iconType: getTechIcon('Sql Server').type },
    { name: 'Postgres', level: 70, icon: getTechIcon('Postgres').icon, color: 'from-blue-600 to-blue-700', iconType: getTechIcon('Postgres').type },
    { name: 'Qdrant', level: 70, icon: getTechIcon('Qdrant').icon, color: 'from-pink-600 to-red-600', iconType: getTechIcon('Qdrant').type },
    { name: 'Redis', level: 60, icon: getTechIcon('Redis').icon, color: 'from-red-700 to-red-800', iconType: getTechIcon('Redis').type }
  ];

  const designTools: Skill[] = [
    { name: 'AdobeXD', level: 95, icon: getTechIcon('AdobeXD').icon, color: 'from-pink-600 to-purple-600', iconType: getTechIcon('AdobeXD').type },
    { name: 'Figma', level: 90, icon: getTechIcon('Figma').icon, color: 'from-purple-500 to-pink-500', iconType: getTechIcon('Figma').type },
    { name: 'Adobe Photoshop', level: 80, icon: getTechIcon('Adobe Photoshop').icon, color: 'from-blue-600 to-blue-700', iconType: getTechIcon('Adobe Photoshop').type },
    { name: 'Adobe Illustrator', level: 60, icon: getTechIcon('Adobe Illustrator').icon, color: 'from-orange-600 to-orange-700', iconType: getTechIcon('Adobe Illustrator').type }
  ];

  const devTools: Skill[] = [
    { name: 'Git hub', level: 98, icon: getTechIcon('Git hub').icon, color: 'from-gray-800 to-black', iconType: getTechIcon('Git hub').type },
    { name: 'Git lab', level: 95, icon: getTechIcon('Git lab').icon, color: 'from-orange-600 to-red-600', iconType: getTechIcon('Git lab').type },
    { name: 'Jira', level: 90, icon: getTechIcon('Jira').icon, color: 'from-blue-600 to-blue-700', iconType: getTechIcon('Jira').type },
    { name: 'Jest', level: 80, icon: getTechIcon('Jest').icon, color: 'from-red-700 to-red-800', iconType: getTechIcon('Jest').type },
    { name: 'LangChain', level: 70, icon: getTechIcon('LangChain').icon, color: 'from-green-600 to-green-700', iconType: getTechIcon('LangChain').type },
    { name: 'LLM', level: 70, icon: getTechIcon('LLM').icon, color: 'from-blue-500 to-blue-600', iconType: getTechIcon('LLM').type },
    { name: 'Docker', level: 60, icon: getTechIcon('Docker').icon, color: 'from-blue-600 to-blue-700', iconType: getTechIcon('Docker').type }
  ];

  const SkillCard = ({ skill, index }: { skill: Skill; index: number }) => (
   
   
    <div
      onMouseEnter={() => setHoveredCard(`${skill.name}-${index}`)}
      onMouseLeave={() => setHoveredCard(null)}
      className="relative ilo bg-transparent rounded-lg p-2 md:p-5 border border-gray-700 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20"
    >
      
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
          {skill.iconType === 'emoji' ? (
            <span className="text-lg md:text-2xl">{skill.icon}</span>
          ) : (
            <img
              src={skill.icon}
              alt={skill.name}
              className="w-6 md:w-8 h-6 md:h-8 object-contain"
              loading="lazy"
              onError={(e) => {
                // Fallback vers emoji si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.className = 'text-lg md:text-2xl';
                  fallback.textContent = '❓';
                  parent.appendChild(fallback);
                }
              }}
            />
          )}
        </div>
        <span className="text-white font-semibold text-sm md:text-lg">{skill.level}%</span>
      </div>
      <h3 className="text-white font-bold text-xs md:text-base mb-2 md:mb-3 leading-tight">{skill.name}</h3>
      <div className="w-full ilo bg-gray-700 rounded-full h-0.5 overflow-hidden">
        <div
          className={`h-full ilo transition-all duration-500 rounded-full ${
            hoveredCard === `${skill.name}-${index}`
              ? 'bg-yellow-500' 
              : 'bg-gray-400'
          }`}
          style={{
            width: `${skill.level}%`
          }}
        />
      </div>
    </div>
  );

  const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-4 mb-8">
      <div className="text-white text-3xl">{icon}</div>
      <div>
        <h2 className="text-white text-2xl font-bold">{title}</h2>
        {subtitle && <h3 className="text-gray-400 text-lg">{subtitle}</h3>}
      </div>
    </div>
  );

  const InfoBox = ({ title, description }: { title: string; description: string }) => (
    <div className="ilo rounded-lg p-6 border-1 border-gray-700">
      <h3 className="text-white text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed text-sm">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 py-8 relative overflow-hidden">
      {/* Network Background Animation */}
      <NetworkBackground 
        nodeCount={40}
        connectionDistance={150}
        color="#fbbf24"
        nodeColor="#faa81b6c"
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal direction="up" delay={0.3} duration={0.8}>
          <h1 className="text-white text-3xl font-bold mb-12">
            {t('techno.technologies')} <span className="text-yellow-500">{t('techno.details')}</span>
          </h1>
        </ScrollReveal>


        {/* Frontend Section */}
        <ScrollReveal direction="up" delay={0.4} duration={0.8}>
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <SectionTitle icon="</>" title={t('techno.frontend')} subtitle="" />
              <StaggerReveal direction="up" staggerDelay={0.05} className="grid grid-cols-3 gap-2 md:gap-4">
                {frontendSkills.map((skill, index) => (
                  <SkillCard key={skill.name} skill={skill} index={index} />
                ))}
              </StaggerReveal>
            </div>
            <div>
              <ScrollReveal direction="left" delay={0.6} duration={0.8}>
                <InfoBox
                  title={t('techno.frontend')}
                  description={t('techno.frontendDesc')}
                />
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>

        {/* Backend Section */}
        <ScrollReveal direction="up" delay={0.5} duration={0.8}>
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <SectionTitle icon="</>" title={t('techno.backend')} subtitle={t('techno.baseDonnee')} />
              <StaggerReveal direction="up" staggerDelay={0.05} className="grid grid-cols-3 gap-2 md:gap-4">
                {backendSkills.map((skill, index) => (
                  <SkillCard key={skill.name} skill={skill} index={index} />
                ))}
              </StaggerReveal>
            </div>
            <div>
              <ScrollReveal direction="right" delay={0.7} duration={0.8}>
                <InfoBox
                  title={`${t('techno.backend')} ${t('techno.baseDonnee')}`}
                  description={t('techno.backendDesc')}
                />
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>

        {/* Design Tools Section */}
        <ScrollReveal direction="up" delay={0.6} duration={0.8}>
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <SectionTitle icon="✏️" title={t('techno.outilsDesign')} subtitle={t('techno.design')} />
              <StaggerReveal direction="up" staggerDelay={0.05} className="grid grid-cols-3 gap-2 md:gap-4">
                {designTools.map((skill, index) => (
                  <SkillCard key={skill.name} skill={skill} index={index} />
                ))}
              </StaggerReveal>
            </div>
            <div>
              <ScrollReveal direction="left" delay={0.8} duration={0.8}>
                <InfoBox
                  title={`${t('techno.outilsDesign')} ${t('techno.design')}`}
                  description={t('techno.designDesc')}
                />
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>

        {/* Dev Tools Section */}
        <ScrollReveal direction="up" delay={0.7} duration={0.8}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <SectionTitle icon="🔧" title={t('techno.testUnitaire')} subtitle={t('techno.outils')} />
              <StaggerReveal direction="up" staggerDelay={0.05} className="grid grid-cols-3 gap-2 md:gap-4">
                {devTools.map((skill, index) => (
                  <SkillCard key={skill.name} skill={skill} index={index} />
                ))}
              </StaggerReveal>
            </div>
            <div>
              <ScrollReveal direction="right" delay={0.9} duration={0.8}>
                <InfoBox
                  title={`${t('techno.testUnitaire')} ${t('techno.outils')}`}
                  description={t('techno.outilsDesc')}
                />
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}