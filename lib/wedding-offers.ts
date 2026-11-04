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
