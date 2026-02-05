'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userQuestion?: string; // Stocker la question de l'utilisateur pour la mise en évidence
}

export default function Chatbot() {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('chatbot.bonjour'),
      timestamp: new Date(),
    },
  ]);

  // Réinitialiser le message initial quand la langue change
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t('chatbot.bonjour'),
        timestamp: new Date(),
      },
    ]);
  }, [language, t]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réception de la réponse');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        userQuestion: trimmed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: t('chatbot.erreur'),
        timestamp: new Date(),
        userQuestion: trimmed,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // Écouter les questions envoyées depuis les suggestions (ex: page Accueil)
  useEffect(() => {
    const handler = (e: CustomEvent<{ question: string }>) => {
      const question = e.detail?.question;
      if (question && typeof question === 'string') {
        setIsOpen(true);
        sendMessageRef.current(question);
      }
    };
    window.addEventListener('chatbot-send-question', handler as EventListener);
    return () => window.removeEventListener('chatbot-send-question', handler as EventListener);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fonction pour mettre en évidence les mots-clés de la question dans la réponse
  const highlightKeywords = (text: string, userQuestion: string): string => {
    if (!userQuestion || !text) return text;
    
    // Extraire les mots-clés significatifs de la question (mots de 3+ caractères, excluant les mots vides)
    const stopWords = ['est', 'il', 'est-il', 'es', 't\'il', 't\'il', 'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'pour', 'avec', 'sans', 'sur', 'dans', 'par', 'is', 'he', 'she', 'it', 'the', 'a', 'an', 'and', 'or', 'to', 'for', 'with', 'in', 'on', 'at'];
    const questionWords = userQuestion
      .toLowerCase()
      .split(/[\s\?\!\.]+/)
      .filter(word => word.length >= 3 && !stopWords.includes(word.toLowerCase()));
    
    if (questionWords.length === 0) return text;
    
    // Créer une regex pour trouver les mots-clés (insensible à la casse)
    // Exclure les mots dans les balises HTML pour ne pas casser les liens
    const keywordsPattern = questionWords
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    // Ne pas remplacer les mots dans les balises HTML
    const parts = text.split(/(<[^>]+>)/);
    const processedParts = parts.map((part) => {
      // Si c'est une balise HTML, ne pas la modifier
      if (part.startsWith('<')) return part;
      
      // Sinon, appliquer la mise en évidence
      const regex = new RegExp(`\\b(${keywordsPattern})\\b`, 'gi');
      return part.replace(regex, (match) => {
        return `<span class="bg-yellow-400 text-gray-900 font-semibold px-1 rounded">${match}</span>`;
      });
    });
    
    return processedParts.join('');
  };

  // Ajouter un gestionnaire d'événements pour les liens de section et CV
  useEffect(() => {
    const handleSectionLinks = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('.section-link') as HTMLElement;
      
      if (link && link.classList.contains('section-link')) {
        e.preventDefault();
        e.stopPropagation();
        const sectionId = link.getAttribute('data-section-id') || link.getAttribute('href')?.replace('#', '');
        if (sectionId) {
          const section = document.getElementById(sectionId);
          if (section) {
            const headerHeight = 100;
            const sectionPosition = section.offsetTop - headerHeight;
            window.scrollTo({
              top: sectionPosition,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    const handleCVLinks = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('.cv-link') as HTMLElement;
      
      if (link && link.classList.contains('cv-link')) {
        e.preventDefault();
        e.stopPropagation();
        try {
          // Créer un lien temporaire pour télécharger le PDF
          const downloadLink = document.createElement('a');
          downloadLink.href = '/cv.pdf';
          downloadLink.download = 'CV_Sarobidy_Fifaliantsoa.pdf';
          downloadLink.target = '_blank';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error('Erreur lors du téléchargement du CV:', error);
          // Fallback: ouvrir le PDF dans un nouvel onglet
          window.open('/cv.pdf', '_blank');
        }
      }
    };

    // Utiliser la délégation d'événements pour les liens dynamiques
    // Attacher au conteneur du chatbot pour éviter les conflits
    const chatbotContainer = document.querySelector('[data-chatbot-container]');
    const container = chatbotContainer || document;
    
    container.addEventListener('click', handleSectionLinks);
    container.addEventListener('click', handleCVLinks);
    
    return () => {
      container.removeEventListener('click', handleSectionLinks);
      container.removeEventListener('click', handleCVLinks);
    };
  }, []);


  return (
    <>
      {/* Bouton d'ouverture du chatbot */}
      <div className="fixed cursor-pointer z-[9999] sm:bottom-12 bottom-26 sm:left-12 left-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 ilo h-12 cursor-pointer flex items-center justify-center rounded-full bg-gray-900 backdrop-blur-sm border-2 border-white hover:border-yellow-400 shadow-lg transition-all duration-300 hover:scale-110 group relative overflow-visible"
          aria-label="Ouvrir le chatbot"
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-[10000] shadow-lg border border-gray-700">
            {t('chatbot.tooltip')}
            {/* Flèche du tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
            </div>
          </div>
          <svg 
            className="w-6 h-6 text-white group-hover:text-yellow-400 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        </button>
      </div>

      {/* Fenêtre du chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] sm:bottom-24 bottom-16 sm:left-12 left-3 w-[calc(100vw-1.5rem)] sm:w-96 h-[500px] bg-gray-900/95 backdrop-blur-lg border-2 border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            {/* En-tête */}
            <div className="bg-gray-800/90 px-4 py-3 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="text-white font-semibold text-sm">{t('chatbot.assistantIA')}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Fermer le chatbot"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" data-chatbot-container>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <p 
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightKeywords(message.content, message.userQuestion || '')
                        }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="border-t border-gray-700 p-4 bg-gray-800/50">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chatbot.placeholder')}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {t('chatbot.envoyer')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

