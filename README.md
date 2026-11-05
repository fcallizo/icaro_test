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

Define los valores reales en `.env.local`. No guardes credenciales reales en `.env.example` ni en el repositorio.

Para el área privada configura `PRIVATE_SESSION_SECRET` (mínimo 32 caracteres). Puedes generar el secreto con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

El primer usuario privado se crea de forma explícita con `scripts/provision-private-user.mjs`; así, abrir el login no modifica la base de datos. Define `PROVISION_USERNAME` y `PROVISION_PASSWORD` (mínimo 8 caracteres) en `.env.local` y ejecuta:

```bash
node scripts/provision-private-user.mjs
```

El script crea el usuario o actualiza sus credenciales si ya existe.

El envío de correo usa Resend (`RESEND_API_KEY` y, opcionalmente, `RESEND_FROM`).

## Desarrollo local

```bash
npm install
npm run dev
```

## Base de datos

Las migraciones se ejecutan fuera de las peticiones de la aplicación. Antes del primer despliegue con esta versión, haz una copia de seguridad de la base de datos y ejecuta el esquema/migración inicial:

```bash
npm run db:migrate
```

El comando usa `DATABASE_URL` del entorno o de `.env.local` y aplica `scripts/init-db.sql` mediante el cliente Neon, sin requerir `psql`, dentro de una transacción. Este SQL también migra instalaciones existentes; incluye transformaciones de datos y eliminación de columnas antiguas, por lo que conviene revisar y respaldar la base antes de ejecutarlo. La tabla `api_rate_limits` debe estar creada antes de desplegar la protección del login y del formulario público. Ejecuta cualquier cambio de esquema futuro antes de desplegar código que dependa de él.

El login limita a 5 intentos por combinación de IP y usuario, y a 20 por IP, en ventanas de 15 minutos. El formulario público acepta hasta 5 solicitudes por IP cada 15 minutos; el exceso recibe HTTP 429 con `Retry-After`.

Las ofertas extra de boda se guardan en `wedding_offers`. Se crean con tarifas vacías y ocultas para que puedas configurarlas y publicarlas desde **Área privada → Configuración → Extras y álbumes**.

También hay endpoints API disponibles:

- `GET /api/health`
- `GET /api/requests` (solo fechas confirmadas, sin datos personales)
- `POST /api/requests`
- `GET /api/private/session`
- `POST /api/private/login` y `POST /api/private/logout`
- `GET /api/private/requests` y `PATCH /api/private/requests` (requieren sesión)
- `/api/private/event-management` (requiere sesión): gestión de colaboradores y asignación de eventos confirmados
- `/equipo/[token]`: calendario externo de solo lectura para eventos asignados

Los enlaces de equipo funcionan como credenciales personales: quien tenga el enlace puede consultar todos los datos del evento asignado. Desde el área privada se pueden renovar o revocar; la base de datos solo conserva el hash del token.
## Despliegue en Vercel

1. Conecta este repositorio a Vercel.
2. Define `DATABASE_URL` y `PRIVATE_SESSION_SECRET` en Vercel. Añade la configuración SMTP en el entorno Production y `RESEND_API_KEY` (y opcionalmente `RESEND_FROM`) en los entornos Preview.
3. Antes del primer despliegue de esta versión y antes de futuros cambios de esquema, haz una copia de seguridad y ejecuta `npm run db:migrate` apuntando a la base de datos del entorno correspondiente.
4. Haz deploy del proyecto.

## Estructura principal

- `app/page.tsx`: pantalla principal de Ícaro Studio
- `app/api/requests/route.ts`: API para guardar solicitudes
- `lib/db.ts`: conexión a Neon
- `scripts/init-db.sql`: esquema base de datos
