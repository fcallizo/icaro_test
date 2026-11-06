import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, getPrivateSessionUser } from '@/lib/private-auth';
import {
  WEDDING_OFFER_CATEGORIES,
  type WeddingOfferCategory,
} from '@/lib/wedding-form';

type OfferKind = 'extra' | 'album';

type OfferPayload = {
  id?: unknown;
  kind?: unknown;
  category?: unknown;
  title?: unknown;
  variant?: unknown;
  description?: unknown;
  pageRange?: unknown;
  price?: unknown;
  oldPrice?: unknown;
  visible?: unknown;
};

type OfferRow = {
  id: string;
  kind: OfferKind;
  category: WeddingOfferCategory;
  title: string;
  variant: string;
  description: string;
  pageRange: string;
  price: number | string | null;
  oldPrice: number | string | null;
  visible: boolean;
  sortOrder: number;
};

async function isAuthenticated(request: NextRequest) {
  return Boolean(await getPrivateSessionUser(request.cookies.get(PRIVATE_SESSION_COOKIE)?.value));
}

function parsePrice(value: unknown): number | null | undefined {
  if (value === null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 9999999999.99) {
    return undefined;
  }
  return Number(value.toFixed(2));
}

function validateOffer(payload: OfferPayload) {
  const kind = payload.kind;
  const category = WEDDING_OFFER_CATEGORIES.find(
    (candidate) => candidate === payload.category,
  );
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const variant = typeof payload.variant === 'string' ? payload.variant.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const pageRange = typeof payload.pageRange === 'string' ? payload.pageRange.trim() : '';
  const price = parsePrice(payload.price);
  const oldPrice = parsePrice(payload.oldPrice);

  if (kind !== 'extra' && kind !== 'album') {
    return { error: 'El tipo de extra no es válido.' };
  }
  if (kind === 'extra' && !category) {
    return { error: 'Selecciona una categoría válida para el extra.' };
  }
  if (!title || title.length > 120 || description.length > 1000) {
    return { error: 'El nombre es obligatorio (máximo 120 caracteres) y la descripción no puede superar 1000 caracteres.' };
  }
  if (kind === 'album' && (!variant || variant.length > 50 || !pageRange || pageRange.length > 80)) {
    return { error: 'Indica el nombre de la opción y el rango de páginas del álbum.' };
  }
  if (kind === 'extra' && (variant || pageRange)) {
    return { error: 'Los extras no pueden tener una opción ni un rango de páginas.' };
  }
  if (price === undefined || oldPrice === undefined) {
    return { error: 'Los precios deben ser importes válidos iguales o superiores a cero, o estar vacíos.' };
  }
  if (oldPrice !== null && (price === null || oldPrice <= price)) {
    return { error: 'El precio anterior debe ser superior al precio actual.' };
  }
  if (payload.visible !== undefined && typeof payload.visible !== 'boolean') {
    return { error: 'El estado de publicación no es válido.' };
  }

  return {
    value: {
      kind,
      category: kind === 'extra' ? category ?? 'celebration' : 'celebration',
      title,
      variant: kind === 'album' ? variant : '',
      description,
      pageRange: kind === 'album' ? pageRange : '',
      price,
      oldPrice,
      visible: payload.visible === true,
    },
  };
}

function serializeOffer(offer: OfferRow) {
  return {
    id: offer.id,
    kind: offer.kind,
    category: offer.category,
    title: offer.title,
    variant: offer.variant || null,
    description: offer.description,
    pageRange: offer.pageRange || null,
    price: offer.price === null ? null : Number(offer.price),
    oldPrice: offer.oldPrice === null ? null : Number(offer.oldPrice),
    visible: offer.visible,
    sortOrder: offer.sortOrder,
  };
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const offers = await sql`
    SELECT id, kind, category, title, variant, description,
      page_range AS "pageRange", price, old_price AS "oldPrice",
      visible, sort_order AS "sortOrder"
    FROM wedding_offers
    ORDER BY sort_order ASC, title ASC, variant ASC;
  ` as OfferRow[];

  return NextResponse.json({ offers: offers.map(serializeOffer) });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => null) as OfferPayload | null;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Datos no válidos.' }, { status: 400 });
  }

  const validated = validateOffer(payload);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }


  const offer = validated.value;
  const [duplicate] = await sql`
    SELECT id FROM wedding_offers
    WHERE kind = ${offer.kind} AND title = ${offer.title} AND variant = ${offer.variant}
    LIMIT 1;
  `;
  if (duplicate) {
    return NextResponse.json({ error: 'Ya existe una oferta con ese nombre y opción.' }, { status: 409 });
  }

  const [created] = await sql`
    INSERT INTO wedding_offers (
      kind, category, title, variant, description, page_range, price, old_price, visible, sort_order, updated_at
    )
    VALUES (
      ${offer.kind}, ${offer.category}, ${offer.title}, ${offer.variant}, ${offer.description},
      ${offer.pageRange}, ${offer.price}, ${offer.oldPrice}, FALSE,
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM wedding_offers), NOW()
    )
    RETURNING id, kind, category, title, variant, description,
      page_range AS "pageRange", price, old_price AS "oldPrice",
      visible, sort_order AS "sortOrder";
  `;

  return NextResponse.json({ offer: serializeOffer(created as OfferRow) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => null) as OfferPayload | null;
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)
  ) {
    return NextResponse.json({ error: 'El identificador del extra no es válido.' }, { status: 400 });
  }
  if (typeof payload.visible !== 'boolean') {
    return NextResponse.json({ error: 'Indica si el extra se debe publicar u ocultar.' }, { status: 400 });
  }

  const validated = validateOffer(payload);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }


  const offer = validated.value;
  const [duplicate] = await sql`
    SELECT id FROM wedding_offers
    WHERE kind = ${offer.kind} AND title = ${offer.title} AND variant = ${offer.variant}
      AND id <> ${payload.id}
    LIMIT 1;
  `;
  if (duplicate) {
    return NextResponse.json({ error: 'Ya existe una oferta con ese nombre y opción.' }, { status: 409 });
  }

  const [updated] = await sql`
    UPDATE wedding_offers
    SET kind = ${offer.kind}, category = ${offer.category}, title = ${offer.title}, variant = ${offer.variant},
      description = ${offer.description}, page_range = ${offer.pageRange},
      price = ${offer.price}, old_price = ${offer.oldPrice},
      visible = ${offer.visible}, updated_at = NOW()
    WHERE id = ${payload.id}
    RETURNING id, kind, category, title, variant, description,
      page_range AS "pageRange", price, old_price AS "oldPrice",
      visible, sort_order AS "sortOrder";
  `;

  if (!updated) {
    return NextResponse.json({ error: 'No se encontró el extra.' }, { status: 404 });
  }
  return NextResponse.json({ offer: serializeOffer(updated as OfferRow) });
}
