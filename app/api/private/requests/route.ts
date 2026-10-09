import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';
import { sendRequestDecisionNotification } from '@/lib/request-notifications';

type RequestType = 'wedding' | 'production';

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
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
  const weddings = await sql`
    SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
      w.nombre, w.email, w.tel_novio AS "telNovio", w.tel_novia AS "telNovia",
      w.lugar, w.novia, w.novio, w.ceremonia, w.cronograma,
      w.hora_salida_novio AS "horaSalidaNovio", w.hora_salida_novia AS "horaSalidaNovia",
      w.hora_ceremonia AS "horaCeremonia", w.hora_coctel AS "horaCoctel",
      w.hora_barra_libre AS "horaBarraLibre", w.detalles, w.tipo_pack AS "tipoPack",
      (SELECT pe.fecha FROM eventos pe WHERE pe.parent_event_id = e.id AND pe.tipo = 'prewedding') AS "fechaPreboda",
      w.lugar_preboda AS "lugarPreboda", w.detalles_preboda AS "detallesPreboda",
      (SELECT pe.fecha FROM eventos pe WHERE pe.parent_event_id = e.id AND pe.tipo = 'postwedding') AS "fechaPostboda",
      w.lugar_postboda AS "lugarPostboda", w.detalles_postboda AS "detallesPostboda"
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

  if (action === 'confirm') {
    const [manualBlock] = await sql`
      SELECT e.id FROM eventos e
      WHERE (e.id = ${id} OR e.parent_event_id = ${id})
        AND e.status = 'pending'
        AND EXISTS (
          SELECT 1 FROM calendar_blocks b
          WHERE e.fecha >= to_char(b.start_date, 'YYYY-MM-DD')
            AND e.fecha <= to_char(b.end_date, 'YYYY-MM-DD')
        )
      LIMIT 1;
    `;
    if (manualBlock) {
      return NextResponse.json({ error: 'No se puede confirmar: una de las fechas está bloqueada como no disponible.' }, { status: 409 });
    }
  }

  if (action === 'update') {
    const values = payload.values;
    const editableFields = [
      'nombre', 'email', 'fecha', 'telNovio', 'telNovia', 'telefono', 'lugar',
      'novia', 'novio', 'ceremonia', 'cronograma', 'horaSalidaNovio', 'horaSalidaNovia',
      'horaCeremonia', 'horaCoctel', 'horaBarraLibre', 'detalles', 'tipo', 'presupuesto', 'descripcion', 'tipoPack',
      'fechaPreboda', 'lugarPreboda', 'detallesPreboda', 'fechaPostboda', 'lugarPostboda', 'detallesPostboda',
      'cameraSetup', 'cameraPrice', 'droneSetup', 'dronePrice', 'lightingSetup', 'lightingPrice',
      'soundSetup', 'soundPrice', 'deliveryFormat', 'formatPrice', 'extraCrew', 'extraCrewPrice',
      'logistics', 'logisticsPrice', 'taxPercent',
    ];
    if (!values || editableFields.some((field) => typeof values[field] !== 'string' || values[field].length > 10000)) {
      return NextResponse.json({ error: 'Los datos del evento no son válidos.' }, { status: 400 });
    }

    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    const hasValidDate = isValidDate(values.fecha);
    if (!values.nombre.trim() || !hasValidEmail || !hasValidDate) {
      return NextResponse.json({ error: 'Nombre, email y fecha son obligatorios y deben ser válidos.' }, { status: 400 });
    }
    const secondaryDates = requestType === 'wedding'
      ? [values.fechaPreboda.trim(), values.fechaPostboda.trim()]
      : [];
    if (secondaryDates.some((date) => date !== '' && !isValidDate(date))) {
      return NextResponse.json({ error: 'Las fechas de preboda y postboda deben ser válidas.' }, { status: 400 });
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
          ceremonia = ${values.ceremonia.trim()}, cronograma = ${values.cronograma.trim()},
          hora_salida_novio = ${values.horaSalidaNovio.trim()},
          hora_salida_novia = ${values.horaSalidaNovia.trim()},
          hora_ceremonia = ${values.horaCeremonia.trim()},
          hora_coctel = ${values.horaCoctel.trim()},
          hora_barra_libre = ${values.horaBarraLibre.trim()},
          detalles = ${values.detalles.trim()}, tipo_pack = ${values.tipoPack.trim()},
          lugar_preboda = ${values.lugarPreboda.trim()}, lugar_postboda = ${values.lugarPostboda.trim()},
          detalles_preboda = ${values.detallesPreboda.trim()}, detalles_postboda = ${values.detallesPostboda.trim()}
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

    if (requestType === 'wedding') {
      const secondaryEvents = [
        { type: 'prewedding', date: values.fechaPreboda.trim() },
        { type: 'postwedding', date: values.fechaPostboda.trim() },
      ] as const;
      for (const secondaryEvent of secondaryEvents) {
        if (!secondaryEvent.date) {
          await sql`DELETE FROM eventos
            WHERE parent_event_id = ${id} AND tipo = ${secondaryEvent.type};`;
          continue;
        }

        const savedEvent = await sql`
          INSERT INTO eventos (tipo, fecha, status, parent_event_id, decided_at)
          SELECT ${secondaryEvent.type}, ${secondaryEvent.date}, parent.status, parent.id,
            CASE WHEN parent.status = 'pending' THEN NULL ELSE COALESCE(parent.decided_at, NOW()) END
          FROM eventos parent
          WHERE parent.id = ${id} AND parent.tipo = 'wedding'
          ON CONFLICT (parent_event_id, tipo) WHERE parent_event_id IS NOT NULL
          DO UPDATE SET fecha = EXCLUDED.fecha, updated_at = NOW()
          RETURNING id;
        `;
        if (savedEvent.length === 0) {
          return NextResponse.json({ error: 'No se pudo guardar la fecha del evento secundario.' }, { status: 404 });
        }
      }
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
      ), related_decisions AS (
        UPDATE eventos child SET status = ${nextStatus}, updated_at = NOW(), decided_at = NOW()
        FROM decision
        WHERE child.parent_event_id = decision.id
        RETURNING child.id
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