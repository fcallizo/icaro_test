import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';
import { ProductionMaterialCategory } from '@/components/private/private-types';

const categories: ProductionMaterialCategory[] = ['camera', 'drone', 'lighting', 'sound', 'format'];

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
  const materials = await sql`
    SELECT id, category, name, base_price AS "basePrice", active, sort_order AS "sortOrder"
    FROM production_materials
    ORDER BY category, sort_order, name;
  `;
  return NextResponse.json({ materials });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const { category, name } = payload;
  const basePrice = payload.basePrice;
  if (!categories.includes(category) || typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    return NextResponse.json({ error: 'La categoría y el nombre son obligatorios.' }, { status: 400 });
  }
  if (basePrice !== null && basePrice !== '' && (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0 || Number(basePrice) > 9999999999.99)) {
    return NextResponse.json({ error: 'El precio base debe ser un importe válido.' }, { status: 400 });
  }

  await ensureTables();
  const [material] = await sql`
    INSERT INTO production_materials (category, name, base_price)
    VALUES (${category}, ${name.trim()}, ${basePrice === null || basePrice === '' ? null : Number(basePrice)})
    ON CONFLICT (category, name) DO NOTHING
    RETURNING id, category, name, base_price AS "basePrice", active, sort_order AS "sortOrder";
  `;
  if (!material) {
    return NextResponse.json({ error: 'Ya existe un material con ese nombre en la categoría.' }, { status: 409 });
  }
  return NextResponse.json({ material }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const { id } = payload;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'El material no es válido.' }, { status: 400 });
  }

  await ensureTables();
  if (typeof payload.active === 'boolean' && payload.name === undefined && payload.basePrice === undefined) {
    const [material] = await sql`
      UPDATE production_materials SET active = ${payload.active}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, category, name, base_price AS "basePrice", active, sort_order AS "sortOrder";
    `;
    return material
      ? NextResponse.json({ material })
      : NextResponse.json({ error: 'No se encontró el material.' }, { status: 404 });
  }

  const { name, basePrice } = payload;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
    return NextResponse.json({ error: 'El nombre del material es obligatorio.' }, { status: 400 });
  }
  if (basePrice !== null && basePrice !== '' && (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0 || Number(basePrice) > 9999999999.99)) {
    return NextResponse.json({ error: 'El precio base debe ser un importe válido.' }, { status: 400 });
  }

  const [material] = await sql`
    UPDATE production_materials SET
      name = ${name.trim()},
      base_price = ${basePrice === null || basePrice === '' ? null : Number(basePrice)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, category, name, base_price AS "basePrice", active, sort_order AS "sortOrder";
  `;
  return material
    ? NextResponse.json({ material })
    : NextResponse.json({ error: 'No se encontró el material.' }, { status: 404 });
}