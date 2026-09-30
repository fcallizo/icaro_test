import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/db';

export async function GET() {
  const db = await getDbStatus();

  return NextResponse.json({
    ok: true,
    dbConfigured: db.configured,
    database: db.url,
    app: 'icaro-studio-vercel',
  });
}
