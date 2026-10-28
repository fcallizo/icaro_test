import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  PRIVATE_SESSION_COOKIE,
  readPrivateSession,
} from '@/lib/private-auth';

type CinemaOfferPayload = {
  id?: string;
  title?: unknown;
  description?: unknown;
  price?: unknown;
  oldPrice?: unknown;
  visible?: unknown;
  position?: unknown;
};

async function isAuthenticated(request: NextRequest) {
  return Boolean(
    await readPrivateSession(
      request.cookies.get(PRIVATE_SESSION_COOKIE)?.value,
    ),
  );
}

function parsePrice(value: unknown): number | null | undefined {
  if (value === null || value === '') return null;

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    return undefined;
  }

  return value;
}

function validateOffer(payload: CinemaOfferPayload) {
  const title =
    typeof payload.title === 'string' ? payload.title.trim() : '';

  const description =
    typeof payload.description === 'string'
      ? payload.description.trim()
      : '';

  const price = parsePrice(payload.price);
  const oldPrice = parsePrice(payload.oldPrice);

  if (!title || title.length > 120) {
    return { error: 'El título es obligatorio y no puede superar 120 caracteres.' };
  }

  if (description.length > 2000) {
    return { error: 'La descripción no puede superar 2000 caracteres.' };
  }

  if (price === undefined || oldPrice === undefined) {
    return { error: 'Los precios deben ser números enteros iguales o superiores a cero, o estar vacíos.' };
  }

  if (payload.visible !== undefined && typeof payload.visible !== 'boolean') {
    return { error: 'El estado de visibilidad no es válido.' };
  }

  const visible = payload.visible === true;
  const position = payload.position;

  if (
    visible &&
    (!Number.isInteger(position) ||
      typeof position !== 'number' ||
      position < 1 ||
      position > 4)
  ) {
    return { error: 'Una oferta visible debe tener una posición del 1 al 4.' };
  }

  if (
    price !== null &&
    oldPrice !== null &&
    oldPrice <= price
  ) {
    return { error: 'El precio anterior debe ser superior al precio actual.' };
  }

  return {
    value: {
      title,
      description,
      price,
      oldPrice,
      visible,
      position: visible ? position as number : 5,
    },
  };
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada.' },
      { status: 503 },
    );
  }

  const offers = await sql`
    SELECT
      id,
      position,
      title,
      description,
      price,
      old_price AS "oldPrice",
      visible,
      updated_at AS "updatedAt"
    FROM cinema_offers
    ORDER BY visible DESC, position ASC, updated_at DESC
  `;

  return NextResponse.json({ offers });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada.' },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
  }

  const validated = validateOffer(payload as CinemaOfferPayload);

  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const offer = validated.value;

  // Las ofertas nuevas siempre se crean ocultas.
  const [created] = await sql`
    INSERT INTO cinema_offers (
      position, title, description, price, old_price, visible, updated_at
    )
    VALUES (
      5,
      ${offer.title},
      ${offer.description},
      ${offer.price},
      ${offer.oldPrice},
      FALSE,
      NOW()
    )
    RETURNING
      id,
      position,
      title,
      description,
      price,
      old_price AS "oldPrice",
      visible,
      updated_at AS "updatedAt"
  `;

  return NextResponse.json({ offer: created }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada.' },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null) as CinemaOfferPayload | null;

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)
  ) {
    return NextResponse.json(
      { error: 'El identificador de la oferta no es válido.' },
      { status: 400 },
    );
  }

  const validated = validateOffer(payload);

  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const offer = validated.value;

  const [existing] = await sql`
    SELECT id
    FROM cinema_offers
    WHERE id = ${payload.id}
    LIMIT 1
  `;

  if (!existing) {
    return NextResponse.json(
      { error: 'La oferta no existe.' },
      { status: 404 },
    );
  }

  // Comprueba que la posición no esté ocupada por otra oferta visible.
  if (offer.visible) {
    const [duplicate] = await sql`
      SELECT id
      FROM cinema_offers
      WHERE visible = TRUE
        AND position = ${offer.position}
        AND id <> ${payload.id}
      LIMIT 1
    `;

    if (duplicate) {
      return NextResponse.json(
        { error: 'Esa posición ya está ocupada. Elige otra posición libre.' },
        { status: 409 },
      );
    }
  }

  const [updated] = await sql`
    UPDATE cinema_offers
    SET
      position = ${offer.position},
      title = ${offer.title},
      description = ${offer.description},
      price = ${offer.price},
      old_price = ${offer.oldPrice},
      visible = ${offer.visible},
      updated_at = NOW()
    WHERE id = ${payload.id}
    RETURNING
      id,
      position,
      title,
      description,
      price,
      old_price AS "oldPrice",
      visible,
      updated_at AS "updatedAt"
  `;

  return NextResponse.json({ offer: updated });
}