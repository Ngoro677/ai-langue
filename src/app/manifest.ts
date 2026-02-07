import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IAlangue — Apprenez FR · EN · MG',
    short_name: 'IAlangue',
    description: 'Assistant pour apprendre le français, l\'anglais et le malagasy. Dialogue, vocabulaire, verbes et correction vocale.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1e3a5f',
    theme_color: '#1e3a5f',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['education', 'productivity'],
    lang: 'fr',
  };
}
