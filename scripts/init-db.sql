CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL CHECK (attempts >= 0),
  window_started_at TIMESTAMPTZ NOT NULL,
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS api_rate_limits_updated_at_idx ON api_rate_limits (updated_at);

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
  tipo_documento_identidad TEXT,
  documento_identidad TEXT,
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
  tipo_documento_identidad TEXT,
  documento_identidad TEXT,
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
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS tipo_documento_identidad TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS documento_identidad TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_salida_novio TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_salida_novia TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_ceremonia TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_coctel TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS hora_barra_libre TEXT;
ALTER TABLE wedding_requests ADD COLUMN IF NOT EXISTS customer_form_token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS wedding_requests_customer_form_token_hash_idx ON wedding_requests (customer_form_token_hash) WHERE customer_form_token_hash IS NOT NULL;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS tipo_documento_identidad TEXT;
ALTER TABLE production_requests ADD COLUMN IF NOT EXISTS documento_identidad TEXT;
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
  pass TEXT,
  email TEXT,
  notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notificaciones SMALLINT NOT NULL DEFAULT 0 CHECK (notificaciones BETWEEN 0 AND 3);
ALTER TABLE users ALTER COLUMN pass DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS private_auth_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('invite', 'reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS private_auth_tokens_user_id_unique ON private_auth_tokens (user_id);

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

CREATE TABLE IF NOT EXISTS wedding_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('extra', 'album')),
  category TEXT NOT NULL DEFAULT 'celebration'
    CHECK (category IN ('coverage', 'celebration', 'delivery')),
  title TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  page_range TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) CHECK (price IS NULL OR price >= 0),
  old_price NUMERIC(12, 2) CHECK (old_price IS NULL OR (price IS NOT NULL AND old_price > price)),
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, title, variant)
);

INSERT INTO wedding_offers (id, sort_order, kind, category, title, variant, page_range, price, old_price, description)
VALUES
  -- tecnicos y horas extra
  ('6bc20ad1-91d1-4b72-a233-000000000001', 1, 'extra', 'coverage', 'Técnico Auxiliar Fotográfico', '', '',
    150, Null, 'Un segundo fotógrafo se une al equipo y se encarga de la fotografía durante toda la celebración, para que ningún momento se quede sin capturar.'),
  ('6bc20ad1-91d1-4b72-a233-000000000002', 2, 'extra', 'coverage', 'Técnico Auxiliar de Video', '', '',
    150, Null, 'Un segundo videógrafo se incorpora al equipo y se encarga del vídeo durante toda la celebración, cubriendo los ángulos que quedan fuera del plano principal.'),
  ('6bc20ad1-91d1-4b72-a233-000000000003', 3, 'extra', 'coverage', 'Hora extra de cobertura', '', 'por hora',
    120, NULL, 'Una hora más de cámara donde os haga falta: el aperitivo que se alarga, la entrada de la banda o las últimas canciones de la noche.'),
  -- Durante la celebración
  ('6bc20ad1-91d1-4b72-a233-000000000006', 6, 'extra', 'celebration', 'Same-day edit en el banquete', '', '',
    150, NULL, 'Vídeo resumen del día, listo para proyectarse durante el banquete. Recoge lo ocurrido hasta ese momento.'),
  ('6bc20ad1-91d1-4b72-a233-000000000007', 7, 'extra', 'celebration', 'entrevistas a invitados', '', '',
    150, NULL, 'Un rincón con micrófono donde familiares y amigos cuentan lo que nadie más graba. Las mejores respuestas las entrelazamos en el montaje del día.'),
  ('6bc20ad1-91d1-4b72-a233-000000000008', 8, 'extra', 'celebration', 'Tomas aéreas con dron', '', '',
    0, 150, 'Planos generales de la finca, la ceremonia al aire libre y la fiesta vista desde arriba. Lo volamos siempre que el espacio, la normativa y el tiempo lo permitan.'),
  ('6bc20ad1-91d1-4b72-a233-000000000009', 9, 'extra', 'celebration', 'Photocall personalizado', '', '',
  NULL, NULL, 'Photocall montado y atendido durante toda la celebración, con atrezzo y una decoración adaptada al estilo de la boda.'),
  ('6bc20ad1-91d1-4b72-a233-000000000010', 10, 'extra', 'celebration', 'Guestbox: cámaras para invitados', '', '6 cámaras',
  130, NULL, 'Cámaras desechables en las mesas para que los invitados fotografíen su propia boda. Sus copias reveladas llegan con el reportaje.'),
  -- Albumes de fotos
  ('6bc20ad1-91d1-4b72-a233-000000000011', 11, 'album', 'celebration', 'Álbum de fotos', 'Essential', '70 - 80 páginas',
    300, NULL, 'Un album fotografico de 70 a 80 páginas con las imágenes más importantes del día, maquetado con cuidado para dejar en el salón, no en el trastero.'),
  ('6bc20ad1-91d1-4b72-a233-000000000012', 12, 'album', 'celebration', 'Álbum de fotos', 'Premium', '100 - 110 páginas',
    400, 500, 'El relato casi completo: también invitados, detalles y esos momentos que en el Essential quedan fuera. 100-110 páginas que recoge el día completo, con un montaje más elaborado y una terminación más cuidada.'),
  ('6bc20ad1-91d1-4b72-a233-000000000013', 13, 'album', 'celebration', 'Álbum de fotos', 'Delux', '140 - 150 páginas',
    700, NULL, 'Nuestro álbum más largo: 140-150 páginas para guardar la boda entera con sus repeticiones, el baile y las conversaciones de sobremesa. Encuadernación artesanal y diseño cerrado contigo.'),
  -- Entregables
  ('6bc20ad1-91d1-4b72-a233-000000000019', 14, 'extra', 'delivery', 'Vídeo de ceremonia', '', '',
    80, 200, 'Grabación completa de la ceremonia con el audio original, lista para volver a verla las veces que queráis.'),
  ('6bc20ad1-91d1-4b72-a233-000000000014', 4, 'extra', 'delivery', 'Adelanto en 48 horas', '', '30 - 50 fotos',
    90, NULL, 'Una selección de 30-50 fotos editada y entregada en los dos días siguientes, para compartir el día mientras el reportaje final se termina.'),
  ('6bc20ad1-91d1-4b72-a233-000000000015', 5, 'extra', 'delivery', 'Edición exprés', '', '',
    300, NULL, 'Recepción de las fotografías editadas en 15 días en lugar del plazo habitual. Para cuando hay prisa por verlas.')
ON CONFLICT (kind, title, variant) DO NOTHING;

SELECT 'Base de datos lista para Ícaro Studio.' AS status;
