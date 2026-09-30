CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS wedding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  fecha TEXT,
  tipo TEXT,
  presupuesto TEXT,
  descripcion TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS email TEXT;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL UNIQUE,
  pass TEXT NOT NULL,
  email TEXT,
  notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  boolean_value BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (setting_key, boolean_value)
VALUES ('unify_calendars', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

SELECT 'Base de datos lista para Ícaro Studio.' AS status;
