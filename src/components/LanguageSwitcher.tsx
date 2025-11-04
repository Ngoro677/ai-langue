'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  const languages = [
    { code: 'fr', name: 'Français', flag: '/images/Drapeau/fr.png' },
    { code: 'mga', name: 'Malagasy', flag: '/images/Drapeau/mga.jpeg' },
    { code: 'en', name: 'English', flag: '/images/Drapeau/en.png' },
  ];

  return (
    <div className="fixed z-50 sm:bottom-12 bottom-26 sm:right-12 right-3 flex space-x-2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code as 'fr' | 'en' | 'mga')}
          className={`w-10 h-8 cursor-pointer rounded overflow-visible shadow-md p-0.5 transition-all duration-300 group relative ${
            language === lang.code 
              ? 'border-2 border-white bg-gray-700/50' 
              : 'border-2 border-transparent hover:border-gray-600'
          }`}
          aria-label={lang.name}
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-[60] shadow-lg border border-gray-700">
            {lang.name}
            {/* Flèche du tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
            </div>
          </div>
          <img src={lang.flag} alt={lang.name} className="w-full h-full object-cover rounded-sm" />
        </button>
      ))}
    </div>
  );
}

