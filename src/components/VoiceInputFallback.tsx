'use client';

import { useState } from 'react';
import { Keyboard, Send } from 'lucide-react';

type VoiceInputFallbackProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

/** Fallback texte quand la reconnaissance vocale n'est pas supportée (ex. iOS Safari) */
export default function VoiceInputFallback({
  onSend,
  disabled,
  placeholder = 'Tapez votre message...',
  className = '',
}: VoiceInputFallbackProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const t = text.trim();
    if (t && !disabled) {
      onSend(t);
      setText('');
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
        <Keyboard className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder-slate-400 outline-none disabled:opacity-60"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
        aria-label="Envoyer"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
