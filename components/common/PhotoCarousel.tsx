'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useCloudinaryPhotos, type CarouselPhoto } from '@/hooks/useCloudinaryPhotos';

const imageStyle = (active: boolean): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: active ? 1 : 0,
  transition: 'opacity 0.7s ease',
});

type PhotoCarouselProps = {
  /** Etiqueta de Cloudinary: las fotos que la tengan aparecen en el carrusel. */
  tag: string;
  /** Fotos que se usan si Cloudinary no está configurado o no responde. */
  fallback?: CarouselPhoto[];
  /** Milisegundos entre fotos. */
  interval?: number;
};

export function PhotoCarousel({ tag, fallback = [], interval = 5000 }: PhotoCarouselProps) {
  const { photos, loading } = useCloudinaryPhotos(tag, fallback);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = photos.length;
  // Si quitas fotos en Cloudinary mientras alguien navega, el índice nunca se sale de la lista
  const current = count ? index % count : 0;

  const prev = () => setIndex(count ? (current - 1 + count) % count : 0);
  const next = () => setIndex(count ? (current + 1) % count : 0);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // setTimeout + `current` en las dependencias: el contador de 5 s se reinicia con cada clic
    const timer = setTimeout(() => setIndex((current + 1) % count), interval);
    return () => clearTimeout(timer);
  }, [paused, count, current, interval]);

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Galería de fotos"
      aria-busy={loading}
    >
      {count > 1 && (
        <button className="nav prev" onClick={prev} aria-label="Anterior">‹</button>
      )}

      <div className="slide">
        {/* Todas las fotos apiladas: la activa se ve y el cambio es un fundido suave */}
        {photos.map((photo, i) => (
          <img
            key={photo.src}
            className="slide-img"
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="100vw"
            alt={photo.alt}
            aria-hidden={i !== current}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            style={imageStyle(i === current)}
          />
        ))}
      </div>

      {count > 1 && (
        <button className="nav next" onClick={next} aria-label="Siguiente">›</button>
      )}

      {count > 1 && (
        <div className="dots">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              className={i === current ? 'dot active' : 'dot'}
              onClick={() => setIndex(i)}
              aria-label={`Ir a la foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
