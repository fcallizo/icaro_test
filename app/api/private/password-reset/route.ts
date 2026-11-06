import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createRateLimitBucket, consumeRateLimitBuckets } from '@/lib/rate-limit';
import { createEmailSender } from '@/lib/email';
import { getPrivatePasswordUrl, issuePrivateAuthToken, normalizeEmail } from '@/lib/private-account';

const GENERIC_RESPONSE = {
  message: 'Si el correo está asociado a una cuenta, recibirás un enlace para establecer la contraseña.',
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });

  const parsedPayload: unknown = await request.json().catch(() => ({}));
  const payload = typeof parsedPayload === 'object' && parsedPayload !== null && !Array.isArray(parsedPayload)
    ? parsedPayload as Record<string, unknown>
    : {};
  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Introduce un correo electrónico válido.' }, { status: 400 });
  }

  try {
    const rawIp = request.ip
      ?? request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const clientIp = rawIp && isIP(rawIp) ? rawIp : 'unknown';
    const retryAfter = await consumeRateLimitBuckets([
      { bucketKey: createRateLimitBucket('password-reset-ip', clientIp), maxAttempts: 20, windowSeconds: 900, cooldownSeconds: 900 },
      { bucketKey: createRateLimitBucket('password-reset-email', email), maxAttempts: 5, windowSeconds: 900, cooldownSeconds: 900 },
    ]);
    if (retryAfter > 0) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const sender = createEmailSender();
    const [user] = await sql`
      SELECT id::text AS id, email FROM users WHERE LOWER(email) = ${email} LIMIT 1;
    `;
    if (user) {
      if (!sender) {
        console.error('No se puede enviar la recuperación de contraseña: RESEND_API_KEY no está configurada.');
        return NextResponse.json(GENERIC_RESPONSE);
      }

      const token = await issuePrivateAuthToken(user.id, 'reset');
      const actionUrl = getPrivatePasswordUrl(request, token);
      if (!actionUrl) {
        await sql`DELETE FROM private_auth_tokens WHERE user_id = ${user.id}::uuid;`;
        console.error('No se puede enviar la recuperación de contraseña: configura NEXT_PUBLIC_APP_URL.');
        return NextResponse.json(GENERIC_RESPONSE);
      }

      try {
        await sender({
          to: user.email,
          subject: 'Restablece tu contraseña de Ícaro Studio',
          text: 'Hemos recibido una solicitud para establecer o restablecer la contraseña de tu cuenta privada. Si no has sido tú, ignora este mensaje. El enlace caduca en una hora.',
          action: { label: 'Establecer contraseña', url: actionUrl },
          footer: 'Este mensaje contiene un enlace de seguridad para el área privada de Ícaro Studio.',
        });
      } catch (error) {
        await sql`DELETE FROM private_auth_tokens WHERE user_id = ${user.id}::uuid;`;
        console.error('No se pudo enviar el correo de restablecimiento de contraseña:', error);
        return NextResponse.json(GENERIC_RESPONSE);
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('No se pudo procesar la solicitud de restablecimiento:', error);
    return NextResponse.json({ error: 'No se pudo procesar la solicitud.' }, { status: 500 });
  }
}
