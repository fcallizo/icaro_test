import 'react-phone-number-input/style.css';
import './globals.css';
import type { Metadata } from 'next';

const title = 'Ícaro Studio | Producción Audiovisual Premium';

export const metadata: Metadata = {
  title: title,
  description: 'Aventura de producción cinematográfica, bodas y contenido premium.',
  icons: {
    icon: '/logos/logo_alas_pq.png',
    apple: '/logos/logo_alas_pq.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <title>{title}</title>
        <link rel="icon" type="image/png" href="public/logos/logo_alas_pq.png" />
      </head>

      <body>{children}</body>
    </html>
  );
}
