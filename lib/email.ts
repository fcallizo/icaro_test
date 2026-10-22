import nodemailer from 'nodemailer';
import { Resend } from 'resend';

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  action?: {
    label: string;
    url: string;
  };
};

type EmailSender = (message: EmailMessage) => Promise<void>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailHtml({ subject, text, action }: EmailMessage) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.7;">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const actionButton = action
    ? `<p style="margin:28px 0 8px;text-align:center;"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:13px 24px;background-color:#d4af37;border-radius:4px;color:#191a1b;font-weight:700;text-decoration:none;">${escapeHtml(action.label)}</a></p>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background-color:#191a1b;color:#222324;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="padding:28px 24px;text-align:center;background-color:#222324;border-bottom:3px solid #d4af37;">
          <div style="color:#d4af37;font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:3px;">ÍCARO STUDIO</div>
          <div style="margin-top:8px;color:#bdb8ac;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Producción audiovisual premium</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 28px;background-color:#faf9f6;color:#222324;">
          <h1 style="margin:0 0 24px;color:#191a1b;font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:500;">${escapeHtml(subject)}</h1>
          ${paragraphs}
          ${actionButton}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;text-align:center;color:#bdb8ac;font-size:12px;line-height:1.6;">
          Gracias por contactar con Ícaro Studio.<br>
          Este mensaje se ha enviado en relación con una solicitud de nuestros servicios.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderEmailText({ text, action }: EmailMessage) {
  if (!action) return text;
  return `${text}\n\n${action.label}: ${action.url}`;
}

export function createEmailSender(): EmailSender | null {

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || 'Ícaro Studio <info@icarostudio.es>';

  return async (message) => {
    const { error } = await resend.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      text: renderEmailText(message),
      html: renderEmailHtml(message),
    });
    if (error) throw new Error(`Resend: ${error.message}`);
  };
}

export function getEmailConfigurationHint() {
  return 'configura RESEND_API_KEY';
}
