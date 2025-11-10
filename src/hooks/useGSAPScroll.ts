'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface UseGSAPScrollOptions {
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  delay?: number;
  duration?: number;
  distance?: number;
  start?: string;
  end?: string;
  toggleActions?: string;
  once?: boolean;
}

export const useGSAPScroll = (options: UseGSAPScrollOptions = {}) => {
  const ref = useRef<HTMLElement>(null);
  const {
    direction = 'up',
    delay = 0,
    duration = 1,
    distance = 50,
    start = 'top 85%',
    end = 'bottom 20%',
    toggleActions = 'play none none reverse',
    once = false,
  } = options;

  useEffect(() => {
    if (!ref.current) return;

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

      const animation = gsap.fromTo(
        element,
        fromProps,
        {
          ...toProps,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start,
            end,
            toggleActions,
            once,
          },
        }
      );

      return () => {
        animation.kill();
      };
    }, element);

    return () => ctx.revert();
  }, [direction, delay, duration, distance, start, end, toggleActions, once]);

  return ref;
};

