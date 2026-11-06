import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { clearRateLimitBuckets, consumeRateLimitBuckets, createRateLimitBucket } from '@/lib/rate-limit';
import {
  createPrivateSession,
  PRIVATE_SESSION_COOKIE,
  privateSessionDuration,
  verifyPassword,
} from '@/lib/private-auth';

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const { email, password } = await request.json().catch(() => ({}));
  if (typeof email !== 'string' || !email.trim() || email.trim().length > 254
    || typeof password !== 'string' || password.length === 0 || password.length > 256) {
    return NextResponse.json({ error: 'Correo o contraseña no válidos.' }, { status: 400 });
  }

  if (!process.env.PRIVATE_SESSION_SECRET || process.env.PRIVATE_SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: 'Falta configurar PRIVATE_SESSION_SECRET (mínimo 32 caracteres).' }, { status: 503 });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const rawIp = request.ip
      ?? request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const clientIp = rawIp && isIP(rawIp) ? rawIp : 'unknown';
    const rateLimitBuckets = [
      createRateLimitBucket('login-ip', clientIp),
      createRateLimitBucket('login-ip-user', `${clientIp}\n${normalizedEmail}`),
    ];
    const retryAfter = await consumeRateLimitBuckets([
      { bucketKey: rateLimitBuckets[0], maxAttempts: 20, windowSeconds: 900, cooldownSeconds: 900 },
      { bucketKey: rateLimitBuckets[1], maxAttempts: 5, windowSeconds: 900, cooldownSeconds: 900 },
    ]);

    if (retryAfter > 0) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera antes de volver a intentarlo.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const [user] = await sql`
      SELECT id::text AS id, email, pass, is_admin AS "isAdmin"
      FROM users
      WHERE LOWER(email) = ${normalizedEmail} AND pass IS NOT NULL
      LIMIT 1;
    `;

    if (!user || typeof user.pass !== 'string' || !(await verifyPassword(password, user.pass))) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    await clearRateLimitBuckets(rateLimitBuckets);
    const token = await createPrivateSession(user.id);
    const response = NextResponse.json({ authenticated: true, email: user.email, isAdmin: Boolean(user.isAdmin) });
    response.cookies.set(PRIVATE_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: privateSessionDuration,
    });

    return response;
  } catch (error) {
    console.error('No se pudo iniciar sesión privada:', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}