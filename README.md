# Ícaro Studio — Vercel + Neon

Esta app está preparada para desplegarse en Vercel y guardar peticiones en Neon PostgreSQL.

## Requisitos

- Node.js 18+
- Una base de datos PostgreSQL en Neon
- Cuenta de Vercel

## Variables de entorno

Crea un archivo `.env.local` a partir de `.env.example` y ajusta los valores:

```bash
cp .env.example .env.local
```

La variable `DATABASE_URL` ya apunta al valor de Neon proporcionado.

## Desarrollo local

```bash
npm install
npm run dev
```

## Base de datos

Puedes ejecutar el script SQL incluido en Neon para preparar las tablas:

```sql
\i scripts/init-db.sql
```

También hay endpoints API disponibles:

- `GET /api/health`
- `GET /api/requests`
- `POST /api/requests`

## Despliegue en Vercel

1. Conecta este repositorio a Vercel.
2. Define la variable de entorno `DATABASE_URL` en Vercel.
3. Haz deploy del proyecto.
4. Si la base de datos está vacía, ejecuta el SQL de `scripts/init-db.sql` desde el editor de Neon o con psql.

## Estructura principal

- `app/page.tsx`: pantalla principal de Ícaro Studio
- `app/api/requests/route.ts`: API para guardar solicitudes
- `lib/db.ts`: conexión a Neon
- `scripts/init-db.sql`: esquema base de datos

## Ruta de ejemplo para la base de datos

```bash
psql 'postgresql://neondb_owner:npg_bfFZWhCBS24z@ep-rapid-silence-b46q81sg-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```
