'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'authenticated') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(data.email ?? email.trim().toLowerCase())}`);
      router.refresh();
    } catch {
      setError('Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-8 pt-safe">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 ilo bg-white p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-slate-800">Inscription</h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Créez un compte avec votre email
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-slate-300">
              Nom (optionnel)
            </label>
            <div className="relative">
              <User className="input-ilo-element" />
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full input-ilo"
                placeholder="Votre nom"
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="input-ilo-element" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full input-ilo"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-300">
              Mot de passe (min. 6 caractères)
            </label>
            <div className="relative">
              <Lock className="input-ilo-element" />
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full input-ilo"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex bouton-ilo w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 py-2.5 font-medium text-white hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
            S&apos;inscrire
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-amber-500 hover:text-amber-400">
            Se connecter
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-400">Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  );
}
