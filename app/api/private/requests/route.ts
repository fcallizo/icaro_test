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
      p.nombre, p.email, p.telefono, p.tipo, p.presupuesto, p.descripcion,
      p.camera_setup AS "cameraSetup", p.camera_price AS "cameraPrice",
      p.drone_setup AS "droneSetup", p.drone_price AS "dronePrice",
      p.lighting_setup AS "lightingSetup", p.lighting_price AS "lightingPrice",
      p.sound_setup AS "soundSetup", p.sound_price AS "soundPrice",
      p.delivery_format AS "deliveryFormat", p.format_price AS "formatPrice",
      p.extra_crew AS "extraCrew", p.extra_crew_price AS "extraCrewPrice",
      p.logistics, p.logistics_price AS "logisticsPrice", p.tax_percent AS "taxPercent"
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
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['wedding', 'production'].includes(type) || !['confirm', 'reject', 'update'].includes(action)) {
    return NextResponse.json({ error: 'Acción o solicitud no válida.' }, { status: 400 });
  }

  await ensureTables();
  const requestType = type as RequestType;

  if (action === 'update') {
    const values = payload.values;
    const editableFields = [
      'nombre', 'email', 'fecha', 'telNovio', 'telNovia', 'telefono', 'lugar',
      'novia', 'novio', 'ceremonia', 'cronograma', 'detalles', 'tipo', 'presupuesto', 'descripcion',
      'cameraSetup', 'cameraPrice', 'droneSetup', 'dronePrice', 'lightingSetup', 'lightingPrice',
      'soundSetup', 'soundPrice', 'deliveryFormat', 'formatPrice', 'extraCrew', 'extraCrewPrice',
      'logistics', 'logisticsPrice', 'taxPercent',
    ];
    if (!values || editableFields.some((field) => typeof values[field] !== 'string' || values[field].length > 10000)) {
      return NextResponse.json({ error: 'Los datos del evento no son válidos.' }, { status: 400 });
    }

    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    const hasValidDate = /^\d{4}-\d{2}-\d{2}$/.test(values.fecha)
      && !Number.isNaN(Date.parse(`${values.fecha}T00:00:00Z`));
    if (!values.nombre.trim() || !hasValidEmail || !hasValidDate) {
      return NextResponse.json({ error: 'Nombre, email y fecha son obligatorios y deben ser válidos.' }, { status: 400 });
    }

    if (requestType === 'wedding' && (!values.telNovio.trim() || !values.telNovia.trim() || !values.lugar.trim())) {
      return NextResponse.json({ error: 'Los teléfonos y el lugar de la boda son obligatorios.' }, { status: 400 });
    }
    if (requestType === 'production' && (!values.telefono.trim() || !values.presupuesto.trim() || !Number.isFinite(Number(values.presupuesto)) || Number(values.presupuesto) < 0)) {
      return NextResponse.json({ error: 'El teléfono y un presupuesto válido son obligatorios.' }, { status: 400 });
    }

    const amountFields = ['cameraPrice', 'dronePrice', 'lightingPrice', 'soundPrice', 'formatPrice', 'extraCrewPrice', 'logisticsPrice'];
    if (requestType === 'production' && amountFields.some((field) => values[field].trim() !== '' && (!Number.isFinite(Number(values[field])) || Number(values[field]) < 0))) {
      return NextResponse.json({ error: 'Los importes técnicos deben ser números iguales o superiores a cero.' }, { status: 400 });
    }
    if (requestType === 'production' && !['', '0', '21'].includes(values.taxPercent)) {
      return NextResponse.json({ error: 'El IVA debe ser 0 % o 21 %.' }, { status: 400 });
    }

    const result = requestType === 'wedding'
      ? await sql`
        WITH updated_event AS (
          UPDATE eventos SET fecha = ${values.fecha}, updated_at = NOW()
          WHERE id = ${id} AND tipo = 'wedding'
          RETURNING id
        )
        UPDATE wedding_requests AS w SET
          nombre = ${values.nombre.trim()}, email = ${values.email.trim()},
          tel_novio = ${values.telNovio.trim()}, tel_novia = ${values.telNovia.trim()},
          lugar = ${values.lugar.trim()}, novia = ${values.novia.trim()}, novio = ${values.novio.trim()},
          ceremonia = ${values.ceremonia.trim()}, cronograma = ${values.cronograma.trim()}, detalles = ${values.detalles.trim()}
        FROM updated_event AS e
        WHERE w.evento_id = e.id
        RETURNING w.evento_id;
      `
      : await sql`
        WITH updated_event AS (
          UPDATE eventos SET fecha = ${values.fecha}, updated_at = NOW()
          WHERE id = ${id} AND tipo = 'production'
          RETURNING id
        )
        UPDATE production_requests AS p SET
          nombre = ${values.nombre.trim()}, email = ${values.email.trim()}, telefono = ${values.telefono.trim()},
          tipo = ${values.tipo.trim()}, presupuesto = ${values.presupuesto.trim()}, descripcion = ${values.descripcion.trim()},
          camera_setup = ${values.cameraSetup.trim() || null}, camera_price = ${values.cameraPrice.trim() === '' ? null : Number(values.cameraPrice)},
          drone_setup = ${values.droneSetup.trim() || null}, drone_price = ${values.dronePrice.trim() === '' ? null : Number(values.dronePrice)},
          lighting_setup = ${values.lightingSetup.trim() || null}, lighting_price = ${values.lightingPrice.trim() === '' ? null : Number(values.lightingPrice)},
          sound_setup = ${values.soundSetup.trim() || null}, sound_price = ${values.soundPrice.trim() === '' ? null : Number(values.soundPrice)},
          delivery_format = ${values.deliveryFormat.trim() || null}, format_price = ${values.formatPrice.trim() === '' ? null : Number(values.formatPrice)},
          extra_crew = ${values.extraCrew.trim() || null}, extra_crew_price = ${values.extraCrewPrice.trim() === '' ? null : Number(values.extraCrewPrice)},
          logistics = ${values.logistics.trim() || null}, logistics_price = ${values.logisticsPrice.trim() === '' ? null : Number(values.logisticsPrice)},
          tax_percent = ${values.taxPercent === '' ? null : Number(values.taxPercent)}
        FROM updated_event AS e
        WHERE p.evento_id = e.id
        RETURNING p.evento_id;
      `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'No se encontró el evento para actualizar.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, action });
  }

  if (action === 'confirm' && requestType === 'production') {
    const [technicalDetails] = await sql`
      SELECT p.camera_setup, p.camera_price, p.drone_setup, p.drone_price,
        p.lighting_setup, p.lighting_price, p.sound_setup, p.sound_price,
        p.delivery_format, p.format_price, p.extra_crew, p.extra_crew_price,
        p.logistics, p.logistics_price, p.tax_percent
      FROM production_requests p
      JOIN eventos e ON e.id = p.evento_id
      WHERE e.id = ${id} AND e.tipo = 'production' AND e.status = 'pending';
    `;
    if (technicalDetails) {
      const textFields = ['camera_setup', 'drone_setup', 'lighting_setup', 'sound_setup', 'delivery_format', 'extra_crew', 'logistics'];
      const amountFields = ['camera_price', 'drone_price', 'lighting_price', 'sound_price', 'format_price', 'extra_crew_price', 'logistics_price'];
      const isComplete = textFields.every((field) => typeof technicalDetails[field] === 'string' && technicalDetails[field].trim() !== '')
        && amountFields.every((field) => technicalDetails[field] !== null && Number.isFinite(Number(technicalDetails[field])) && Number(technicalDetails[field]) >= 0)
        && technicalDetails.tax_percent !== null
        && [0, 21].includes(Number(technicalDetails.tax_percent));
      if (!isComplete) {
        return NextResponse.json({ error: 'Completa y guarda el desglose técnico y el contrato antes de confirmar.' }, { status: 422 });
      }
    }
  }

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