
export type ReserveWeddingForm = {
  nombre: string;
  email: string;
  telNovia: string;
  fecha: string;
  tipoPack: string;
  ceremonia: string;
  detalles: string;
};

export type WeddingFormValues = {
  nombre: string;
  email: string;
  fecha: string;
  telNovio: string;
  telNovia: string;
  tipoPack: string;
  detalles: string;  
  novio: string;
  horaSalidaNovio: string;
  novia: string;
  horaSalidaNovia: string;
  ceremonia: string;
  horaCeremonia: string;
  lugar: string;
  horaCoctel: string;
  horaBarraLibre: string;
  servicioBoda: string;

  servicioPreboda: string;
  fechaPreboda: string;
  lugarPreboda: string;
  detallesPreboda: string;

  servicioPostboda: string;
  fechaPostboda: string;
  lugarPostboda: string;
  detallesPostboda: string;

  status: string;
};

/* ---------- Opciones de los desplegables ---------- */

export const PACK_OPTIONS = [
  { value: 'indeciso', label: 'Aún no lo sabemos' },
  { value: 'boda', label: 'Solo boda' },
  { value: 'duo-pre', label: 'Boda y preboda' },
  { value: 'duo-post', label: 'Boda y postboda' },
  { value: 'trio', label: 'Pack Completo' },
];

export const SERVICE_OPTIONS = [
  { value: 'fotos', label: 'Sesión fotográfica' },
  { value: 'video', label: 'Vídeo documental' },
  { value: 'duo', label: 'Sesión fotográfica y vídeo' },
];


/* ---------- Precios Boda ---------- */

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


/* ---------- Ofertas Boda ---------- */

export const WEDDING_OFFER_CATEGORIES = [
  'coverage',
  'celebration',
  'delivery',
] as const;

export type WeddingOfferCategory = (typeof WEDDING_OFFER_CATEGORIES)[number];

export const WEDDING_OFFER_CATEGORY_LABELS: Record<WeddingOfferCategory, string> = {
  coverage: 'Equipo y cobertura',
  celebration: 'Durante la celebración',
  delivery: 'Entrega y edición',
};

export type WeddingOffer = {
  id: string;
  kind: 'extra' | 'album';
  category: WeddingOfferCategory;
  title: string;
  variant: string | null;
  description: string;
  pageRange: string | null;
  price: number | null;
  oldPrice: number | null;
  visible?: boolean;
};

/* ---------- PDF ---------- */

export type WeddingSheetLine = { label: string; amount: string };

export type WeddingSheetBlock = {
  title: string; // "Boda", "Preboda", "Postboda"
  fecha?: string;
  lugar?: string;
  detalles?: string;
  lines: WeddingSheetLine[];
};

export type WeddingSheetData = {
  nombre: string;
  email: string;
  presupuestoNumero?: string;
  tipoDocumentoIdentidad?: string;
  documentoIdentidad?: string;
  fecha: string;
  telNovio: string;
  telNovia: string;
  pack: string;
  schedule: { label: string; place: string; time: string }[];
  detalles: string;
  blocks: WeddingSheetBlock[];
  discountPercent: string;
  subtotal: string;
  discount: string;
  total: string;
};