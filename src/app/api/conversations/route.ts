import { getDatabase } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ conversations: [] });
  }
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, title, created_at FROM conversations
    WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
  `);
  const rows = stmt.all(userId) as { id: string; title: string; created_at: number }[];
  return NextResponse.json({ conversations: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const session = await getServerSession(authOptions);
  const db = getDatabase();
  const id = randomUUID();
  const insert = db.prepare(`
    INSERT INTO conversations (id, user_id, title) VALUES (?, ?, 'Nouvelle conversation')
  `);
  insert.run(id, userId);
  if (session?.user?.email) {
    const userInsert = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, name, image) VALUES (?, ?, ?, ?)
    `);
    userInsert.run(userId, session.user.email, session.user.name ?? null, session.user.image ?? null);
  }
  return NextResponse.json({ id, title: 'Nouvelle conversation' });
}
