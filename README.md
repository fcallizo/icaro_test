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

El primer usuario privado se crea de forma explícita con `scripts/provision-private-user.mjs`; así, abrir el login no modifica la base de datos. El inicio de sesión usa el correo electrónico. Para crear una cuenta desde cero, define `PROVISION_USERNAME` (puede ser el mismo correo), `PROVISION_EMAIL`, `PROVISION_PASSWORD` (mínimo 8 caracteres) y `PROVISION_IS_ADMIN=true` en `.env.local`, y ejecuta:

```bash
node scripts/provision-private-user.mjs
```

Para convertir la cuenta inicial existente en administrador sin cambiar su contraseña, define `PROVISION_USERNAME` con el nombre actual exacto de esa cuenta, `PROVISION_EMAIL` con el correo que usará para acceder y `PROVISION_IS_ADMIN=true`; deja `PROVISION_PASSWORD` sin definir. El script actualiza el correo y promociona la cuenta, conservando su contraseña. Si se define `PROVISION_PASSWORD`, también la reemplaza. `PROVISION_NOTIFICATIONS` (0–3) es opcional.

Las invitaciones y recuperaciones envían enlaces de un solo uso (24 horas para invitaciones y 1 hora para recuperación). Configura Resend con `RESEND_API_KEY` y, opcionalmente, `RESEND_FROM`, además de `NEXT_PUBLIC_APP_URL` con la URL pública canónica de la aplicación.

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

El login limita a 5 intentos por combinación de IP y correo, y a 20 por IP, en ventanas de 15 minutos. La solicitud de recuperación y el establecimiento de contraseña también tienen límites por IP/cuenta o token. El formulario público acepta hasta 5 solicitudes por IP cada 15 minutos; el exceso recibe HTTP 429 con `Retry-After`.

La migración añade `users.is_admin`, permite cuentas pendientes sin contraseña y crea la tabla de tokens de invitación/recuperación. Los usuarios existentes no se convierten automáticamente en administradores: tras la migración, promociona la cuenta inicial con el script anterior antes de entrar a gestionar usuarios. El área privada permite a administradores invitar por correo, cambiar permisos y eliminar cuentas; se protege para que siempre quede al menos un administrador. Los administradores pueden configurar las notificaciones por correo de cada usuario: producción (1), bodas (2), ambas (3) o ninguna (0). Los correos de recuperación no revelan si una cuenta existe.

Las ofertas extra de boda se guardan en `wedding_offers`. Se crean con tarifas vacías y ocultas para que puedas configurarlas y publicarlas desde **Área privada → Configuración → Extras y álbumes**.

También hay endpoints API disponibles:

- `GET /api/health`
- `GET /api/requests` (solo fechas confirmadas, sin datos personales)
- `POST /api/requests`
- `GET /api/private/session`
- `POST /api/private/login` y `POST /api/private/logout`
- `GET /api/private/users`, `POST /api/private/users`, `PATCH /api/private/users` y `DELETE /api/private/users` (solo administradores)
- `POST /api/private/password-reset` y `POST /api/private/set-password`
- `GET /api/private/requests` y `PATCH /api/private/requests` (requieren sesión)
- `/api/private/event-management` (requiere sesión): gestión de colaboradores y asignación de eventos confirmados
- `/equipo/[token]`: calendario externo de solo lectura para eventos asignados

Los enlaces de equipo funcionan como credenciales personales: quien tenga el enlace puede consultar todos los datos del evento asignado. Desde el área privada se pueden renovar o revocar; la base de datos solo conserva el hash del token.
## Despliegue en Vercel

1. Conecta este repositorio a Vercel.
2. Define `DATABASE_URL`, `PRIVATE_SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY` y, opcionalmente, `RESEND_FROM` en Vercel.
3. Antes del despliegue, haz una copia de seguridad y ejecuta `npm run db:migrate` apuntando a la base de datos del entorno correspondiente.
4. Promociona la cuenta existente con `scripts/provision-private-user.mjs`, apuntando a esa misma base de datos.
5. Haz deploy del proyecto.

## Estructura principal

- `app/page.tsx`: pantalla principal de Ícaro Studio
- `app/api/requests/route.ts`: API para guardar solicitudes
- `lib/db.ts`: conexión a Neon
- `scripts/init-db.sql`: esquema base de datos
