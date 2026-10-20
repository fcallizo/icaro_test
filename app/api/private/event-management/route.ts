import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');


function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function createToken() {
  return randomBytes(32).toString('base64url');
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
  const [members, events] = await Promise.all([
    sql`
      SELECT id, name, created_at AS "createdAt", revoked_at AS "revokedAt"
      FROM team_members
      ORDER BY created_at DESC;
    `,
    sql`
      SELECT e.id, e.tipo AS type, e.fecha AS date,
        COALESCE(w.nombre, p.nombre, 'Evento') AS "clientName",
        COALESCE(w.lugar, p.lugar) AS location,
        COALESCE((
          SELECT json_agg(a.member_id)
          FROM event_assignments a
          WHERE a.event_id = e.id
        ), '[]'::json) AS "collaboratorIds"
      FROM eventos e
      LEFT JOIN wedding_requests w
        ON w.evento_id = COALESCE(e.parent_event_id, e.id)
        AND e.tipo IN ('wedding', 'prewedding', 'postwedding')
      LEFT JOIN production_requests p
        ON p.evento_id = e.id AND e.tipo = 'production'
      WHERE e.status = 'confirmed' AND e.fecha IS NOT NULL
      ORDER BY e.fecha, e.tipo;
    `,
  ]);

  return NextResponse.json(
    { members, events },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload: unknown = await request.json().catch(() => ({}));
  const name = typeof payload === 'object' && payload !== null && 'name' in payload
    ? payload.name
    : undefined;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return NextResponse.json({ error: 'Indica un nombre de hasta 100 caracteres.' }, { status: 400 });
  }

  await ensureTables();
  const token = createToken();
  const [member] = await sql`
    INSERT INTO team_members (name, token_hash)
    VALUES (${name.trim()}, ${hashToken(token)})
    RETURNING id, name, created_at AS "createdAt", revoked_at AS "revokedAt";
  `;

  const link = new URL(`/equipo/${token}`, appUrl).toString();
  return NextResponse.json(
    { member, link },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload: unknown = await request.json().catch(() => ({}));
  if (typeof payload !== 'object' || payload === null || !('action' in payload)) {
    return NextResponse.json({ error: 'La acción no es válida.' }, { status: 400 });
  }
  const action = payload.action;

  await ensureTables();
  if (action === 'assign') {
    const memberId = 'memberId' in payload ? payload.memberId : undefined;
    const eventIds = 'eventIds' in payload ? payload.eventIds : undefined;
    if (!isUuid(memberId) || !Array.isArray(eventIds) || eventIds.length > 500 || !eventIds.every(isUuid)) {
      return NextResponse.json({ error: 'La asignación no es válida.' }, { status: 400 });
    }

    const uniqueEventIds = Array.from(new Set(eventIds));
    if (uniqueEventIds.length !== eventIds.length) {
      return NextResponse.json({ error: 'La lista contiene eventos duplicados.' }, { status: 400 });
    }

    const [member] = await sql`
      SELECT id FROM team_members WHERE id = ${memberId} AND revoked_at IS NULL LIMIT 1;
    `;
    if (!member) {
      return NextResponse.json({ error: 'No se encontró un colaborador activo.' }, { status: 404 });
    }

    const validEvents = uniqueEventIds.length
      ? await sql`
        SELECT id FROM eventos
        WHERE id = ANY(${uniqueEventIds}::uuid[]) AND status = 'confirmed';
      `
      : [];
    if (validEvents.length !== uniqueEventIds.length) {
      return NextResponse.json({ error: 'La asignación incluye eventos no confirmados o inexistentes.' }, { status: 400 });
    }

    await sql`
      WITH removed AS (
        DELETE FROM event_assignments WHERE member_id = ${memberId}
        RETURNING member_id
      ), delete_barrier AS (
        SELECT COUNT(*) FROM removed
      ), inserted AS (
        INSERT INTO event_assignments (member_id, event_id)
        SELECT ${memberId}, e.id
        FROM eventos e CROSS JOIN delete_barrier
        WHERE e.id = ANY(${uniqueEventIds}::uuid[]) AND e.status = 'confirmed'
        RETURNING event_id
      )
      SELECT COUNT(*) FROM inserted;
    `;
    return NextResponse.json({ success: true });
  }

  if (action === 'rotate') {
    const memberId = 'memberId' in payload ? payload.memberId : undefined;
    if (!isUuid(memberId)) {
      return NextResponse.json({ error: 'El colaborador no es válido.' }, { status: 400 });
    }

    const token = createToken();
    const [member] = await sql`
      UPDATE team_members SET token_hash = ${hashToken(token)}
      WHERE id = ${memberId} AND revoked_at IS NULL
      RETURNING id;
    `;
    if (!member) {
      return NextResponse.json({ error: 'No se encontró un colaborador activo.' }, { status: 404 });
    }

    const link = new URL(`/equipo/${token}`, appUrl).toString();
    return NextResponse.json({ link }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  return NextResponse.json({ error: 'La acción no es válida.' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload: unknown = await request.json().catch(() => ({}));
  const memberId = typeof payload === 'object' && payload !== null && 'memberId' in payload
    ? payload.memberId
    : undefined;
  if (!isUuid(memberId)) {
    return NextResponse.json({ error: 'El colaborador no es válido.' }, { status: 400 });
  }

  await ensureTables();
  const [revoked] = await sql`
    WITH revoked AS (
      UPDATE team_members SET revoked_at = NOW()
      WHERE id = ${memberId} AND revoked_at IS NULL
      RETURNING id
    ), removed AS (
      DELETE FROM event_assignments
      WHERE member_id = (SELECT id FROM revoked)
    )
    SELECT id FROM revoked;
  `;
  if (!revoked) {
    return NextResponse.json({ error: 'No se encontró un colaborador activo.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
