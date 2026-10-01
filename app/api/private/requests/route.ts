import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';
import { sendRequestDecisionNotification } from '@/lib/request-notifications';

type RequestType = 'wedding' | 'production';

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
  const weddings = await sql`
    SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
      w.nombre, w.email, w.tel_novio AS "telNovio", w.tel_novia AS "telNovia",
      w.lugar, w.novia, w.novio, w.ceremonia, w.cronograma, w.detalles
    FROM eventos e
    JOIN wedding_requests w ON w.evento_id = e.id
    WHERE e.tipo = 'wedding' AND e.status IN ('pending', 'confirmed')
    ORDER BY e.created_at DESC LIMIT 500;
  `;
  const productions = await sql`
    SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
      p.nombre, p.email, p.telefono, p.tipo, p.presupuesto, p.descripcion
    FROM eventos e
    JOIN production_requests p ON p.evento_id = e.id
    WHERE e.tipo = 'production' AND e.status IN ('pending', 'confirmed')
    ORDER BY e.created_at DESC LIMIT 500;
  `;

  return NextResponse.json({ requests: [...weddings, ...productions] });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const { id, type, action } = payload;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['wedding', 'production'].includes(type) || !['confirm', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Acción o solicitud no válida.' }, { status: 400 });
  }

  await ensureTables();
  const requestType = type as RequestType;
  const isConfirming = action === 'confirm';
  let result: Array<Record<string, unknown>>;

  if (requestType === 'wedding') {
    const nextStatus = isConfirming ? 'confirmed' : 'rejected';
    result = await sql`
      WITH decision AS (
        UPDATE eventos SET status = ${nextStatus}, updated_at = NOW(), decided_at = NOW()
        WHERE id = ${id} AND tipo = 'wedding' AND status = 'pending'
        RETURNING id, fecha
      )
      SELECT decision.fecha, w.email, w.nombre
      FROM decision JOIN wedding_requests w ON w.evento_id = decision.id;
    `;
  } else {
    const nextStatus = isConfirming ? 'confirmed' : 'rejected';
    result = await sql`
      WITH decision AS (
        UPDATE eventos SET status = ${nextStatus}, updated_at = NOW(), decided_at = NOW()
        WHERE id = ${id} AND tipo = 'production' AND status = 'pending'
        RETURNING id, fecha
      )
      SELECT decision.fecha, p.email, p.nombre
      FROM decision JOIN production_requests p ON p.evento_id = decision.id;
    `;
  }

  if (result.length === 0) {
    return NextResponse.json({ error: 'La solicitud ya no está pendiente.' }, { status: 409 });
  }

  const affectedRequest = result[0];
  await sendRequestDecisionNotification({
    type: requestType,
    email: typeof affectedRequest.email === 'string' ? affectedRequest.email : null,
    nombre: typeof affectedRequest.nombre === 'string' ? affectedRequest.nombre : undefined,
    fecha: typeof affectedRequest.fecha === 'string' ? affectedRequest.fecha : undefined,
    decision: isConfirming ? 'confirmed' : 'rejected',
  });

  return NextResponse.json({ success: true, action });
}