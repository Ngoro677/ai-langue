'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Send,
  MessageCircleCode,
  User,
  Bot,
  History,
  ChevronDown,
  Loader2,
  LogIn,
} from 'lucide-react';
import LanguageSelectModal, { type DialogueLang, LANG_OPTIONS } from '@/components/LanguageSelectModal';

const DIALOGUE_LANG_KEY = 'ialangue-dialogue-lang';

type Message = { role: 'user' | 'assistant'; content: string };

type MessageConversationProps = { headerRight?: React.ReactNode };

export default function MessageConversation({ headerRight }: MessageConversationProps) {
  const { data: session, status } = useSession();
  const [selectedLanguage, setSelectedLanguage] = useState<DialogueLang | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(DIALOGUE_LANG_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'mg') return stored;
    return null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    if (!session?.user) return;
    setConversationsLoading(true);
    try {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } finally {
      setConversationsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) loadConversations();
  }, [session?.user, loadConversations]);

  useEffect(() => {
    if (sidebarOpen && session?.user) loadConversations();
  }, [sidebarOpen, session?.user, loadConversations]);

  const saveMessage = useCallback(
    async (role: 'user' | 'assistant', content: string, convId?: string | null) => {
      const id = convId ?? conversationId;
      if (!id || !session?.user) return;
      await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content }),
      });
    },
    [conversationId, session?.user]
  );

  const updateConversationTitle = useCallback(
    async (convId: string, title: string) => {
      if (!session?.user) return;
      await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.slice(0, 50) }),
      });
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: title.slice(0, 50) } : c)));
    },
    [session?.user]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !selectedLanguage) return;

      let currentConvId = conversationId;
      if (session?.user && !currentConvId) {
        const res = await fetch('/api/conversations', { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.id) {
          currentConvId = data.id;
          setConversationId(data.id);
          setConversations((prev) => [{ id: data.id, title: data.title }, ...prev]);
        }
      }

      const userMessage: Message = { role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);
      if (session?.user && currentConvId) saveMessage('user', trimmed, currentConvId);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            conversationMode: true,
            preferredLanguage: selectedLanguage || 'fr',
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const assistantMessage: Message = { role: 'assistant', content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);
        if (session?.user && currentConvId) {
          saveMessage('assistant', data.response, currentConvId);
          if (messages.length === 0) updateConversationTitle(currentConvId, trimmed.slice(0, 50) || 'Dialogue');
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessaie.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, session?.user, conversationId, saveMessage, updateConversationTitle, selectedLanguage]
  );

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    setConversationId(id);
    setMessages(
      (data.messages || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    );
    setSidebarOpen(false);
  }, []);

  const newChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }, []);

  const handleLanguageSelect = useCallback((lang: DialogueLang) => {
    setSelectedLanguage(lang);
    if (typeof window !== 'undefined') localStorage.setItem(DIALOGUE_LANG_KEY, lang);
  }, []);

  const changeLanguage = useCallback(() => {
    setSelectedLanguage(null);
  }, []);

  const canChat = selectedLanguage !== null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-50 text-slate-900">
      <LanguageSelectModal
        isOpen={!canChat}
        onSelect={handleLanguageSelect}
        title="Choisissez votre langue"
        subtitle="Sélectionnez la langue du dialogue avant de commencer"
      />
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"
            aria-label="Historique"
          >
            <History className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
            <MessageCircleCode className="h-5 w-5" />
          </div>
          <div>
            <h1 className="truncate text-base font-semibold text-slate-800">Dialogue message</h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              {canChat && selectedLanguage && (
                <button
                  type="button"
                  onClick={changeLanguage}
                  className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 hover:bg-amber-200"
                  title="Changer la langue"
                >
                  {LANG_OPTIONS.find((l) => l.id === selectedLanguage)?.flag} {LANG_OPTIONS.find((l) => l.id === selectedLanguage)?.label}
                </button>
              )}
              {canChat && selectedLanguage ? '· corrections rapides' : 'Choisissez une langue pour commencer'}
            </p>
          </div>
        </div>
        {headerRight ?? (!session?.user && status !== 'loading' && (
          <Link
            href="/login"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400"
            aria-label="Se connecter"
          >
            <LogIn className="h-4 w-4" />
          </Link>
        ))}
      </header>

      {/* Sidebar historique (utilisateur connecté) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] max-w-full border-r border-slate-200 bg-white pt-safe md:static md:z-0 md:block md:max-w-xs md:flex-1 md:pt-0">
            <div className="flex items-center justify-between border-b border-slate-200 p-3">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <History className="h-4 w-4 shrink-0" />
                Historique
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 md:h-8 md:w-8"
                aria-label="Fermer"
              >
                <ChevronDown className="h-5 w-5 rotate-90 text-slate-600" />
              </button>
            </div>
            {!session?.user ? (
              <p className="p-4 text-sm text-slate-500">
                <Link href="/login" className="text-amber-600 hover:underline">Connectez-vous</Link> pour enregistrer vos conversations.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={newChat}
                  className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Nouveau dialogue
                </button>
                {conversationsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Aucun dialogue enregistré.</p>
                ) : (
                  <ul className="mt-2 max-h-96 overflow-y-auto p-2">
                    {conversations.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => loadConversation(c.id)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${conversationId === c.id ? 'bg-amber-50 text-amber-800' : 'text-slate-700'}`}
                        >
                          {c.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Messages */}
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/50 bg-amber-500/10">
                <MessageCircleCode className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-800">
                Dialogue & débat
              </h2>
              <p className="max-w-sm text-sm text-slate-600">
                Échange rapide, réponses courtes et précises. L&apos;assistant corrige les erreurs de frappe et grammaire de façon simple.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Par exemple : &quot;Bonjour, comment vas-tu ?&quot; ou un sujet à débattre.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <Bot className="h-4 w-4 text-amber-600" />
                </div>
              )}
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${
                  m.role === 'user'
                    ? 'bg-yellow-600/90 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
              </div>
              {m.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="mb-3 flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                <Bot className="h-4 w-4 text-amber-600" />
              </div>
              <div className="rounded-2xl bg-slate-200 px-4 py-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canChat && sendMessage(input)}
              placeholder={canChat ? "Écrivez une phrase courte..." : "Choisissez une langue pour commencer"}
              disabled={!canChat}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim() || !canChat}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-xs text-slate-500">
            Réponses courtes · corrections d&apos;erreurs automatiques
          </p>
        </div>
      </div>
    </div>
  );
}
