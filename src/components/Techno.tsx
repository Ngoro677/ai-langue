import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import NetworkBackground from './NetworkBackground';

interface Circuit {
  id: number;
  x: number;
  y: number;
  width: number;
  rotation: number;
  type: number;
}

interface Skill {
  name: string;
  level: number;
  icon: string;
  color: string;
}

interface Technology {
  name: string;
  icon: string;
}

export default function TechSkills() {
  const { t } = useI18n();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [circuits, setCircuits] = useState<Circuit[]>([]);

  useEffect(() => {
    // Generate random circuits
    const newCircuits = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      width: Math.random() * 150 + 50,
      rotation: Math.random() * 360,
      type: Math.floor(Math.random() * 3)
    }));
    setCircuits(newCircuits);
  }, []);

  // Liste complète des technologies avec leurs icônes
  const technologies: Technology[] = [
    { name: "Laravel", icon: "https://cdn.simpleicons.org/laravel/FF2D20" },
   { name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
    { name: "Angular", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg" },
    { name: "Node.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
    { name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
    { name: "Docker", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
    { name: "PostgreSQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
    { name: "MySQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" },
    { name: "Python", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
    { name: "n8n", icon: "https://cdn.simpleicons.org/n8n/EF4444" },
    { name: ".NET", icon: "https://cdn.simpleicons.org/dotnet/512BD4" },
    { name: "SQL Server", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg" },
    { name: "LangChain", icon: "https://cdn.simpleicons.org/langchain/1C3C3C" },
    { name: "LLM", icon: "https://cdn.simpleicons.org/openai/412991" },
   { name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
    { name: "Tailwind CSS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" },
    { name: "HTML5", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
    { name: "CSS3", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" },
    { name: "GitLab", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg" },
    { name: "Redis", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" },
    { name: "Figma", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" }
  ];

  const frontendSkills = [
    { name: 'HTML', level: 100, icon: '📄', color: 'from-orange-500 to-orange-600' },
    { name: 'CSS', level: 100, icon: '🎨', color: 'from-blue-500 to-blue-600' },
    { name: 'JS / TS', level: 98, icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
    { name: 'TailwindCss', level: 97, icon: '🌊', color: 'from-cyan-500 to-cyan-600' },
    { name: 'React', level: 96, icon: '⚛️', color: 'from-blue-400 to-blue-500' },
    { name: 'Next', level: 96, icon: '▲', color: 'from-gray-800 to-black' },
    { name: 'Angular', level: 90, icon: '🅰️', color: 'from-red-600 to-red-700' },
    { name: 'Zustand', level: 85, icon: '🐻', color: 'from-purple-500 to-purple-600' },
    { name: 'NgRx', level: 80, icon: '📦', color: 'from-purple-600 to-purple-700' },
    { name: 'Styled component', level: 80, icon: '💅', color: 'from-pink-500 to-pink-600' },
    { name: 'Optimisation SEO', level: 86, icon: '🔍', color: 'from-green-500 to-green-600' }
  ];

  const backendSkills = [
    { name: 'ExpressJs', level: 85, icon: '⚡', color: 'from-gray-700 to-gray-800' },
    { name: 'Laravel', level: 80, icon: '🔺', color: 'from-red-500 to-red-600' },
    { name: 'NestJs', level: 75, icon: '🐱', color: 'from-red-600 to-pink-600' },
    { name: 'Dotnet', level: 75, icon: '🔷', color: 'from-purple-600 to-purple-700' },
    { name: 'FastApi', level: 70, icon: '⚡', color: 'from-teal-500 to-teal-600' },
    { name: 'Sql Server', level: 70, icon: '🗄️', color: 'from-gray-600 to-gray-700' },
    { name: 'Postgres', level: 70, icon: '🐘', color: 'from-blue-600 to-blue-700' },
    { name: 'Qdrant', level: 70, icon: '🔴', color: 'from-pink-600 to-red-600' },
    { name: 'Redis', level: 60, icon: '🔴', color: 'from-red-700 to-red-800' }
  ];

  const designTools = [
    { name: 'AdobeXD', level: 95, icon: '🎨', color: 'from-pink-600 to-purple-600' },
    { name: 'Figma', level: 90, icon: '🎯', color: 'from-purple-500 to-pink-500' },
    { name: 'Adobe Photoshop', level: 80, icon: '🖼️', color: 'from-blue-600 to-blue-700' },
    { name: 'Adobe Illustrator', level: 60, icon: '🎨', color: 'from-orange-600 to-orange-700' }
  ];

  const devTools = [
    { name: 'Git hub', level: 98, icon: '🐙', color: 'from-gray-800 to-black' },
    { name: 'Git lab', level: 95, icon: '🦊', color: 'from-orange-600 to-red-600' },
    { name: 'Jira', level: 90, icon: '📊', color: 'from-blue-600 to-blue-700' },
    { name: 'Jest', level: 80, icon: '🃏', color: 'from-red-700 to-red-800' },
    { name: 'LangChain', level: 70, icon: '🔗', color: 'from-green-600 to-green-700' },
    { name: 'LLM', level: 70, icon: '🤖', color: 'from-blue-500 to-blue-600' },
    { name: 'Docker', level: 60, icon: '🐋', color: 'from-blue-600 to-blue-700' }
  ];

  const SkillCard = ({ skill, index }: { skill: Skill; index: number }) => (
    <div
      onMouseEnter={() => setHoveredCard(`${skill.name}-${index}`)}
      onMouseLeave={() => setHoveredCard(null)}
      className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-2 md:p-5 border border-gray-700 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20"
    >
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-lg md:text-2xl">{skill.icon}</span>
        <span className="text-white font-semibold text-sm md:text-lg">{skill.level}%</span>
      </div>
      <h3 className="text-white font-bold text-xs md:text-base mb-2 md:mb-3 leading-tight">{skill.name}</h3>
      <div className="w-full bg-gray-700 rounded-full h-1 md:h-1.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r transition-all duration-500 rounded-full ${
            hoveredCard !== null 
              ? 'from-yellow-400 to-yellow-500' 
              : skill.color
          }`}
          style={{
            width: hoveredCard === `${skill.name}-${index}` ? `${skill.level}%` : '0%'
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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
      <h3 className="text-white text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed text-sm">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 relative overflow-hidden">
      {/* Network Background Animation */}
      <NetworkBackground 
        nodeCount={45}
        connectionDistance={160}
        color="#fbbf24"
        nodeColor="#faa81b6c"
      />
      
      {/* Animated Circuit Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <svg className="w-full h-full">
          {circuits.map((circuit) => (
            <g key={circuit.id}>
              {circuit.type === 0 && (
                <g
                  className={`transition-all duration-1000 ${
                    hoveredCard ? 'animate-pulse' : ''
                  }`}
                  style={{
                    transform: `translate(${circuit.x}%, ${circuit.y}%) rotate(${circuit.rotation}deg)`
                  }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2={circuit.width}
                    y2="0"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                  <circle cx={circuit.width} cy="0" r="4" fill="#fbbf24" />
                </g>
              )}
              {circuit.type === 1 && (
                <g
                  className={`transition-all duration-1000 ${
                    hoveredCard ? 'animate-pulse' : ''
                  }`}
                  style={{
                    transform: `translate(${circuit.x}%, ${circuit.y}%) rotate(${circuit.rotation}deg)`
                  }}
                >
                  <path
                    d={`M 0 0 L ${circuit.width / 2} 0 L ${circuit.width / 2} ${circuit.width / 2} L ${circuit.width} ${circuit.width / 2}`}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    fill="none"
                  />
                  <rect
                    x={circuit.width - 8}
                    y={circuit.width / 2 - 8}
                    width="16"
                    height="16"
                    fill="#fbbf24"
                  />
                </g>
              )}
              {circuit.type === 2 && (
                <g
                  className={`transition-all duration-1000 ${
                    hoveredCard ? 'animate-pulse' : ''
                  }`}
                  style={{
                    transform: `translate(${circuit.x}%, ${circuit.y}%) rotate(${circuit.rotation}deg)`
                  }}
                >
                  <circle cx="0" cy="0" r="6" fill="#fbbf24" />
                  <line
                    x1="6"
                    y1="0"
                    x2={circuit.width}
                    y2="0"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      <h1 className="text-white max-w-7xl mx-auto px-6 mt-12 text-3xl font-bold mb-12 relative z-10">
          {t('techno.technologies')}
        </h1>

        {/* Scrolling Technologies Section */}
        <div className="relative z-10">
          {/* Masque de dégradé aux bords pour effet fade */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none"></div>
          
          <div className="relative -mt-12 overflow-hidden py-12">
            {/* Animation de défilement infini */}
            <div className="flex animate-scroll space-x-6 w-max">
              {/* Première série */}
              {technologies.map((tech, index) => (
                <div
                  key={`first-${index}`}
                  className="flex-shrink-0 w-17 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/20 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-50 shadow-lg border border-gray-700">
                    {tech.name}
                    {/* Flèche du tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
                    </div>
                  </div>
                  <img
                    src={tech.icon}
                    alt={tech.name}
                    className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback si l'image ne charge pas
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'text-white text-xs font-semibold text-center';
                        fallback.textContent = tech.name.substring(0, 3);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ))}
              {/* Deuxième série pour effet infini */}
              {technologies.map((tech, index) => (
                <div
                  key={`second-${index}`}
                  className="flex-shrink-0 w-17 h-17 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/20 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-50 shadow-lg border border-gray-700">
                    {tech.name}
                    {/* Flèche du tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
                    </div>
                  </div>
                  <img
                    src={tech.icon}
                    alt={tech.name}
                    className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'text-white text-xs font-semibold text-center';
                        fallback.textContent = tech.name.substring(0, 3);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <h1 className="text-white text-3xl font-bold mb-12">
          {t('techno.technologies')} <span className="text-yellow-500">{t('techno.details')}</span>
        </h1>


        {/* Frontend Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <SectionTitle icon="</>" title={t('techno.frontend')} subtitle="" />
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {frontendSkills.map((skill, index) => (
                <SkillCard key={skill.name} skill={skill} index={index} />
              ))}
            </div>
          </div>
          <div>
            <InfoBox
              title={t('techno.frontend')}
              description={t('techno.frontendDesc')}
            />
          </div>
        </div>

        {/* Backend Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <SectionTitle icon="</>" title={t('techno.backend')} subtitle={t('techno.baseDonnee')} />
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {backendSkills.map((skill, index) => (
                <SkillCard key={skill.name} skill={skill} index={index} />
              ))}
            </div>
          </div>
          <div>
            <InfoBox
              title={`${t('techno.backend')} ${t('techno.baseDonnee')}`}
              description={t('techno.backendDesc')}
            />
          </div>
        </div>

        {/* Design Tools Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <SectionTitle icon="✏️" title={t('techno.outilsDesign')} subtitle={t('techno.design')} />
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {designTools.map((skill, index) => (
                <SkillCard key={skill.name} skill={skill} index={index} />
              ))}
            </div>
          </div>
          <div>
            <InfoBox
              title={`${t('techno.outilsDesign')} ${t('techno.design')}`}
              description={t('techno.designDesc')}
            />
          </div>
        </div>

        {/* Dev Tools Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SectionTitle icon="🔧" title={t('techno.testUnitaire')} subtitle={t('techno.outils')} />
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {devTools.map((skill, index) => (
                <SkillCard key={skill.name} skill={skill} index={index} />
              ))}
            </div>
          </div>
          <div>
            <InfoBox
              title={`${t('techno.testUnitaire')} ${t('techno.outils')}`}
              description={t('techno.outilsDesc')}
            />
          </div>
        </div>

      </div>
    </div>
  );
}