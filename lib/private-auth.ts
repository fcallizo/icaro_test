import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
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

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(storedHash);
  if (!match) return false;

  const salt = Buffer.from(match[1], 'hex');
  const expected = Buffer.from(match[2], 'hex');
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}

export async function seedInitialAdmin() {
  if (!sql) return;

  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12) return;

  const existingUsers = await sql`SELECT id FROM usuarios LIMIT 1;`;
  if (existingUsers.length > 0) return;

  const passwordHash = await hashPassword(password);
  await sql`
    INSERT INTO usuarios (usuario, pass)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (usuario) DO NOTHING;
  `;
}

export async function createPrivateSession(username: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
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

export const privateSessionDuration = SESSION_DURATION_SECONDS;