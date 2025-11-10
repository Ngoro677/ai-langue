'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Enregistrer le plugin ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
  useGSAP?: boolean;
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.8,
  distance = 50,
  className = '',
  once = true,
  useGSAP = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  useEffect(() => {
    if (!ref.current || !useGSAP) return;

    const element = ref.current;
    const ctx = gsap.context(() => {
      const fromProps: gsap.TweenVars = { opacity: 0 };
      const toProps: gsap.TweenVars = { opacity: 1, duration, delay };

      switch (direction) {
        case 'up':
          fromProps.y = distance;
          toProps.y = 0;
          break;
        case 'down':
          fromProps.y = -distance;
          toProps.y = 0;
          break;
        case 'left':
          fromProps.x = distance;
          toProps.x = 0;
          break;
        case 'right':
          fromProps.x = -distance;
          toProps.x = 0;
          break;
        case 'scale':
          fromProps.scale = 0.8;
          toProps.scale = 1;
          break;
        case 'fade':
        default:
          break;
      }

      gsap.fromTo(
        element,
        fromProps,
        {
          ...toProps,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, element);

    return () => ctx.revert();
  }, [direction, delay, duration, distance, useGSAP]);

  // Utiliser Framer Motion si useGSAP est false
  if (!useGSAP) {
    const variants = {
      hidden: {
        opacity: 0,
        ...(direction === 'up' && { y: distance }),
        ...(direction === 'down' && { y: -distance }),
        ...(direction === 'left' && { x: distance }),
        ...(direction === 'right' && { x: -distance }),
        ...(direction === 'scale' && { scale: 0.8 }),
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

