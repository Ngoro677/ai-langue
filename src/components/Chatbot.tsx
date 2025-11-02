'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
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
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réception de la réponse');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: t('chatbot.erreur'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Bouton d'ouverture du chatbot */}
      <div className="fixed cursor-pointer z-50 sm:bottom-12 bottom-3 sm:left-12 left-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 cursor-pointer flex items-center justify-center rounded-full bg-gray-900/80 backdrop-blur-sm border-2 border-white hover:border-yellow-400 shadow-lg transition-all duration-300 hover:scale-110 group relative overflow-visible"
          aria-label="Ouvrir le chatbot"
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-[60] shadow-lg border border-gray-700">
            {t('chatbot.tooltip')}
            {/* Flèche du tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
            </div>
          </div>
          <p className="text-white text-2xl font-bold group-hover:text-yellow-400 transition-colors">?</p>
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
            className="fixed z-50 sm:bottom-24 bottom-16 sm:left-12 left-3 w-[calc(100vw-1.5rem)] sm:w-96 h-[500px] bg-gray-900/95 backdrop-blur-lg border-2 border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

