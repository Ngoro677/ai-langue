import { getDatabase } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { id: conversationId } = await params;
  const db = getDatabase();
  const conv = db.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').get(conversationId, userId);
  if (!conv) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }
  const body = await request.json();
  const role = body.role === 'assistant' ? 'assistant' : 'user';
  const content = typeof body.content === 'string' ? body.content : '';
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(conversationId, role, content);
  return NextResponse.json({ ok: true });
}
