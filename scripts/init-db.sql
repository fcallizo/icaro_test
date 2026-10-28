CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('wedding', 'production', 'prewedding', 'postwedding')),
  fecha TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  parent_event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);
ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_tipo_check;
ALTER TABLE eventos ADD CONSTRAINT eventos_tipo_check
  CHECK (tipo IN ('wedding', 'production', 'prewedding', 'postwedding'));
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS calendar_blocks_dates_idx ON calendar_blocks (start_date, end_date);

CREATE TABLE IF NOT EXISTS wedding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL UNIQUE REFERENCES eventos(id) ON DELETE CASCADE,
  nombre TEXT,
  email TEXT,
  tel_novio TEXT,
  tel_novia TEXT,
  tipo_pack TEXT,
  detalles TEXT,
  novio TEXT,
  hora_salida_novio TEXT,
  novia TEXT,
  hora_salida_novia TEXT,
  ceremonia TEXT,
  hora_ceremonia TEXT,
  lugar TEXT,
  hora_coctel TEXT,
  hora_barra_libre TEXT,
  servicio_boda TEXT,
  extra_boda TEXT,
  precio_extra_boda TEXT,
  descuento_boda TEXT,
  servicio_preboda TEXT,
  lugar_preboda TEXT,
  detalles_preboda TEXT,
  extra_preboda TEXT,
  precio_extra_preboda TEXT,
  servicio_postboda TEXT,
  lugar_postboda TEXT,
  detalles_postboda TEXT,
  extra_postboda TEXT,
  precio_extra_postboda TEXT,
  customer_form_token_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL UNIQUE REFERENCES eventos(id) ON DELETE CASCADE,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  tipo TEXT,
  presupuesto TEXT,
  lugar TEXT,
  detalles TEXT,
  setup_camara TEXT,
  precio_camara NUMERIC(12, 2),
  setup_drone TEXT,
  precio_drone NUMERIC(12, 2),
  setup_iluminacion TEXT,
  precio_iluminacion NUMERIC(12, 2),
  setup_sonido TEXT,
  precio_sonido NUMERIC(12, 2),
  formato_entrega TEXT,
  precio_formato NUMERIC(12, 2),
  personal_extra TEXT,
  precio_personal_extra NUMERIC(12, 2),
  logistica TEXT,
  precio_logistica NUMERIC(12, 2),
  tax_percent SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_salida_novio TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_salida_novia TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_ceremonia TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_coctel TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_barra_libre TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS customer_form_token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS wedding_requests_customer_form_token_hash_idx ON wedding_requests (customer_form_token_hash) WHERE customer_form_token_hash IS NOT NULL;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS setup_camara TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_camara NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS setup_drone TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_drone NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS setup_iluminacion TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_iluminacion NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS setup_sonido TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_sonido NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS formato_entrega TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_formato NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS personal_extra TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_personal_extra NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS logistica TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS precio_logistica NUMERIC(12, 2);
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS tax_percent SMALLINT;

CREATE TABLE IF NOT EXISTS production_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('camera', 'drone', 'lighting', 'sound', 'format')),
  name TEXT NOT NULL,
  base_price NUMERIC(12, 2) CHECK (base_price IS NULL OR base_price >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, name)
);

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
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS evento_id UUID;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS evento_id UUID;

UPDATE wedding_requests SET evento_id = gen_random_uuid() WHERE evento_id IS NULL;
UPDATE production_requests SET evento_id = gen_random_uuid() WHERE evento_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'wedding_requests' AND column_name = 'fecha'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'wedding_requests' AND column_name = 'status'
  ) THEN
    INSERT INTO eventos (id, tipo, fecha, status, created_at, updated_at, decided_at)
    SELECT evento_id, 'wedding', fecha,
      CASE WHEN status IN ('confirmed', 'rejected') THEN status ELSE 'pending' END,
      COALESCE(created_at, NOW()), COALESCE(created_at, NOW()),
      CASE WHEN status = 'pending' THEN NULL ELSE COALESCE(created_at, NOW()) END
    FROM wedding_requests
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'production_requests' AND column_name = 'fecha'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'production_requests' AND column_name = 'status'
  ) THEN
    INSERT INTO eventos (id, tipo, fecha, status, created_at, updated_at, decided_at)
    SELECT evento_id, 'production', fecha,
      CASE WHEN status IN ('confirmed', 'rejected') THEN status ELSE 'pending' END,
      COALESCE(created_at, NOW()), COALESCE(created_at, NOW()),
      CASE WHEN status = 'pending' THEN NULL ELSE COALESCE(created_at, NOW()) END
    FROM production_requests
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS wedding_requests_evento_id_key ON wedding_requests (evento_id);
CREATE UNIQUE INDEX IF NOT EXISTS production_requests_evento_id_key ON production_requests (evento_id);
CREATE INDEX IF NOT EXISTS eventos_fecha_status_idx ON eventos (fecha, status);
CREATE UNIQUE INDEX IF NOT EXISTS eventos_parent_tipo_key
  ON eventos (parent_event_id, tipo) WHERE parent_event_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'wedding_requests' AND column_name = 'fecha_preboda'
  ) THEN
    EXECUTE $migration$
      INSERT INTO eventos (tipo, fecha, status, parent_event_id, decided_at)
      SELECT 'prewedding', NULLIF(BTRIM(w.fecha_preboda), ''), e.status, e.id, e.decided_at
      FROM wedding_requests w
      JOIN eventos e ON e.id = w.evento_id AND e.tipo = 'wedding'
      WHERE NULLIF(BTRIM(w.fecha_preboda), '') IS NOT NULL
      ON CONFLICT (parent_event_id, tipo) WHERE parent_event_id IS NOT NULL
      DO UPDATE SET fecha = EXCLUDED.fecha, status = EXCLUDED.status,
        decided_at = EXCLUDED.decided_at, updated_at = NOW();
    $migration$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'wedding_requests' AND column_name = 'fecha_postboda'
  ) THEN
    EXECUTE $migration$
      INSERT INTO eventos (tipo, fecha, status, parent_event_id, decided_at)
      SELECT 'postwedding', NULLIF(BTRIM(w.fecha_postboda), ''), e.status, e.id, e.decided_at
      FROM wedding_requests w
      JOIN eventos e ON e.id = w.evento_id AND e.tipo = 'wedding'
      WHERE NULLIF(BTRIM(w.fecha_postboda), '') IS NOT NULL
      ON CONFLICT (parent_event_id, tipo) WHERE parent_event_id IS NOT NULL
      DO UPDATE SET fecha = EXCLUDED.fecha, status = EXCLUDED.status,
        decided_at = EXCLUDED.decided_at, updated_at = NOW();
    $migration$;
  END IF;
