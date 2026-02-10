'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  FileQuestion,
  User,
  Bot,
  Loader2,
  PhoneOff,
  Briefcase,
  Clock,
  Timer,
} from 'lucide-react';

const INTERVIEW_DURATION_SEC = 15 * 60; // 15 minutes
import InterviewSelectModal, {
  type InterviewConfig,
  type InterviewTech,
  ROLE_OPTIONS,
} from '@/components/InterviewSelectModal';
import VoiceInputFallback from '@/components/VoiceInputFallback';
import { useAudioCapabilities } from '@/hooks/useAudioCapabilities';

const TECH_LABELS: Partial<Record<InterviewTech, string>> = {
  react: 'React',
  next: 'Next.js',
  angular: 'Angular',
  vue: 'Vue.js',
  'php-laravel': 'PHP/Laravel',
  node: 'Node.js',
  nest: 'Nest.js',
  express: 'Express',
  fastapi: 'FastAPI',
  'ia-base': 'IA/ML',
};

type InterviewMessage = { role: 'user' | 'assistant'; content: string };

type VocalInterviewProps = { headerRight?: React.ReactNode };

function getVoicesForLang(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const fr = voices.filter((v) => v.lang.startsWith('fr'));
  return fr.find((v) => /paul|claire|male|female|nicolas|marie/i.test(v.name)) || fr[0] || voices[0] || null;
}

