import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
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
    signIn: '/',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
