'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Code2, ArrowLeft, Clock } from 'lucide-react';

export type InterviewRole = 'frontend' | 'backend' | 'fullstack' | 'ia';

export type InterviewTech =
  | 'react' | 'next' | 'angular' | 'vue'
  | 'php-laravel' | 'node' | 'nest' | 'express' | 'fastapi'
  | 'ia-base';

export const ROLE_OPTIONS: { id: InterviewRole; label: string; icon: string; desc: string }[] = [
  { id: 'frontend', label: 'Frontend', icon: '🎨', desc: 'React, Next.js, Angular, Vue.js' },
  { id: 'backend', label: 'Backend', icon: '⚙️', desc: 'PHP/Laravel, Node, Nest, Express, FastAPI' },
  { id: 'fullstack', label: 'Fullstack', icon: '🔗', desc: 'Combine frontend + backend' },
  { id: 'ia', label: 'Intelligence Artificielle', icon: '🤖', desc: 'ML, Deep Learning, LLM' },
];

const FRONTEND_TECHS: { id: InterviewTech; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'next', label: 'Next.js' },
  { id: 'angular', label: 'Angular' },
  { id: 'vue', label: 'Vue.js' },
];

const BACKEND_TECHS: { id: InterviewTech; label: string }[] = [
  { id: 'php-laravel', label: 'PHP (Laravel)' },
  { id: 'node', label: 'Node.js' },
  { id: 'nest', label: 'Nest.js' },
  { id: 'express', label: 'Express' },
  { id: 'fastapi', label: 'FastAPI' },
];

const FULLSTACK_FRONT: { id: InterviewTech; label: string }[] = FRONTEND_TECHS;
const FULLSTACK_BACK: { id: InterviewTech; label: string }[] = BACKEND_TECHS;

const IA_TECHS: { id: InterviewTech; label: string }[] = [
  { id: 'ia-base', label: 'Bases (ML, Deep Learning, LLM)' },
];

export type InterviewConfig = {
  role: InterviewRole;
  techs: InterviewTech[];
};

type InterviewSelectModalProps = {
  isOpen: boolean;
  onConfirm: (config: InterviewConfig) => void;
};

