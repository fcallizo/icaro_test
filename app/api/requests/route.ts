import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { sendRequestNotification } from '@/lib/request-notifications';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ requests: [], unifyCalendars: false, dbConfigured: false }, { status: 200 });
  }

  await ensureTables();

  const weddingRows = await sql`SELECT id, fecha, status, 'wedding' AS type FROM wedding_requests WHERE status = 'confirmed' ORDER BY created_at DESC LIMIT 100;`;
  const productionRows = await sql`SELECT id, fecha, status, 'production' AS type FROM production_requests WHERE status = 'confirmed' ORDER BY created_at DESC LIMIT 100;`;
  const [calendarSetting] = await sql`SELECT boolean_value FROM app_settings WHERE setting_key = 'unify_calendars' LIMIT 1;`;

  const requests = [...weddingRows, ...productionRows];

  return NextResponse.json({ requests, unifyCalendars: Boolean(calendarSetting?.boolean_value), dbConfigured: true }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const type = payload.type;
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';

  if (!type || !['wedding', 'production'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de solicitud no válido.' }, { status: 400 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Introduce un email de contacto válido.' }, { status: 400 });
  }

  if (!sql) {
    const mock = {
      id: `mock-${Date.now()}`,
      status: 'pending',
      ...payload,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ request: mock, dbConfigured: false }, { status: 200 });
  }

  await ensureTables();

  if (type === 'wedding') {
    const { nombre, telNovio, telNovia, fecha, lugar, novia, novio, ceremonia, cronograma, detalles } = payload;

    const result = await sql`
      INSERT INTO wedding_requests (nombre, email, tel_novio, tel_novia, fecha, lugar, novia, novio, ceremonia, cronograma, detalles)
      VALUES (${nombre || ''}, ${email || ''}, ${telNovio || ''}, ${telNovia || ''}, ${fecha || ''}, ${lugar || ''}, ${novia || ''}, ${novio || ''}, ${ceremonia || ''}, ${cronograma || ''}, ${detalles || ''})
      RETURNING id, nombre, email, tel_novio as "telNovio", tel_novia as "telNovia", fecha, lugar, novia, novio, ceremonia, cronograma, detalles, status, created_at;
    `;

    await sendRequestNotification({ type: 'wedding', nombre, fecha });
    return NextResponse.json({ request: { ...result[0], type: 'wedding' }, dbConfigured: true }, { status: 201 });
  }

  const { nombre, telefono, fecha, tipo, presupuesto, descripcion } = payload;

  const result = await sql`
    INSERT INTO production_requests (nombre, email, telefono, fecha, tipo, presupuesto, descripcion)
    VALUES (${nombre || ''}, ${email || ''}, ${telefono || ''}, ${fecha || ''}, ${tipo || ''}, ${presupuesto || ''}, ${descripcion || ''})
    RETURNING id, nombre, email, telefono, fecha, tipo, presupuesto, descripcion, status, created_at;
  `;

  await sendRequestNotification({ type: 'production', nombre, fecha });
  return NextResponse.json({ request: { ...result[0], type: 'production' }, dbConfigured: true }, { status: 201 });
}
