import { neon } from '@neondatabase/serverless';

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export async function ensureTables() {
  if (!sql) return;

  await sql`CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('wedding', 'production')),
    fecha TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
  );`;

  await sql`CREATE TABLE IF NOT EXISTS calendar_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
  );`;
  await sql`CREATE INDEX IF NOT EXISTS calendar_blocks_dates_idx ON calendar_blocks (start_date, end_date);`;

  await sql`CREATE TABLE IF NOT EXISTS wedding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL UNIQUE REFERENCES eventos(id) ON DELETE CASCADE,
    nombre TEXT,
    email TEXT,
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
    evento_id UUID NOT NULL UNIQUE REFERENCES eventos(id) ON DELETE CASCADE,
    nombre TEXT,
    email TEXT,
    telefono TEXT,
    fecha TEXT,
    tipo TEXT,
    presupuesto TEXT,
    descripcion TEXT,
    camera_setup TEXT,
    camera_price NUMERIC(12, 2),
    drone_setup TEXT,
    drone_price NUMERIC(12, 2),
    lighting_setup TEXT,
    lighting_price NUMERIC(12, 2),
    sound_setup TEXT,
    sound_price NUMERIC(12, 2),
    delivery_format TEXT,
    format_price NUMERIC(12, 2),
    extra_crew TEXT,
    extra_crew_price NUMERIC(12, 2),
    logistics TEXT,
    logistics_price NUMERIC(12, 2),
    tax_percent SMALLINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  await sql`ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS email TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS email TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS camera_setup TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS camera_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS drone_setup TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS drone_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS lighting_setup TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS lighting_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS sound_setup TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS sound_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS delivery_format TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS format_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS extra_crew TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS extra_crew_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS logistics TEXT;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS logistics_price NUMERIC(12, 2);`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS tax_percent SMALLINT;`;
  await sql`CREATE TABLE IF NOT EXISTS production_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('camera', 'drone', 'lighting', 'sound', 'format')),
    name TEXT NOT NULL,
    base_price NUMERIC(12, 2) CHECK (base_price IS NULL OR base_price >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (category, name)
  );`;
  await sql`
    INSERT INTO production_materials (category, name, sort_order)
    VALUES
      ('camera', 'Sony Alpha 7 V', 0),
      ('camera', 'Sony FX3 II', 1),
      ('drone', 'Sin dron', 0),
      ('drone', 'DJI Mini 5 Pro', 1),
      ('drone', 'DJI Mini 4 Pro', 2),
      ('drone', 'DJI Mavic 3 Cine', 3),
      ('drone', 'DJI Inspire 3', 4),
      ('lighting', 'Sin iluminación', 0),
      ('lighting', 'Iluminación básica (Paneles LED)', 1),
      ('lighting', 'Iluminación cinematográfica (Aputure/Nanlite)', 2),
      ('sound', 'Sin sonido', 0),
      ('sound', 'Sonido directo a cámara', 1),
      ('sound', 'Sonido profesional (Pértiga y Lavaliers)', 2),
      ('format', 'Solo brutos', 0),
      ('format', 'Spot Comercial', 1),
      ('format', 'Vídeo corporativo largo', 2),
      ('format', 'Paquete Completo (Largo + Reels)', 3)
    ON CONFLICT (category, name) DO NOTHING;
  `;
  await sql`ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS evento_id UUID;`;
  await sql`ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS evento_id UUID;`;

  await sql`UPDATE wedding_requests SET evento_id = gen_random_uuid() WHERE evento_id IS NULL;`;
  await sql`UPDATE production_requests SET evento_id = gen_random_uuid() WHERE evento_id IS NULL;`;

  const legacyColumns = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name IN ('wedding_requests', 'production_requests')
      AND column_name IN ('fecha', 'status');
  `;
  const hasLegacyWeddingFields = legacyColumns.some((column: any) => column.table_name === 'wedding_requests');
  const hasLegacyProductionFields = legacyColumns.some((column: any) => column.table_name === 'production_requests');

  if (hasLegacyWeddingFields) {
    await sql`
      INSERT INTO eventos (id, tipo, fecha, status, created_at, updated_at, decided_at)
      SELECT evento_id, 'wedding', fecha,
        CASE WHEN status IN ('confirmed', 'rejected') THEN status ELSE 'pending' END,
        COALESCE(created_at, NOW()), COALESCE(created_at, NOW()),
        CASE WHEN status = 'pending' THEN NULL ELSE COALESCE(created_at, NOW()) END
      FROM wedding_requests
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  if (hasLegacyProductionFields) {
    await sql`
      INSERT INTO eventos (id, tipo, fecha, status, created_at, updated_at, decided_at)
      SELECT evento_id, 'production', fecha,
        CASE WHEN status IN ('confirmed', 'rejected') THEN status ELSE 'pending' END,
        COALESCE(created_at, NOW()), COALESCE(created_at, NOW()),
        CASE WHEN status = 'pending' THEN NULL ELSE COALESCE(created_at, NOW()) END
      FROM production_requests
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS wedding_requests_evento_id_key ON wedding_requests (evento_id);`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS production_requests_evento_id_key ON production_requests (evento_id);`;
  await sql`CREATE INDEX IF NOT EXISTS eventos_fecha_status_idx ON eventos (fecha, status);`;
  if (hasLegacyWeddingFields) {
    await sql`ALTER TABLE wedding_requests ALTER COLUMN evento_id SET NOT NULL;`;
    await sql`DO $$ BEGIN
      ALTER TABLE wedding_requests ADD CONSTRAINT wedding_requests_evento_id_fkey
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;`;
    await sql`ALTER TABLE wedding_requests DROP COLUMN IF EXISTS fecha;`;
    await sql`ALTER TABLE wedding_requests DROP COLUMN IF EXISTS status;`;
  }
  if (hasLegacyProductionFields) {
    await sql`ALTER TABLE production_requests ALTER COLUMN evento_id SET NOT NULL;`;
    await sql`DO $$ BEGIN
      ALTER TABLE production_requests ADD CONSTRAINT production_requests_evento_id_fkey
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;`;
    await sql`ALTER TABLE production_requests DROP COLUMN IF EXISTS fecha;`;
    await sql`ALTER TABLE production_requests DROP COLUMN IF EXISTS status;`;
  }

  await sql`CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario TEXT NOT NULL UNIQUE,
    pass TEXT NOT NULL,
    email TEXT,
    notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email TEXT;`;
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3);`;

  await sql`CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    boolean_value BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`;
  await sql`INSERT INTO app_settings (setting_key, boolean_value)
    VALUES ('unify_calendars', FALSE)
    ON CONFLICT (setting_key) DO NOTHING;`;
}

export async function getDbStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL),
    url: process.env.DATABASE_URL ? 'configured' : 'missing',
  };
}
