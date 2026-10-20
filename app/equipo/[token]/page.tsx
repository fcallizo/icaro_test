import type { Metadata } from 'next';
import { TeamCalendar } from '@/components/private/TeamCalendar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Calendario de equipo | Ícaro Studio',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function TeamCalendarPage({ params }: { params: { token: string } }) {
  return <TeamCalendar token={params.token} />;
}
