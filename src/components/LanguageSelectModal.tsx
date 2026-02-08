'use client';

import { Languages } from 'lucide-react';

export type DialogueLang = 'fr' | 'en' | 'mg';

export const LANG_OPTIONS: { id: DialogueLang; label: string; flag: string; desc: string }[] = [
  { id: 'fr', label: 'Français', flag: '🇫🇷', desc: 'Pratiquer le français' },
  { id: 'en', label: 'English', flag: '🇬🇧', desc: 'Practice English' },
  { id: 'mg', label: 'Malagasy', flag: '🇲🇬', desc: 'Mianatra ny teny malagasy' },
];

type LanguageSelectModalProps = {
  isOpen: boolean;
  onSelect: (lang: DialogueLang) => void;
  title?: string;
  subtitle?: string;
};

export default function LanguageSelectModal({
  isOpen,
  onSelect,
  title = 'Choisissez votre langue',
  subtitle = 'Sélectionnez la langue du dialogue avant de commencer',
}: LanguageSelectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-modal-title"
      aria-describedby="lang-modal-desc"
    >
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        onClick={() => {}}
        aria-hidden
      />
      <div className="relative ilo w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="border-b border-slate-100 bg-gradient-to-br from-amber-50 to-slate-50 px-6 py-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/20">
            <Languages className="h-7 w-7 text-amber-600" />
          </div>
          <h2 id="lang-modal-title" className="text-center text-lg font-semibold text-slate-800">
            {title}
          </h2>
          <p id="lang-modal-desc" className="mt-1 text-center text-sm text-slate-600">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {LANG_OPTIONS.map(({ id, label, flag, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="flex ilo items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition-all hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md active:scale-[0.99]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                {flag}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block font-medium text-slate-800">{label}</span>
                <span className="block text-sm text-slate-500">{desc}</span>
              </div>
              <span className="shrink-0 text-slate-400">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
