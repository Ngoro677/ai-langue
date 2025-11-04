'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import ProfileModal from './ProfileModal';

export default function MobileNavigation() {
  const { t } = useI18n();
  const [activeLink, setActiveLink] = useState('accueil');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const accueilSection = document.getElementById('accueil');
      const projetSection = document.getElementById('projet');
      const technoSection = document.getElementById('techno');

      if (accueilSection && projetSection && technoSection) {
        const scrollTop = window.scrollY;
        const headerHeight = 100;
        const scrollPosition = scrollTop + headerHeight + 100;

        const accueilOffset = accueilSection.offsetTop;
        const projetOffset = projetSection.offsetTop;
        const technoOffset = technoSection.offsetTop;

        if (scrollPosition >= technoOffset) {
          setActiveLink('techno');
        } else if (scrollPosition >= projetOffset - 200) {
          setActiveLink('projet');
        } else if (scrollPosition >= accueilOffset) {
          setActiveLink('accueil');
        } else {
          setActiveLink('accueil');
        }
      }
    };

    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', optimizedScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = 100;
      const sectionPosition = section.offsetTop - headerHeight;
      window.scrollTo({
        top: sectionPosition,
        behavior: 'smooth'
      });
      setTimeout(() => {
        setActiveLink(sectionId);
      }, 600);
    }
  };

  const navItems = [
    {
      id: 'accueil',
      label: t('nav.accueil'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => scrollToSection('accueil'),
    },
    {
      id: 'projet',
      label: t('nav.projet'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: () => scrollToSection('projet'),
    },
    {
      id: 'techno',
      label: t('nav.techno'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      onClick: () => scrollToSection('techno'),
    },
    {
      id: 'profil',
      label: t('nav.profil'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => setIsProfileModalOpen(true),
    },
  ];

  return (
    <>
      {/* Navigation Mobile - Visible uniquement sur mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 rounded-t-3xl shadow-2xl">
        {/* Indicateur de geste */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-600/60 rounded-full"></div>
        </div>

        {/* Items de navigation */}
        <div className="flex items-center justify-around px-2 pb-2 pt-3">
          {navItems.map((item) => {
            const isActive = activeLink === item.id || (item.id === 'profil' && isProfileModalOpen);
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center space-y-1.5 min-w-[64px] py-2 rounded-2xl transition-all duration-300 relative ${
                  isActive
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }`}
                aria-label={item.label}
              >
                <span className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                {isActive && (
                  <span className="text-[10px] font-semibold text-white leading-tight">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}

