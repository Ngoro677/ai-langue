'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté côté client pour le portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Empêcher le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      // Sauvegarder le style actuel pour la restauration
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const diplomas = [
    {
      title: 'Master en Informatique Générale',
      year: '2025',
      institution: 'ENI - École Nationale d\'Informatique, Madagascar',
      icon: '🎓'
    },
    {
      title: 'Certification Responsive Web Design',
      date: 'Avril 2025',
      provider: 'OpenClassrooms',
      icon: '🏆'
    },
    {
      title: 'Certification Javascript',
      date: 'Juillet 2024',
      provider: 'Free Codecamp',
      icon: '🏆'
    }
  ];

  const experiences = [
    {
      title: 'Développeur Full-stack',
      company: 'Ilomad',
      period: '2024 - Présent',
      description: 'Développement d\'applications web et mobiles avec les dernières technologies'
    },
    {
      title: 'Développeur Frontend',
      company: 'Freelance',
      period: '2022 - 2024',
      description: 'Création d\'interfaces utilisateur modernes et responsives avec les dernières technologies'
    }
  ];

  const languages = ['Français', 'Anglais', 'Malagasy'];

  // Contenu de la modal
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/10 backdrop-blur-md"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              width: '100vw',
              height: '100vh'
            }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-[5%] left-0 right-0 pointer-events-none"
            style={{
              position: 'fixed',
              top: '5%',
              left: 0,
              right: 0,
              zIndex: 10000,
              pointerEvents: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border border-white bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-b-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
              {/* Header avec image de profil */}
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 pt-6 pb-4">
                {/* Bouton fermer */}
                <button
                  onClick={onClose}
                  className="absolute cursor-pointer top-4 right-4 w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors z-10"
                  aria-label="Fermer"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image de profil */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-90 overflow-hidden">
                      <img
                        src="/images/bidy.png"
                        alt="Fifaliantsoa Sarobidy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/profile.png';
                        }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {/* Informations du profil */}
                <div className="mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src="/images/bidy.png"
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/profile.png';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">FIFALIANTSOA Sarobidy</h3>
                      <p className="text-gray-300 text-sm">
                        {t('profile.profession')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Langues */}
                <div className="mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">🌐</div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{t('profile.langues')}</h3>
                      <p className="text-gray-300 text-sm">{languages.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Diplômes et certifications */}
                <div className="mb-6">
                  <h3 className="text-white text-xl font-bold mb-4">{t('profile.diplomes')}</h3>
                  <div className="space-y-3">
                    {diplomas.map((diploma, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="text-2xl flex-shrink-0">{diploma.icon}</div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1">{diploma.title}</h4>
                            {diploma.year && (
                              <p className="text-gray-400 text-sm mb-1">{diploma.year}</p>
                            )}
                            {diploma.date && (
                              <p className="text-gray-400 text-sm mb-1">{diploma.date}</p>
                            )}
                            <p className="text-gray-300 text-sm">
                              {diploma.institution || diploma.provider}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Expériences */}
                <div className="mb-6">
                  <h3 className="text-white text-xl font-bold mb-4">{t('profile.experiences')}</h3>
                  <div className="space-y-3">
                    {experiences.map((exp, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (diplomas.length + index) * 0.1 }}
                        className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                      >
                        <h4 className="text-white font-semibold mb-1">{exp.title}</h4>
                        <p className="text-yellow-400 text-sm mb-1">{exp.company}</p>
                        <p className="text-gray-400 text-sm mb-2">{exp.period}</p>
                        <p className="text-gray-300 text-sm">{exp.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Informations de contact */}
                <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 mb-6">
                  <h3 className="text-white font-semibold mb-4">Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>+261 34 46 536 09</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>sarobidy.fifaliantsoa@ilomad.com</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Madagascar, Fianarantsoa</span>
                    </div>
                  </div>
                </div>

                {/* Bouton Contacter */}
                <button
                  onClick={() => {
                    const message = encodeURIComponent('Bonjour Sarobidy, J\'ai un projet pour vous ...');
                    const whatsappUrl = `https://wa.me/261344653609?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                    onClose();
                  }}
                  className="w-full border border-yellow-400 hover:border-yellow-400 hover:bg-transparent hover:text-yellow-400 border-2 border-transparent text-yellow-400 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {t('profile.contacter')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Utiliser un portal pour rendre la modal directement dans le body
  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

