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

Para el área privada configura `ADMIN_USERNAME`, `ADMIN_PASSWORD` (mínimo 12 caracteres) y `PRIVATE_SESSION_SECRET` (mínimo 32 caracteres). Puedes generar el secreto con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cuando `usuarios` está vacía, la primera visita al panel crea el usuario configurado y guarda su contraseña derivada con scrypt. Los usuarios existentes no se sobrescriben. Reinicia el servidor después de cambiar `.env.local`.

El envío de correo usa Resend en desarrollo local y en los despliegues Preview de Vercel (`RESEND_API_KEY` y, opcionalmente, `RESEND_FROM`). En el despliegue Production usa SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`). Vercel define `VERCEL_ENV` automáticamente; fuera de Vercel se usa `NODE_ENV` para distinguir producción. Si usas `onboarding@resend.dev`, Resend limita los destinatarios a las direcciones permitidas en tu cuenta; para enviar a clientes configura un dominio verificado y su dirección en `RESEND_FROM`.

El endpoint `GET /api/test-email` prueba el proveedor correspondiente al entorno. Configura `EMAIL_TEST_RECIPIENT` para elegir el destinatario. El campo `notificaciones` de cada usuario acepta `0` (ningún aviso), `1` (cine), `2` (bodas) o `3` (ambos). Si el correo no está configurado o falla, la solicitud se guarda igualmente.

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
- `GET /api/requests` (solo fechas confirmadas, sin datos personales)
- `POST /api/requests`
- `GET /api/private/session`
- `POST /api/private/login` y `POST /api/private/logout`
- `GET /api/private/requests` y `PATCH /api/private/requests` (requieren sesión)

## Despliegue en Vercel

1. Conecta este repositorio a Vercel.
2. Define `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `PRIVATE_SESSION_SECRET` en Vercel. Añade la configuración SMTP en el entorno Production y `RESEND_API_KEY` (y opcionalmente `RESEND_FROM`) en los entornos Preview.
3. Haz deploy del proyecto.
4. Si la base de datos está vacía, ejecuta el SQL de `scripts/init-db.sql` desde el editor de Neon o con psql.

## Estructura principal

- `app/page.tsx`: pantalla principal de Ícaro Studio
- `app/api/requests/route.ts`: API para guardar solicitudes
- `lib/db.ts`: conexión a Neon
- `scripts/init-db.sql`: esquema base de datos

## Inicializar la base de datos

```bash
psql "$DATABASE_URL" -f scripts/init-db.sql
```
