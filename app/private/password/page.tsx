import type { Metadata } from 'next';
import { SetPrivatePasswordForm } from '@/components/private/SetPrivatePasswordForm';

export const metadata: Metadata = {
  title: 'Crear contraseña | Ícaro Studio',
  robots: { index: false, follow: false },
};

export default function SetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return <SetPrivatePasswordForm token={searchParams.token || ''} />;
}
