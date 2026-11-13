import { neon } from '@neondatabase/serverless';
import { randomBytes, scrypt } from 'node:crypto';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const username = process.env.PROVISION_USERNAME?.trim();
const password = process.env.PROVISION_PASSWORD;
const email = process.env.PROVISION_EMAIL?.trim().toLowerCase();
const isAdmin = process.env.PROVISION_IS_ADMIN === 'true';
const notificationSetting = process.env.PROVISION_NOTIFICATIONS;
const notificationLevel = notificationSetting === undefined ? null : Number(notificationSetting);

if (!process.env.DATABASE_URL || !username || !email) {
  throw new Error('Define DATABASE_URL, PROVISION_USERNAME y PROVISION_EMAIL.');
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  throw new Error('PROVISION_EMAIL debe ser un correo válido.');
}

if (password !== undefined && password.length < 8) {
  throw new Error('La contraseña debe tener al menos 8 caracteres.');
}

if (notificationLevel !== null && (!Number.isInteger(notificationLevel) || notificationLevel < 0 || notificationLevel > 3)) {
  throw new Error('PROVISION_NOTIFICATIONS debe ser un entero entre 0 y 3.');
}

if (password === undefined && process.env.PROVISION_IS_ADMIN !== 'true') {
  throw new Error('Para crear una cuenta nueva define PROVISION_PASSWORD; para promover la cuenta existente define PROVISION_IS_ADMIN=true.');
}

let passwordHash = null;
if (password !== undefined) {
  const salt = randomBytes(16);
  const key = await promisify(scrypt)(password, salt, 64);
  passwordHash = `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
const sql = neon(process.env.DATABASE_URL);

const [existingUser] = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1;`;
const [emailOwner] = await sql`
  SELECT id FROM users WHERE LOWER(email) = ${email} AND username <> ${username} LIMIT 1;
`;
if (emailOwner) throw new Error('Ese correo ya está asociado a otro usuario.');

if (existingUser) {
  await sql`
    UPDATE users
    SET email = ${email},
        password_hash = COALESCE(${passwordHash}, password_hash),
        is_admin = is_admin OR ${isAdmin},
        notification_level = COALESCE(${notificationLevel}, notification_level)
    WHERE username = ${username};
  `;
} else {
  if (!passwordHash) throw new Error('No se encontró la cuenta existente y no se proporcionó contraseña para crearla.');
  await sql`
    INSERT INTO users (username, password_hash, email, notification_level, is_admin)
    VALUES (${username}, ${passwordHash}, ${email}, COALESCE(${notificationLevel}, 0), ${isAdmin});
  `;
}

console.log(`Usuario ${username} guardado con correo ${email}${isAdmin ? ' y permisos de administrador' : ''}.`);
