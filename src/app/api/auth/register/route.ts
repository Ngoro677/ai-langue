import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body as { email?: string; password?: string; name?: string };
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const passwordVal = typeof password === 'string' ? password : '';
    const nameTrim = typeof name === 'string' ? name.trim() : '';

    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    if (passwordVal.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrim);
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 });
    }

    const id = randomUUID();
    const hash = await bcrypt.hash(passwordVal, 10);
    db.prepare('INSERT INTO users (id, email, name, image, password) VALUES (?, ?, ?, ?, ?)').run(
      id,
      emailTrim,
      nameTrim || null,
      null,
      hash
    );

    return NextResponse.json({ ok: true, message: 'Inscription réussie' });
  } catch (e) {
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