export default function InterviewSelectModal({ isOpen, onConfirm }: InterviewSelectModalProps) {
  const [step, setStep] = useState<'role' | 'tech'>('role');
  const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);
  const [selectedFrontTech, setSelectedFrontTech] = useState<InterviewTech | null>(null);
  const [selectedBackTech, setSelectedBackTech] = useState<InterviewTech | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: InterviewRole) => {
    setSelectedRole(role);
    setSelectedFrontTech(null);
    setSelectedBackTech(null);
    if (role === 'ia') {
      onConfirm({ role: 'ia', techs: ['ia-base'] });
      setStep('role');
      setSelectedRole(null);
      return;
    }
    setStep('tech');
  };

  const handleBack = () => {
    setStep('role');
    setSelectedRole(null);
    setSelectedFrontTech(null);
    setSelectedBackTech(null);
  };

  const handleConfirm = () => {
    if (!selectedRole) return;
    if (selectedRole === 'frontend' && selectedFrontTech) {
      onConfirm({ role: 'frontend', techs: [selectedFrontTech] });
    } else if (selectedRole === 'backend' && selectedBackTech) {
      onConfirm({ role: 'backend', techs: [selectedBackTech] });
    } else if (selectedRole === 'fullstack' && selectedFrontTech && selectedBackTech) {
      onConfirm({ role: 'fullstack', techs: [selectedFrontTech, selectedBackTech] });
    } else return;
    setStep('role');
    setSelectedRole(null);
    setSelectedFrontTech(null);
    setSelectedBackTech(null);
  };

  const canConfirm =
    (selectedRole === 'frontend' && selectedFrontTech) ||
    (selectedRole === 'backend' && selectedBackTech) ||
    (selectedRole === 'fullstack' && selectedFrontTech && selectedBackTech);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 backdrop-blur-[2px]"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative ilo w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/50"
      >
        <div className="border-b border-slate-100 bg-gradient-to-br from-yellow-500/5 via-white to-slate-50/80 px-6 py-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/25"
          >
            <Briefcase className="h-8 w-8 text-white" />
          </motion.div>
          <div className="flex items-center justify-center gap-2 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Entretien 15 min</span>
          </div>
          <h2 id="interview-modal-title" className="mt-2 text-center text-xl font-bold text-slate-800">
            {step === 'role' ? 'Choisissez le type de poste' : 'Choisissez vos technologies'}
          </h2>
          <p className="mt-1 text-center text-sm text-slate-600">
            {step === 'role'
              ? 'Sélectionnez le poste pour lequel vous préparez l\'entretien'
              : selectedRole === 'frontend'
                ? 'Frontend'
                : selectedRole === 'backend'
                  ? 'Backend'
                  : 'Fullstack : frontend + backend'}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div
              key="roles"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {ROLE_OPTIONS.map((r, i) => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all hover:border-yellow-300 hover:shadow-md hover:shadow-yellow-500/10"
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">{r.icon}</span>
                  <span className="font-semibold text-slate-800">{r.label}</span>
                  <span className="text-xs text-slate-500">{r.desc}</span>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="techs"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <motion.button
                whileHover={{ x: -2 }}
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-yellow-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </motion.button>

              {selectedRole === 'frontend' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Framework frontend</p>
                  <div className="flex flex-wrap gap-2">
                    {FRONTEND_TECHS.map((t) => (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setSelectedFrontTech(t.id)}
                        className={`rounded-xl ilo border px-4 py-2.5 text-sm font-medium transition-all ${
                          selectedFrontTech === t.id
                            ? 'border-yellow-500 bg-yellow-500 text-white shadow-md'
                            : 'border-slate-200 bg-slate-50 hover:border-yellow-300 hover:bg-yellow-50/50'
                        }`}
                      >
                        {t.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {selectedRole === 'backend' && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Stack backend</p>
                  <div className="flex flex-wrap gap-2">
                    {BACKEND_TECHS.map((t) => (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setSelectedBackTech(t.id)}
                        className={`rounded-xl ilo border px-4 py-2.5 text-sm font-medium transition-all ${
                          selectedBackTech === t.id
                            ? 'border-yellow-500 bg-yellow-500 text-white shadow-md'
                            : 'border-slate-200 bg-slate-50 hover:border-yellow-300 hover:bg-yellow-50/50'
                        }`}
                      >
                        {t.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {selectedRole === 'fullstack' && (
                <>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Frontend</p>
                    <div className="flex flex-wrap gap-2">
                      {FULLSTACK_FRONT.map((t) => (
                        <motion.button
                          key={t.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => setSelectedFrontTech(t.id)}
                          className={`rounded-xl ilo border px-4 py-2.5 text-sm font-medium transition-all ${
                            selectedFrontTech === t.id
                              ? 'border-yellow-500 bg-yellow-500 text-white shadow-md'
                              : 'border-slate-200 bg-slate-50 hover:border-yellow-300 hover:bg-yellow-50/50'
                          }`}
                        >
                          {t.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Backend</p>
                    <div className="flex flex-wrap gap-2">
                      {FULLSTACK_BACK.map((t) => (
                        <motion.button
                          key={t.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => setSelectedBackTech(t.id)}
                          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                            selectedBackTech === t.id
                              ? 'border-yellow-500 bg-yellow-500 text-white shadow-md'
                              : 'border-slate-200 bg-slate-50 hover:border-yellow-300 hover:bg-yellow-50/50'
                          }`}
                        >
                          {t.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {step === 'tech' && canConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-slate-100 bg-slate-50/50 p-4"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 py-3.5 font-semibold text-white shadow-lg shadow-yellow-500/25 transition hover:from-yellow-600 hover:to-yellow-700"
            >
              <Code2 className="h-5 w-5" />
              Démarrer l&apos;entretien (15 min)
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
