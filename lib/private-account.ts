import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPrivateAuthToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function issuePrivateAuthToken(userId: string, purpose: 'invite' | 'reset') {
  if (!sql) throw new Error('La base de datos no está configurada.');

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashPrivateAuthToken(token);
  const durationHours = purpose === 'invite' ? 24 : 1;
  await sql.transaction([
    sql`DELETE FROM private_auth_tokens WHERE user_id = ${userId}::uuid;`,
    sql`
      INSERT INTO private_auth_tokens (token_hash, user_id, purpose, expires_at)
      VALUES (${tokenHash}, ${userId}::uuid, ${purpose}, NOW() + (${durationHours}::INTEGER * INTERVAL '1 hour'));
    `,
  ]);
  return token;
}

export function getPrivatePasswordUrl(request: NextRequest, token: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const baseUrl = configuredUrl || (process.env.NODE_ENV !== 'production' ? request.nextUrl.origin : '');
  if (!baseUrl) return null;

  try {
    const url = new URL('/private/password', baseUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.searchParams.set('token', token);
    return url.toString();
  } catch {
    return null;
  }
}
