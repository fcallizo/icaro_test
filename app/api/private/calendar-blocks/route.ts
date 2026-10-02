import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

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
  const blocks = await sql`
    SELECT id, to_char(start_date, 'YYYY-MM-DD') AS "startDate",
      to_char(end_date, 'YYYY-MM-DD') AS "endDate", reason, created_at AS "createdAt"
    FROM calendar_blocks
    ORDER BY start_date DESC;
  `;
  return NextResponse.json({ blocks });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const { startDate, endDate } = payload;
  const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
  if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
    return NextResponse.json({ error: 'Indica un intervalo de fechas válido.' }, { status: 400 });
  }
  if (reason.length > 500) {
    return NextResponse.json({ error: 'El motivo no puede superar los 500 caracteres.' }, { status: 400 });
  }

  const firstDay = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const lastDay = new Date(`${endDate}T00:00:00.000Z`).getTime();
  if ((lastDay - firstDay) / 86400000 > 365) {
    return NextResponse.json({ error: 'Un bloqueo no puede superar un año.' }, { status: 400 });
  }

  await ensureTables();
  const [confirmedConflict] = await sql`
    SELECT id FROM eventos
    WHERE status = 'confirmed' AND fecha >= ${startDate} AND fecha <= ${endDate}
    LIMIT 1;
  `;
  if (confirmedConflict) {
    return NextResponse.json({ error: 'El intervalo incluye una fecha con un evento ya confirmado.' }, { status: 409 });
  }

  const [existingBlock] = await sql`
    SELECT id FROM calendar_blocks
    WHERE start_date <= ${endDate}::date AND end_date >= ${startDate}::date
    LIMIT 1;
  `;
  if (existingBlock) {
    return NextResponse.json({ error: 'El intervalo se solapa con otro bloqueo. Modifica o elimina el existente primero.' }, { status: 409 });
  }

  const [block] = await sql`
    INSERT INTO calendar_blocks (start_date, end_date, reason)
    VALUES (${startDate}::date, ${endDate}::date, ${reason || null})
    RETURNING id, to_char(start_date, 'YYYY-MM-DD') AS "startDate",
      to_char(end_date, 'YYYY-MM-DD') AS "endDate", reason, created_at AS "createdAt";
  `;
  return NextResponse.json({ block }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  if (typeof payload.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.id)) {
    return NextResponse.json({ error: 'El bloqueo no es válido.' }, { status: 400 });
  }

  await ensureTables();
  const result = await sql`DELETE FROM calendar_blocks WHERE id = ${payload.id} RETURNING id;`;
  if (result.length === 0) {
    return NextResponse.json({ error: 'No se encontró el bloqueo.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}