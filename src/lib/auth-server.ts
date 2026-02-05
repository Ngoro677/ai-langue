import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';

/**
 * Récupère l'ID utilisateur depuis le JWT de la requête.
 * Utilise getToken() avec la requête pour que les Route Handlers (App Router)
 * lisent correctement le cookie de session.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: authOptions.secret,
  });
  if (!token?.sub) return null;
  return String(token.sub);
}
