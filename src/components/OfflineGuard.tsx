'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Affiche un écran bloquant "Connexion requise" quand l'utilisateur est hors ligne.
 * L'application ne fonctionne pas sans connexion.
 */
export default function OfflineGuard({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  if (!online) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1e3a5f] p-6 text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <WifiOff className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-xl font-semibold">Connexion requise</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-white/80">
          IAlangue a besoin d&apos;une connexion internet pour fonctionner. Vérifiez votre réseau et réessayez.
        </p>
        <p className="mt-6 text-xs text-white/60">
          L&apos;application se réactivera automatiquement lorsque la connexion sera rétablie.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
