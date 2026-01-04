'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';
import NetworkBackground from './NetworkBackground';
import ScrollReveal from './ScrollReveal';
import StaggerReveal from './StaggerReveal';
import { useRouter } from 'next/navigation';

export default function Legal() {
  const { t } = useI18n();
  const router = useRouter();

  const handleBackToHome = () => {
    router.push('/');
  };

  const legalSections = [
    {
      id: 'mentions',
      title: t('legal.mentionsLegales'),
      content: t('legal.contenuMentions'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'propriete',
      title: t('legal.proprieteIntellectuelle'),
      content: t('legal.contenuPropriete'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'donnees',
      title: t('legal.donneesPersonnelles'),
      content: t('legal.contenuDonnees'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'contact',
      title: t('legal.contact'),
      content: t('legal.contenuContact'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'copyright',
      title: t('legal.copyright'),
      content: t('legal.contenuCopyright'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="min-h-screen py-16 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 relative overflow-hidden">
      {/* Network Background Animation */}
      <NetworkBackground 
        nodeCount={50}
        connectionDistance={160}
        color="#fbbf24"
        nodeColor="#faa81b6c"
      />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header avec bouton retour */}
        <ScrollReveal direction="down" delay={0.2} duration={0.8}>
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={handleBackToHome}
              className="flex bouton-ilo items-center space-x-2 text-white hover:text-yellow-400 transition-colors group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{t('legal.retour')}</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Titre principal */}
        <ScrollReveal direction="up" delay={0.3} duration={0.8}>
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {t('legal.titre')}
            </h1>
            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
          </div>
        </ScrollReveal>

        {/* Sections légales */}
        <StaggerReveal direction="up" staggerDelay={0.1} className="space-y-8">
          {legalSections.map((section, index) => (
            <ScrollReveal key={section.id} direction="up" delay={0.4 + index * 0.1} duration={0.8}>
              <div className="bg-gray-800/50 ilo backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gray-700/50 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/10">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 ilo w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center text-yellow-400 border border-yellow-400/20">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4">
                      {section.title}
                    </h2>
                    <p className="text-gray-300 text-base leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

