'use client';

import { useState, useEffect, forwardRef } from 'react';
import ProfileModal from './ProfileModal';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

const Header = forwardRef<HTMLDivElement>((props, ref) => {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('accueil');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const isHomePage = pathname === '/';

  // Gérer le backdrop-blur sur toutes les pages (détection du scroll)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    // Utiliser requestAnimationFrame pour optimiser les performances
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
    // Vérifier l'état initial
    handleScroll();
    return () => window.removeEventListener('scroll', optimizedScroll);
  }, []);

  // Gérer la détection des sections actives uniquement sur la page principale
  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      // Détection de la section active lors du scroll
      const accueilSection = document.getElementById('accueil');
      const projetSection = document.getElementById('projet');
      const technoSection = document.getElementById('techno');

      if (accueilSection && projetSection && technoSection) {
        const headerHeight = 100; // Hauteur approximative du header
        const scrollPosition = scrollTop + headerHeight + 100; // Offset pour détecter quand la section est visible

        const accueilOffset = accueilSection.offsetTop;
        const projetOffset = projetSection.offsetTop;
        const technoOffset = technoSection.offsetTop;

        // Détection basée sur la position du scroll
        if (scrollPosition >= technoOffset) {
          setActiveLink('techno');
        } else if (scrollPosition >= projetOffset - 200) {
          // Seuil ajusté pour changer de lien avant d'arriver exactement à la section
          setActiveLink('projet');
        } else if (scrollPosition >= accueilOffset) {
          setActiveLink('accueil');
        } else {
          setActiveLink('accueil');
        }
      }
    };

    // Utiliser requestAnimationFrame pour optimiser les performances
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
    // Vérifier la section active au chargement initial
    handleScroll();
    return () => window.removeEventListener('scroll', optimizedScroll);
  }, [isHomePage]);

  // Gérer le hash dans l'URL si on arrive depuis une autre page
  useEffect(() => {
    if (isHomePage && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const section = document.getElementById(hash);
      if (section) {
        setTimeout(() => {
          const headerHeight = 100;
          const sectionPosition = section.offsetTop - headerHeight;
          window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
          });
          setActiveLink(hash);
        }, 500);
      }
    }
  }, [isHomePage]);

  const scrollToSection = (sectionId: string, delay: number = 0) => {
    setTimeout(() => {
      // Si on n'est pas sur la page principale, naviguer vers la page principale avec le hash
      if (!isHomePage) {
        router.push(`/#${sectionId}`);
        return;
      }

      // Si on est sur la page principale, faire le scroll normal
      const section = document.getElementById(sectionId);
      if (section) {
        const headerHeight = 100; // Hauteur approximative du header
        const sectionPosition = section.offsetTop - headerHeight;
        window.scrollTo({
          top: sectionPosition,
          behavior: 'smooth'
        });
        // L'état actif sera mis à jour automatiquement par le handler de scroll
        // après que l'animation de scroll soit terminée
        setTimeout(() => {
          setActiveLink(sectionId);
        }, 600); // Délai pour attendre la fin de l'animation
      }
    }, delay);
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/20 backdrop-blur-sm' : ''
      }`}
    >
      <div ref={ref} className="bounds absolute inset-0 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-2"
          >
             <button
               onClick={() => {
                 if (!isHomePage) {
                   router.push('/');
                 } else {
                   scrollToSection('accueil');
                 }
               }}
               className="cursor-pointer"
             >
               <img
                 src="/images/Logo.png"
                 alt="Logo"
                 className="w-32 h-full object-cover"
               />
             </button>

            {/* Navigation */}
            <motion.nav 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden md:flex items-center space-x-8 ml-6"
            >
              <button 
                onClick={() => scrollToSection('accueil')}
                className={`transition-colors cursor-pointer relative group font-medium flex items-center ${
                  activeLink === 'accueil' 
                    ? 'text-yellow-400' 
                    : 'text-white hover:text-yellow-400'
                }`}
              >
                {t('nav.accueil')}
                {activeLink === 'accueil' && (
                  <span className="ml-2 w-8 h-0.5 bg-yellow-400"></span>
                )}
              </button>
              <button 
                onClick={() => scrollToSection('projet', 300)}
                className={`transition-colors cursor-pointer relative group font-medium flex items-center ${
                  activeLink === 'projet' 
                    ? 'text-yellow-400' 
                    : 'text-white hover:text-yellow-400'
                }`}
              >
                {t('nav.projet')}
                {activeLink === 'projet' && (
                  <span className="ml-2 w-8 h-0.5 bg-yellow-400"></span>
                )}
              </button>
              <button 
                onClick={() => scrollToSection('techno')}
                className={`transition-colors cursor-pointer relative group font-medium flex items-center ${
                  activeLink === 'techno' 
                    ? 'text-yellow-400' 
                    : 'text-white hover:text-yellow-400'
                }`}
              >
                {t('nav.techno')}
                {activeLink === 'techno' && (
                  <span className="ml-2 w-8 h-0.5 bg-yellow-400"></span>
                )}
              </button>
            </motion.nav>
          </motion.div>



          {/* Social Media & Profile */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex mr-4 md:mr-0 items-center space-x-4"
          >
            {/* Social Icons */}
            <div className="flex items-center space-x-3">
              <a 
                href="https://wa.me/261344653609?text=Bonjour%20Sarobidy,%20J'ai%20un%20projet%20pour%20vous%20..." 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </a>
              <a 
                href="mailto:sarobidy.fifaliantsoa@ilomad.com" 
                className="text-white hover:text-yellow-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/in/fifaliantsoa-sarobidy-8a9335350/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>

            {/* Profile Picture */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-10 overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-110"
            >
              <img
                src="/images/profile.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </motion.header>
  );
});

Header.displayName = 'Header';

export default Header;

