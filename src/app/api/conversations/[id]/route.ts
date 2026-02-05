import { getDatabase } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const db = getDatabase();
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, userId);
  if (!conv) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }
  const messages = db.prepare('SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(id) as { id: number; role: string; content: string; created_at: number }[];
  return NextResponse.json({ conversation: conv, messages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const title = typeof body.title === 'string' ? body.title : undefined;
  if (!title) {
    return NextResponse.json({ error: 'title requis' }, { status: 400 });
  }
  const db = getDatabase();
  const result = db.prepare('UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?').run(title, id, userId);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
