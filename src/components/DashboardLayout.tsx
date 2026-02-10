'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  HelpCircle,
  LogIn,
  UserPlus,
  LogOut,
  Star,
  Image as ImageIcon,
  FileStack,
  Info,
  ChevronDown,
  X,
  User,
  MicVocal,
  MessageCircleCode,
  FileQuestion,
} from 'lucide-react';
import LanguageChat from '@/components/LanguageChat';
import VoiceDialogue from '@/components/VoiceDialogue';
import MessageConversation from '@/components/MessageConversation';
import VocalInterview from '@/components/VocalInterview';

type NavView = 'conversation' | 'dialogue' | 'chat' | 'faq' | 'users' | 'help';

const leftNavItems: { icon: typeof FileText; label: string; view: NavView }[] = [
  { icon: MessageCircleCode, label: 'Dialogue message', view: 'conversation' },
  { icon: MicVocal, label: 'Dialogue vocal', view: 'dialogue' },
  { icon: MessageSquare, label: 'Chat', view: 'chat' },
  { icon: FileQuestion, label: 'Questions fréquentes', view: 'faq' },
  { icon: Users, label: 'Utilisateurs', view: 'users' },
  { icon: HelpCircle, label: 'Aide', view: 'help' },
];

function ProfilePanelContent({
  session,
  status,
  onClose,
}: {
  session: ReturnType<typeof useSession>['data'];
  status: string;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="border-b border-slate-200 p-4">
        {status === 'loading' ? (
          <div className="h-20 animate-pulse rounded-lg bg-slate-200" />
        ) : session?.user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0">
                {session.user.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-14 w-14 ilo rounded-full bg-slate-300 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        const fallback = parent?.querySelector('[data-avatar-fallback]');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                    <div data-avatar-fallback className="absolute ilo inset-0 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1e3a5f] text-xl font-semibold text-white" aria-hidden>
                      {(session.user.name ?? session.user.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="flex h-14 w-14 items-center ilo justify-center rounded-full bg-[#1e3a5f] text-xl font-semibold text-white">
                    {(session.user.name ?? session.user.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {session.user.name ?? session.user.email ?? 'Utilisateur'}
                </p>
                <p className="text-sm text-slate-500">Membre</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { signOut(); onClose?.(); }}
              className="mt-3 bouton-ilo flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Connectez-vous pour enregistrer vos conversations.</p>
            <Link
              href="/login"
              onClick={onClose}
              className="flex bouton-ilo w-full items-center justify-center gap-2 rounded-lg bg-yellow-600 py-2.5 text-sm font-medium text-white hover:bg-amber-400"
            >
              <LogIn className="h-4 w-4 text-white" />
              Se connecter
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex bouton-ilo w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus className="h-4 w-4" />
              S&apos;inscrire
            </Link>
          </div>
        )}
      </div>
      {session?.user && (
        <div className="flex-1 overflow-y-auto p-2">
          <button type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-100">
            <span className="flex items-center gap-2 text-slate-700">
              <Star className="h-4 w-4 text-amber-500" />
              Messages étoilés
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-100">
            <span className="flex items-center gap-2 text-slate-700">
              <ImageIcon className="h-4 w-4" />
              Médias
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-100">
            <span className="flex items-center gap-2 text-slate-700">
              <FileStack className="h-4 w-4" />
              Fichiers et documents
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-100">
            <span className="flex items-center gap-2 text-slate-700">
              <Info className="h-4 w-4" />
              Informations
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      )}
    </>
  );
}

const VALID_VIEWS: NavView[] = ['chat', 'conversation', 'dialogue', 'faq'];

function getViewFromUrl(): NavView {
  if (typeof window === 'undefined') return 'chat';
  const v = new URLSearchParams(window.location.search).get('view');
  if (v && VALID_VIEWS.includes(v as NavView)) return v as NavView;
  return 'chat';
}

export default function DashboardLayout() {
  const { data: session, status } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeView, setActiveView] = useState<NavView>(() => getViewFromUrl());

  useEffect(() => {
    const handler = () => setActiveView(getViewFromUrl());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const setActiveViewAndUrl = (view: NavView) => {
    setActiveView(view);
    const params = new URLSearchParams(window.location.search);
    if (VALID_VIEWS.includes(view)) {
      params.set('view', view);
    } else {
      params.delete('view');
    }
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  };

  const mobileProfileTrigger = (
    <div className="flex items-center md:hidden">
      <button
        type="button"
        onClick={() => setProfileOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 hover:bg-slate-100"
        aria-label={profileOpen ? 'Fermer le profil' : 'Ouvrir le profil'}
        aria-expanded={profileOpen}
      >
        {status === 'loading' ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
        ) : session?.user ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#1e3a5f] text-sm font-semibold text-white">
              {session.user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                (session.user.name ?? session.user.email ?? '?').charAt(0).toUpperCase()
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
            <User className="h-4 w-4" />
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="flex h-dvh max-h-screen w-full min-h-0 bg-[#1e3a5f] text-slate-100">
      {/* Barre latérale gauche - icônes */}
      <aside className="flex w-16 shrink-0 flex-col items-center border-r border-slate-700/50 bg-slate-900/90 pt-safe">
        <div className="flex h-14 w-full items-center justify-center border-b border-slate-700/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="IAlangue"
            className="h-9 w-9 rounded-full object-cover"
            width={36}
            height={36}
          />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1 py-3">
          {leftNavItems.map(({ icon: Icon, label, view }) => {
            const isActive = activeView === view;
            const isDialogue = view === 'dialogue';
            const isConversation = view === 'conversation';
            const isChat = view === 'chat';
            const isFaq = view === 'faq';
            const isSwitchable = isDialogue || isConversation || isChat || isFaq;

            return (
              <div key={view} className="group relative flex justify-center">
                {isSwitchable ? (
                  <button
                    type="button"
                    onClick={() => setActiveViewAndUrl(view)}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    aria-label={label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-yellow-600" />
                    )}
                  </button>
                ) : (
                  <Link
                    href="#"
                    className={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    aria-label={label}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-yellow-600" />
                    )}
                  </Link>
                )}
                {/* Tooltip professionnel au survol */}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 min-w-[7rem] -translate-y-1/2 scale-95 rounded-lg bg-slate-800 px-3 py-2 text-center text-sm font-medium text-slate-100 shadow-xl ring-1 ring-slate-700/50 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 invisible group-hover:visible"
                >
                  {label}
                  <span
                    className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-800"
                    aria-hidden
                  />
                </span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Zone centrale - Chat, Dialogue message, Dialogue vocal ou Entretien vocal */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-l-2xl bg-slate-100 text-slate-900 shadow-xl">
        {activeView === 'dialogue' ? (
          <VoiceDialogue headerRight={mobileProfileTrigger} />
        ) : activeView === 'conversation' ? (
          <MessageConversation headerRight={mobileProfileTrigger} />
        ) : activeView === 'faq' ? (
          <VocalInterview headerRight={mobileProfileTrigger} />
        ) : (
          <LanguageChat headerRight={mobileProfileTrigger} />
        )}
      </section>

      {/* Overlay profil mobile (toggle) */}
      {profileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setProfileOpen(false)}
            aria-hidden
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,90vw)] flex-col border-l border-slate-200 bg-white shadow-xl md:hidden"
            role="dialog"
            aria-label="Profil"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="font-medium text-slate-800">Profil</span>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ProfilePanelContent session={session} status={status} onClose={() => setProfileOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* Barre latérale droite - Profil (desktop) */}
      <aside className="hidden w-72 shrink-0 flex-col border-l border-slate-700/30 bg-slate-100 text-slate-800 shadow-xl md:flex">
        <ProfilePanelContent session={session} status={status} />
      </aside>
    </div>
  );
}
