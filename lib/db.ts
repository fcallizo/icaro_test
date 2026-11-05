import { neon } from '@neondatabase/serverless';

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export async function getDbStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL),
    url: process.env.DATABASE_URL ? 'configured' : 'missing',
  };
}
