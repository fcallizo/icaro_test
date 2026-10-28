// Precios cinematograficos

export type CinemaPrice = {
    title: string;
    description: string;
    price: number | null;
    originalPrice?: number;
}

export const DEFAULT_CINEMA_PRICES: CinemaPrice[] = [
  {
    title: 'Spot comercial',
    description:
      'Publicidad, branding y contenido premium para dar visibilidad a tu marca y conectar con tu público.',
    price: 200,
    originalPrice: 250,
  },
  {
    title: 'Videoclip cinematográfico',
    description:
      'Dirección visual, narrativa creativa y edición avanzada para convertir tu música en imágenes.',
    price: 150,
  },
  {
    title: 'Sesión fotográfica',
    description:
      'Sesiones personalizadas para proyectos personales, retratos, marcas o necesidades profesionales.',
    price: 100,
    originalPrice: 125,
  },
  {
    title: 'Producción completa',
    description:
      'Equipo técnico, planificación y coordinación para desarrollar tu proyecto de principio a fin.',
    price: null,
  },
];
