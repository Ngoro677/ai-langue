'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, Clock } from 'lucide-react';

const OTP_LENGTH = 6;
const INITIAL_SECONDS = 60;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setSecondsLeft(INITIAL_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  useEffect(() => {
    if (!email) {
      router.replace('/register');
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError('');
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const otpValue = digits.join('');
  const isComplete = otpValue.length === OTP_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || loading || secondsLeft <= 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Code invalide ou expiré.');
        setLoading(false);
        return;
      }
      router.push('/login?verified=1');
      router.refresh();
    } catch {
      setError('Une erreur est survenue.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown || !email) return;
    setResendCooldown(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Impossible de renvoyer le code.');
      } else {
        startTimer();
      }
    } catch {
      setError('Une erreur est survenue.');
    }
    setTimeout(() => setResendCooldown(false), 30000);
  };

  if (!email) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-8 pt-safe">
      <div className="w-full max-w-md ilo border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600">
            <Mail className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-slate-800">Vérification OTP</h1>
        <p className="mb-4 text-center text-sm text-slate-500">
          Entrez le code à 6 chiffres reçu par email
        </p>
        <p className="mb-4 truncate text-center text-xs text-slate-400">{email}</p>

        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
            <Clock className="h-4 w-4" />
            <span>Expiration dans : {timeStr}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg ilo border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Code OTP</label>
            <div
              className="flex justify-center gap-2"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-11 rounded-lg border border-slate-300 text-center text-lg font-semibold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 sm:w-12"
                  aria-label={`Chiffre ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!isComplete || loading || secondsLeft <= 0}
            className="flex bouton-ilo w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 py-2.5 font-medium text-white hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : null}
            Valider
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown || secondsLeft > 0}
            className="font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Renvoyer le code OTP
          </button>
        </p>
        <p className="mt-2 text-center">
          <Link
            href="/login"
            className="text-sm text-red-600 underline decoration-dashed hover:text-red-700"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
