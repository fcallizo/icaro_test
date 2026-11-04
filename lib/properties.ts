export type PageView = 'selector' | 'cinema' | 'wedding';

export type PageTheme = 'light' | 'dark';

export type TabMode = 'video' | 'trabajos' | 'info' | 'reserva' | 'sobreMi';

export type EventType = 'wedding' | 'production' | 'prewedding' | 'postwedding';

// Default values for form fields

export function setNullValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
