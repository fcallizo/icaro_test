import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import {
  createPrivateSession,
  PRIVATE_SESSION_COOKIE,
  privateSessionDuration,
  seedInitialAdmin,
  verifyPassword,
} from '@/lib/private-auth';

export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const { usuario, password } = await request.json().catch(() => ({}));
  if (typeof usuario !== 'string' || typeof password !== 'string' || password.length > 256) {
    return NextResponse.json({ error: 'Usuario o contraseña no válidos.' }, { status: 400 });
  }

  if (!process.env.PRIVATE_SESSION_SECRET || process.env.PRIVATE_SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: 'Falta configurar PRIVATE_SESSION_SECRET (mínimo 32 caracteres).' }, { status: 503 });
  }

  try {
    await ensureTables();
    await seedInitialAdmin();
    const [user] = await sql`SELECT id, usuario, pass FROM usuarios WHERE usuario = ${usuario.trim()} LIMIT 1;`;

    if (!user || !(await verifyPassword(password, user.pass))) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    }

    const token = await createPrivateSession(user.usuario);
    const response = NextResponse.json({ authenticated: true, username: user.usuario });
    response.cookies.set(PRIVATE_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: privateSessionDuration,
    });

    return response;
  } catch (error) {
    console.error('No se pudo iniciar sesión privada:', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}