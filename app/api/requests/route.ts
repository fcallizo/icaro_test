import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { sendRequestNotification } from '@/lib/request-notifications';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ requests: [], blockedRanges: [], unifyCalendars: false, dbConfigured: false }, { status: 200 });
  }

  await ensureTables();

  const eventRows = await sql`SELECT id, fecha, status, tipo AS type FROM eventos WHERE status = 'confirmed' ORDER BY created_at DESC LIMIT 100;`;
  const blockedRanges = await sql`
    SELECT to_char(start_date, 'YYYY-MM-DD') AS "startDate",
      to_char(end_date, 'YYYY-MM-DD') AS "endDate"
    FROM calendar_blocks ORDER BY start_date;
  `;
  const [calendarSetting] = await sql`SELECT boolean_value FROM app_settings WHERE setting_key = 'unify_calendars' LIMIT 1;`;

  return NextResponse.json({
    requests: eventRows,
    blockedRanges,
    unifyCalendars: Boolean(calendarSetting?.boolean_value),
    dbConfigured: true,
  }, { status: 200 });
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
  const requestedDate = typeof payload.fecha === 'string' ? payload.fecha : '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    const [blockedDate] = await sql`
      SELECT id FROM calendar_blocks
      WHERE start_date <= ${requestedDate}::date AND end_date >= ${requestedDate}::date
      LIMIT 1;
    `;
    if (blockedDate) {
      return NextResponse.json({ error: 'Esa fecha no está disponible. Elige otra para tu solicitud.' }, { status: 409 });
    }
  }

  if (type === 'wedding') {
    const { nombre, telNovio, telNovia, fecha, lugar, novia, novio, ceremonia, cronograma, detalles, tipoPack, fechaPreboda, lugarPreboda, detallesPreboda, fechaPostboda, lugarPostboda, detallesPostboda } = payload;
    const eventId = randomUUID();

    const result = await sql`
      WITH new_event AS (
        INSERT INTO eventos (id, tipo, fecha, status)
        VALUES (${eventId}, 'wedding', ${fecha || ''}, 'pending')
        RETURNING id
      ), new_details AS (
        INSERT INTO wedding_requests (evento_id, nombre, email, tel_novio, tel_novia, lugar, novia, novio, ceremonia, cronograma, detalles, tipo_pack, fecha_preboda, lugar_preboda, detalles_preboda, fecha_postboda, lugar_postboda, detalles_postboda)
        SELECT id, ${nombre || ''}, ${email}, ${telNovio || ''}, ${telNovia || ''}, ${lugar || ''}, ${novia || ''}, ${novio || ''}, ${ceremonia || ''}, ${cronograma || ''}, ${detalles || ''}, ${tipoPack || ''},
           ${fechaPreboda || ''},  ${lugarPreboda || ''},  ${detallesPreboda || ''},  ${fechaPostboda || ''},  ${lugarPostboda || ''}, ${detallesPostboda || ''}
        FROM new_event
        RETURNING evento_id
      )
      SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
        w.nombre, w.email, w.tel_novio AS "telNovio", w.tel_novia AS "telNovia",
        w.lugar, w.novia, w.novio, w.ceremonia, w.cronograma, w.detalles, w.tipo_pack,
        w.fecha_preboda, w.lugar_preboda, w.detalles_preboda, w.fecha_postboda, w.lugar_postboda, w.detalles_postboda
      FROM new_details d
      JOIN eventos e ON e.id = d.evento_id
      JOIN wedding_requests w ON w.evento_id = e.id;
    `;

    await sendRequestNotification({ type: 'wedding', nombre, fecha });
    return NextResponse.json({ request: { ...result[0], type: 'wedding' }, dbConfigured: true }, { status: 201 });
  }

  const { nombre, telefono, fecha, tipo, presupuesto, descripcion } = payload;
  const eventId = randomUUID();

  const result = await sql`
    WITH new_event AS (
      INSERT INTO eventos (id, tipo, fecha, status)
      VALUES (${eventId}, 'production', ${fecha || ''}, 'pending')
      RETURNING id
    ), new_details AS (
      INSERT INTO production_requests (evento_id, nombre, email, telefono, tipo, presupuesto, descripcion)
      SELECT id, ${nombre || ''}, ${email}, ${telefono || ''}, ${tipo || ''}, ${presupuesto || ''}, ${descripcion || ''}
      FROM new_event
      RETURNING evento_id
    )
    SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
      p.nombre, p.email, p.telefono, p.tipo, p.presupuesto, p.descripcion
    FROM new_details d
    JOIN eventos e ON e.id = d.evento_id
    JOIN production_requests p ON p.evento_id = e.id;
  `;

  await sendRequestNotification({ type: 'production', nombre, fecha });
  return NextResponse.json({ request: { ...result[0], type: 'production' }, dbConfigured: true }, { status: 201 });
}
