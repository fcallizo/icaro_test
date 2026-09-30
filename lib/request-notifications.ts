import nodemailer from 'nodemailer';
import { sql } from '@/lib/db';

type RequestNotification = {
  type: 'wedding' | 'production';
  nombre?: string;
  fecha?: string;
};

function createSmtpTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPassword || !emailFrom || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) return null;

  return {
    from: emailFrom,
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPassword },
    }),
  };
}

export async function sendRequestNotification(notification: RequestNotification) {
  if (!sql) return;

  const notificationFlag = notification.type === 'wedding' ? 2 : 1;

  try {
    const mailer = createSmtpTransporter();
    if (!mailer) {
      console.warn('Notificación de solicitud omitida: configura SMTP_HOST, SMTP_USER, SMTP_PASSWORD y un SMTP_PORT válido.');
      return;
    }

    const recipients = await sql`
      SELECT email
      FROM usuarios
      WHERE email IS NOT NULL
        AND btrim(email) <> ''
        AND (notificaciones & ${notificationFlag}) = ${notificationFlag};
    `;

    if (recipients.length === 0) return;

    const eventLabel = notification.type === 'wedding' ? 'boda' : 'evento cinematográfico';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    const panelUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/private` : '/private';
    const subject = `Nueva solicitud de ${eventLabel}`;
    const text = [
      `Se ha recibido una nueva solicitud de ${eventLabel}.`,
      `Cliente: ${notification.nombre || 'No indicado'}`,
      `Fecha: ${notification.fecha || 'Por confirmar'}`,
      '',
      `Revisar en el área privada: ${panelUrl}`,
    ].join('\n');

    const deliveries = await Promise.allSettled(
      recipients.map(({ email }) => mailer.transporter.sendMail({ from: mailer.from, to: email, subject, text })),
    );
    const failedDeliveries = deliveries.filter((delivery) => delivery.status === 'rejected').length;

    if (failedDeliveries > 0) {
      console.error(`Fallaron ${failedDeliveries} notificaciones de ${eventLabel}.`);
    }
  } catch (error) {
    console.error('No se pudieron enviar notificaciones de solicitudes:', error);
  }
}

type RequestDecisionNotification = RequestNotification & {
  email?: string | null;
  decision: 'confirmed' | 'rejected';
};

export async function sendRequestDecisionNotification(notification: RequestDecisionNotification) {
  const recipient = notification.email?.trim();
  if (!recipient) return;

  try {
    const mailer = createSmtpTransporter();
    if (!mailer) {
      console.warn('Aviso de decisión omitido: configura las variables SMTP.');
      return;
    }

    const eventLabel = notification.type === 'wedding' ? 'boda' : 'evento cinematográfico';
    const decisionLabel = notification.decision === 'confirmed' ? 'aceptada' : 'rechazada';
    const subject = `Tu solicitud de ${eventLabel} ha sido ${decisionLabel}`;
    const text = [
      `Hola${notification.nombre ? ` ${notification.nombre}` : ''},`,
      '',
      `Tu solicitud de ${eventLabel}${notification.fecha ? ` para el ${notification.fecha}` : ''} ha sido ${decisionLabel}.`,
      '',
      'Gracias por contactar con Ícaro Studio.',
    ].join('\n');

    await mailer.transporter.sendMail({ from: mailer.from, to: recipient, subject, text });
  } catch (error) {
    console.error('No se pudo enviar el aviso de decisión al cliente:', error);
  }
}