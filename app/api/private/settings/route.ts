import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';

async function isAuthenticated(request: NextRequest) {
  return Boolean(await readPrivateSession(request.cookies.get(PRIVATE_SESSION_COOKIE)?.value));
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  await ensureTables();
  const [setting] = await sql`SELECT boolean_value FROM app_settings WHERE setting_key = 'unify_calendars' LIMIT 1;`;
  return NextResponse.json({ unifyCalendars: Boolean(setting?.boolean_value) });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  if (typeof payload.unifyCalendars !== 'boolean') {
    return NextResponse.json({ error: 'El valor de unificación no es válido.' }, { status: 400 });
  }

  await ensureTables();
  const [setting] = await sql`
    INSERT INTO app_settings (setting_key, boolean_value, updated_at)
    VALUES ('unify_calendars', ${payload.unifyCalendars}, NOW())
    ON CONFLICT (setting_key) DO UPDATE
      SET boolean_value = EXCLUDED.boolean_value, updated_at = NOW()
    RETURNING boolean_value;
  `;

  return NextResponse.json({ unifyCalendars: Boolean(setting.boolean_value) });
}