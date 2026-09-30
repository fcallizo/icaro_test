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
    SELECT id, nombre, email, tel_novio AS "telNovio", tel_novia AS "telNovia", fecha,
      lugar, novia, novio, ceremonia, cronograma, detalles, status, created_at,
      'wedding' AS type
    FROM wedding_requests ORDER BY created_at DESC LIMIT 500;
  `;
  const productions = await sql`
    SELECT id, nombre, email, telefono, fecha, tipo, presupuesto, descripcion, status,
      created_at, 'production' AS type
    FROM production_requests ORDER BY created_at DESC LIMIT 500;
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
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['wedding', 'production'].includes(type) || !['confirm', 'discard'].includes(action)) {
    return NextResponse.json({ error: 'Acción o solicitud no válida.' }, { status: 400 });
  }

  await ensureTables();
  const requestType = type as RequestType;
  const isConfirming = action === 'confirm';
  let result: Array<Record<string, unknown>>;

  if (requestType === 'wedding') {
    result = isConfirming
      ? await sql`UPDATE wedding_requests SET status = 'confirmed' WHERE id = ${id} AND status = 'pending' RETURNING email, nombre, fecha;`
      : await sql`DELETE FROM wedding_requests WHERE id = ${id} AND status = 'pending' RETURNING email, nombre, fecha;`;
  } else {
    result = isConfirming
      ? await sql`UPDATE production_requests SET status = 'confirmed' WHERE id = ${id} AND status = 'pending' RETURNING email, nombre, fecha;`
      : await sql`DELETE FROM production_requests WHERE id = ${id} AND status = 'pending' RETURNING email, nombre, fecha;`;
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