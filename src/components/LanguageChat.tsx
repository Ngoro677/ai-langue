'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Send,
  Mic,
  MicOff,
  MessageSquare,
  History,
  Volume2,
  User,
  Bot,
  ChevronDown,
  Loader2,
  Gauge,
  VolumeX,
  CheckCircle,
  LogIn,
} from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const VOICE_OPTIONS = [
  { id: 'male1', label: 'Voix homme 1', lang: 'fr-FR' },
  { id: 'male2', label: 'Voix homme 2', lang: 'en-US' },
  { id: 'female1', label: 'Voix femme 1', lang: 'fr-FR' },
  { id: 'female2', label: 'Voix femme 2', lang: 'en-US' },
];

const SPEECH_SPEED_OPTIONS = [
  { id: 'slow', label: 'Très lent', rate: 0.5 },
  { id: 'normal', label: 'Normal', rate: 1 },
  { id: 'fast', label: 'Très rapide', rate: 1.6 },
] as const;

function getVoicesForOptions(): { id: string; label: string; voice: SpeechSynthesisVoice | null }[] {
  if (typeof window === 'undefined') return VOICE_OPTIONS.map((v) => ({ ...v, voice: null }));
  try {
    const synth = window.speechSynthesis;
    if (!synth) return VOICE_OPTIONS.map((v) => ({ ...v, voice: null }));
    const voices = synth.getVoices();
    const fr = voices.filter((v) => v.lang.startsWith('fr'));
    const en = voices.filter((v) => v.lang.startsWith('en'));
    const maleFr = fr.find((v) => /paul|male|david|nicolas|thomas/i.test(v.name)) || fr[0];
    const maleEn = en.find((v) => /male|david|daniel|mark|james/i.test(v.name)) || en[0];
    const femaleFr = fr.find((v) => /female|claire|marie|amelie|alice/i.test(v.name)) || fr[1] || fr[0];
    const femaleEn = en.find((v) => /female|samantha|victoria|karen|zira/i.test(v.name)) || en[1] || en[0];
    return [
      { id: 'male1', label: 'Voix homme 1', voice: maleFr ?? voices[0] ?? null },
      { id: 'male2', label: 'Voix homme 2', voice: maleEn ?? voices[1] ?? null },
      { id: 'female1', label: 'Voix femme 1', voice: femaleFr ?? voices[2] ?? null },
      { id: 'female2', label: 'Voix femme 2', voice: femaleEn ?? voices[3] ?? null },
    ];
  } catch {
    return VOICE_OPTIONS.map((v) => ({ ...v, voice: null }));
  }
}

type LanguageChatProps = { headerRight?: React.ReactNode };

