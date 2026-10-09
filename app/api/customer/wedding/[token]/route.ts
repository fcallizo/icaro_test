import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';

type RouteContext = {
  params: { token: string };
};

const scheduleFields = [
  'horaSalidaNovio',
  'horaSalidaNovia',
  'horaCeremonia',
  'horaCoctel',
  'horaBarraLibre',
] as const;

const textFields = [
  'nombre',
  'email',
  'fecha',
  'telNovio',
  'telNovia',
  'lugar',
  'novia',
  'novio',
  'ceremonia',
  'detalles',
  'tipoPack',
  'fechaPreboda',
  'lugarPreboda',
  'detallesPreboda',
  'fechaPostboda',
  'lugarPostboda',
  'detallesPostboda',
  'status',
  ...scheduleFields,
] as const;

type WeddingFormValues = Record<(typeof textFields)[number], string>;

function getTokenHash(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return createHash('sha256').update(token).digest('hex');
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function findWedding(tokenHash: string) {
  if (!sql) return null;
  await ensureTables();
  const rows = await sql`
    SELECT e.id, e.fecha, w.nombre, w.email, w.tel_novio AS "telNovio", e.status,
      w.tel_novia AS "telNovia", w.lugar, w.novia, w.novio, w.ceremonia,
      w.hora_salida_novio AS "horaSalidaNovio",
      w.hora_salida_novia AS "horaSalidaNovia",
      w.hora_ceremonia AS "horaCeremonia",
      w.hora_coctel AS "horaCoctel",
      w.hora_barra_libre AS "horaBarraLibre",
      w.detalles, w.tipo_pack AS "tipoPack",
      (SELECT pe.fecha FROM eventos pe WHERE pe.parent_event_id = e.id AND pe.tipo = 'prewedding') AS "fechaPreboda",
      w.lugar_preboda AS "lugarPreboda", w.detalles_preboda AS "detallesPreboda",
      (SELECT pe.fecha FROM eventos pe WHERE pe.parent_event_id = e.id AND pe.tipo = 'postwedding') AS "fechaPostboda",
      w.lugar_postboda AS "lugarPostboda", w.detalles_postboda AS "detallesPostboda"
    FROM eventos e
    JOIN wedding_requests w ON w.evento_id = e.id
    WHERE w.customer_form_token_hash = ${tokenHash}
      AND e.tipo = 'wedding' AND e.status IN ('pending', 'confirmed')
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const tokenHash = getTokenHash(params.token);
  if (!tokenHash) return NextResponse.json({ error: 'Enlace no válido o ya no disponible.' }, { status: 404 });
  if (!sql) return NextResponse.json({ error: 'El formulario no está disponible temporalmente.' }, { status: 503 });

  const wedding = await findWedding(tokenHash);
  if (!wedding) return NextResponse.json({ error: 'Enlace no válido o ya no disponible.' }, { status: 404 });
  return NextResponse.json({ wedding }, { headers: { 'Cache-Control': 'no-store, private' } });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const tokenHash = getTokenHash(params.token);
  if (!tokenHash) return NextResponse.json({ error: 'Enlace no válido o ya no disponible.' }, { status: 404 });
  if (!sql) return NextResponse.json({ error: 'El formulario no está disponible temporalmente.' }, { status: 503 });

  const existingWedding = await findWedding(tokenHash);
  if (!existingWedding) return NextResponse.json({ error: 'Enlace no válido o ya no disponible.' }, { status: 404 });

  const payload = await request.json().catch(() => null);
  const rawValues = payload?.values;
  if (!rawValues || textFields.some((field) => typeof rawValues[field] !== 'string' || rawValues[field].length > 10000)) {
    return NextResponse.json({ error: 'Revisa los datos del formulario e inténtalo de nuevo.' }, { status: 400 });
  }

  const values: WeddingFormValues = {
    nombre: rawValues.nombre.trim(),
    email: rawValues.email.trim(),
    fecha: rawValues.fecha.trim(),
    telNovio: rawValues.telNovio.trim(),
    telNovia: rawValues.telNovia.trim(),
    lugar: rawValues.lugar.trim(),
    novia: rawValues.novia.trim(),
    novio: rawValues.novio.trim(),
    ceremonia: rawValues.ceremonia.trim(),
    horaSalidaNovio: rawValues.horaSalidaNovio.trim(),
    horaSalidaNovia: rawValues.horaSalidaNovia.trim(),
    horaCeremonia: rawValues.horaCeremonia.trim(),
    horaCoctel: rawValues.horaCoctel.trim(),
    horaBarraLibre: rawValues.horaBarraLibre.trim(),
    detalles: rawValues.detalles.trim(),
    tipoPack: rawValues.tipoPack.trim(),
    fechaPreboda: rawValues.fechaPreboda.trim(),
    lugarPreboda: rawValues.lugarPreboda.trim(),
    detallesPreboda: rawValues.detallesPreboda.trim(),
    fechaPostboda: rawValues.fechaPostboda.trim(),
    lugarPostboda: rawValues.lugarPostboda.trim(),
    detallesPostboda: rawValues.detallesPostboda.trim(),
    status: rawValues.status.trim(),
  };
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  if (values.nombre.length > 250 || values.email.length > 254) {
    return NextResponse.json({ error: 'El nombre o el correo superan la longitud permitida.' }, { status: 400 });
  }
  if (!values.nombre || !validEmail || !isValidDate(values.fecha) ||
      !values.telNovio || !values.telNovia || !values.lugar) {
    return NextResponse.json({ error: 'Nombre, email, fecha, teléfonos y lugar de celebración son obligatorios.' }, { status: 400 });
  }
  if (!['indeciso', 'boda', 'duo-pre', 'duo-post', 'trio'].includes(values.tipoPack)) {
    return NextResponse.json({ error: 'Selecciona un tipo de pack válido.' }, { status: 400 });
  }
  if (scheduleFields.some((field) => values[field] !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values[field]))) {
    return NextResponse.json({ error: 'Comprueba que los horarios sean válidos.' }, { status: 400 });
  }

  const includesPreWedding = ['duo-pre', 'trio'].includes(values.tipoPack);
  const includesPostWedding = ['duo-post', 'trio'].includes(values.tipoPack);
  const fechaPreboda = includesPreWedding ? values.fechaPreboda : '';
  const fechaPostboda = includesPostWedding ? values.fechaPostboda : '';
  const secondaryDates = [fechaPreboda, fechaPostboda];
  if (secondaryDates.some((date) => date !== '' && !isValidDate(date))) {
    return NextResponse.json({ error: 'Las fechas de preboda y postboda deben ser válidas.' }, { status: 400 });
  }
  if (includesPreWedding &&
      (!values.fechaPreboda || !values.lugarPreboda)) {
    return NextResponse.json({ error: 'Completa la fecha y el lugar de la preboda para el pack seleccionado.' }, { status: 400 });
  }
  if (includesPostWedding &&
      (!values.fechaPostboda || !values.lugarPostboda)) {
    return NextResponse.json({ error: 'Completa la fecha y el lugar de la postboda para el pack seleccionado.' }, { status: 400 });
  }

  const cronograma = [
    `Salida Novio: ${values.horaSalidaNovio || '--:--'}`,
    `Salida Novia: ${values.horaSalidaNovia || '--:--'}`,
    `Ceremonia: ${values.horaCeremonia || '--:--'}`,
    `Cóctel: ${values.horaCoctel || '--:--'}`,
    `Barra Libre: ${values.horaBarraLibre || '--:--'}`,
  ].join(' | ');

  const updatedRows = await sql`
    WITH updated_event AS (
      UPDATE eventos SET fecha = ${values.fecha}, updated_at = NOW()
      WHERE id = ${existingWedding.id} AND tipo = 'wedding' AND status IN ('pending', 'confirmed')
      RETURNING id
    )
    UPDATE wedding_requests AS w SET
      nombre = ${values.nombre}, email = ${values.email},
      tel_novio = ${values.telNovio}, tel_novia = ${values.telNovia},
      lugar = ${values.lugar}, novia = ${values.novia}, novio = ${values.novio},
      ceremonia = ${values.ceremonia}, cronograma = ${cronograma},
      hora_salida_novio = ${values.horaSalidaNovio},
      hora_salida_novia = ${values.horaSalidaNovia},
      hora_ceremonia = ${values.horaCeremonia},
      hora_coctel = ${values.horaCoctel},
      hora_barra_libre = ${values.horaBarraLibre},
      detalles = ${values.detalles}, tipo_pack = ${values.tipoPack},
      lugar_preboda = ${includesPreWedding ? values.lugarPreboda : ''},
      detalles_preboda = ${includesPreWedding ? values.detallesPreboda : ''},
      lugar_postboda = ${includesPostWedding ? values.lugarPostboda : ''},
      detalles_postboda = ${includesPostWedding ? values.detallesPostboda : ''}
    FROM updated_event AS e
    WHERE w.evento_id = e.id
    RETURNING w.evento_id;
  `;
  if (updatedRows.length === 0) {
    return NextResponse.json({ error: 'La solicitud ya no está disponible para editarse.' }, { status: 404 });
  }

  const secondaryEvents = [
    { type: 'prewedding', date: fechaPreboda },
    { type: 'postwedding', date: fechaPostboda },
  ] as const;
  for (const secondaryEvent of secondaryEvents) {
    if (!secondaryEvent.date) {
      await sql`DELETE FROM eventos
        WHERE parent_event_id = ${existingWedding.id} AND tipo = ${secondaryEvent.type};`;
      continue;
    }
    await sql`
      INSERT INTO eventos (tipo, fecha, status, parent_event_id, decided_at)
      SELECT ${secondaryEvent.type}, ${secondaryEvent.date}, parent.status, parent.id,
        CASE WHEN parent.status = 'pending' THEN NULL ELSE COALESCE(parent.decided_at, NOW()) END
      FROM eventos parent
      WHERE parent.id = ${existingWedding.id} AND parent.tipo = 'wedding'
      ON CONFLICT (parent_event_id, tipo) WHERE parent_event_id IS NOT NULL
      DO UPDATE SET fecha = EXCLUDED.fecha, updated_at = NOW();
    `;
  }

  return NextResponse.json({ success: true });
}
