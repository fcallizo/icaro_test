/* =========================================================
   Cloudinary: listado de fotos por etiqueta (tag)

   Funciona SIN claves secretas ni instalar nada: Cloudinary publica
   la lista de archivos con una etiqueta en una URL del tipo
     https://res.cloudinary.com/<cloud>/image/list/<etiqueta>.json

   Requisito (una sola vez): en Cloudinary, Settings > Security >
   "Restricted media types", desmarcar "Resource list" y guardar.
   ========================================================= */

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

export type CloudinaryImage = {
  publicId: string;
  version: number;
  width: number;
  height: number;
};

type ListResponse = {
  resources?: Array<{ public_id: string; version: number; width: number; height: number }>;
};

/** Pide la lista de imágenes que tienen una etiqueta, ordenadas por nombre (01-, 02-, ...). */
export async function fetchImagesByTag(tag: string, signal?: AbortSignal): Promise<CloudinaryImage[]> {
  if (!CLOUD_NAME) throw new Error('Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.');

  const response = await fetch(
    `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${encodeURIComponent(tag)}.json`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(
      `Cloudinary respondió ${response.status}. Comprueba que "Resource list" está desmarcado en Settings > Security.`,
    );
  }

  const data = (await response.json()) as ListResponse;
  return (data.resources ?? [])
    .map((r) => ({ publicId: r.public_id, version: r.version, width: r.width, height: r.height }))
    .sort((a, b) => a.publicId.localeCompare(b.publicId, 'es', { numeric: true }));
}

/**
 * URL de una imagen con las transformaciones en el propio enlace:
 * f_auto = mejor formato para cada navegador, q_auto = compresión automática,
 * c_limit = reduce si es más grande, pero nunca la agranda ni la recorta.
 * Incluye la versión (v123), así que al reemplazar una foto se actualiza sola.
 */
export function imageUrl(image: CloudinaryImage, width: number) {
  const path = image.publicId.split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_limit,w_${width}/v${image.version}/${path}`;
}

export function imageSrcSet(image: CloudinaryImage, widths = [640, 1024, 1600, 2200]) {
  return widths.map((w) => `${imageUrl(image, w)} ${w}w`).join(', ');
}

/** "bodas/01-primer_baile" -> "Primer baile" (si no queda nada, devuelve ''). */
export function altFromPublicId(publicId: string) {
  const name = publicId.split('/').pop() ?? '';
  const text = name.replace(/^\d+[-_.\s]*/, '').replace(/[-_]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
