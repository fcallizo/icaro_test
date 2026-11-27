import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página no encontrada · Ícaro Studio',
  // Un 404 no debe indexarse ni rastrearse: es la página que señala enlaces rotos.
  robots: { index: false, follow: false },
};

/**
 * `app/not-found.tsx` es EL fichero del 404 en App Router (no `pages/_error` ni
 * `_404`). Se usa para:
 *   · URLs que no casan con ninguna ruta -> Next responde 404 ya.
 *   · Cualquier página que llame a notFound() (p. ej. /equipo/[token] con un
 *     enlace revocado), que también devuelve 404.
 * Se renderiza en el servidor sin JavaScript: el mensaje y el enlace a inicio
 * funcionan con el JS apagado; solo el "volver atrás" es progresivo.
 */
export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf__inner">
        {/* alt="" porque la ilustración es decorativa: el "404" y el título ya
            están en texto real. Un alt de relleno ("error 404") sería ruido. */}
        <img
          className="flicker-anim"
          src="/logos/error_404.png"
          alt="error_404.png"
        />

        <h1>Volaste demasiado cerca del sol</h1>

        <div className="nf__actions">
          <Link href="/" className="submit-btn">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
