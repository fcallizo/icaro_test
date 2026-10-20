import { useEffect, useState } from 'react';
import { CLOUD_NAME, altFromPublicId, fetchImagesByTag, imageSrcSet, imageUrl } from '@/lib/cloudinary';

export type CarouselPhoto = {
  src: string;
  srcSet?: string;
  alt: string;
};

/**
 * Devuelve las fotos de Cloudinary que tienen la etiqueta indicada.
 * Si no hay configuración, la petición falla o la etiqueta está vacía,
 * usa las fotos de respaldo (`fallback`) para que la web nunca quede sin imágenes.
 */
export function useCloudinaryPhotos(tag: string, fallback: CarouselPhoto[]) {
  const [photos, setPhotos] = useState<CarouselPhoto[]>(CLOUD_NAME ? [] : fallback);
  const [loading, setLoading] = useState(Boolean(CLOUD_NAME));

  useEffect(() => {
    if (!CLOUD_NAME) return;

    // Marca de "este efecto sigue vigente". Si el componente se desmonta o cambia la etiqueta
    // (o React repite el efecto en desarrollo), se ignora la respuesta, sin cancelar la petición
    // y sin lanzar ningún error.
    let isCurrent = true;

    fetchImagesByTag(tag)
      .then((images) => {
        if (!isCurrent) return;
        setPhotos(
          images.length > 0
            ? images.map((image, i) => ({
                src: imageUrl(image, 1600),
                srcSet: imageSrcSet(image),
                alt: altFromPublicId(image.publicId) || `Foto ${i + 1}`,
              }))
            : fallback,
        );
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        console.warn('No se pudieron cargar las fotos de Cloudinary:', error);
        setPhotos(fallback);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
    // `fallback` es una constante del componente que llama; solo se vuelve a pedir si cambia la etiqueta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag]);

  return { photos, loading };
}
