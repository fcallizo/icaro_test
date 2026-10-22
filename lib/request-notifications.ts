import { sql } from '@/lib/db';
import { createEmailSender, getEmailConfigurationHint } from '@/lib/email';

const formatDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('-') : value;

type RequestNotification = {
  type: 'wedding' | 'production';
  nombre?: string;
  fecha: string;
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
      `Fecha: ${formatDate(notification.fecha) || 'Por confirmar'}`,
    ].join('\n');

    const deliveries = await Promise.allSettled(
      recipients.map(({ email }) => sendEmail({ to: email, subject, text, action: { label: 'Revisar solicitud', url: panelUrl } })),
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
      'Hemos recibido vuestra solicitud y nos pondremos en contacto con ustedes en las próximas 24-48 horas.',
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
  fecha:string;
  email?: string | null;
  decision: 'confirmed' | 'rejected';
};

export async function sendRequestDecisionNotification(notification: RequestDecisionNotification) {
  const recipient = notification.email?.trim();
  if (!recipient) return;

  function getSubject() {
    const eventLabel = notification.type === 'wedding' ? 'boda' : 'evento cinematográfico';

    if (notification.decision === "confirmed")
      return `Confirmación de disponibilidad para su ${eventLabel}${formatDate(notification.fecha) ? ` — ${formatDate(notification.fecha)}` : ""} | IcaroStudio`;
    else
      return `Respuesta a su solicitud de ${eventLabel}${formatDate(notification.fecha) ? ` — ${formatDate(notification.fecha)}` : ""} | IcaroStudio`;
  }

  function getBody() {

    const L: string[] = [];

    if (notification.decision === "confirmed") {
      if (notification.type === "wedding") {
        L.push(`Hola ${notification.nombre}, `);
        L.push(`En nombre de todo el equipo de IcaroStudio, le agradecemos sinceramente la confianza depositada en nosotros para un día tan significativo.`);
        L.push("");
        L.push(`Nos complace confirmarle que su solicitud para la cobertura audiovisual de su boda para el día ${formatDate(notification.fecha)} ha sido ACEPTADA.  Será un verdadero honor acompañaros y transformar vuestros recuerdos en una película atemporal.`);
        L.push("");
        L.push("¿Cuáles son los siguientes pasos?");
        L.push("");
        L.push(`1. Conversación personal: os contactaremos en las próximas 24-48 horas para conoceros mejor y resolver todas vuestras dudas.`);
        L.push("2. Propuesta a medida: prepararemos una propuesta adaptada a vuestros horarios, espacios y estilo.");
        L.push("3. Reserva en firme: con la firma del contrato y un anticipo del 30 %, vuestra fecha quedará bloqueada en exclusiva para vosotros.");
        L.push("");
        L.push("Vuestra fecha es única, y la tratamos como tal: solo rodamos un evento por día para dedicaros toda nuestra atención y energía creativa.");
        L.push("");
        L.push("Gracias de nuevo por vuestra confianza. Estamos deseando crear algo inolvidable juntos.");
        L.push("");
        L.push("Un saludo.");
      } else {
        L.push(`Hola ${notification.nombre}, `);
        L.push(`Agradecemos su interés en IcaroStudio para la producción audiovisual de su evento.`);
        L.push("");
        L.push(`Tras revisar la disponibilidad y los requerimientos técnicos, nos complace confirmarle que su solicitud para el evento cinematográfico para el día${formatDate(notification.fecha)} ha sido ACEPTADA.`);
        L.push("");
        L.push("PRÓXIMOS PASOS:");
        L.push("");
        L.push("1. Brief creativo y visita técnica (presencial o remota).");
        L.push("2. Propuesta técnico-económica y cronograma de producción.");
        L.push("3. Firma de contrato y anticipo para bloquear equipo y fecha.");
        L.push("");
        L.push(`Nuestro equipo de producción le contactará en 24-48 h laborables.`);
        L.push("");
        L.push("Atentamente.");
      }
    } else {
      const motivo = "no disponemos de disponibilidad para esa fecha";
      if (notification.type === "wedding") {
        L.push(`Hola ${notification.nombre}, `);
        L.push(`Gracias de corazón por pensar en IcaroStudio para vuestra boda el día ${formatDate(notification.fecha)}. Hemos leído vuestra solicitud con atención y cariño.`);
        L.push("");
        L.push(`Con toda honestidad, y porque creemos que vuestro día merece el 100 % de nuestra energía, debemos comunicaros que no podremos acompañaros en esta ocasión, ${motivo}.`);
        L.push("");
        L.push("Sabemos lo importante que es esta decisión y sentimos de verdad no poder formar parte de vuestro día. Preferimos ser transparentes antes que comprometer la calidad que merecéis.");
        L.push("");
        L.push("");
        L.push("Os deseamos una boda llena de emoción, luz y momentos inolvidables. Y si en el futuro surge otro proyecto, será un placer volver a conversar.");
        L.push("Un saludo.");
      } else {
        L.push(`Hola ${notification.nombre}, `);
        L.push(`Muchas gracias por confiar en IcaroStudio para vuestro evento cinematográfico el día ${formatDate(notification.fecha)}. Valoramos mucho que hayáis pensado en nosotros.`);
        L.push("");
        L.push(`Tras revisar nuestra agenda y compromisos de producción, sentimos comunicaros que no podremos acompañaros en esta ocasión, ${motivo}.`);
        L.push("");
        L.push("Preferimos ser honestos desde el principio: solo aceptamos los proyectos a los que podemos dedicarles toda nuestra atención y nivel de acabado.");
        L.push("");
        L.push("");
        L.push("Os deseamos un evento brillante y quedamos a vuestra disposición para futuros proyectos.");
        L.push("Atentamente.");
      }
    }

    return L;
  }


  try {
    const sendEmail = createEmailSender();
    if (!sendEmail) {
      console.warn(`Aviso de decisión omitido: ${getEmailConfigurationHint()}.`);
      return;
    }

    const subject = getSubject();
    const text = getBody().join('\n');

    await sendEmail({ to: recipient, subject, text });
  } catch (error) {
    console.error('No se pudo enviar el aviso de decisión al cliente:', error);
  }
}