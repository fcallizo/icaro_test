import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, getPrivateSessionUser } from '@/lib/private-auth';
import { sendRequestDecisionNotification } from '@/lib/request-notifications';
import { setNullValue } from '@/lib/properties';
import { isValidIdentityDocument, normalizeSpanishTaxId } from '@/lib/spanish-tax-id';
import type { IdentityDocumentType } from '@/lib/spanish-tax-id';

type RequestType = 'wedding' | 'production';

const EDITABLE_FIELDS = [
  'nombre', 'email', 'fecha', 'tipoDocumentoIdentidad', 'documentoIdentidad', 'telNovio', 'telNovia', 'telefono', 'lugar', 'hora',
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

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isIdentityDocumentType(value: unknown): value is IdentityDocumentType {
  return value === 'nif' || value === 'passport';
}

function validateRequestValues(requestType: RequestType, rawValues: unknown) {
  if (!rawValues || typeof rawValues !== 'object' || Array.isArray(rawValues)) {
    return { error: 'Los datos del evento no son válidos.' } as const;
  }

  const raw = rawValues as Record<string, unknown>;
  if (EDITABLE_FIELDS.some((field) => typeof raw[field] !== 'string' || raw[field].length > 10000)) {
    return { error: 'Los datos del evento no son válidos.' } as const;
  }
  const values = raw as Record<string, string>;
  if (values.documentoIdentidad.length > 32) {
    return { error: 'El documento de identidad no puede superar los 32 caracteres.' } as const;
  }
  if (!isIdentityDocumentType(values.tipoDocumentoIdentidad)) {
    return { error: 'El tipo de documento no es válido.' } as const;
  }

  const normalizedDocument = normalizeSpanishTaxId(values.documentoIdentidad);
  if (normalizedDocument && !isValidIdentityDocument(values.tipoDocumentoIdentidad, normalizedDocument)) {
    return {
      error: values.tipoDocumentoIdentidad === 'passport'
        ? 'El pasaporte debe tener entre 5 y 20 letras o números.'
        : 'El documento debe ser un DNI, NIE o CIF español válido.',
    } as const;
  }
  if (!values.nombre.trim()
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    || !isValidDate(values.fecha)) {
    return { error: 'Nombre, email y fecha son obligatorios y deben ser válidos.' } as const;
  }
  if (requestType === 'wedding'
    && [values.fechaPreboda.trim(), values.fechaPostboda.trim()].some((date) => date !== '' && !isValidDate(date))) {
    return { error: 'Las fechas de preboda y postboda deben ser válidas.' } as const;
  }
  if (requestType === 'wedding' && (!values.telNovio.trim() || !values.telNovia.trim())) {
    return { error: 'Los teléfonos son obligatorios.' } as const;
  }
  if (requestType === 'production'
    && (!values.telefono.trim() || !values.presupuesto.trim()
      || !Number.isFinite(Number(values.presupuesto)) || Number(values.presupuesto) < 0)) {
    return { error: 'El teléfono y un presupuesto válido son obligatorios.' } as const;
  }

  const amountFields = ['precioCamara', 'precioDrone', 'precioIluminacion', 'precioSonido', 'precioFormato', 'precioPersonalExtra', 'precioLogistica'];
  if (requestType === 'production' && amountFields.some((field) =>
    values[field].trim() !== '' && (!Number.isFinite(Number(values[field])) || Number(values[field]) < 0))) {
    return { error: 'Los importes técnicos deben ser números iguales o superiores a cero.' } as const;
  }
  if (requestType === 'production' && !['', '0', '21'].includes(values.taxPercent)) {
    return { error: 'El IVA debe ser 0 % o 21 %.' } as const;
  }

  return {
    values,
    normalizedDocument,
    documentType: normalizedDocument ? values.tipoDocumentoIdentidad : null,
  } as const;
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
    SELECT e.id, e.type, e.status, e.event_date AS fecha, e.budget_id AS "idPresupuesto",
      e.created_at, e.decided_at, e.finished_at,
      w.name AS nombre, w.email, COALESCE(w.identity_document_type, 'nif') AS "tipoDocumentoIdentidad",
      w.identity_document AS "documentoIdentidad",
      w.groom_phone AS "telNovio", w.bride_phone AS "telNovia",
      w.location AS lugar, w.bride_location AS novia, w.groom_location AS novio,
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
      WHERE e.type = 'wedding'
      AND (
        e.id IN ( 
          SELECT id
          FROM events e2
          WHERE e2.type = 'wedding' 
            AND e2.event_date::DATE > CURRENT_DATE - 
              ((SELECT numeric_value FROM app_settings WHERE setting_key = 'history_range' LIMIT 1) * INTERVAL '1 month')
            AND e2.status in ('finished', 'rejected')
            ORDER BY created_at DESC LIMIT 500
        )
        OR e.id IN (
          SELECT id FROM events
          WHERE type = 'wedding' AND status IN ('pending', 'confirmed')
          ORDER BY created_at DESC LIMIT 500
        )
      )
    ORDER BY e.created_at DESC;
  `;
  const productions = await sql`
    SELECT e.id, e.type, e.status, e.event_date AS fecha, e.budget_id AS "idPresupuesto",
      e.created_at, e.decided_at, e.finished_at,
      p.name AS nombre, p.email, COALESCE(p.identity_document_type, 'nif') AS "tipoDocumentoIdentidad",
      p.identity_document AS "documentoIdentidad",
      p.phone AS telefono, p.project_type AS tipo, p.budget AS presupuesto,
      p.location AS lugar, p.event_time AS hora, p.details AS detalles,
      p.camera_setup AS "setupCamara", p.camera_price AS "precioCamara",
      p.drone_setup AS "setupDrone", p.drone_price AS "precioDrone",
      p.lighting_setup AS "setupIluminacion", p.lighting_price AS "precioIluminacion",
      p.sound_setup AS "setupSonido", p.sound_price AS "precioSonido",
      p.delivery_format AS "formatoEntrega", p.delivery_price AS "precioFormato",
      p.extra_staff AS "personalExtra", p.extra_staff_price AS "precioPersonalExtra",
      p.logistics AS logistica, p.logistics_price AS "precioLogistica", p.tax_percent AS "taxPercent"
    FROM events e
    JOIN production_requests p ON p.event_id = e.id
    WHERE e.type = 'production'
      AND (
        e.id IN ( 
          SELECT id
          FROM events e2
          WHERE e2.type = 'production' 
            AND e2.event_date::DATE > CURRENT_DATE - 
              ((SELECT numeric_value FROM app_settings WHERE setting_key = 'history_range' LIMIT 1) * INTERVAL '1 month')
            AND e2.status in ('finished', 'rejected')
            ORDER BY created_at DESC LIMIT 500
        )
        OR e.id IN (
          SELECT id FROM events
          WHERE type = 'production' AND status IN ('pending', 'confirmed')
          ORDER BY created_at DESC LIMIT 500
        )
      )
    ORDER BY e.created_at DESC;
  `;

  return NextResponse.json({ requests: [...weddings, ...productions] });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
    || (payload.type !== 'wedding' && payload.type !== 'production')) {
    return NextResponse.json({ error: 'El tipo de evento no es válido.' }, { status: 400 });
  }
  const requestType = payload.type as RequestType;
  const validation = validateRequestValues(requestType, payload.values);
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { values, normalizedDocument, documentType } = validation;
  const preweddingDate = values.fechaPreboda.trim() || null;
  const postweddingDate = values.fechaPostboda.trim() || null;
  const hasPreweddingDate = preweddingDate !== null;
  const hasPostweddingDate = postweddingDate !== null;
  const [dateConflict] = await sql`
    SELECT id FROM events
    WHERE status IN ('confirmed', 'finished')
      AND event_date IN (${values.fecha}, ${preweddingDate}, ${postweddingDate})
    LIMIT 1;
  `;
  if (dateConflict) {
    return NextResponse.json({ error: 'Ya existe un evento confirmado o finalizado en una de las fechas seleccionadas.' }, { status: 409 });
  }

  const [manualBlock] = await sql`
    SELECT id FROM calendar_blocks
    WHERE ${values.fecha}::date BETWEEN start_date AND end_date
      OR (${preweddingDate}::date IS NOT NULL AND ${preweddingDate}::date BETWEEN start_date AND end_date)
      OR (${postweddingDate}::date IS NOT NULL AND ${postweddingDate}::date BETWEEN start_date AND end_date)
    LIMIT 1;
  `;
  if (manualBlock) {
    return NextResponse.json({ error: 'No se puede crear el evento: una de sus fechas está bloqueada como no disponible.' }, { status: 409 });
  }

  const createdEvents = requestType === 'wedding'
    ? await sql`
      WITH current_year AS MATERIALIZED (
        SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS year
      ), allocation AS (
        INSERT INTO annual_budget_counters (year, last_number)
        SELECT year, 1 FROM current_year
        ON CONFLICT (year) DO UPDATE
        SET last_number = annual_budget_counters.last_number + 1
        WHERE annual_budget_counters.last_number < 9999
        RETURNING year, last_number
      ), created_event AS (
        INSERT INTO events (type, event_date, status, budget_id, decided_at)
        SELECT 'wedding', ${values.fecha}, 'confirmed',
          allocation.year::TEXT || '-' || LPAD(allocation.last_number::TEXT, 4, '0'), NOW()
        FROM allocation
        RETURNING id
      ), created_request AS (
        INSERT INTO wedding_requests (
          event_id, name, email, identity_document_type, identity_document, groom_phone, bride_phone,
          package_type, details, groom_location, groom_departure_time, bride_location, bride_departure_time,
          ceremony_location, ceremony_time, location, cocktail_time, open_bar_time, wedding_service,
          wedding_extra, wedding_extra_price, wedding_discount, prewedding_service, prewedding_location,
          prewedding_details, prewedding_extra, prewedding_extra_price, postwedding_service,
          postwedding_location, postwedding_details, postwedding_extra, postwedding_extra_price
        )
        SELECT created_event.id, ${values.nombre.trim()}, ${values.email.trim()}, ${documentType},
          ${setNullValue(normalizedDocument)}, ${values.telNovio.trim()}, ${values.telNovia.trim()},
          ${values.tipoPack}, ${values.detalles.trim()}, ${setNullValue(values.novio)},
          ${setNullValue(values.horaSalidaNovio)}, ${setNullValue(values.novia)},
          ${setNullValue(values.horaSalidaNovia)}, ${setNullValue(values.ceremonia)},
          ${setNullValue(values.horaCeremonia)}, ${setNullValue(values.lugar)},
          ${setNullValue(values.horaCoctel)}, ${setNullValue(values.horaBarraLibre)},
          ${values.servicioBoda}, ${setNullValue(values.extraBoda)},
          ${values.precioExtraBoda || null}, ${values.descuentoBoda || null}, ${values.servicioPreboda},
          ${setNullValue(values.lugarPreboda)}, ${setNullValue(values.detallesPreboda)},
          ${setNullValue(values.extraPreboda)}, ${values.precioExtraPreboda || null},
          ${values.servicioPostboda}, ${setNullValue(values.lugarPostboda)},
          ${setNullValue(values.detallesPostboda)}, ${setNullValue(values.extraPostboda)},
          ${values.precioExtraPostboda || null}
        FROM created_event
        RETURNING event_id
      ), created_pre_event AS (
        INSERT INTO events (type, event_date, status, parent_event_id, decided_at)
        SELECT 'prewedding', ${preweddingDate}, 'confirmed', created_event.id, NOW()
        FROM created_event
        WHERE ${hasPreweddingDate}
        RETURNING id
      ), created_post_event AS (
        INSERT INTO events (type, event_date, status, parent_event_id, decided_at)
        SELECT 'postwedding', ${postweddingDate}, 'confirmed', created_event.id, NOW()
        FROM created_event
        WHERE ${hasPostweddingDate}
        RETURNING id
      )
      SELECT event_id AS id FROM created_request;
    `
    : await sql`
      WITH current_year AS MATERIALIZED (
        SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS year
      ), allocation AS (
        INSERT INTO annual_budget_counters (year, last_number)
        SELECT year, 1 FROM current_year
        ON CONFLICT (year) DO UPDATE
        SET last_number = annual_budget_counters.last_number + 1
        WHERE annual_budget_counters.last_number < 9999
        RETURNING year, last_number
      ), created_event AS (
        INSERT INTO events (type, event_date, status, budget_id, decided_at)
        SELECT 'production', ${values.fecha}, 'confirmed',
          allocation.year::TEXT || '-' || LPAD(allocation.last_number::TEXT, 4, '0'), NOW()
        FROM allocation
        RETURNING id
      ), created_request AS (
        INSERT INTO production_requests (
          event_id, name, email, identity_document_type, identity_document, phone, project_type,
          budget, location, event_time, details, camera_setup, camera_price, drone_setup, drone_price,
          lighting_setup, lighting_price, sound_setup, sound_price, delivery_format, delivery_price,
          extra_staff, extra_staff_price, logistics, logistics_price, tax_percent
        )
        SELECT created_event.id, ${values.nombre.trim()}, ${values.email.trim()}, ${documentType},
          ${setNullValue(normalizedDocument)}, ${values.telefono.trim()}, ${values.tipo.trim()},
          ${values.presupuesto.trim()}, ${values.lugar.trim()}, ${setNullValue(values.hora)},
          ${values.detalles.trim()}, ${values.setupCamara.trim() || null},
          ${values.precioCamara.trim() === '' ? null : Number(values.precioCamara)},
          ${values.setupDrone.trim() || null},
          ${values.precioDrone.trim() === '' ? null : Number(values.precioDrone)},
          ${values.setupIluminacion.trim() || null},
          ${values.precioIluminacion.trim() === '' ? null : Number(values.precioIluminacion)},
          ${values.setupSonido.trim() || null},
          ${values.precioSonido.trim() === '' ? null : Number(values.precioSonido)},
          ${values.formatoEntrega.trim() || null},
          ${values.precioFormato.trim() === '' ? null : Number(values.precioFormato)},
          ${values.personalExtra.trim() || null},
          ${values.precioPersonalExtra.trim() === '' ? null : Number(values.precioPersonalExtra)},
          ${values.logistica.trim() || null},
          ${values.precioLogistica.trim() === '' ? null : Number(values.precioLogistica)},
          ${values.taxPercent === '' ? null : Number(values.taxPercent)}
        FROM created_event
        RETURNING event_id
      )
      SELECT event_id AS id FROM created_request;
    `;

  if (createdEvents.length === 0) {
    return NextResponse.json({ error: 'Se alcanzó el límite anual de 9999 presupuestos.' }, { status: 409 });
  }

  return NextResponse.json({ success: true, id: createdEvents[0].id }, { status: 201 });
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
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['wedding', 'production'].includes(type) || !['confirm', 'reject', 'update', 'finish'].includes(action)) {
    return NextResponse.json({ error: 'Acción o solicitud no válida.' }, { status: 400 });
  }


  const requestType = type as RequestType;

  if (action === 'update') {
    const validation = validateRequestValues(requestType, payload.values);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { values, normalizedDocument, documentType } = validation;

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
          groom_location = ${setNullValue(values.novio)},
          groom_departure_time = ${setNullValue(values.horaSalidaNovio)},
          bride_location = ${setNullValue(values.novia)},
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
          location = ${values.lugar.trim()}, event_time = ${setNullValue(values.hora)},
          details = ${values.detalles.trim()},
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

  if (action === 'finish') {
    const result = await sql`
      WITH finished_event AS (
        UPDATE events SET status = 'finished', finished_at = NOW(), updated_at = NOW()
        WHERE id = ${id} AND type = ${requestType} AND status = 'confirmed'
        RETURNING id, type
      ), finished_related_events AS (
        UPDATE events child SET status = 'finished', finished_at = NOW(), updated_at = NOW()
        FROM finished_event parent
        WHERE parent.type = 'wedding'
          AND child.parent_event_id = parent.id
          AND child.status = 'confirmed'
        RETURNING child.id
      )
      SELECT id FROM finished_event;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'El evento ya no está confirmado.' }, { status: 409 });
    }

    return NextResponse.json({ success: true, action });
  }

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