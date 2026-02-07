import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';

const OTP_EXPIRY_SECONDS = 60;

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };
    const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!emailTrim) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const db = getDatabase();
    const row = db.prepare('SELECT email FROM pending_registrations WHERE email = ?').get(emailTrim) as { email: string } | undefined;
    if (!row) {
      return NextResponse.json(
        { error: 'Aucune inscription en attente pour cet email. Inscrivez-vous à nouveau.' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;
    db.prepare('UPDATE pending_registrations SET otp = ?, expires_at = ? WHERE email = ?').run(otp, expiresAt, emailTrim);

    const sendResult = await sendOTPEmail(emailTrim, otp);
    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error ?? 'Impossible d\'envoyer l\'email' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, expiresAt, message: 'Nouveau code envoyé' });
  } catch (e) {
    console.error('Resend OTP error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
