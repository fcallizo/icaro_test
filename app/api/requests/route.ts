import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function ensureTables() {
  if (!sql) return;

  await sql`CREATE TABLE IF NOT EXISTS wedding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    tel_novio TEXT,
    tel_novia TEXT,
    fecha TEXT,
    lugar TEXT,
    novia TEXT,
    novio TEXT,
    ceremonia TEXT,
    cronograma TEXT,
    detalles TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  await sql`CREATE TABLE IF NOT EXISTS production_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    telefono TEXT,
    fecha TEXT,
    tipo TEXT,
    presupuesto TEXT,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`;
}

export async function GET() {
  if (!sql) {
    return NextResponse.json({ requests: [], dbConfigured: false }, { status: 200 });
  }

  await ensureTables();

  const weddingRows = await sql`SELECT id, nombre, tel_novio as telNovio, tel_novia as telNovia, fecha, lugar, novia, novio, ceremonia, cronograma, detalles, created_at FROM wedding_requests ORDER BY created_at DESC LIMIT 20;`;
  const productionRows = await sql`SELECT id, nombre, telefono, fecha, tipo, presupuesto, descripcion, created_at FROM production_requests ORDER BY created_at DESC LIMIT 20;`;

  const requests = [
    ...weddingRows.map((row: any) => ({ ...row, type: 'wedding' })),
    ...productionRows.map((row: any) => ({ ...row, type: 'production' })),
  ];

  return NextResponse.json({ requests, dbConfigured: true }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const type = payload.type;

  if (!type || !['wedding', 'production'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de solicitud no válido.' }, { status: 400 });
  }

  if (!sql) {
    const mock = {
      id: `mock-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ request: mock, dbConfigured: false }, { status: 200 });
  }

  await ensureTables();

  if (type === 'wedding') {
    const { nombre, telNovio, telNovia, fecha, lugar, novia, novio, ceremonia, cronograma, detalles } = payload;

    const result = await sql`
      INSERT INTO wedding_requests (nombre, tel_novio, tel_novia, fecha, lugar, novia, novio, ceremonia, cronograma, detalles)
      VALUES (${nombre || ''}, ${telNovio || ''}, ${telNovia || ''}, ${fecha || ''}, ${lugar || ''}, ${novia || ''}, ${novio || ''}, ${ceremonia || ''}, ${cronograma || ''}, ${detalles || ''})
      RETURNING id, nombre, tel_novio as "telNovio", tel_novia as "telNovia", fecha, lugar, novia, novio, ceremonia, cronograma, detalles, created_at;
    `;

    return NextResponse.json({ request: { ...result[0], type: 'wedding' }, dbConfigured: true }, { status: 201 });
  }

  const { nombre, telefono, fecha, tipo, presupuesto, descripcion } = payload;

  const result = await sql`
    INSERT INTO production_requests (nombre, telefono, fecha, tipo, presupuesto, descripcion)
    VALUES (${nombre || ''}, ${telefono || ''}, ${fecha || ''}, ${tipo || ''}, ${presupuesto || ''}, ${descripcion || ''})
    RETURNING id, nombre, telefono, fecha, tipo, presupuesto, descripcion, created_at;
  `;

  return NextResponse.json({ request: { ...result[0], type: 'production' }, dbConfigured: true }, { status: 201 });
}
