import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body as { email?: string; otp?: string };
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const otpTrim = typeof otp === 'string' ? otp.replace(/\s/g, '') : '';

    if (!emailTrim || !otpTrim || otpTrim.length !== 6) {
      return NextResponse.json({ error: 'Email et code OTP à 6 chiffres requis' }, { status: 400 });
    }

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const row = db.prepare(
      'SELECT email, name, password_hash FROM pending_registrations WHERE email = ? AND otp = ? AND expires_at > ?'
    ).get(emailTrim, otpTrim, now) as { email: string; name: string | null; password_hash: string } | undefined;

    if (!row) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré. Demandez un nouveau code.' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    db.prepare('INSERT INTO users (id, email, name, image, password) VALUES (?, ?, ?, ?, ?)').run(
      id,
      row.email,
      row.name,
      null,
      row.password_hash
    );
    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(emailTrim);

    return NextResponse.json({ ok: true, message: 'Compte créé avec succès' });
  } catch (e) {
    console.error('Verify email error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
