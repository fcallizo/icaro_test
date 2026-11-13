import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const PASSWORD_KEY_LENGTH = 64;
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
export const PRIVATE_SESSION_COOKIE = 'icaro_private_session';

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Buffer.from(derivedKey));
    });
  });
}

function getSessionKey() {
  const secret = process.env.PRIVATE_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('PRIVATE_SESSION_SECRET debe tener al menos 32 caracteres.');
  }

  return new TextEncoder().encode(secret);
}

export async function verifyPassword(password: string, storedHash: string) {
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(storedHash);
  if (!match) return false;

  const salt = Buffer.from(match[1], 'hex');
  const expected = Buffer.from(match[2], 'hex');
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}

export async function createPrivateSession(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionKey());
}

export async function readPrivateSession(token?: string) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionKey());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getPrivateSessionUser(token?: string) {
  const userId = await readPrivateSession(token);
  if (!userId || !sql) return null;

  const [user] = await sql`
    SELECT id::text AS id, username, email, is_admin AS "isAdmin"
    FROM users
    WHERE id::text = ${userId}
    LIMIT 1;
  `;
  return user ?? null;
}

export const privateSessionDuration = SESSION_DURATION_SECONDS;