'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './StickyCursor.module.scss';
import { motion, useMotionValue, useSpring, transform, animate } from 'framer-motion';

interface StickyCursorProps {
  stickyElement: React.RefObject<HTMLDivElement>;
}

export default function StickyCursor({ stickyElement }: StickyCursorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const cursor = useRef<HTMLDivElement>(null);
  
  // Taille du curseur : 4rem (64px) pour images/textes, 60px pour header, 15px par défaut
  const cursorSize = isHoveringInteractive ? 64 : (isHovered ? 60 : 15);

  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0)
  };

  const scale = {
    x: useMotionValue(1),
    y: useMotionValue(1)
  };

  // Smooth out the mouse values
  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouse.x, smoothOptions),
    y: useSpring(mouse.y, smoothOptions)
  };

  const rotate = (distance: { x: number; y: number }) => {
    if (!cursor.current) return;
    const angle = Math.atan2(distance.y, distance.x);
    animate(cursor.current, { rotate: `${angle}rad` }, { duration: 0 });
  };

  // Détecter si l'élément sous la souris est une image ou un texte
  const checkInteractiveElement = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return false;

    // Vérifier si c'est une image
    if (target.tagName === 'IMG' || target.closest('img')) {
      return true;
    }

    // Vérifier si c'est un texte (paragraphes, titres, spans, liens, boutons)
    const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LABEL', 'LI', 'TD', 'TH', 'DIV'];
    if (textTags.includes(target.tagName)) {
      // Vérifier que l'élément contient du texte visible
      const textContent = target.textContent?.trim() || '';
      if (textContent.length > 0) {
        return true;
      }
    }

    // Vérifier les parents pour les éléments texte
    const textSelectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'label', 'li', 'td', 'th'];
    for (const selector of textSelectors) {
      if (target.closest(selector)) {
        const closestElement = target.closest(selector) as HTMLElement;
        if (closestElement && closestElement.textContent?.trim().length > 0) {
          return true;
        }
      }
    }

    // Vérifier si l'élément contient du texte visible directement
    const textContent = target.textContent?.trim() || '';
    if (textContent.length > 0 && target.offsetHeight > 0 && target.offsetWidth > 0) {
      // Vérifier que ce n'est pas un conteneur vide
      const hasTextNodes = Array.from(target.childNodes).some(
        node => node.nodeType === Node.TEXT_NODE && (node.textContent?.trim().length ?? 0) > 0
      );
      if (hasTextNodes) return true;
    }

    return false;
  }, []);

  const manageMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;

    // Vérifier si on survole une image ou un texte
    const isInteractive = checkInteractiveElement(e);
    setIsHoveringInteractive(isInteractive);

    // Si stickyElement existe et qu'on est en hover
    if (stickyElement.current && isHovered) {
      const { left, top, height, width } = stickyElement.current.getBoundingClientRect();

      // Center position of the stickyElement
      const center = { x: left + width / 2, y: top + height / 2 };

      // Distance between the mouse pointer and the center of the custom cursor
      const distance = { x: clientX - center.x, y: clientY - center.y };

      // Move mouse to center of stickyElement + slightly move it towards the mouse pointer
      mouse.x.set((center.x - cursorSize / 2) + (distance.x * 0.1));
      mouse.y.set((center.y - cursorSize / 2) + (distance.y * 0.1));

      // Stretch based on the distance
      const absDistance = Math.max(Math.abs(distance.x), Math.abs(distance.y));
      const newScaleX = transform(absDistance, [0, height / 2], [1, 1.3]);
      const newScaleY = transform(absDistance, [0, width / 2], [1, 0.8]);
      scale.x.set(newScaleX);
      scale.y.set(newScaleY);

      // Rotate
      rotate(distance);
    } else {
      // Move custom cursor to mouse position (toujours actif)
      mouse.x.set(clientX - cursorSize / 2);
      mouse.y.set(clientY - cursorSize / 2);
    }
  }, [isHovered, isHoveringInteractive, stickyElement, cursorSize, mouse, scale, rotate, checkInteractiveElement]);

  const manageMouseOver = useCallback(() => {
    setIsHovered(true);
  }, []);

  const manageMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsHoveringInteractive(false);
    if (cursor.current) {
      animate(cursor.current, { scaleX: 1, scaleY: 1 }, { duration: 0.1, type: 'spring' });
    }
    scale.x.set(1);
    scale.y.set(1);
  }, [scale]);

  // Initialiser le curseur au chargement - toujours écouter les mouvements
  useEffect(() => {
    // Initialiser la position du curseur au centre de l'écran
    if (typeof window !== 'undefined') {
      mouse.x.set(window.innerWidth / 2);
      mouse.y.set(window.innerHeight / 2);
    }

    window.addEventListener('mousemove', manageMouseMove);

    return () => {
      window.removeEventListener('mousemove', manageMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageMouseMove]);

  // Gérer les événements hover sur stickyElement
  useEffect(() => {
    const element = stickyElement.current;
    if (!element) return;

    element.addEventListener('mouseenter', manageMouseOver);
    element.addEventListener('mouseleave', manageMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', manageMouseOver);
      element.removeEventListener('mouseleave', manageMouseLeave);
    };
  }, [stickyElement, manageMouseOver, manageMouseLeave]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const template = (transformProps: Record<string, any>) => {
    const rotate = transformProps.rotate || '0rad';
    const scaleX = typeof transformProps.scaleX === 'number' ? transformProps.scaleX : 1;
    const scaleY = typeof transformProps.scaleY === 'number' ? transformProps.scaleY : 1;
    return `rotate(${rotate}) scaleX(${scaleX}) scaleY(${scaleY})`;
  };

  return (
    <div className={styles.cursorContainer}>
      <motion.div
        ref={cursor}
        style={{
          scaleX: scale.x,
          scaleY: scale.y,
          left: smoothMouse.x,
          top: smoothMouse.y,
        }}
        animate={{
          width: cursorSize,
          height: cursorSize,
        }}
        transformTemplate={template}
        className={styles.cursor}
      />
    </div>
  );
}

