'use client';

import { useState, useEffect, useRef } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileNavigation from '@/components/MobileNavigation';
import Accueil from '@/components/Accueil';
import Projet from '@/components/Projet';
import Techno from '@/components/Techno';
import LoadingScreen from '@/components/LoadingScreen';
import Chatbot from '@/components/Chatbot';
import StickyCursor from '@/components/StickyCursor';

// Composant principal
export default function Home() {
  const stickyElement = useRef<HTMLDivElement>(null);
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
          <Header ref={stickyElement} />
          <StickyCursor stickyElement={stickyElement as React.RefObject<HTMLDivElement>} />
          <main className=" md:pb-0">
            <section id="accueil">
              <Accueil />
            </section>
            <section id="projet">
              <Projet />
            </section>
            <section id="techno">
              <Techno />
            </section>
          </main>
          <Footer />
          <MobileNavigation />
          <Chatbot />
        </div>
      )}
    </>
  );
}