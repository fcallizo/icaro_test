
// ruta iamgenes

export const RUTA_LOGO_ALAS = "/logos/logo_alas.png";

export const RUTA_LOGO_CAMARA = "/logos/logo_camara.png";

export const RUTA_LOGO_CAMARA_SIN_ALAS = "/logos/logo_camara_SA.png";


export type PageView = 'selector' | 'cinema' | 'wedding';

export type PageTheme = 'light' | 'dark';

export type TabMode = 'video' | 'trabajos' | 'info' | 'reserva' | 'sobreMi';

export type EventType = 'wedding' | 'production' | 'prewedding' | 'postwedding';

// Default values for form fields

export function setNullValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}


// PDF

export const STUDIO = {
  brand: 'ÍCARO STUDIO',
  legal: 'Ícaro Studio S.L.',
  cif: 'B-00000000',
  address: 'C/ Master 11, Bajo, 41013 Sevilla',
  email: 'hola@icaro.studio',
  phone: '+34 600 00 00 00',
  tagline: 'Fotografía · Vídeo · Producciones',
  insurance: 'Seguro de responsabilidad civil: Allianz, póliza R-0000000',
} as const;


export const GOLD = '#F5C31F';
export const INK = '#111111';
export const MUTED = '#6b7280';
export const LINE = '#e2e4e8';
export const SOFT = '#f6f7f9';