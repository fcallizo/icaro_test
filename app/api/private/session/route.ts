import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, getPrivateSessionUser } from '@/lib/private-auth';

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  try {
    const user = await getPrivateSessionUser(request.cookies.get(PRIVATE_SESSION_COOKIE)?.value);
    const [userState] = await sql`SELECT EXISTS(SELECT 1 FROM users) AS configured;`;

    return NextResponse.json({
      authenticated: Boolean(user),
      email: user?.email || '',
      isAdmin: Boolean(user?.isAdmin),
      setupRequired: !userState.configured,
      sessionReady: Boolean(process.env.PRIVATE_SESSION_SECRET && process.env.PRIVATE_SESSION_SECRET.length >= 32),
    });
  } catch (error) {
    console.error('No se pudo comprobar la sesión privada:', error);
    return NextResponse.json({ error: 'No se pudo comprobar la sesión.' }, { status: 500 });
  }
}