export default function LanguageChat({ headerRight }: LanguageChatProps) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('female1');
  const [voiceOptions, setVoiceOptions] = useState<{ id: string; label: string; voice: SpeechSynthesisVoice | null }[]>(VOICE_OPTIONS.map((v) => ({ ...v, voice: null })));
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<(typeof SPEECH_SPEED_OPTIONS)[number]['id']>('normal');
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        setVoiceOptions(getVoicesForOptions());
      } catch {
        setVoiceOptions(VOICE_OPTIONS.map((v) => ({ ...v, voice: null })));
      }
    };
    load();
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis?.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    } catch {
      // ignore
    }
  }, []);

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

  const speedRate = SPEECH_SPEED_OPTIONS.find((s) => s.id === speechSpeed)?.rate ?? 1;

  const speak = useCallback(
    (text: string) => {
      if (!text?.trim()) return;
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const opts = voiceOptions.find((v) => v.id === selectedVoiceId);
        const voice = opts?.voice ?? null;
        const u = new SpeechSynthesisUtterance(text.trim());
        u.rate = speedRate;
        u.pitch = 1;
        if (voice) u.voice = voice;
        window.speechSynthesis.speak(u);
      } catch {
        // Lecture audio non disponible (ex. WebView Android / Messenger)
      }
    },
    [selectedVoiceId, voiceOptions, speedRate]
  );

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
    [conversationId, session]
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
      if (!trimmed || loading) return;

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

      abortRef.current = new AbortController();
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: abortRef.current.signal,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const assistantMessage: Message = { role: 'assistant', content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);
        if (session?.user && currentConvId) {
          saveMessage('assistant', data.response, currentConvId);
          if (messages.length === 0) updateConversationTitle(currentConvId, trimmed.slice(0, 50) || 'Nouvelle conversation');
        }
        if (autoPlayVoice) speak(data.response);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessaie.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, session, conversationId, saveMessage, updateConversationTitle, autoPlayVoice, speak]
  );

  const startRecording = () => {
    if (typeof window === 'undefined') return;
    try {
      const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
      if (!SR) {
        alert('Reconnaissance vocale non supportée sur ce navigateur.');
        return;
      }
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'fr-FR';
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const r = e.results[e.results.length - 1];
        const t = r?.[0]?.transcript?.trim();
        if (t) sendMessage(t);
      };
      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch {
      alert('Reconnaissance vocale non disponible.');
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const loadConversation = async (id: string) => {
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
  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-50 text-slate-900">
      {/* Header - style dashboard centre */}
      <header className="flex shrink-0 items-center justify-between gap-1 border-b border-slate-200 bg-white px-2 py-2 sm:gap-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 sm:h-10 sm:w-10"
            aria-label="Historique"
          >
            <MessageSquare className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="truncate text-sm font-semibold tracking-tight text-slate-800 sm:text-lg">
            <span className="hidden sm:inline">Apprenez </span>FR · EN · MG
          </h1>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          {/* Mobile: Voix en icône seule (select invisible par-dessus) */}
          <div className="relative h-9 w-9 shrink-0 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500" aria-hidden>
              <Volume2 className="h-4 w-4" />
            </span>
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="absolute inset-0 cursor-pointer rounded-lg opacity-0"
              title="Voix de l'assistant"
            >
              {voiceOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          {/* Desktop: Voix select visible */}
          <div className="relative hidden min-w-0 max-w-[5.5rem] md:block md:max-w-none">
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="w-full min-w-0 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              title="Voix de l'assistant"
            >
              {voiceOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            <Volume2 className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {/* Mobile: Vitesse en icône seule */}
          <div className="relative h-9 w-9 shrink-0 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500" aria-hidden>
              <Gauge className="h-4 w-4" />
            </span>
            <select
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(e.target.value as (typeof SPEECH_SPEED_OPTIONS)[number]['id'])}
              className="absolute inset-0 cursor-pointer rounded-lg opacity-0"
              title="Vitesse de lecture"
            >
              {SPEECH_SPEED_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {/* Desktop: Vitesse select visible (padding gauche pour l'icône) */}
          <div className="relative hidden sm:block">
            <Gauge className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <select
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(e.target.value as (typeof SPEECH_SPEED_OPTIONS)[number]['id'])}
              className="w-16 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-7 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 md:w-auto"
              title="Vitesse de lecture"
            >
              {SPEECH_SPEED_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {/* Lecture auto: toujours icône, texte masqué sur mobile */}
          <button
            type="button"
            onClick={() => setAutoPlayVoice((v) => !v)}
            title={autoPlayVoice ? 'Désactiver la lecture automatique' : 'Lecture auto des réponses'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:h-auto sm:w-auto sm:px-2.5 sm:py-2 ${autoPlayVoice ? 'border-amber-500 bg-amber-500/20 text-amber-600' : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            {autoPlayVoice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{autoPlayVoice ? 'Lecture auto' : 'Sans lecture'}</span>
          </button>
          {/* Slot profil (mobile) ou lien connexion */}
          {headerRight ?? (!session?.user && status !== 'loading' && (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 md:hidden"
              aria-label="Se connecter"
            >
              <LogIn className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </header>

      {/* Sidebar historique (connecté) - style dashboard */}
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
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 md:h-8 md:w-8"
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
                  + Créer nouveau
                </button>
                {conversationsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Aucune conversation pour le moment.</p>
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

      {/* Messages - style dashboard (bulles gris / rose) */}
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
        <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center px-2 py-12 text-center sm:py-16">
              {session?.user ? (
                <>
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 sm:mb-4 sm:h-20 sm:w-20">
                    <CheckCircle className="h-10 w-10 text-emerald-600 sm:h-12 sm:w-12" />
                  </div>
                  <h2 className="mb-1.5 text-lg font-semibold text-slate-800 sm:mb-2 sm:text-xl">
                    Bienvenue, {session.user.name?.split(' ')[0] ?? session.user.email?.split('@')[0] ?? 'vous'}
                  </h2>
                  <p className="max-w-sm text-sm text-slate-600 sm:text-base">
                    Vous êtes connecté. Vos conversations sont enregistrées. Posez des questions ou envoyez un message vocal pour commencer.
                  </p>
                  <p className="mt-2 text-xs text-emerald-600 sm:mt-3 sm:text-sm">
                    Historique sauvegardé
                  </p>
                </>
              ) : (
                <>
                  <Bot className="mb-3 h-12 w-12 text-amber-500 sm:mb-4 sm:h-14 sm:w-14" />
                  <h2 className="mb-1.5 text-lg font-semibold text-slate-800 sm:mb-2 sm:text-xl">
                    Assistant langues
                  </h2>
                  <p className="max-w-sm text-sm text-slate-600 sm:text-base">
                    Pratiquez le français, l&apos;anglais et le malagasy. Posez des questions, envoyez un message vocal, apprenez verbes et vocabulaire.
                  </p>
                  <p className="mt-2 text-xs text-slate-500 sm:mt-3 sm:text-sm">
                    <Link href="/login" className="text-amber-600 hover:underline">Connectez-vous</Link> pour sauvegarder l&apos;historique.
                  </p>
                </>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 flex gap-2 sm:mb-4 sm:gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <Bot className="h-4 w-4 text-amber-600" />
                </div>
              )}
              <div
                className={`max-w-[90%] ilo rounded-2xl px-3 py-2 sm:max-w-[85%] sm:px-4 sm:py-2.5 ${
                  m.role === 'user'
                    ? 'bg-yellow-600/90 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => speak(m.content)}
                    className="mt-1.5 flex min-h-[2rem] min-w-[2rem] items-center gap-1 rounded text-xs text-amber-600 hover:text-amber-700 sm:mt-2"
                  >
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                    Écouter
                  </button>
                )}
              </div>
              {m.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="mb-3 flex gap-2 sm:mb-4 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                <Bot className="h-4 w-4 text-amber-600" />
              </div>
              <div className="rounded-2xl bg-slate-200 px-3 py-2.5 sm:px-4">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input - style dashboard */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl active:scale-95 sm:h-12 sm:w-12 ${isRecording ? 'bg-red-500/20 text-red-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
              title="Message vocal : parlez, envoi automatique"
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Écrivez un message..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-base text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:px-4 sm:py-3 [font-size:16px]"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-50 active:scale-95 sm:h-12 sm:w-12"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1.5 hidden text-center text-xs text-slate-500 sm:block">
            Message vocal : micro → parlez, envoi automatique. Réponse à l&apos;oral : &quot;Écouter&quot; ou &quot;Lecture auto&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
