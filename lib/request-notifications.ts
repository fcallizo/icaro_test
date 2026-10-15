import { sql } from '@/lib/db';
import { createEmailSender, getEmailConfigurationHint } from '@/lib/email';

type RequestNotification = {
  type: 'wedding' | 'production';
  nombre?: string;
  fecha?: string;
};

export async function sendRequestNotification(notification: RequestNotification) {
  if (!sql) return;

  const notificationFlag = notification.type === 'wedding' ? 2 : 1;

  try {
    const sendEmail = createEmailSender();
    if (!sendEmail) {
      console.warn(`Notificación de solicitud omitida: ${getEmailConfigurationHint()}.`);
      return;
    }

    const recipients = await sql`
      SELECT email
      FROM users
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
      recipients.map(({ email }) => sendEmail({ to: email, subject, text })),
    );
    const failedDeliveries = deliveries.filter((delivery) => delivery.status === 'rejected').length;

    if (failedDeliveries > 0) {
      console.error(`Fallaron ${failedDeliveries} notificaciones de ${eventLabel}.`);
    }
  } catch (error) {
    console.error('No se pudieron enviar notificaciones de solicitudes:', error);
  }
}

type RequestWeddingNotification = RequestNotification & {
  email?: string | null;
  token?: string;
};

export async function sendRequestWeddingNotification(notification: RequestWeddingNotification) {
  const recipient = notification.email?.trim();
  if (!recipient) return;

  try {
    const sendEmail = createEmailSender();
    if (!sendEmail) {
      console.warn(`Aviso de decisión omitido: ${getEmailConfigurationHint()}.`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    const accessUrl = `${appUrl.replace(/\/+$/, '')}/solicitud-boda/${notification.token}`;
    const subject = `Solicitud de presupuesto de Boda`;
    const text = [
      `Hola${notification.nombre ? ` ${notification.nombre}` : ''},`,
      '',
      `Muchas gracias por confiar en Icaro Studio para compartir un momento tan importante.`,
      '',
      'Hemos recibido vuestra solicitud y nos pondremos en contacto con ustedes en las próximas 24 horas.',
      'Si quieren ir avanzando, pueden acceder al formulario para completar los datos de la boda. Si prefieren esperar a hablar con nosotros, no se preocupen: les contactaremos lo antes posible.',
      '',
      'Gracias,',
      'Un saludo,',
    ].join('\n');

    await sendEmail({ to: recipient, subject, text, action: { label: 'Completar formulario', url: accessUrl } });
  } catch (error) {
    console.error('No se pudo enviar el aviso de decisión al cliente:', error);
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
    const sendEmail = createEmailSender();
    if (!sendEmail) {
      console.warn(`Aviso de decisión omitido: ${getEmailConfigurationHint()}.`);
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

    await sendEmail({ to: recipient, subject, text });
  } catch (error) {
    console.error('No se pudo enviar el aviso de decisión al cliente:', error);
  }
}