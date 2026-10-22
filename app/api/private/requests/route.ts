import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';
import { sendRequestDecisionNotification } from '@/lib/request-notifications';
import { setNullValue } from '@/lib/form-values';

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
      w.lugar, w.novia, w.novio, w.ceremonia,
      w.hora_salida_novio AS "horaSalidaNovio", w.hora_salida_novia AS "horaSalidaNovia",
      w.hora_ceremonia AS "horaCeremonia", w.hora_coctel AS "horaCoctel",
      w.hora_barra_libre AS "horaBarraLibre", w.detalles, w.tipo_pack AS "tipoPack",
      w.servicio_boda AS "servicioBoda", w.extra_boda AS "extraBoda", w.precio_extra_boda AS "precioExtraBoda", w.descuento_boda AS "descuentoBoda",
      w.servicio_preboda AS "servicioPreboda", w.extra_preboda AS "extraPreboda", w.precio_extra_preboda AS "precioExtraPreboda",
      w.servicio_postboda AS "servicioPostboda", w.extra_postboda AS "extraPostboda", w.precio_extra_postboda AS "precioExtraPostboda",
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
      p.nombre, p.email, p.telefono, p.tipo, p.presupuesto, p.lugar, p.detalles,
      p.setup_camara AS "setupCamara", p.precio_camara AS "precioCamara",
      p.setup_drone AS "setupDrone", p.precio_drone AS "precioDrone",
      p.setup_iluminacion AS "setupIluminacion", p.precio_iluminacion AS "precioIluminacion",
      p.setup_sonido AS "setupSonido", p.precio_sonido AS "precioSonido",
      p.formato_entrega AS "formatoEntrega", p.precio_formato AS "precioFormato",
      p.personal_extra AS "personalExtra", p.precio_personal_extra AS "precioPersonalExtra",
      p.logistica, p.precio_logistica AS "precioLogistica", p.tax_percent AS "taxPercent"
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
      'novia', 'novio', 'ceremonia', 'horaSalidaNovio', 'horaSalidaNovia',
      'horaCeremonia', 'horaCoctel', 'horaBarraLibre', 'detalles', 'tipo', 'presupuesto', 'detalles', 'tipoPack',
      'fechaPreboda', 'lugarPreboda', 'detallesPreboda', 'fechaPostboda', 'lugarPostboda', 'detallesPostboda',
      'servicioBoda', 'extraBoda', 'precioExtraBoda', 'descuentoBoda',
      'servicioPreboda', 'extraPreboda', 'precioExtraPreboda',
      'servicioPostboda', 'extraPostboda', 'precioExtraPostboda',
      'setupCamara', 'precioCamara', 'setupDrone', 'precioDrone', 'setupIluminacion', 'precioIluminacion',
      'setupSonido', 'precioSonido', 'formatoEntrega', 'precioFormato', 'personalExtra', 'precioPersonalExtra',
      'logistica', 'precioLogistica', 'taxPercent',
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

    if (requestType === 'wedding' && (!values.telNovio.trim() || !values.telNovia.trim())) {
      return NextResponse.json({ error: 'Los teléfonos son obligatorios.' }, { status: 400 });
    }
    if (requestType === 'production' && (!values.telefono.trim() || !values.presupuesto.trim() || !Number.isFinite(Number(values.presupuesto)) || Number(values.presupuesto) < 0)) {
      return NextResponse.json({ error: 'El teléfono y un presupuesto válido son obligatorios.' }, { status: 400 });
    }

    const amountFields = ['precioCamara', 'precioDrone', 'precioIluminacion', 'precioSonido', 'precioFormato', 'precioPersonalExtra', 'precioLogistica'];
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
          novio = ${setNullValue(values.novio)},
          hora_salida_novio = ${setNullValue(values.horaSalidaNovio)},
          novia = ${setNullValue(values.novia)},
          hora_salida_novia = ${setNullValue(values.horaSalidaNovia)},
          ceremonia = ${setNullValue(values.ceremonia)},
          hora_ceremonia = ${setNullValue(values.horaCeremonia)},
          lugar = ${setNullValue(values.lugar)},
          hora_coctel = ${setNullValue(values.horaCoctel)},
          hora_barra_libre = ${setNullValue(values.horaBarraLibre)},
          detalles = ${values.detalles.trim()}, tipo_pack = ${values.tipoPack},
          servicio_boda = ${values.servicioBoda},
          extra_boda = ${setNullValue(values.extraBoda)},
          precio_extra_boda = ${values.precioExtraBoda === '' ? null : Number(values.precioExtraBoda)},
          descuento_boda = ${values.descuentoBoda === '' ? null : Number(values.descuentoBoda)},
          servicio_preboda = ${values.servicioPreboda},
          lugar_preboda = ${setNullValue(values.lugarPreboda)},
          detalles_preboda = ${setNullValue(values.detallesPreboda)},
          extra_preboda = ${setNullValue(values.extraPreboda)},
          precio_extra_preboda = ${values.precioExtraPreboda === '' ? null : Number(values.precioExtraPreboda)},
          servicio_postboda = ${values.servicioPostboda},
          lugar_postboda = ${setNullValue(values.lugarPostboda)},
          detalles_postboda = ${setNullValue(values.detallesPostboda)},
          extra_postboda = ${setNullValue(values.extraPostboda)},
          precio_extra_postboda = ${values.precioExtraPostboda === '' ? null : Number(values.precioExtraPostboda)}
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
          tipo = ${values.tipo.trim()}, presupuesto = ${values.presupuesto.trim()}, 
          lugar = ${values.lugar.trim()}, detalles = ${values.detalles.trim()},
          setup_camara = ${values.setupCamara.trim() || null}, precio_camara = ${values.precioCamara.trim() === '' ? null : Number(values.precioCamara)},
          setup_drone = ${values.setupDrone.trim() || null}, precio_drone = ${values.precioDrone.trim() === '' ? null : Number(values.precioDrone)},
          setup_iluminacion = ${values.setupIluminacion.trim() || null}, precio_iluminacion = ${values.precioIluminacion.trim() === '' ? null : Number(values.precioIluminacion)},
          setup_sonido = ${values.setupSonido.trim() || null}, precio_sonido = ${values.precioSonido.trim() === '' ? null : Number(values.precioSonido)},
          formato_entrega = ${values.formatoEntrega.trim() || null}, precio_formato = ${values.precioFormato.trim() === '' ? null : Number(values.precioFormato)},
          personal_extra = ${values.personalExtra.trim() || null}, precio_personal_extra = ${values.precioPersonalExtra.trim() === '' ? null : Number(values.precioPersonalExtra)},
          logistica = ${values.logistica.trim() || null}, precio_logistica = ${values.precioLogistica.trim() === '' ? null : Number(values.precioLogistica)},
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
      SELECT p.setup_camara, p.precio_camara, p.setup_drone, p.precio_drone,
        p.setup_iluminacion, p.precio_iluminacion, p.setup_sonido, p.precio_sonido,
        p.formato_entrega, p.precio_formato, p.personal_extra, p.precio_personal_extra,
        p.logistica, p.precio_logistica, p.tax_percent
      FROM production_requests p
      JOIN eventos e ON e.id = p.evento_id
      WHERE e.id = ${id} AND e.tipo = 'production' AND e.status = 'pending';
    `;
    if (technicalDetails) {
      const textFields = ['setup_camara', 'setup_drone', 'setup_iluminacion', 'setup_sonido', 'formato_entrega', 'personal_extra', 'logistica'];
      const amountFields = ['precio_camara', 'precio_drone', 'precio_iluminacion', 'precio_sonido', 'precio_formato', 'precio_personal_extra', 'precio_logistica'];
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
    fecha: typeof affectedRequest.fecha === 'string' ? affectedRequest.fecha : '',
    decision: isConfirming ? 'confirmed' : 'rejected',
  });

  return NextResponse.json({ success: true, action });
}