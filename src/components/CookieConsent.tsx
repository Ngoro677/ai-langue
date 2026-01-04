'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const checkAndShowCookie = () => {
      const cookieConsent = localStorage.getItem('cookieConsent');
      
      if (!cookieConsent) {
        // Afficher le cookie si aucun consentement n'a été donné
        setIsVisible(true);
        // Démarrer l'animation après un court délai
        setTimeout(() => {
          setIsAnimating(true);
        }, 300);
      } else {
        // Si le consentement existe déjà, incrémenter le compteur sans afficher le cookie
        incrementVisitorCount();
      }
    };

    // Attendre un peu pour s'assurer que le DOM est prêt et pour une meilleure UX
    const timer = setTimeout(checkAndShowCookie, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const incrementVisitorCount = () => {
    const currentCount = parseInt(localStorage.getItem('visitorCount') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('visitorCount', newCount.toString());
    // Déclencher un événement personnalisé pour mettre à jour le Footer
    window.dispatchEvent(new CustomEvent('visitorCountUpdated', { detail: newCount }));
  };

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
    incrementVisitorCount();
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
    incrementVisitorCount();
  };

  const handleClose = () => {
    // Fermer temporairement mais ne pas sauvegarder le consentement
    // Le cookie réapparaîtra à la prochaine visite
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={isAnimating ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative pointer-events-auto max-w-md w-full"
          >
            {/* Cookie Character */}
            <div className="absolute -right-12 -bottom-2 hidden md:block z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
                className="relative"
              >
                {/* Cookie Body */}
                <div className="w-20 h-20 bg-amber-600 rounded-full relative overflow-hidden shadow-lg">
                  {/* Chocolate Chips */}
                  <div className="absolute top-3 left-4 w-2 h-2 bg-amber-900 rounded-full"></div>
                  <div className="absolute top-6 right-5 w-2.5 h-2.5 bg-amber-900 rounded-full"></div>
                  <div className="absolute bottom-5 left-6 w-2 h-2 bg-amber-900 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-2 h-2 bg-amber-900 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-900 rounded-full"></div>
                  
                  {/* Face */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {/* Eyes */}
                    <div className="flex space-x-3 mb-1">
                      <div className="w-3 h-4 bg-black rounded-full">
                        <div className="w-1 h-1 bg-white rounded-full mt-1 ml-1"></div>
                      </div>
                      <div className="w-3 h-4 bg-black rounded-full">
                        <div className="w-1 h-1 bg-white rounded-full mt-1 ml-1"></div>
                      </div>
                    </div>
                    {/* Eyebrows */}
                    <div className="flex space-x-3 -mt-1">
                      <div className="w-2 h-0.5 bg-black rounded-full transform rotate-12"></div>
                      <div className="w-2 h-0.5 bg-black rounded-full transform -rotate-12"></div>
                    </div>
                    {/* Smile */}
                    <div className="w-4 h-2 border-2 border-black border-t-0 rounded-b-full mt-1 mx-auto"></div>
                  </div>
                </div>
                
                {/* Arms */}
                <motion.div
                  initial={{ x: -10, rotate: -20 }}
                  animate={{ x: 0, rotate: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -left-6 top-8 w-8 h-1 bg-amber-700 rounded-full transform rotate-45"
                ></motion.div>
                <motion.div
                  initial={{ x: 10, rotate: 20 }}
                  animate={{ x: 0, rotate: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -right-6 top-6 w-8 h-1 bg-amber-700 rounded-full transform -rotate-45"
                >
                  {/* Hand */}
                  <div className="absolute -right-2 -top-1 w-3 h-3 bg-amber-700 rounded-full"></div>
                </motion.div>
              </motion.div>
            </div>

            {/* Cookie Consent Box */}
            <div className="bg-gray-800/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-gray-700/50 relative overflow-hidden">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute ilo top-4 right-4 cursor-pointer text-gray-400 hover:text-white transition-colors z-10"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3 pr-8">
                {t('cookie.titre')}
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                {t('cookie.description')}
              </p>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 bouton-ilo bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 transition-all duration-300 transform shadow-lg"
                >
                  {t('cookie.accepter')}
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 bouton-ilo bg-transparent border-2 border-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:border-gray-500 hover:bg-gray-700/50 transition-all duration-300"
                >
                  {t('cookie.refuser')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

