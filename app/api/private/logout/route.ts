import { NextResponse } from 'next/server';
import { PRIVATE_SESSION_COOKIE } from '@/lib/private-auth';

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PRIVATE_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}