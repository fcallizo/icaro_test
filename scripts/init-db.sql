CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS wedding_requests (
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
);

CREATE TABLE IF NOT EXISTS production_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  telefono TEXT,
  fecha TEXT,
  tipo TEXT,
  presupuesto TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Base de datos lista para Ícaro Studio.' AS status;
