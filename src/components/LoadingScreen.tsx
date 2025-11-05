'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);
  const overlayTopRef = useRef<HTMLDivElement>(null);
  const overlayBottomRef = useRef<HTMLDivElement>(null);
  const overlayLeftRef = useRef<HTMLDivElement>(null);
  const overlayRightRef = useRef<HTMLDivElement>(null);
  const progressObjRef = useRef({ value: 0 });

  useEffect(() => {
    // Liste des images CRITIQUES à précharger (seulement celles visibles immédiatement)
    const imagesToPreload = [
      // Images principales - VISIBLES IMMÉDIATEMENT
      '/images/Accueil.png',
      '/images/Logo.png',
      '/images/profile.png',
      // Drapeaux - VISIBLES IMMÉDIATEMENT
      '/images/Drapeau/fr.png',
      '/images/Drapeau/en.png',
      '/images/Drapeau/mga.jpeg',
      // Premières images de projets - VISIBLES DANS LA SECTION PROJETS
      '/images/Capture/DasboardIlodesk.png',
      '/images/Capture/Ilodesk.png',
      '/images/Capture/SmartDasboard.png',
      // Icônes technologies principales - VISIBLES IMMÉDIATEMENT
      '/images/IconTechno/React.png',
      '/images/IconTechno/nodejs-logo.png',
      '/images/IconTechno/tailwind.png',
      '/images/IconTechno/Figma.png',
    ];

    let loadedImages = 0;
    const totalImages = imagesToPreload.length;
    let animationFrameId: number;

    // Fonction pour précharger les images
    const preloadImages = () => {
      imagesToPreload.forEach((src) => {
        const img = new Image();
        img.onload = () => {
          loadedImages++;
          const newProgress = Math.min(
            Math.round((loadedImages / totalImages) * 100),
            100
          );
          setProgress(newProgress);
        };
        img.onerror = () => {
          loadedImages++;
          const newProgress = Math.min(
            Math.round((loadedImages / totalImages) * 100),
            100
          );
          setProgress(newProgress);
        };
        img.src = src;
      });
    };

    // Simuler le chargement avec progression - Version optimisée et plus rapide
    const simulateProgress = () => {
      const startTime = Date.now();
      const minDuration = 600; // 0.6 secondes minimum (réduit)
      const maxDuration = 1500; // 1.5 secondes maximum (réduit)

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const imageProgressPercent = (loadedImages / totalImages) * 100;
        
        // Progression basée sur le temps (60%) et les images (40%)
        const timeProgress = Math.min((elapsed / maxDuration) * 60, 60);
        const imageProgress = imageProgressPercent * 0.4;
        const totalProgress = Math.min(Math.round(timeProgress + imageProgress), 100);
        
        setProgress(totalProgress);

        // Continuer jusqu'à ce que toutes les images soient chargées ET minimum de temps écoulé
        const allImagesLoaded = loadedImages === totalImages;
        const minTimeElapsed = elapsed >= minDuration;
        
        if (totalProgress < 100 || !allImagesLoaded || !minTimeElapsed) {
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          // Forcer à 100% si tout est chargé
          setProgress(100);
          // Animation complète - attendre un peu avant l'animation d'ouverture (réduit)
          setTimeout(() => {
            animateExit();
          }, 200);
        }
      };

      updateProgress();
    };

    // Animation d'ouverture de la page (slide depuis le centre)
    const animateExit = () => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        },
      });

      // Animation des overlays qui s'ouvrent depuis le centre (version accélérée)
      tl.to(overlayTopRef.current, {
        y: '-100%',
        duration: 0.8,
        ease: 'power3.inOut',
      })
        .to(
          overlayBottomRef.current,
          {
            y: '100%',
            duration: 0.8,
            ease: 'power3.inOut',
          },
          '<'
        )
        .to(
          overlayLeftRef.current,
          {
            x: '-100%',
            duration: 0.8,
            ease: 'power3.inOut',
          },
          '<'
        )
        .to(
          overlayRightRef.current,
          {
            x: '100%',
            duration: 0.8,
            ease: 'power3.inOut',
          },
          '<'
        )
        .to(
          loaderRef.current,
          {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
          },
          '-=0.3'
        )
        .set(loaderRef.current, { display: 'none' });
    };

    // Initialiser les animations GSAP
    gsap.set(overlayTopRef.current, { y: 0 });
    gsap.set(overlayBottomRef.current, { y: 0 });
    gsap.set(overlayLeftRef.current, { x: 0 });
    gsap.set(overlayRightRef.current, { x: 0 });

    // Démarrer le préchargement et la simulation
    preloadImages();
    simulateProgress();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onComplete]);

  // Animation de la barre de progression
  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${progress}%`,
        duration: 0.3,
        ease: 'power2.out',
      });
    }

    if (progressTextRef.current) {
      // Utiliser un objet ref pour animer le contenu textuel
      progressObjRef.current.value = parseInt(progressTextRef.current.textContent?.replace('%', '') || '0');
      gsap.to(progressObjRef.current, {
        value: progress,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          if (progressTextRef.current) {
            progressTextRef.current.textContent = `${Math.round(progressObjRef.current.value)}%`;
          }
        },
      });
    }
  }, [progress]);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[99999] bg-black flex items-center justify-center"
    >
      {/* Conteneur principal du loader */}
      <div className="relative w-full max-w-2xl mx-auto px-8">
        {/* Texte de pourcentage */}
        <div className="text-center mb-8">
          <div
            ref={progressTextRef}
            className="text-6xl md:text-8xl font-bold text-white mb-4"
          >
            0%
          </div>
          <div className="text-yellow-400 text-sm md:text-base font-semibold tracking-wider">
            CHARGEMENT...
          </div>
        </div>

        {/* Barre de progression */}
        <div className="relative w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full"
            style={{ width: '0%' }}
          >
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Overlays pour l'animation d'ouverture */}
      <div
        ref={overlayTopRef}
        className="absolute top-0 left-0 w-full h-1/2 bg-black z-10"
      />
      <div
        ref={overlayBottomRef}
        className="absolute bottom-0 left-0 w-full h-1/2 bg-black z-10"
      />
      <div
        ref={overlayLeftRef}
        className="absolute top-0 left-0 w-1/2 h-full bg-black z-10"
      />
      <div
        ref={overlayRightRef}
        className="absolute top-0 right-0 w-1/2 h-full bg-black z-10"
      />
    </div>
  );
}

