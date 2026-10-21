export type WeddingPrices = {
  weddingPhoto: number;
  weddingVideo: number;
  weddingComplete: number;
  complementaryPhoto: number;
  complementaryVideo: number;
  complementaryComplete: number;
  discountDuo: number;
  discountTrio: number;
};

export const DEFAULT_WEDDING_PRICES: WeddingPrices = {
  weddingPhoto: 800,
  weddingVideo: 800,
  weddingComplete: 1300,
  complementaryPhoto: 200,
  complementaryVideo: 150,
  complementaryComplete: 300,
  discountDuo: 5,
  discountTrio: 15,
};

export const WEDDING_PRICE_SETTING_KEYS: Record<keyof WeddingPrices, string> = {
  weddingPhoto: 'wedding_photo_price',
  weddingVideo: 'wedding_video_price',
  weddingComplete: 'wedding_complete_price',
  complementaryPhoto: 'wedding_complementary_photo_price',
  complementaryVideo: 'wedding_complementary_video_price',
  complementaryComplete: 'wedding_complementary_complete_price',
  discountDuo: 'wedding_discount_duo',
  discountTrio: 'wedding_discount_trio',
};

type SettingRow = { setting_key: string; numeric_value: number | string | null };

export function readWeddingPrices(rows: SettingRow[]): WeddingPrices {
  const prices = { ...DEFAULT_WEDDING_PRICES };

  for (const [property, settingKey] of Object.entries(WEDDING_PRICE_SETTING_KEYS) as Array<
    [keyof WeddingPrices, string]
  >) {
    const value = rows.find((row) => row.setting_key === settingKey)?.numeric_value;
    const parsed = Number(value);
    if (value !== null && value !== undefined && Number.isFinite(parsed) && parsed >= 0) {
      prices[property] = parsed;
    }
  }

  return prices;
}
