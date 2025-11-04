'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Enregistrer le plugin ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const useScrollAnimation = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const element = sectionRef.current;
    const ctx = gsap.context(() => {
      // Animation de révélation au scroll
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 100,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, element);

    return () => ctx.revert();
  }, []);

  return sectionRef;
};

export const useScrollReveal = (
  selector: string,
  options?: {
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
  }
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const elements = ref.current.querySelectorAll(selector);
    const { delay = 0, direction = 'up', duration = 1 } = options || {};

    const ctx = gsap.context(() => {
      elements.forEach((el, index) => {
        const fromProps: { opacity: number; x?: number; y?: number } = { opacity: 0 };
        
        if (direction === 'up') fromProps.y = 80;
        else if (direction === 'down') fromProps.y = -80;
        else if (direction === 'left') fromProps.x = 80;
        else if (direction === 'right') fromProps.x = -80;

        gsap.fromTo(
          el,
          fromProps,
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration,
            delay: delay + index * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, ref.current);

    return () => ctx.revert();
  }, [selector, options]);

  return ref;
};

