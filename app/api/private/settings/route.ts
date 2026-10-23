import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';
import { PRIVATE_SESSION_COOKIE, readPrivateSession } from '@/lib/private-auth';
import { DEFAULT_WEDDING_PRICES, readWeddingPrices, WeddingPrices, WEDDING_PRICE_SETTING_KEYS } from '@/lib/wedding-form';

async function isAuthenticated(request: NextRequest) {
  return Boolean(await readPrivateSession(request.cookies.get(PRIVATE_SESSION_COOKIE)?.value));
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  await ensureTables();
  const [setting] = await sql`SELECT boolean_value FROM app_settings WHERE setting_key = 'unify_calendars' LIMIT 1;`;
  const priceRows = (await sql`
  SELECT setting_key, numeric_value FROM app_settings WHERE setting_key IN (
      'wedding_photo_price',
      'wedding_video_price',
      'wedding_complete_price',
      'wedding_complementary_photo_price',
      'wedding_complementary_video_price',
      'wedding_complementary_complete_price',
      'wedding_discount_duo',
      'wedding_discount_trio'
    )
  `) as Array<{ setting_key: string; numeric_value: number | string | null }>;
  return NextResponse.json({
    unifyCalendars: Boolean(setting?.boolean_value),
    weddingPrices: readWeddingPrices(priceRows),
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  const parsedPayload: unknown = await request.json().catch(() => ({}));
  const payload = typeof parsedPayload === 'object' && parsedPayload !== null && !Array.isArray(parsedPayload)
    ? parsedPayload as Record<string, unknown>
    : {};
  const hasCalendarSetting = Object.prototype.hasOwnProperty.call(payload, 'unifyCalendars');
  const hasWeddingPrices = Object.prototype.hasOwnProperty.call(payload, 'weddingPrices');
  if (!hasCalendarSetting && !hasWeddingPrices) {
    return NextResponse.json({ error: 'No se recibieron ajustes válidos.' }, { status: 400 });
  }
  if (hasCalendarSetting && typeof payload.unifyCalendars !== 'boolean') {
    return NextResponse.json({ error: 'El valor de unificación no es válido.' }, { status: 400 });
  }

  let weddingPrices: WeddingPrices | undefined;
  if (hasWeddingPrices) {
    const suppliedPrices = payload.weddingPrices as Partial<WeddingPrices> | undefined;
    const priceKeys = Object.keys(DEFAULT_WEDDING_PRICES) as Array<keyof WeddingPrices>;
    if (
      !suppliedPrices ||
      priceKeys.some((key) => {
        const value = suppliedPrices[key];
        return typeof value !== 'number' || !Number.isFinite(value) || value < 0;
      })
    ) {
      return NextResponse.json({ error: 'Los precios deben ser números válidos iguales o superiores a cero.' }, { status: 400 });
    }
    weddingPrices = suppliedPrices as WeddingPrices;
  }

  await ensureTables();
  let unifyCalendars: boolean | undefined;
  if (hasCalendarSetting) {
    const [setting] = await sql`
      INSERT INTO app_settings (setting_key, boolean_value, updated_at)
      VALUES ('unify_calendars', ${payload.unifyCalendars}, NOW())
      ON CONFLICT (setting_key) DO UPDATE
        SET boolean_value = EXCLUDED.boolean_value, updated_at = NOW()
      RETURNING boolean_value;
    `;
    unifyCalendars = Boolean(setting.boolean_value);
  }

  if (weddingPrices) {
    await sql`
      INSERT INTO app_settings (setting_key, numeric_value, updated_at)
      VALUES
        (${WEDDING_PRICE_SETTING_KEYS.weddingPhoto}, ${weddingPrices.weddingPhoto}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.weddingVideo}, ${weddingPrices.weddingVideo}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.weddingComplete}, ${weddingPrices.weddingComplete}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.complementaryPhoto}, ${weddingPrices.complementaryPhoto}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.complementaryVideo}, ${weddingPrices.complementaryVideo}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.complementaryComplete}, ${weddingPrices.complementaryComplete}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.discountDuo}, ${weddingPrices.discountDuo}, NOW()),
        (${WEDDING_PRICE_SETTING_KEYS.discountTrio}, ${weddingPrices.discountTrio}, NOW())
      ON CONFLICT (setting_key) DO UPDATE
        SET numeric_value = EXCLUDED.numeric_value, updated_at = NOW();
    `;
  }

  return NextResponse.json({ unifyCalendars, weddingPrices });
}