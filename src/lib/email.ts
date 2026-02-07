/**
 * Envoi d'email OTP :
 * - Option 1 (gratuit) : SMTP (Gmail, Outlook, Brevo…) → configurez SMTP_* dans .env
 * - Option 2 : Resend → RESEND_API_KEY et optionnellement FROM_EMAIL
 * - Sinon (dev) : le code OTP est logué en console.
 */
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'IAlangue <noreply@example.com>';

const htmlBody = (code: string) => `
  <p>Bonjour,</p>
  <p>Votre code de vérification pour confirmer votre adresse email est :</p>
  <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
  <p>Ce code expire dans 1 minute.</p>
  <p>Si vous n'avez pas demandé cet email, ignorez-le.</p>
  <p>— IAlangue</p>
`;

async function sendViaSMTP(to: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  if (!host || !user || !pass) {
    return { ok: false, error: 'SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS requis).' };
  }
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    const from = process.env.SMTP_FROM || FROM_EMAIL;
    await transporter.sendMail({
      from,
      to,
      subject: 'Votre code de vérification IAlangue',
      html: htmlBody(code),
    });
    return { ok: true };
  } catch (e) {
    console.error('SMTP error:', e);
    return { ok: false, error: (e as Error).message };
  }
}

async function sendViaResend(to: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY manquant.' };
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Votre code de vérification IAlangue',
      html: htmlBody(code),
    });
    if (error) {
      const msg = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: string }).message)
        : String(error);
      if (msg.includes('only send testing emails') || msg.includes('your own email')) {
        return {
          ok: false,
          error: 'En mode test Resend, l\'OTP ne peut être envoyé qu\'à l\'adresse email de votre compte Resend. Utilisez SMTP (Gmail, etc.) ou vérifiez un domaine dans Resend.',
        };
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    console.error('Resend error:', e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendOTPEmail(to: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (useSmtp) {
    return sendViaSMTP(to, code);
  }
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(to, code);
  }
  console.log('[DEV] OTP non envoyé (ni SMTP ni RESEND_API_KEY). Code pour', to, ':', code);
  return { ok: true };
}