END $$;

ALTER TABLE wedding_requests DROP COLUMN IF EXISTS fecha_preboda;
ALTER TABLE wedding_requests DROP COLUMN IF EXISTS fecha_postboda;

ALTER TABLE wedding_requests ALTER COLUMN evento_id SET NOT NULL;
ALTER TABLE production_requests ALTER COLUMN evento_id SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE wedding_requests ADD CONSTRAINT wedding_requests_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE production_requests ADD CONSTRAINT production_requests_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE wedding_requests DROP COLUMN IF EXISTS fecha;
ALTER TABLE wedding_requests DROP COLUMN IF EXISTS status;
ALTER TABLE production_requests DROP COLUMN IF EXISTS fecha;
ALTER TABLE production_requests DROP COLUMN IF EXISTS status;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL UNIQUE,
  pass TEXT NOT NULL,
  email TEXT,
  notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_assignments (
  event_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, member_id)
);
CREATE INDEX IF NOT EXISTS event_assignments_member_id_idx ON event_assignments (member_id);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  boolean_value BOOLEAN NOT NULL DEFAULT FALSE,
  numeric_value NUMERIC(10, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (setting_key, boolean_value)
VALUES ('unify_calendars', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO app_settings (setting_key, numeric_value)
VALUES
  ('wedding_photo_price', 800),
  ('wedding_video_price', 800),
  ('wedding_complete_price', 1300),
  ('wedding_complementary_photo_price', 200),
  ('wedding_complementary_video_price', 150),
  ('wedding_complementary_complete_price', 300),
  ('wedding_discount_duo', 5),
  ('wedding_discount_trio', 15)
ON CONFLICT (setting_key) DO UPDATE
  SET numeric_value = COALESCE(app_settings.numeric_value, EXCLUDED.numeric_value);

CREATE TABLE IF NOT EXISTS cinema_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position INTEGER NOT NULL DEFAULT 5,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER,
  old_price INTEGER,
  visible BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_visible_position CHECK (
    NOT visible OR (position IN (1, 2, 3, 4))
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_visible_position 
ON cinema_offers (position) 
WHERE visible = TRUE;

INSERT INTO cinema_offers (id, position, title, price, old_price, visible, description)
VALUES
  ('540a7d61-968c-4dcc-8151-9f99adb4bcfa', 1, 'Spot comercial', 200, 250, TRUE, 'Publicidad, branding y contenido premium para dar visibilidad a tu marca y conectar con tu público.'),
  ('e2743d82-c4d7-41fb-9998-dfa9052fcdf1', 2, 'Videoclip cinematográfico', 150, NULL, TRUE, 'Dirección visual, narrativa creativa y edición avanzada para convertir tu música en imágenes.'),
  ('d64598c9-b804-4798-bd97-ea540aff8a9a', 4, 'Producción completa', NULL, NULL, TRUE, 'Equipo técnico, planificación y coordinación para desarrollar tu proyecto de principio a fin.'),
  ('0d51c652-5f6b-4fbe-a4f6-f0a289365ffa', 3, 'Sesión fotográfica', 100, 125, TRUE, 'Sesiones personalizadas para proyectos personales, retratos, marcas o necesidades profesionales.')
ON CONFLICT (id) DO NOTHING; 

SELECT 'Base de datos lista para Ícaro Studio.' AS status;
