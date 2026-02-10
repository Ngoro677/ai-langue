'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  MicVocal,
  History,
  Volume2,
  User,
  Bot,
  ChevronDown,
  Loader2,
  Gauge,
  LogIn,
  CheckCircle,
  PhoneCall,
  PhoneOff,
} from 'lucide-react';
import LanguageSelectModal, { type DialogueLang, LANG_OPTIONS } from '@/components/LanguageSelectModal';
import VoiceInputFallback from '@/components/VoiceInputFallback';
import { useAudioCapabilities } from '@/hooks/useAudioCapabilities';

const DIALOGUE_LANG_KEY = 'ialangue-dialogue-lang';

type VoiceMessage = { role: 'user' | 'assistant'; content: string; audioUrl?: string };

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

type VoiceDialogueProps = { headerRight?: React.ReactNode };

const LANG_TO_RECOGNITION: Record<DialogueLang, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  mg: 'mg-MG',
};

export default function VoiceDialogue({ headerRight }: VoiceDialogueProps) {
  const { data: session, status } = useSession();
  const audioCap = useAudioCapabilities();
  const [selectedLanguage, setSelectedLanguage] = useState<DialogueLang | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(DIALOGUE_LANG_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'mg') return stored;
    return null;
  });
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('male1');
  const [voiceOptions, setVoiceOptions] = useState<{ id: string; label: string; voice: SpeechSynthesisVoice | null }[]>(
    VOICE_OPTIONS.map((v) => ({ ...v, voice: null }))
  );
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<(typeof SPEECH_SPEED_OPTIONS)[number]['id']>('normal');
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const lastVoiceTranscriptRef = useRef<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const audioUnlocked = useRef(false);
  const autoRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInterruptedRef = useRef(false);

  const INACTIVITY_MS = 2 * 60 * 1000; // 2 minutes

  useEffect(() => {
    const load = () => {
      try {
        setVoiceOptions(getVoicesForOptions());
      } catch {
        setVoiceOptions(VOICE_OPTIONS.map((v) => ({ ...v, voice: null })));
      }
    };
    load();
    if (typeof window !== 'undefined' && window.speechSynthesis?.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

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

  const unlockAudio = useCallback(() => {
    if (audioUnlocked.current || typeof window === 'undefined') return;
    try {
      audioUnlocked.current = true;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        if (ctx.state === 'suspended') ctx.resume();
      }
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(' ');
        (u as SpeechSynthesisUtterance & { volume?: number }).volume = 0;
        window.speechSynthesis.speak(u);
      }
    } catch {
      audioUnlocked.current = false;
    }
  }, []);

  useEffect(() => {
    const unlock = () => unlockAudio();
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('click', unlock, { once: true, passive: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, [unlockAudio]);

  const speak = useCallback(
    (text: string, onSpeakEnd?: () => void) => {
      if (!text?.trim()) return;
      setIsAssistantSpeaking(true);
      const win = typeof window !== 'undefined' ? window : null;
      const cap = win && (win as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      if (cap?.isNativePlatform?.()) {
        const doNativeTts = async () => {
          try {
            const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
            await TextToSpeech.stop();
            const opts = VOICE_OPTIONS.find((v) => v.id === selectedVoiceId);
            await TextToSpeech.speak({
              text: text.trim(),
              lang: opts?.lang ?? 'fr-FR',
              rate: speedRate,
              pitch: 1,
              volume: 1,
              queueStrategy: 0,
            });
          } catch {
            // fallback
          } finally {
            setIsAssistantSpeaking(false);
            onSpeakEnd?.();
          }
        };
        void doNativeTts();
        return;
      }
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        setIsAssistantSpeaking(false);
        onSpeakEnd?.();
        return;
      }
      unlockAudio();
      try {
        window.speechSynthesis.cancel();
        const opts = voiceOptions.find((v) => v.id === selectedVoiceId);
        const u = new SpeechSynthesisUtterance(text.trim());
        u.rate = speedRate;
        u.pitch = 1;
        if (opts?.voice) u.voice = opts.voice;
        else u.lang = 'fr-FR';
        u.onend = () => {
          setIsAssistantSpeaking(false);
          onSpeakEnd?.();
        };
        u.onerror = () => {
          setIsAssistantSpeaking(false);
          onSpeakEnd?.();
        };
        window.speechSynthesis.speak(u);
      } catch {
        setIsAssistantSpeaking(false);
        onSpeakEnd?.();
      }
    },
    [selectedVoiceId, voiceOptions, speedRate, unlockAudio]
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

  const triggerInactivityRelance = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        voiceMode: true,
        preferredLanguage: selectedLanguage || 'fr',
        inactivityRelance: true,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.response) {
          setMessages((prev) => [...prev, { role: 'assistant', content: d.response }]);
          if (session?.user && conversationId) saveMessage('assistant', d.response, conversationId);
          speak(d.response, () => {
            if (userInterruptedRef.current) {
              userInterruptedRef.current = false;
              return;
            }
            if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
            autoRestartTimeoutRef.current = setTimeout(() => {
              autoRestartTimeoutRef.current = null;
              startRecording();
            }, 600);
            inactivityTimeoutRef.current = setTimeout(triggerInactivityRelance, INACTIVITY_MS);
          });
        }
      })
      .catch(() => {});
  }, [messages, selectedLanguage, session?.user, conversationId, speak, saveMessage]);

  const sendVoiceMessage = useCallback(
    async (text: string, audioUrl?: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !selectedLanguage) return;

      let currentConvId = conversationId;
      if (session?.user && !currentConvId) {
        const res = await fetch('/api/conversations', { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.id) {
          currentConvId = data.id;
          setConversationId(data.id);
          setConversations((prev) => [{ id: data.id, title: 'Dialogue vocal' }, ...prev]);
        }
      }

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      const userMessage: VoiceMessage = { role: 'user', content: trimmed, ...(audioUrl && { audioUrl }) };
      setMessages((prev) => [...prev, userMessage]);
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
            voiceMode: true,
            preferredLanguage: selectedLanguage || 'fr',
          }),
          signal: abortRef.current.signal,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const assistantMessage: VoiceMessage = { role: 'assistant', content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);
        if (session?.user && currentConvId) {
          saveMessage('assistant', data.response, currentConvId);
          if (messages.length === 0) updateConversationTitle(currentConvId, trimmed.slice(0, 50) || 'Dialogue vocal');
        }
        speak(data.response, () => {
          if (userInterruptedRef.current) {
            userInterruptedRef.current = false;
            return;
          }
          if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
          if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
          autoRestartTimeoutRef.current = setTimeout(() => {
            autoRestartTimeoutRef.current = null;
            startRecording();
          }, 600);
          inactivityTimeoutRef.current = setTimeout(() => {
            if (autoRestartTimeoutRef.current) {
              clearTimeout(autoRestartTimeoutRef.current);
              autoRestartTimeoutRef.current = null;
            }
            triggerInactivityRelance();
          }, INACTIVITY_MS);
        });
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
    [loading, messages, session, conversationId, saveMessage, updateConversationTitle, speak, selectedLanguage, triggerInactivityRelance]
  );

  const startRecording = async () => {
    if (typeof window === 'undefined' || !selectedLanguage) return;
    try {
      const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
      if (!SR) {
        return;
      }
      lastVoiceTranscriptRef.current = '';
      setLiveTranscript('');
      voiceChunksRef.current = [];
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch {
        streamRef.current = null;
      }
      if (stream && window.MediaRecorder) {
        const mime = audioCap.preferredMimeType && MediaRecorder.isTypeSupported(audioCap.preferredMimeType)
          ? audioCap.preferredMimeType
          : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const mr = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) voiceChunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          if (voiceChunksRef.current.length === 0) {
            sendVoiceMessage(lastVoiceTranscriptRef.current || '');
            return;
          }
          const blob = new Blob(voiceChunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          const text = lastVoiceTranscriptRef.current?.trim() || '(Message vocal)';
          sendVoiceMessage(text, url);
        };
        mr.start(200);
      }
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = selectedLanguage ? LANG_TO_RECOGNITION[selectedLanguage] : 'fr-FR';
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const r = e.results[e.results.length - 1];
        const t = r?.[0]?.transcript?.trim() ?? '';
        const isFinal = r?.isFinal;
        if (t) {
          lastVoiceTranscriptRef.current = t;
          setLiveTranscript(t);
        }
        if (isFinal) setLiveTranscript('');
      };
      rec.onend = () => {
        if (!mediaRecorderRef.current) {
          if (lastVoiceTranscriptRef.current) sendVoiceMessage(lastVoiceTranscriptRef.current);
          setIsRecording(false);
          return;
        }
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };
      rec.onerror = () => {
        if (mediaRecorderRef.current) {
          try {
            mediaRecorderRef.current.stop();
          } catch {
            streamRef.current?.getTracks().forEach((t) => t.stop());
          }
          mediaRecorderRef.current = null;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (lastVoiceTranscriptRef.current) sendVoiceMessage(lastVoiceTranscriptRef.current);
        setIsRecording(false);
      };
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
  };

  const endConversation = useCallback(() => {
    userInterruptedRef.current = true;
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
      autoRestartTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    setIsAssistantSpeaking(false);
    setIsRecording(false);
  }, []);

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

  const newDialogue = () => {
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleLanguageSelect = useCallback((lang: DialogueLang) => {
    setSelectedLanguage(lang);
    if (typeof window !== 'undefined') localStorage.setItem(DIALOGUE_LANG_KEY, lang);
  }, []);

  const canChat = selectedLanguage !== null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <LanguageSelectModal
        isOpen={!canChat}
        onSelect={handleLanguageSelect}
        title="Choisissez votre langue"
        subtitle="Sélectionnez la langue du dialogue vocal avant de commencer"
      />
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-1 border-b border-slate-200 bg-white/95 px-2 py-2 backdrop-blur sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 active:bg-slate-200 sm:h-10 sm:w-10"
            aria-label="Historique dialogue vocal"
          >
            <History className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="flex flex-col gap-0.5 truncate sm:flex-row sm:items-center sm:gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-800 sm:text-lg">
              <MicVocal className="h-5 w-5 shrink-0 text-yellow-500 sm:h-6 sm:w-6" />
              Dialogue vocal
            </span>
            {canChat && selectedLanguage && (
              <button
                type="button"
                onClick={() => { setSelectedLanguage(null); }}
                className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800 hover:bg-yellow-200"
                title="Changer la langue"
              >
                {LANG_OPTIONS.find((l) => l.id === selectedLanguage)?.flag} {LANG_OPTIONS.find((l) => l.id === selectedLanguage)?.label}
              </button>
            )}
          </h1>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <div className="relative hidden min-w-0 max-w-[5.5rem] md:block md:max-w-none">
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="w-full min-w-0 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
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
          <div className="relative hidden sm:block">
            <Gauge className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <select
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(e.target.value as (typeof SPEECH_SPEED_OPTIONS)[number]['id'])}
              className="w-16 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-7 text-sm text-slate-700 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 md:w-auto"
              title="Vitesse de lecture"
            >
              {SPEECH_SPEED_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {headerRight ?? (!session?.user && status !== 'loading' && (
            <Link href="/login" className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500 text-slate-900 hover:bg-yellow-400 md:hidden" aria-label="Se connecter">
              <LogIn className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </header>

      {/* Sidebar historique (connecté) */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
          <div className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] max-w-full border-r border-slate-200 bg-white pt-safe md:static md:z-0 md:block md:max-w-xs md:flex-1 md:pt-0">
            <div className="flex items-center justify-between border-b border-slate-200 p-3">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <History className="h-4 w-4 shrink-0" />
                Historique vocal
              </span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 md:h-8 md:w-8" aria-label="Fermer">
                <ChevronDown className="h-5 w-5 rotate-90 text-slate-600" />
              </button>
            </div>
            {!session?.user ? (
              <p className="p-4 text-sm text-slate-500">
                <Link href="/login" className="text-yellow-600 hover:underline">Connectez-vous</Link> pour enregistrer vos dialogues vocaux.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={newDialogue}
                  className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  + Nouveau dialogue
                </button>
                {conversationsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Aucun dialogue vocal enregistré.</p>
                ) : (
                  <ul className="mt-2 max-h-96 overflow-y-auto p-2">
                    {conversations.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => loadConversation(c.id)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${conversationId === c.id ? 'bg-yellow-50 text-yellow-800' : 'text-slate-700'}`}
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

      {/* Zone principale : mode appel (comme un coup de fil, pas de file de messages) */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6">
        {(() => {
          const phase = isRecording ? 'listening' : loading ? 'thinking' : isAssistantSpeaking ? 'speaking' : 'idle';
          return (
            <div className="flex w-full max-w-lg flex-col items-center text-center">
              {/* Indicateur central type appel */}
              <div
                className={`mb-4 flex h-28 w-28 items-center justify-center rounded-full transition-all sm:mb-6 sm:h-36 sm:w-36 ${
                  phase === 'listening'
                    ? 'animate-pulse bg-red-500/20 ring-4 ring-red-400/50'
                    : phase === 'thinking'
                      ? 'bg-slate-200 ring-4 ring-slate-300/50'
                      : phase === 'speaking'
                        ? 'bg-yellow-500/20 ring-4 ring-yellow-400/50'
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 ring-4 ring-slate-300/30'
                }`}
              >
                {phase === 'listening' && <Mic className="h-14 w-14 text-red-600 sm:h-16 sm:w-16" />}
                {phase === 'thinking' && <Loader2 className="h-14 w-14 animate-spin text-yellow-600 sm:h-16 sm:w-16" />}
                {(phase === 'speaking' || phase === 'idle') && (
                  <PhoneCall className={`h-14 w-14 text-slate-600 sm:h-16 sm:w-16 ${phase === 'speaking' ? 'text-yellow-600' : ''}`} />
                )}
              </div>

              <h2 className="mb-1 text-lg font-semibold text-slate-800 sm:text-xl">
                {phase === 'idle' && "Appuyez pour parler · Comme un appel"}
                {phase === 'listening' && 'Vous parlez…'}
                {phase === 'thinking' && "L'assistant réfléchit…"}
                {phase === 'speaking' && "L'assistant vous répond"}
              </h2>
              <p className="mb-4 text-sm text-slate-500 sm:mb-6">
                {phase === 'idle' && "Discussion en temps réel : parlez, écoutez la réponse, reprenez la parole."}
                {phase === 'listening' && (liveTranscript || 'Parlez puis arrêtez pour envoyer.')}
                {phase === 'thinking' && 'Réponse vocale dans un instant.'}
                {phase === 'speaking' && 'Réponse à l\'oral, avec corrections si besoin.'}
              </p>

              {/* Dernier échange uniquement (pas toute la conversation) */}
              {messages.length > 0 && (
                <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-left backdrop-blur sm:p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Dernier échange</p>
                  {messages.slice(-2).map((m, i) => (
                    <div key={i} className="flex gap-2">
                      {m.role === 'user' ? (
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                      ) : (
                        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                      )}
                      <p className={`min-w-0 flex-1 text-sm ${m.role === 'user' ? 'text-slate-700' : 'text-slate-600'}`}>
                        {m.content.slice(0, 200)}{m.content.length > 200 ? '…' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!session?.user && (
                <p className="mt-4 text-xs text-slate-500">
                  <Link href="/login" className="text-yellow-600 hover:underline">Connectez-vous</Link> pour enregistrer l&apos;historique.
                </p>
              )}
            </div>
          );
        })()}
      </main>

      {/* Bouton micro ou fallback clavier (iOS Safari) */}
      <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          {!audioCap.speechRecognitionSupported && (
            <>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
                Sur iPhone/iPad, utilisez le clavier ci-dessous pour taper vos messages. La reconnaissance vocale est disponible sur Android (Chrome) ou via l&apos;app native.
              </p>
              <VoiceInputFallback
                onSend={(t) => sendVoiceMessage(t)}
                disabled={!canChat || loading}
                placeholder="Tapez votre message..."
                className="w-full max-w-md"
              />
            </>
          )}
          {audioCap.speechRecognitionSupported && (
            <>
          <button
            type="button"
            onClick={() => {
              if (!canChat) return;
              if (isAssistantSpeaking) {
                userInterruptedRef.current = true;
                if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
                autoRestartTimeoutRef.current = null;
                if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
                setIsAssistantSpeaking(false);
                startRecording();
              } else if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            disabled={!canChat}
            className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 sm:h-24 sm:w-24 ${
              !canChat
                ? 'cursor-not-allowed bg-slate-300 text-slate-500 opacity-70'
                : isRecording
                  ? 'animate-pulse bg-red-500 text-white shadow-red-500/40'
                  : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-yellow-500/30 hover:from-yellow-500 hover:to-yellow-700'
            }`}
            aria-label={isRecording ? 'Arrêter' : isAssistantSpeaking ? 'Interrompre et parler' : 'Parler'}
          >
            {isRecording ? <MicOff className="h-10 w-10 sm:h-12 sm:w-12" /> : <MicVocal className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.5} />}
          </button>
          {(isRecording || isAssistantSpeaking || loading) && (
            <button
              type="button"
              onClick={endConversation}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              aria-label="Terminer la conversation"
            >
              <PhoneOff className="h-4 w-4" />
              Terminer la conversation
            </button>
          )}
          <p className="text-center text-sm text-slate-500">
            {isRecording && 'Parlez… puis arrêtez pour envoyer'}
            {isAssistantSpeaking && 'Appuyez pour interrompre et reprendre la parole'}
            {!isRecording && !isAssistantSpeaking && !loading && 'Comme un appel : parlez, écoutez, reprenez'}
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
