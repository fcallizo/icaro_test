import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, getPrivateSessionUser } from '@/lib/private-auth';
import { sendRequestDecisionNotification } from '@/lib/request-notifications';
import { setNullValue } from '@/lib/properties';
import { isValidIdentityDocument, normalizeSpanishTaxId } from '@/lib/spanish-tax-id';
import type { IdentityDocumentType } from '@/lib/spanish-tax-id';

type RequestType = 'wedding' | 'production';

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isIdentityDocumentType(value: unknown): value is IdentityDocumentType {
  return value === 'nif' || value === 'passport';
}

async function isAuthenticated(request: NextRequest) {
  return Boolean(await getPrivateSessionUser(request.cookies.get(PRIVATE_SESSION_COOKIE)?.value));
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }


  const weddings = await sql`
    SELECT e.id, e.type, e.status, e.event_date AS fecha, e.budget_id AS "idPresupuesto", e.created_at,
      w.name AS nombre, w.email, COALESCE(w.identity_document_type, 'nif') AS "tipoDocumentoIdentidad",
      w.identity_document AS "documentoIdentidad",
      w.groom_phone AS "telNovio", w.bride_phone AS "telNovia",
      w.location AS lugar, w.bride_name AS novia, w.groom_name AS novio,
      w.ceremony_location AS ceremonia,
      w.groom_departure_time AS "horaSalidaNovio", w.bride_departure_time AS "horaSalidaNovia",
      w.ceremony_time AS "horaCeremonia", w.cocktail_time AS "horaCoctel",
      w.open_bar_time AS "horaBarraLibre", w.details AS detalles, w.package_type AS "tipoPack",
      w.wedding_service AS "servicioBoda", w.wedding_extra AS "extraBoda", w.wedding_extra_price AS "precioExtraBoda", w.wedding_discount AS "descuentoBoda",
      w.prewedding_service AS "servicioPreboda", w.prewedding_extra AS "extraPreboda", w.prewedding_extra_price AS "precioExtraPreboda",
      w.postwedding_service AS "servicioPostboda", w.postwedding_extra AS "extraPostboda", w.postwedding_extra_price AS "precioExtraPostboda",
      (SELECT pe.event_date FROM events pe WHERE pe.parent_event_id = e.id AND pe.type = 'prewedding') AS "fechaPreboda",
      w.prewedding_location AS "lugarPreboda", w.prewedding_details AS "detallesPreboda",
      (SELECT pe.event_date FROM events pe WHERE pe.parent_event_id = e.id AND pe.type = 'postwedding') AS "fechaPostboda",
      w.postwedding_location AS "lugarPostboda", w.postwedding_details AS "detallesPostboda"
    FROM events e
    JOIN wedding_requests w ON w.event_id = e.id
    WHERE e.type = 'wedding' AND e.status IN ('pending', 'confirmed')
    ORDER BY e.created_at DESC LIMIT 500;
  `;
  const productions = await sql`
    SELECT e.id, e.type, e.status, e.event_date AS fecha, e.budget_id AS "idPresupuesto", e.created_at,
      p.name AS nombre, p.email, COALESCE(p.identity_document_type, 'nif') AS "tipoDocumentoIdentidad",
      p.identity_document AS "documentoIdentidad",
      p.phone AS telefono, p.project_type AS tipo, p.budget AS presupuesto,
      p.location AS lugar, p.details AS detalles,
      p.camera_setup AS "setupCamara", p.camera_price AS "precioCamara",
      p.drone_setup AS "setupDrone", p.drone_price AS "precioDrone",
      p.lighting_setup AS "setupIluminacion", p.lighting_price AS "precioIluminacion",
      p.sound_setup AS "setupSonido", p.sound_price AS "precioSonido",
      p.delivery_format AS "formatoEntrega", p.delivery_price AS "precioFormato",
      p.extra_staff AS "personalExtra", p.extra_staff_price AS "precioPersonalExtra",
      p.logistics AS logistica, p.logistics_price AS "precioLogistica", p.tax_percent AS "taxPercent"
    FROM events e
    JOIN production_requests p ON p.event_id = e.id
    WHERE e.type = 'production' AND e.status IN ('pending', 'confirmed')
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


  const requestType = type as RequestType;

  if (action === 'confirm') {
    const [manualBlock] = await sql`
      SELECT e.id FROM events e
      WHERE (e.id = ${id} OR e.parent_event_id = ${id})
        AND e.status = 'pending'
        AND EXISTS (
          SELECT 1 FROM calendar_blocks b
          WHERE e.event_date >= to_char(b.start_date, 'YYYY-MM-DD')
            AND e.event_date <= to_char(b.end_date, 'YYYY-MM-DD')
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
      'nombre', 'email', 'fecha', 'tipoDocumentoIdentidad', 'documentoIdentidad', 'telNovio', 'telNovia', 'telefono', 'lugar',
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
    if (values.documentoIdentidad.length > 32) {
      return NextResponse.json({ error: 'El documento de identidad no puede superar los 32 caracteres.' }, { status: 400 });
    }

    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    const hasValidDate = isValidDate(values.fecha);
    if (!isIdentityDocumentType(values.tipoDocumentoIdentidad)) {
      return NextResponse.json({ error: 'El tipo de documento no es válido.' }, { status: 400 });
    }
    const normalizedDocument = normalizeSpanishTaxId(values.documentoIdentidad);
    if (normalizedDocument && !isValidIdentityDocument(values.tipoDocumentoIdentidad, normalizedDocument)) {
      return NextResponse.json({
        error: values.tipoDocumentoIdentidad === 'passport'
          ? 'El pasaporte debe tener entre 5 y 20 letras o números.'
          : 'El documento debe ser un DNI, NIE o CIF español válido.',
      }, { status: 400 });
    }
    const documentType = normalizedDocument ? values.tipoDocumentoIdentidad : null;
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
          UPDATE events SET event_date = ${values.fecha}, updated_at = NOW()
          WHERE id = ${id} AND type = 'wedding'
          RETURNING id
        )
        UPDATE wedding_requests AS w SET
          name = ${values.nombre.trim()}, email = ${values.email.trim()},
          identity_document_type = ${documentType},
          identity_document = ${setNullValue(normalizedDocument)},
          groom_phone = ${values.telNovio.trim()}, bride_phone = ${values.telNovia.trim()},
          groom_name = ${setNullValue(values.novio)},
          groom_departure_time = ${setNullValue(values.horaSalidaNovio)},
          bride_name = ${setNullValue(values.novia)},
          bride_departure_time = ${setNullValue(values.horaSalidaNovia)},
          ceremony_location = ${setNullValue(values.ceremonia)},
          ceremony_time = ${setNullValue(values.horaCeremonia)},
          location = ${setNullValue(values.lugar)},
          cocktail_time = ${setNullValue(values.horaCoctel)},
          open_bar_time = ${setNullValue(values.horaBarraLibre)},
          details = ${values.detalles.trim()}, package_type = ${values.tipoPack},
          wedding_service = ${values.servicioBoda},
          wedding_extra = ${setNullValue(values.extraBoda)},
          wedding_extra_price = ${values.precioExtraBoda === '' ? null : Number(values.precioExtraBoda)},
          wedding_discount = ${values.descuentoBoda === '' ? null : Number(values.descuentoBoda)},
          prewedding_service = ${values.servicioPreboda},
          prewedding_location = ${setNullValue(values.lugarPreboda)},
          prewedding_details = ${setNullValue(values.detallesPreboda)},
          prewedding_extra = ${setNullValue(values.extraPreboda)},
          prewedding_extra_price = ${values.precioExtraPreboda === '' ? null : Number(values.precioExtraPreboda)},
          postwedding_service = ${values.servicioPostboda},
          postwedding_location = ${setNullValue(values.lugarPostboda)},
          postwedding_details = ${setNullValue(values.detallesPostboda)},
          postwedding_extra = ${setNullValue(values.extraPostboda)},
          postwedding_extra_price = ${values.precioExtraPostboda === '' ? null : Number(values.precioExtraPostboda)}
        FROM updated_event AS e
        WHERE w.event_id = e.id
        RETURNING w.event_id;
      `
      : await sql`
        WITH updated_event AS (
          UPDATE events SET event_date = ${values.fecha}, updated_at = NOW()
          WHERE id = ${id} AND type = 'production'
          RETURNING id
        )
        UPDATE production_requests AS p SET
          name = ${values.nombre.trim()}, email = ${values.email.trim()},
          identity_document_type = ${documentType},
          identity_document = ${setNullValue(normalizedDocument)}, phone = ${values.telefono.trim()},
          project_type = ${values.tipo.trim()}, budget = ${values.presupuesto.trim()},
          location = ${values.lugar.trim()}, details = ${values.detalles.trim()},
          camera_setup = ${values.setupCamara.trim() || null}, camera_price = ${values.precioCamara.trim() === '' ? null : Number(values.precioCamara)},
          drone_setup = ${values.setupDrone.trim() || null}, drone_price = ${values.precioDrone.trim() === '' ? null : Number(values.precioDrone)},
          lighting_setup = ${values.setupIluminacion.trim() || null}, lighting_price = ${values.precioIluminacion.trim() === '' ? null : Number(values.precioIluminacion)},
          sound_setup = ${values.setupSonido.trim() || null}, sound_price = ${values.precioSonido.trim() === '' ? null : Number(values.precioSonido)},
          delivery_format = ${values.formatoEntrega.trim() || null}, delivery_price = ${values.precioFormato.trim() === '' ? null : Number(values.precioFormato)},
          extra_staff = ${values.personalExtra.trim() || null}, extra_staff_price = ${values.precioPersonalExtra.trim() === '' ? null : Number(values.precioPersonalExtra)},
          logistics = ${values.logistica.trim() || null}, logistics_price = ${values.precioLogistica.trim() === '' ? null : Number(values.precioLogistica)},
          tax_percent = ${values.taxPercent === '' ? null : Number(values.taxPercent)}
        FROM updated_event AS e
        WHERE p.event_id = e.id
        RETURNING p.event_id;
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
          await sql`DELETE FROM events
            WHERE parent_event_id = ${id} AND type = ${secondaryEvent.type};`;
          continue;
        }

        const savedEvent = await sql`
          INSERT INTO events (type, event_date, status, parent_event_id, decided_at)
          SELECT ${secondaryEvent.type}, ${secondaryEvent.date}, parent.status, parent.id,
            CASE WHEN parent.status = 'pending' THEN NULL ELSE COALESCE(parent.decided_at, NOW()) END
          FROM events parent
          WHERE parent.id = ${id} AND parent.type = 'wedding'
          ON CONFLICT (parent_event_id, type) WHERE parent_event_id IS NOT NULL
          DO UPDATE SET event_date = EXCLUDED.event_date, updated_at = NOW()
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
      SELECT p.camera_setup AS setup_camara, p.camera_price AS precio_camara,
        p.drone_setup AS setup_drone, p.drone_price AS precio_drone,
        p.lighting_setup AS setup_iluminacion, p.lighting_price AS precio_iluminacion,
        p.sound_setup AS setup_sonido, p.sound_price AS precio_sonido,
        p.delivery_format AS formato_entrega, p.delivery_price AS precio_formato,
        p.extra_staff AS personal_extra, p.extra_staff_price AS precio_personal_extra,
        p.logistics AS logistica, p.logistics_price AS precio_logistica, p.tax_percent
      FROM production_requests p
      JOIN events e ON e.id = p.event_id
      WHERE e.id = ${id} AND e.type = 'production' AND e.status = 'pending';
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
  const nextStatus = isConfirming ? 'confirmed' : 'rejected';
  const result: Array<Record<string, unknown>> = isConfirming
    ? await sql`
      WITH current_year AS MATERIALIZED (
        SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS year
      ), candidate AS MATERIALIZED (
        SELECT id, type, event_date, budget_id
        FROM events
        WHERE id = ${id} AND type = ${requestType} AND status = 'pending'
        FOR UPDATE
      ), allocation AS (
        INSERT INTO annual_budget_counters (year, last_number)
        SELECT current_year.year, 1
        FROM candidate CROSS JOIN current_year
        WHERE candidate.budget_id IS NULL
        ON CONFLICT (year) DO UPDATE
        SET last_number = annual_budget_counters.last_number + 1
        WHERE annual_budget_counters.last_number < 9999
        RETURNING year, last_number
      ), decision AS (
        UPDATE events ev SET
          status = 'confirmed',
          budget_id = COALESCE(
            ev.budget_id,
            allocation.year::TEXT || '-' || LPAD(allocation.last_number::TEXT, 4, '0')
          ),
          updated_at = NOW(),
          decided_at = NOW()
        FROM candidate
        LEFT JOIN allocation ON TRUE
        WHERE ev.id = candidate.id
          AND (candidate.budget_id IS NOT NULL OR allocation.last_number IS NOT NULL)
        RETURNING ev.id, ev.type, ev.event_date
      ), related_decisions AS (
        UPDATE events child SET status = 'confirmed', updated_at = NOW(), decided_at = NOW()
        FROM decision
        WHERE decision.type = 'wedding' AND child.parent_event_id = decision.id
        RETURNING child.id
      )
      SELECT decision.event_date AS fecha, COALESCE(wedding.email, production.email) AS email,
        COALESCE(wedding.name, production.name) AS nombre, FALSE AS "numberLimitReached"
      FROM decision
      LEFT JOIN wedding_requests wedding ON decision.type = 'wedding' AND wedding.event_id = decision.id
      LEFT JOIN production_requests production ON decision.type = 'production' AND production.event_id = decision.id
      UNION ALL
      SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, TRUE
      FROM candidate
      WHERE candidate.budget_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM allocation)
      LIMIT 1;
    `
    : requestType === 'wedding'
      ? await sql`
        WITH decision AS (
          UPDATE events SET status = 'rejected', updated_at = NOW(), decided_at = NOW()
          WHERE id = ${id} AND type = 'wedding' AND status = 'pending'
          RETURNING id, event_date
        ), related_decisions AS (
          UPDATE events child SET status = 'rejected', updated_at = NOW(), decided_at = NOW()
          FROM decision
          WHERE child.parent_event_id = decision.id
          RETURNING child.id
        )
        SELECT decision.event_date AS fecha, wedding.email, wedding.name AS nombre, FALSE AS "numberLimitReached"
        FROM decision JOIN wedding_requests wedding ON wedding.event_id = decision.id;
      `
      : await sql`
        WITH decision AS (
          UPDATE events SET status = 'rejected', updated_at = NOW(), decided_at = NOW()
          WHERE id = ${id} AND type = 'production' AND status = 'pending'
          RETURNING id, event_date
        )
        SELECT decision.event_date AS fecha, production.email, production.name AS nombre, FALSE AS "numberLimitReached"
        FROM decision JOIN production_requests production ON production.event_id = decision.id;
      `;

  if (result.length === 0) {
    return NextResponse.json({ error: 'La solicitud ya no está pendiente.' }, { status: 409 });
  }
  if (result[0].numberLimitReached === true) {
    return NextResponse.json({ error: 'Se alcanzó el límite anual de 9999 presupuestos.' }, { status: 409 });
  }

  const affectedRequest = result[0];
  await sendRequestDecisionNotification({
    type: requestType,
    email: typeof affectedRequest.email === 'string'
      ? affectedRequest.email
      : null,
    nombre: typeof affectedRequest.nombre === 'string'
      ? affectedRequest.nombre
      : '',
    fecha: typeof affectedRequest.fecha === 'string'
      ? affectedRequest.fecha
      : '',
    decision: isConfirming ? 'confirmed' : 'rejected',
  });

  return NextResponse.json({ success: true, action });
}