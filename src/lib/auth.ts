import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email et mot de passe',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = getDatabase();
        const row = db.prepare('SELECT id, email, name, image, password FROM users WHERE email = ?').get(credentials.email) as
          | { id: string; email: string; name: string | null; image: string | null; password: string | null }
          | undefined;
        if (!row?.password) return null;
        const ok = await bcrypt.compare(credentials.password, row.password);
        if (!ok) return null;
        return { id: row.id, email: row.email, name: row.name ?? undefined, image: row.image ?? undefined };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return !!user?.email;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
      }
      return session;
    },
    async jwt({ token, user, profile }) {
      if (user?.id) token.sub = user.id;
      if (!token.sub && (profile as { sub?: string })?.sub) token.sub = (profile as { sub: string }).sub;
      if (!token.sub && user?.email) token.sub = user.email;
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
