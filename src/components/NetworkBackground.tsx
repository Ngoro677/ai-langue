'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: SVGCircleElement | null;
}

interface Connection {
  from: Node;
  to: Node;
  element: SVGLineElement | null;
  distance: number;
}

interface NetworkBackgroundProps {
  nodeCount?: number;
  connectionDistance?: number;
  color?: string;
  nodeColor?: string;
  className?: string;
}

export default function NetworkBackground({
  nodeCount = 50,
  connectionDistance = 150,
  color = '#fbbf24', // Jaune par défaut
  nodeColor = '#fbbf24', // Jaune par défaut
  className = '',
}: NetworkBackgroundProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Mettre à jour les connexions
  const updateConnections = useCallback(() => {
    if (!svgRef.current) return;

    const connectionsContainer = svgRef.current.querySelector('.connections-container') as SVGGElement;
    if (!connectionsContainer) return;

    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    // Nettoyer les anciennes connexions
    connectionsContainer.innerHTML = '';

    // Créer des connexions entre les nodes proches
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          // Créer la ligne
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', nodes[i].x.toString());
          line.setAttribute('y1', nodes[i].y.toString());
          line.setAttribute('x2', nodes[j].x.toString());
          line.setAttribute('y2', nodes[j].y.toString());
          line.setAttribute('stroke', color);
          line.setAttribute('stroke-width', '1');
          const opacity = 0.3 * (1 - distance / connectionDistance);
          line.setAttribute('opacity', opacity.toString());
          line.classList.add('connection');

          connectionsContainer.appendChild(line);
        }
      }

      // Connexion avec la souris si proche
      const dx = nodes[i].x - mouse.x;
      const dy = nodes[i].y - mouse.y;
      const mouseDistance = Math.sqrt(dx * dx + dy * dy);

      if (mouseDistance < connectionDistance * 1.5 && mouse.x > 0 && mouse.y > 0) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', nodes[i].x.toString());
        line.setAttribute('y1', nodes[i].y.toString());
        line.setAttribute('x2', mouse.x.toString());
        line.setAttribute('y2', mouse.y.toString());
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1.5');
        const mouseOpacity = 0.4 * (1 - mouseDistance / (connectionDistance * 1.5));
        line.setAttribute('opacity', mouseOpacity.toString());
        line.classList.add('connection', 'mouse-connection');

        connectionsContainer.appendChild(line);
      }
    }
  }, [connectionDistance, color]);

  // Initialiser les dimensions et les nodes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Créer les nodes
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = svgRef.current;
    const nodesContainer = svg.querySelector('.nodes-container') as SVGGElement;
    const connectionsContainer = svg.querySelector('.connections-container') as SVGGElement;

    if (!nodesContainer || !connectionsContainer) return;

    // Nettoyer les nodes existants
    nodesContainer.innerHTML = '';
    connectionsContainer.innerHTML = '';
    nodesRef.current = [];
    connectionsRef.current = [];

    // Créer les nodes
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const node: Node = {
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        element: null,
      };

      // Créer l'élément SVG pour le node
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', nodeColor);
      circle.setAttribute('opacity', '0.8');
      circle.classList.add('node');
      
      // Animation de pulsation pour chaque node
      gsap.to(circle, {
        attr: { r: 4 },
        opacity: 1,
        duration: 1.5 + Math.random() * 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      nodesContainer.appendChild(circle);
      node.element = circle;
      nodes.push(node);
    }

    nodesRef.current = nodes;

    // Créer les connexions initiales
    updateConnections();

    // Animation principale
    const animate = () => {
      const nodes = nodesRef.current;
      
      nodes.forEach((node) => {
        // Mettre à jour la position
        node.x += node.vx;
        node.y += node.vy;

        // Rebondir sur les bords
        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1;
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1;

        // Limiter dans les bounds
        node.x = Math.max(0, Math.min(dimensions.width, node.x));
        node.y = Math.max(0, Math.min(dimensions.height, node.y));

        // Mettre à jour l'élément SVG
        if (node.element) {
          gsap.to(node.element, {
            attr: { cx: node.x, cy: node.y },
            duration: 0.1,
            ease: 'none',
          });
        }
      });

      // Mettre à jour les connexions
      updateConnections();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, nodeCount, nodeColor, updateConnections]);

  // Gérer le mouvement de la souris
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      >
        <g className="connections-container" />
        <g className="nodes-container" />
      </svg>
    </div>
  );
}

