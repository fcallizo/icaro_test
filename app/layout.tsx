import 'react-phone-number-input/style.css';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ícaro Studio | Producción Audiovisual Premium',
  description: 'Aventura de producción cinematográfica, bodas y contenido premium.',
  icons: {
    icon: '/logo_24x24_circular.png',
    apple: '/logo_24x24_circular.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
