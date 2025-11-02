'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Accueil from '@/components/Accueil';
import Projet from '@/components/Projet';
import Techno from '@/components/Techno';

// Composant principal
export default function Home() {

  return (
    <div className="min-h-screen">
      <Header />
      <main>
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
    </div>
  );
}