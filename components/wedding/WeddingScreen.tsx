import { Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PageHeader } from '@/components/common/PageHeader';
import { PublicLegalFooter } from '@/components/common/PublicLegalFooter';
import { CalendarBlockRange } from '@/components/private/private-types';

import { WeddingVideoTab } from './tabs/WeddingVideoTab';
import { WeddingInfoTab } from './tabs/WeddingInfoTab';
import { WeddingReserveTab } from './tabs/WeddingReserveTab';
import { WeddingForm } from './WeddingForm';

type WeddingTab = 'video' | 'info' | 'reserva';

type WeddingScreenProps = {
  onBackToHome: () => void;
  onShowCinema: () => void;
  weddingForm: WeddingForm;
  setWeddingForm: Dispatch<SetStateAction<WeddingForm>>;
  requests: CalendarRequest[];
  blockedRanges: CalendarBlockRange[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onWeddingSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WeddingScreen({
  onBackToHome,
  onShowCinema,
  weddingForm,
  setWeddingForm,
  requests,
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  onWeddingSubmit,
}: WeddingScreenProps) {
  const [activeTab, setActiveTab] = useState<WeddingTab>('video');

  return (
    <div className="page-shell page-shell-tabs page-shell-bodas">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <PageHeader
        view="wedding"
        theme="light"
        onHome={onBackToHome}
        onCinema={onShowCinema}
        onWedding={() => setActiveTab('video')}
      />

      <main className="content-section content-section-tabs weddings-mode">
        <div className="tabs" role="tablist" aria-label="Servicios de bodas">
          <button type="button" role="tab" aria-selected={activeTab === 'video'} className={activeTab === 'video' ? 'tab active' : 'tab'} onClick={() => setActiveTab('video')}>Mira lo que creamos</button>
          <button type="button" role="tab" aria-selected={activeTab === 'info'} className={activeTab === 'info' ? 'tab active' : 'tab'} onClick={() => setActiveTab('info')}>Así hacemos realidad tu sueño</button>
          <button type="button" role="tab" aria-selected={activeTab === 'reserva'} className={activeTab === 'reserva' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reserva')}>Hablemos de vuestra boda</button>
        </div>

        {activeTab === 'video' && (
          <WeddingVideoTab />
        )}

        {activeTab === 'info' && (
          <WeddingInfoTab />
        )}

        {activeTab === 'reserva' && (
          <WeddingReserveTab 
            weddingForm={weddingForm}
            setWeddingForm={setWeddingForm}
            requests={requests}
            blockedRanges={blockedRanges}
            unifyCalendars={unifyCalendars}
            isSubmitting={isSubmitting}
            onWeddingSubmit={onWeddingSubmit}
          />
        )}
      </main>
      <PublicLegalFooter />
    </div>
  );
}
