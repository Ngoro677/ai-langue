'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileNavigation from '@/components/MobileNavigation';
import LoadingScreen from '@/components/LoadingScreen';
import Chatbot from '@/components/Chatbot';
import CookieConsent from '@/components/CookieConsent';
import Legal from '@/components/Infolegal';

// Composant principal
export default function PageLegal() {
  const [isLoading, setIsLoading] = useState(() => {
    // Vérifier si c'est la première visite
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('portfolio_visited');
      return !hasVisited; // Afficher le loading seulement si c'est la première visite
    }
    return false; // Par défaut, pas de loading côté serveur
  });

  // Vérifier au montage du composant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('portfolio_visited');
      if (hasVisited) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Marquer comme visité après le premier chargement
    if (!isLoading && typeof window !== 'undefined') {
      localStorage.setItem('portfolio_visited', 'true');
    }
  }, [isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      {!isLoading && (
        <div className="min-h-screen animate-fadeIn">
          <Header />
          <main className=" md:pb-0">
            <section id="legal">
              <Legal />
            </section>
          </main>
          <Footer />
          <MobileNavigation />
          <Chatbot />
          <CookieConsent />
        </div>
      )}
    </>
  );
}