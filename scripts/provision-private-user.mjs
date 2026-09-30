import { neon } from '@neondatabase/serverless';
import { randomBytes, scrypt } from 'node:crypto';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const username = process.env.PROVISION_USERNAME?.trim();
const password = process.env.PROVISION_PASSWORD;
const email = process.env.PROVISION_EMAIL?.trim();
const notificationLevel = Number(process.env.PROVISION_NOTIFICATIONS ?? 0);

if (!process.env.DATABASE_URL || !username || !password) {
  throw new Error('Define DATABASE_URL, PROVISION_USERNAME y PROVISION_PASSWORD.');
}

if (password.length < 8) {
  throw new Error('La contraseña debe tener al menos 8 caracteres.');
}

if (!Number.isInteger(notificationLevel) || notificationLevel < 0 || notificationLevel > 3) {
  throw new Error('PROVISION_NOTIFICATIONS debe ser un entero entre 0 y 3.');
}

const salt = randomBytes(16);
const key = await promisify(scrypt)(password, salt, 64);
const passwordHash = `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
const sql = neon(process.env.DATABASE_URL);

await sql`
  INSERT INTO usuarios (usuario, pass, email, notificaciones)
  VALUES (${username}, ${passwordHash}, ${email || null}, ${notificationLevel})
  ON CONFLICT (usuario) DO UPDATE
  SET pass = EXCLUDED.pass,
      email = EXCLUDED.email,
      notificaciones = EXCLUDED.notificaciones;
`;

console.log(`Usuario ${username} provisionado con nivel de notificaciones ${notificationLevel}; contraseña almacenada con scrypt.`);
