import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '@/lib/email';

const MIN_PASSWORD_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 60;

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

    const otp = generateOTP();
    const hash = await bcrypt.hash(passwordVal, 10);
    const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;

    const insert = db.prepare(`
      INSERT OR REPLACE INTO pending_registrations (email, name, password_hash, otp, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(emailTrim, nameTrim || null, hash, otp, expiresAt);

    const sendResult = await sendOTPEmail(emailTrim, otp);
    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error ?? 'Impossible d\'envoyer l\'email de vérification' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, email: emailTrim, message: 'Code envoyé par email' });
  } catch (e) {
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
