'use client';

import Chatbot from './Chatbot';

export default function Accueil() {

  return (
    <section
      style={{ background: 'url(/images/Accueil.png)', backgroundSize: 'cover' }}
      className="h-[100vh] flex items-center pt-20 relative"
    >
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 text-center sm:text-start lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-white space-y-6">
            {/* Introduction line */}
            <div className="flex justify-center sm:justify-start items-center space-x-3">
              <div className="w-12 h-0.5 bg-yellow-400"></div>
              <span className="text-white text-lg">Je suis</span>
            </div>

            {/* Name */}
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight animate-fadeInUp">
              FIFALIANTSOA<br />
              Sarobidy
            </h1>

            {/* Title */}
            <p className="text-xl text-white">
              Développeur Web et Mobile
            </p>

            {/* Description */}
            <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
              Développeur fullstack{' '}
              <span className="text-yellow-400 font-semibold">Javascript</span>{' '}
              et{' '}
              <span className="text-yellow-400 font-semibold">Designeur</span>{' '}
              avec plus de 4 ans d&apos;expériences, basé à Madagascar
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => {
                  const projetSection = document.getElementById('projet');
                  if (projetSection) {
                    const headerHeight = 100;
                    const sectionPosition = projetSection.offsetTop - headerHeight;
                    window.scrollTo({
                      top: sectionPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="flex items-center cursor-pointer space-x-3 bg-gray-900/80 hover:bg-gray-800/80 border border-gray-700 hover:border-yellow-400 px-6 py-3 rounded-lg transition-all duration-300 group"
              >
                <svg className="w-5 h-5 text-white group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-white group-hover:text-yellow-400 transition-colors">Projet réalisés</span>
              </button>
              
              <button 
                onClick={() => {
                  const message = encodeURIComponent('Bonjour Sarobidy, J\'ai un projet pour vous ...');
                  const whatsappUrl = `https://wa.me/261344653609?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="flex items-center cursor-pointer space-x-3 bg-gray-900/80 hover:bg-gray-800/80 border border-gray-700 hover:border-yellow-400 px-6 py-3 rounded-lg transition-all duration-300 group"
              >
                <svg className="w-5 h-5 text-white group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-white group-hover:text-yellow-400 transition-colors">Contact</span>
              </button>
            </div>
          </div>

        </div>

         {/* Chatbot */}
         <Chatbot />

        {/* Language flags at bottom right */}
        <div className="fixed z-50 sm:bottom-12 bottom-3 sm:right-12 right-3 flex space-x-2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="w-10 cursor-pointer h-8 rounded overflow-hidden border-2 border-white bg-gray-700/50 shadow-md p-0.5">
            <img src="/images/Drapeau/fr.png" alt="Français" className="w-full h-full object-cover rounded-sm" />
          </div>
          <div className="w-8 h-6 rounded overflow-hidden mt-1 shadow-md">
            <img src="/images/Drapeau/mga.jpeg" alt="Malagasy" className="w-full h-full object-cover" />
          </div>
          <div className="w-8 h-7.5 rounded overflow-hidden mt- shadow-md">
            <img src="/images/Drapeau/en.png" alt="English" className="w-full h-full object-cover" />
          </div>
        </div>
        
      </div>
    </section>
  );
}
