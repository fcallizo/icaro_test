import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { sql } from '@/lib/db';
import { consumeRateLimitBuckets, createRateLimitBucket } from '@/lib/rate-limit';
import { sendRequestNotification, sendRequestWeddingNotification } from '@/lib/request-notifications';
import { DEFAULT_WEDDING_PRICES, PACK_OPTIONS, readWeddingPrices } from '@/lib/wedding-form';
import { DEFAULT_CINEMA_PRICES, CinemaPrice } from '@/lib/cinema-forms';

const MAX_REQUEST_BODY_BYTES = 16 * 1024;
const REQUEST_RATE_LIMIT = { maxAttempts: 5, windowSeconds: 900, cooldownSeconds: 900 };

type JsonBodyResult = { value: unknown } | { error: string; status: number };

type WeddingSubmission = {
  type: 'wedding';
  nombre: string;
  email: string;
  telNovia: string;
  fecha: string;
  tipoPack: string;
  ceremonia: string;
  detalles: string;
};

type ProductionSubmission = {
  type: 'production';
  nombre: string;
  email: string;
  telefono: string;
  fecha: string;
  tipo: string;
  presupuesto: string;
  detalles: string;
};

type RequestSubmission = WeddingSubmission | ProductionSubmission;

async function readJsonBody(request: NextRequest): Promise<JsonBodyResult> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { error: 'El formato de la solicitud no es válido.', status: 400 };
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
    return { error: 'La solicitud supera el tamaño máximo permitido.', status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: 'El cuerpo de la solicitud está vacío.', status: 400 };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BODY_BYTES) {
      await reader.cancel();
      return { error: 'La solicitud supera el tamaño máximo permitido.', status: 413 };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { value: JSON.parse(new TextDecoder().decode(body)) };
  } catch {
    return { error: 'El cuerpo de la solicitud no contiene JSON válido.', status: 400 };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTextField(
  payload: Record<string, unknown>,
  field: string,
  maxLength: number,
  required = false,
) {
  const rawValue = payload[field];
  if (rawValue === undefined && !required) return '';
  if (typeof rawValue !== 'string') return null;

  const value = rawValue.trim();
  if ((required && !value) || value.length > maxLength) return null;
  return value;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getClientIp(request: NextRequest) {
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = request.ip ?? request.headers.get('x-real-ip') ?? forwardedIp;
  return ip && isIP(ip) ? ip : 'unknown';
}

function validateSubmission(payload: unknown): { value: RequestSubmission } | { error: string } {
  if (!isRecord(payload)) return { error: 'La solicitud no tiene un formato válido.' };

  const type = payload.type;
  if (type !== 'wedding' && type !== 'production') {
    return { error: 'Tipo de solicitud no válido.' };
  }

  const allowedFields = type === 'wedding'
    ? ['type', 'companyWebsite', 'nombre', 'email', 'telNovia', 'fecha', 'tipoPack', 'ceremonia', 'detalles']
    : ['type', 'companyWebsite', 'nombre', 'email', 'telefono', 'fecha', 'tipo', 'presupuesto', 'detalles'];
  if (Object.keys(payload).some((field) => !allowedFields.includes(field))) {
    return { error: 'La solicitud contiene campos no válidos.' };
  }

  const website = readTextField(payload, 'companyWebsite', 500);
  if (website === null) return { error: 'La solicitud no tiene un formato válido.' };
  if (website) return { error: 'No se pudo validar la solicitud.' };

  const nombre = readTextField(payload, 'nombre', 120, true);
  const email = readTextField(payload, 'email', 254, true);
  const fecha = readTextField(payload, 'fecha', 10, true);
  const detalles = readTextField(payload, 'detalles', 3000);
  if (nombre === null) return { error: 'El nombre es obligatorio y no puede superar los 120 caracteres.' };
  if (email === null || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Introduce un email de contacto válido.' };
  }
  if (fecha === null || !isValidDate(fecha)) return { error: 'Introduce una fecha válida.' };
  if (detalles === null) return { error: 'Los detalles no pueden superar los 3000 caracteres.' };

  if (type === 'wedding') {
    const telNovia = readTextField(payload, 'telNovia', 32, true);
    const tipoPack = readTextField(payload, 'tipoPack', 32, true);
    const ceremonia = readTextField(payload, 'ceremonia', 200);
    if (telNovia === null || !isValidPhoneNumber(telNovia)) {
      return { error: 'Introduce un teléfono de contacto válido.' };
    }
    if (tipoPack === null || !PACK_OPTIONS.some((option) => option.value === tipoPack)) {
      return { error: 'Selecciona una opción de reportaje válida.' };
    }
    if (ceremonia === null) return { error: 'El lugar de la ceremonia no puede superar los 200 caracteres.' };

    return {
      value: { type, nombre, email, telNovia, fecha, tipoPack, ceremonia, detalles },
    };
  }

  const telefono = readTextField(payload, 'telefono', 32, true);
  const tipo = readTextField(payload, 'tipo', 120, true);
  const presupuesto = readTextField(payload, 'presupuesto', 13, true);
  if (telefono === null || !isValidPhoneNumber(telefono)) {
    return { error: 'Introduce un teléfono de contacto válido.' };
  }
  if (tipo === null) return { error: 'El tipo de producción es obligatorio y no puede superar los 120 caracteres.' };
  if (
    presupuesto === null
    || !/^\d{1,10}(?:\.\d{1,2})?$/.test(presupuesto)
    || !Number.isFinite(Number(presupuesto))
    || Number(presupuesto) > 9999999999.99
  ) {
    return { error: 'El presupuesto debe ser un importe válido igual o superior a cero.' };
  }

  return {
    value: { type, nombre, email, telefono, fecha, tipo, presupuesto, detalles },
  };
}

export async function GET() {
  if (!sql) {
    return NextResponse.json({
      requests: [],
      blockedRanges: [],
      unifyCalendars: false,
      weddingPrices: DEFAULT_WEDDING_PRICES,
      cinemaPrices: DEFAULT_CINEMA_PRICES,
      weddingOffers: [],
      dbConfigured: false,
    }, { status: 200 });
  }

  const eventRows = await sql`SELECT id, fecha, status, tipo AS type FROM eventos WHERE status = 'confirmed' ORDER BY created_at DESC LIMIT 100;`;
  const blockedRanges = await sql`
    SELECT to_char(start_date, 'YYYY-MM-DD') AS "startDate",
      to_char(end_date, 'YYYY-MM-DD') AS "endDate"
    FROM calendar_blocks ORDER BY start_date;
  `;
  const [calendarSetting] = await sql`SELECT boolean_value FROM app_settings WHERE setting_key = 'unify_calendars' LIMIT 1;`;
  const weddingPriceRows = (await sql`
    SELECT setting_key, numeric_value FROM app_settings WHERE setting_key IN (
      'wedding_photo_price',
      'wedding_video_price',
      'wedding_complete_price',
      'wedding_complementary_photo_price',
      'wedding_complementary_video_price',
      'wedding_complementary_complete_price',
      'wedding_discount_duo',
      'wedding_discount_trio'
    )
  `) as Array<{ setting_key: string; numeric_value: number | string | null }>;

  const cinemaPriceRows = (await sql`
    SELECT title, price, old_price as "originalPrice", description 
    FROM cinema_offers 
    WHERE visible
    ORDER BY position ASC`) as CinemaPrice[];

  const weddingOffers = await sql`
    SELECT
      id,
      kind,
      category,
      title,
      NULLIF(variant, '') AS variant,
      description,
      NULLIF(page_range, '') AS "pageRange",
      price,
      old_price AS "oldPrice"
    FROM wedding_offers
    WHERE visible = TRUE
    ORDER BY sort_order ASC, title ASC, variant ASC;
  `;

  return NextResponse.json({
    requests: eventRows,
    blockedRanges,
    unifyCalendars: Boolean(calendarSetting?.boolean_value),
    weddingPrices: readWeddingPrices(weddingPriceRows),
    cinemaPrices: cinemaPriceRows,
    weddingOffers: weddingOffers.map((offer) => ({
      ...offer,
      price: offer.price === null ? null : Number(offer.price),
      oldPrice: offer.oldPrice === null ? null : Number(offer.oldPrice),
    })),
    dbConfigured: true,
  }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if ('error' in body) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }

  const validation = validateSubmission(body.value);
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const submission = validation.value;

  if (!sql) {
    const mock = {
      id: `mock-${Date.now()}`,
      status: 'pending',
      ...submission,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ request: mock, dbConfigured: false }, { status: 200 });
  }

  const retryAfter = await consumeRateLimitBuckets([{
    bucketKey: createRateLimitBucket('public-request-ip', getClientIp(request)),
    ...REQUEST_RATE_LIMIT,
  }]);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: 'Se han enviado demasiadas solicitudes. Inténtalo de nuevo más tarde.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const { type, nombre, email, fecha } = submission;
  const [blockedDate] = await sql`
    SELECT id FROM calendar_blocks
    WHERE start_date <= ${fecha}::date AND end_date >= ${fecha}::date
    LIMIT 1;
  `;
  if (blockedDate) {
    return NextResponse.json({ error: 'Esa fecha no está disponible. Elige otra para tu solicitud.' }, { status: 409 });
  }

  if (type === 'wedding') {
    const { telNovia, ceremonia, detalles, tipoPack } = submission;
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const eventId = randomUUID();

    const result = await sql`
      WITH new_event AS (
        INSERT INTO eventos (id, tipo, fecha, status)
        VALUES (${eventId}, 'wedding', ${fecha || ''}, 'pending')
        RETURNING id
      ), new_details AS (
        INSERT INTO wedding_requests (
          evento_id, nombre, email, tel_novia, ceremonia, detalles, tipo_pack, customer_form_token_hash
        )
        SELECT id, ${nombre}, ${email}, ${telNovia}, ${ceremonia}, ${detalles}, ${tipoPack}, ${tokenHash}
        FROM new_event
        RETURNING evento_id
      )
      SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
        w.nombre, w.email, w.tel_novia AS "telNovia", w.ceremonia, w.detalles, w.tipo_pack
      FROM new_details d
      JOIN eventos e ON e.id = d.evento_id
      JOIN wedding_requests w ON w.evento_id = e.id;
    `;

    await sendRequestNotification({ type: 'wedding', nombre, fecha });
    await sendRequestWeddingNotification({
        type: 'wedding',
        email: email,
        nombre: nombre,
        fecha: fecha,
        token: token,
      });
    
    return NextResponse.json({
      request: { ...result[0], type: 'wedding' },
      customerFormPath: `/solicitud-boda/${token}`,
      dbConfigured: true,
    }, { status: 201 });
  }

  const { telefono, tipo, presupuesto, detalles } = submission;
  const eventId = randomUUID();

  const result = await sql`
    WITH new_event AS (
      INSERT INTO eventos (id, tipo, fecha, status)
      VALUES (${eventId}, 'production', ${fecha || ''}, 'pending')
      RETURNING id
    ), new_details AS (
      INSERT INTO production_requests (evento_id, nombre, email, telefono, tipo, presupuesto, detalles)
      SELECT id, ${nombre || ''}, ${email}, ${telefono || ''}, ${tipo || ''}, ${presupuesto || ''}, ${detalles || ''}
      FROM new_event
      RETURNING evento_id
    )
    SELECT e.id, e.tipo AS type, e.status, e.fecha, e.created_at,
      p.nombre, p.email, p.telefono, p.tipo, p.presupuesto, p.detalles
    FROM new_details d
    JOIN eventos e ON e.id = d.evento_id
    JOIN production_requests p ON p.evento_id = e.id;
  `;

  await sendRequestNotification({ type: 'production', nombre, fecha });
  return NextResponse.json({ request: { ...result[0], type: 'production' }, dbConfigured: true }, { status: 201 });
}
