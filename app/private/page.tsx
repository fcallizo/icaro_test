import type { Metadata } from 'next';
import { PrivateArea } from '@/components/private/PrivateArea';

export const metadata: Metadata = {
  title: 'Área privada | Ícaro Studio',
  robots: { index: false, follow: false },
};

export default function PrivatePage() {
  return <PrivateArea />;
}