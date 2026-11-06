import { isIP } from 'node:net';
import { createHash, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { clearRateLimitBuckets, consumeRateLimitBuckets, createRateLimitBucket } from '@/lib/rate-limit';

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Buffer.from(derivedKey));
    });
  });
}

async function createPasswordHash(password: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function POST(request: NextRequest) {
  if (!sql) return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });

  const parsedPayload: unknown = await request.json().catch(() => ({}));
  const payload = typeof parsedPayload === 'object' && parsedPayload !== null && !Array.isArray(parsedPayload)
    ? parsedPayload as Record<string, unknown>
    : {};
  if (typeof payload.token !== 'string' || !/^[a-f0-9]{64}$/i.test(payload.token)) {
    return NextResponse.json({ error: 'El enlace no es válido o ha caducado.' }, { status: 400 });
  }
  if (typeof payload.password !== 'string' || payload.password.length < 8 || payload.password.length > 256) {
    return NextResponse.json({ error: 'La contraseña debe tener entre 8 y 256 caracteres.' }, { status: 400 });
  }
  if (payload.password !== payload.confirmPassword) {
    return NextResponse.json({ error: 'Las contraseñas no coinciden.' }, { status: 400 });
  }

  try {
    const tokenHash = createHash('sha256').update(payload.token).digest('hex');
    const rawIp = request.ip
      ?? request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const clientIp = rawIp && isIP(rawIp) ? rawIp : 'unknown';
    const rateLimitBuckets = [
      createRateLimitBucket('set-password-ip', clientIp),
      createRateLimitBucket('set-password-token', tokenHash),
    ];
    const retryAfter = await consumeRateLimitBuckets([
      { bucketKey: rateLimitBuckets[0], maxAttempts: 10, windowSeconds: 900, cooldownSeconds: 900 },
      { bucketKey: rateLimitBuckets[1], maxAttempts: 5, windowSeconds: 900, cooldownSeconds: 900 },
    ]);
    if (retryAfter > 0) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera antes de volver a intentarlo.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const passwordHash = await createPasswordHash(payload.password);
    const updated = await sql`
      WITH consumed AS (
        DELETE FROM private_auth_tokens
        WHERE token_hash = ${tokenHash} AND expires_at > NOW()
        RETURNING user_id
      )
      UPDATE users
      SET pass = ${passwordHash}
      WHERE id IN (SELECT user_id FROM consumed)
      RETURNING id;
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: 'El enlace no es válido o ha caducado.' }, { status: 400 });
    }

    await clearRateLimitBuckets(rateLimitBuckets);
    return NextResponse.json({ message: 'Contraseña guardada. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('No se pudo establecer la contraseña privada:', error);
    return NextResponse.json({ error: 'No se pudo guardar la contraseña.' }, { status: 500 });
  }
}
