/**
 * Email delivery with Resend → SMTP → console fallback chain.
 *
 * Phase 6 of megaplan.
 *
 * Auto-detects provider:
 *   - RESEND_API_KEY set → Resend
 *   - SMTP_HOST set → nodemailer SMTP
 *   - else → log to console (dev-friendly fallback so the workflow never blocks)
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 6
 *           docs/research-external.md (no specific section but follows industry pattern)
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export type SendInviteParams = {
  to: string;
  name: string;
  tempPassword: string;
  loginUrl: string;
};

export type SendResult = {
  sent: boolean;
  provider: 'resend' | 'smtp' | 'console';
  error?: string;
};

function buildInviteHtml({ name, tempPassword, loginUrl }: Omit<SendInviteParams, 'to'>): string {
  return `<!doctype html>
<html lang="pt-BR">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h1 style="color: #1e3a5f; font-size: 24px; margin: 0 0 16px;">Bem-vindo(a) ao Transitivity 2.0, ${escapeHtml(name)}!</h1>
  <p>Sua conta foi criada por um administrador. Use os dados abaixo para fazer seu primeiro acesso:</p>
  <table cellpadding="8" style="border-collapse: collapse; margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 6px;">
    <tr><td style="font-weight: 600; background: #f9fafb;">URL de login</td><td><a href="${loginUrl}">${loginUrl}</a></td></tr>
    <tr><td style="font-weight: 600; background: #f9fafb;">Senha temporária</td><td style="font-family: ui-monospace, 'Courier New', monospace; background: #fef3c7; padding: 6px 10px; border-radius: 4px;">${escapeHtml(tempPassword)}</td></tr>
  </table>
  <p style="color: #dc2626; font-weight: 600;">⚠️ Você será obrigado(a) a alterar essa senha no primeiro acesso.</p>
  <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Se você não esperava este e-mail, ignore-o.</p>
</body>
</html>`;
}

function buildInviteText({ name, tempPassword, loginUrl }: Omit<SendInviteParams, 'to'>): string {
  return `Bem-vindo(a) ao Transitivity 2.0, ${name}!

Sua conta foi criada por um administrador.

URL de login: ${loginUrl}
Senha temporária: ${tempPassword}

Você será obrigado(a) a alterar essa senha no primeiro acesso.
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendInviteEmail(params: SendInviteParams): Promise<SendResult> {
  const { to, name, tempPassword, loginUrl } = params;
  const subject = 'Sua conta no Transitivity 2.0';
  const html = buildInviteHtml({ name, tempPassword, loginUrl });
  const text = buildInviteText({ name, tempPassword, loginUrl });
  const from = process.env.EMAIL_FROM || 'Transitivity <no-reply@transitivity.local>';

  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({ from, to, subject, html, text });
      if (result.error) {
        return { sent: false, provider: 'resend', error: String(result.error) };
      }
      return { sent: true, provider: 'resend' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email] Resend failed:', msg);
      return { sent: false, provider: 'resend', error: msg };
    }
  }

  // Try SMTP
  if (process.env.SMTP_HOST) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
      await transport.sendMail({ from, to, subject, html, text });
      return { sent: true, provider: 'smtp' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[email] SMTP failed:', msg);
      return { sent: false, provider: 'smtp', error: msg };
    }
  }

  // Console fallback (dev-friendly)
  console.log('================== EMAIL (console fallback) ==================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log('==============================================================');
  return { sent: false, provider: 'console' };
}
