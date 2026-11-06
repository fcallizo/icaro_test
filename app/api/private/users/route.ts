import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createEmailSender } from '@/lib/email';
import { getPrivateSessionUser, PRIVATE_SESSION_COOKIE } from '@/lib/private-auth';
import { issuePrivateAuthToken, normalizeEmail, getPrivatePasswordUrl } from '@/lib/private-account';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getAdmin(request: NextRequest) {
  const user = await getPrivateSessionUser(request.cookies.get(PRIVATE_SESSION_COOKIE)?.value);
  return user?.isAdmin ? user : null;
}

function isValidEmail(email: string) {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export async function GET(request: NextRequest) {
  if (!(await getAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  try {
    const users = await sql`
      SELECT id::text AS id, email, is_admin AS "isAdmin",
        pass IS NOT NULL AS "passwordSet", notificaciones AS notifications,
        created_at AS "createdAt"
      FROM users
      ORDER BY LOWER(email), created_at;
    `;
    return NextResponse.json({ users });
  } catch (error) {
    console.error('No se pudieron cargar los usuarios privados:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los usuarios.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!sql) return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });

  const sender = createEmailSender();
  const parsedPayload: unknown = await request.json().catch(() => ({}));
  const payload = typeof parsedPayload === 'object' && parsedPayload !== null && !Array.isArray(parsedPayload)
    ? parsedPayload as Record<string, unknown>
    : {};
  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Introduce un correo electrónico válido.' }, { status: 400 });
  }
  const passwordUrl = getPrivatePasswordUrl(request, 'placeholder');
  if (!sender || !passwordUrl) {
    return NextResponse.json({ error: 'Configura el envío de correo y NEXT_PUBLIC_APP_URL antes de invitar usuarios.' }, { status: 503 });
  }

  try {
    let [user] = await sql`
      SELECT id::text AS id, pass
      FROM users
      WHERE LOWER(email) = ${email}
      LIMIT 1;
    `;

    if (user && user.pass !== null) {
      return NextResponse.json({ error: 'Ese correo ya tiene una cuenta activa.' }, { status: 409 });
    }

    if (!user) {
      const [usernameConflict] = await sql`
        SELECT id FROM users WHERE LOWER(usuario) = ${email} LIMIT 1;
      `;
      if (usernameConflict) {
        return NextResponse.json({ error: 'No se puede crear la cuenta con ese correo. Contacta con otro administrador.' }, { status: 409 });
      }
      [user] = await sql`
        INSERT INTO users (usuario, email, pass)
        VALUES (${email}, ${email}, NULL)
        RETURNING id::text AS id, pass;
      `;
    }

    const token = await issuePrivateAuthToken(user.id, 'invite');
    const actionUrl = getPrivatePasswordUrl(request, token);
    if (!actionUrl) throw new Error('No se pudo construir el enlace de invitación.');

    try {
      await sender({
        to: email,
        subject: 'Invitación al área privada de Ícaro Studio',
        text: 'Has sido invitado/a al área privada de Ícaro Studio. Usa el enlace para crear tu contraseña. El enlace caduca en 24 horas.',
        action: { label: 'Crear contraseña', url: actionUrl },
        footer: 'Has recibido este mensaje porque un administrador te ha invitado al área privada de Ícaro Studio.',
      });
    } catch (error) {
      await sql`DELETE FROM private_auth_tokens WHERE user_id = ${user.id}::uuid;`;
      throw error;
    }

    return NextResponse.json({ message: 'Invitación enviada.' });
  } catch (error) {
    console.error('No se pudo invitar al usuario privado:', error);
    return NextResponse.json({ error: 'No se pudo enviar la invitación.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!sql) return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });

  const parsedPayload: unknown = await request.json().catch(() => ({}));
  const payload = typeof parsedPayload === 'object' && parsedPayload !== null && !Array.isArray(parsedPayload)
    ? parsedPayload as Record<string, unknown>
    : {};
  const hasAdminChange = Object.prototype.hasOwnProperty.call(payload, 'isAdmin');
  const hasNotificationChange = Object.prototype.hasOwnProperty.call(payload, 'notificationLevel');
  if (
    typeof payload.id !== 'string'
    || (!hasAdminChange && !hasNotificationChange)
    || (hasAdminChange && typeof payload.isAdmin !== 'boolean')
    || (hasNotificationChange && (
      typeof payload.notificationLevel !== 'number'
      || !Number.isInteger(payload.notificationLevel)
      || payload.notificationLevel < 0
      || payload.notificationLevel > 3
    ))
  ) {
    return NextResponse.json({ error: 'Los datos del usuario no son válidos.' }, { status: 400 });
  }
  if (hasAdminChange && payload.id === admin.id && !payload.isAdmin) {
    return NextResponse.json({ error: 'No puedes quitarte tus propios permisos de administrador.' }, { status: 400 });
  }

  try {
    const [target] = await sql`
      SELECT is_admin AS "isAdmin", pass IS NOT NULL AS "passwordSet",
        notificaciones AS notifications
      FROM users WHERE id::text = ${payload.id} LIMIT 1;
    `;
    if (!target) return NextResponse.json({ error: 'No se encontró el usuario.' }, { status: 404 });
    const isAdmin = hasAdminChange ? payload.isAdmin as boolean : Boolean(target.isAdmin);
    const notificationLevel = hasNotificationChange
      ? payload.notificationLevel as number
      : Number(target.notifications);
    if (hasAdminChange && isAdmin && !target.passwordSet) {
      return NextResponse.json({ error: 'El usuario debe aceptar la invitación antes de ser administrador.' }, { status: 400 });
    }
    if (hasAdminChange && target.isAdmin && !isAdmin) {
      const [count] = await sql`SELECT COUNT(*)::INTEGER AS count FROM users WHERE is_admin = TRUE;`;
      if (Number(count.count) <= 1) {
        return NextResponse.json({ error: 'Debe quedar al menos un administrador.' }, { status: 400 });
      }
    }

    await sql`
      UPDATE users
      SET is_admin = ${isAdmin}, notificaciones = ${notificationLevel}
      WHERE id::text = ${payload.id};
    `;
    return NextResponse.json({ message: 'Usuario actualizado.' });
  } catch (error) {
    console.error('No se pudo actualizar el usuario privado:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!sql) return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });

  const parsedPayload: unknown = await request.json().catch(() => ({}));
  const payload = typeof parsedPayload === 'object' && parsedPayload !== null && !Array.isArray(parsedPayload)
    ? parsedPayload as Record<string, unknown>
    : {};
  if (typeof payload.id !== 'string') {
    return NextResponse.json({ error: 'El usuario no es válido.' }, { status: 400 });
  }
  if (payload.id === admin.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 400 });
  }

  try {
    const [target] = await sql`SELECT is_admin AS "isAdmin" FROM users WHERE id::text = ${payload.id} LIMIT 1;`;
    if (!target) return NextResponse.json({ error: 'No se encontró el usuario.' }, { status: 404 });
    if (target.isAdmin) {
      const [count] = await sql`SELECT COUNT(*)::INTEGER AS count FROM users WHERE is_admin = TRUE;`;
      if (Number(count.count) <= 1) {
        return NextResponse.json({ error: 'Debe quedar al menos un administrador.' }, { status: 400 });
      }
    }

    await sql`DELETE FROM users WHERE id::text = ${payload.id};`;
    return NextResponse.json({ message: 'Usuario eliminado.' });
  } catch (error) {
    console.error('No se pudo eliminar el usuario privado:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el usuario.' }, { status: 500 });
  }
}