export default function VocalInterview({ headerRight }: VocalInterviewProps) {
  const audioCap = useAudioCapabilities();
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const lastVoiceTranscriptRef = useRef<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const autoRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInterruptedRef = useRef(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  const INACTIVITY_MS = 2 * 60 * 1000; // 2 minutes
  const [timeLeft, setTimeLeft] = useState<number>(INTERVIEW_DURATION_SEC);
  const [timerStarted, setTimerStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = () => setVoice(getVoicesForLang('fr-FR'));
    load();
    if (typeof window !== 'undefined' && window.speechSynthesis?.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!timerStarted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setInterviewEnded(true);
          if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerStarted]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text?.trim() || typeof window === 'undefined' || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      setIsAssistantSpeaking(true);
      const u = new SpeechSynthesisUtterance(text.trim());
      u.lang = 'fr-FR';
      u.rate = 1;
      if (voice) u.voice = voice;
      u.onend = () => {
        setIsAssistantSpeaking(false);
        onEnd?.();
      };
      u.onerror = () => {
        setIsAssistantSpeaking(false);
        onEnd?.();
      };
      window.speechSynthesis.speak(u);
    },
    [voice]
  );

  const triggerInactivityRelance = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        role: interviewConfig?.role ?? 'frontend',
        techs: interviewConfig?.techs ?? [],
        inactivityRelance: true,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.response && interviewConfig) {
          setMessages((prev) => [...prev, { role: 'assistant', content: d.response }]);
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
  }, [messages, interviewConfig, speak]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !interviewConfig || interviewEnded) return;

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      if (!timerStarted) setTimerStarted(true);

      const userMessage: InterviewMessage = { role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const res = await fetch('/api/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            role: interviewConfig.role,
            techs: interviewConfig.techs,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const assistantMessage: InterviewMessage = { role: 'assistant', content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);
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
          inactivityTimeoutRef.current = setTimeout(triggerInactivityRelance, INACTIVITY_MS);
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "Désolé, une erreur est survenue. Vérifiez que GROQ_API_KEY est configurée." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, interviewConfig, speak, interviewEnded, timerStarted, triggerInactivityRelance]
  );

  const startRecording = useCallback(async () => {
    if (typeof window === 'undefined' || !interviewConfig || interviewEnded) return;
    if (!timerStarted) setTimerStarted(true);
    try {
      const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
      if (!SR) return;
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
            sendMessage(lastVoiceTranscriptRef.current || '');
            return;
          }
          sendMessage(lastVoiceTranscriptRef.current?.trim() || '(Message vocal)');
        };
        mr.start(200);
      }
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'fr-FR';
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const r = e.results[e.results.length - 1];
        const t = r?.[0]?.transcript?.trim() ?? '';
        if (t) {
          lastVoiceTranscriptRef.current = t;
          setLiveTranscript(t);
        }
        if (r?.isFinal) setLiveTranscript('');
      };
      rec.onend = () => {
        if (!mediaRecorderRef.current) {
          if (lastVoiceTranscriptRef.current) sendMessage(lastVoiceTranscriptRef.current);
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
        if (lastVoiceTranscriptRef.current) sendMessage(lastVoiceTranscriptRef.current);
        setIsRecording(false);
      };
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch {
      alert('Reconnaissance vocale non disponible.');
    }
  }, [interviewConfig, sendMessage, interviewEnded, timerStarted, audioCap.preferredMimeType]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const endConversation = useCallback(() => {
    userInterruptedRef.current = true;
    setInterviewEnded(true);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
      autoRestartTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
        mediaRecorderRef.current = null;
      }
      mediaRecorderRef.current = null;
    }
    setIsAssistantSpeaking(false);
    setIsRecording(false);
  }, []);

  const handleConfigSelect = useCallback((config: InterviewConfig) => {
    setInterviewConfig(config);
    setTimeLeft(INTERVIEW_DURATION_SEC);
    setTimerStarted(false);
    setInterviewEnded(false);
  }, []);

  const changeConfig = useCallback(() => {
    setInterviewConfig(null);
    setMessages([]);
    setTimeLeft(INTERVIEW_DURATION_SEC);
    setTimerStarted(false);
    setInterviewEnded(false);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const canChat = interviewConfig !== null;

  const configLabel = interviewConfig
    ? `${ROLE_OPTIONS.find((r) => r.id === interviewConfig.role)?.label} · ${interviewConfig.techs.map((t) => TECH_LABELS[t] ?? t).join(', ')}`
    : '';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 text-slate-900">
      <InterviewSelectModal isOpen={!canChat} onConfirm={handleConfigSelect} />

      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-md shadow-yellow-500/20"
          >
            <FileQuestion className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Entretien vocal recrutement</h1>
            <p className="flex items-center gap-2 text-xs text-slate-600">
              {canChat && interviewConfig && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={changeConfig}
                    className="rounded-lg bg-yellow-100 px-2 py-0.5 font-medium text-yellow-800 transition-colors hover:bg-yellow-200"
                    title="Changer le poste"
                  >
                    <Briefcase className="inline h-3.5 w-3.5" /> {configLabel}
                  </motion.button>
                  {timerStarted && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 font-mono text-sm font-semibold ${
                        timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Timer className="h-3.5 w-3.5" />
                      {formatTime(timeLeft)}
                    </motion.span>
                  )}
                </>
              )}
              {!canChat && 'Choisissez un poste pour commencer'}
            </p>
          </div>
        </div>
        {headerRight}
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6">
        <AnimatePresence mode="wait">
          {interviewEnded ? (
            <motion.div
              key="ended"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-md flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100"
              >
                <Clock className="h-12 w-12 text-yellow-600" />
              </motion.div>
              <h2 className="mb-2 text-xl font-bold text-slate-800">Entretien terminé</h2>
              <p className="mb-4 text-slate-600">
                Les 15 minutes sont écoulées. Félicitations pour votre participation !
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={changeConfig}
                className="rounded-xl bouton-ilo bg-yellow-600 px-6 py-2.5 font-medium text-white shadow-lg hover:bg-yellow-500"
              >
                Nouvel entretien
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-lg flex-col items-center text-center"
            >
              {(() => {
                const phase = isRecording ? 'listening' : loading ? 'thinking' : isAssistantSpeaking ? 'speaking' : 'idle';
                return (
                  <>
                    <motion.div
                      key={phase}
                      initial={{ scale: 0.9, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className={`mb-4 flex h-28 w-28 items-center justify-center rounded-full transition-all sm:mb-6 sm:h-36 sm:w-36 ${
                        phase === 'listening'
                          ? 'animate-pulse bg-red-500/20 ring-4 ring-red-400/50 shadow-lg shadow-red-500/20'
                          : phase === 'thinking'
                            ? 'bg-slate-200 ring-4 ring-slate-300/50'
                            : phase === 'speaking'
                              ? 'bg-yellow-500/20 ring-4 ring-yellow-400/50 shadow-lg shadow-yellow-500/20'
                              : 'bg-gradient-to-br from-slate-100 to-slate-200 ring-4 ring-slate-300/30'
                      }`}
                    >
                      {phase === 'listening' && <Mic className="h-14 w-14 text-red-600 sm:h-16 sm:w-16" />}
                      {phase === 'thinking' && <Loader2 className="h-14 w-14 animate-spin text-yellow-600 sm:h-16 sm:w-16" />}
                      {(phase === 'speaking' || phase === 'idle') && (
                        <FileQuestion className={`h-14 w-14 text-slate-600 sm:h-16 sm:w-16 ${phase === 'speaking' ? 'text-yellow-600' : ''}`} />
                      )}
                    </motion.div>

                    <motion.h2
                      key={`h2-${phase}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-1 text-lg font-semibold text-slate-800 sm:text-xl"
                    >
                      {phase === 'idle' && 'Appuyez pour répondre au recruteur'}
                      {phase === 'listening' && 'Vous parlez…'}
                      {phase === 'thinking' && "Le recruteur prépare sa question…"}
                      {phase === 'speaking' && 'Le recruteur vous pose une question'}
                    </motion.h2>
                    <p className="mb-4 text-sm text-slate-500 sm:mb-6">
                      {phase === 'idle' && 'Simulez un entretien technique vocal. Parlez, écoutez la question, répondez.'}
                      {phase === 'listening' && (liveTranscript || 'Parlez puis arrêtez pour envoyer.')}
                      {phase === 'thinking' && 'Question dans un instant.'}
                      {phase === 'speaking' && 'Écoutez la question du recruteur.'}
                    </p>

                    {messages.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-2 rounded-xl border border-slate-200/80 bg-white/90 p-4 text-left shadow-sm backdrop-blur"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Dernier échange</p>
                        {messages.slice(-2).map((m, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-2"
                          >
                            {m.role === 'user' ? (
                              <User className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                            ) : (
                              <Bot className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                            )}
                            <p className={`min-w-0 flex-1 text-sm ${m.role === 'user' ? 'text-slate-700' : 'text-slate-600'}`}>
                              {m.content.slice(0, 200)}{m.content.length > 200 ? '…' : ''}
                            </p>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="shrink-0 border-t border-slate-200/80 bg-white/95 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          {!audioCap.speechRecognitionSupported && (
            <>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
                Sur iPhone/iPad, utilisez le clavier ci-dessous pour taper vos réponses. La reconnaissance vocale est disponible sur Android (Chrome) ou via l&apos;app native.
              </p>
              <VoiceInputFallback
                onSend={(t) => sendMessage(t)}
                disabled={!canChat || loading || interviewEnded}
                placeholder="Tapez votre réponse au recruteur..."
                className="w-full max-w-md"
              />
            </>
          )}
          {audioCap.speechRecognitionSupported && (
            <>
          <motion.button
            whileHover={!interviewEnded && canChat ? { scale: 1.05 } : {}}
            whileTap={!interviewEnded && canChat ? { scale: 0.95 } : {}}
            type="button"
            onClick={() => {
              if (!canChat || interviewEnded) return;
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
            disabled={!canChat || interviewEnded}
            className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all sm:h-24 sm:w-24 ${
              !canChat
                ? 'cursor-not-allowed bg-slate-300 text-slate-500 opacity-70'
                : isRecording
                  ? 'animate-pulse bg-red-500 text-white shadow-red-500/40'
                  : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-yellow-500/30 hover:from-yellow-600 hover:to-yellow-700'
            }`}
            aria-label={isRecording ? 'Arrêter' : isAssistantSpeaking ? 'Interrompre et répondre' : 'Répondre'}
          >
            {isRecording ? <MicOff className="h-10 w-10 sm:h-12 sm:w-12" /> : <Mic className="h-10 w-10 sm:h-12 sm:w-12" />}
          </motion.button>
          {(isRecording || isAssistantSpeaking || loading) && (
            <button
              type="button"
              onClick={endConversation}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              aria-label="Terminer l'entretien"
            >
              <PhoneOff className="h-4 w-4" />
              Terminer l&apos;entretien
            </button>
          )}
          <p className="text-center text-sm text-slate-500">
            {interviewEnded ? 'Entretien terminé' : 'Entraînez-vous aux entretiens techniques · 15 minutes · Réponses vocales'}
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
