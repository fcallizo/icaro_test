import { Dispatch, FormEvent, SetStateAction } from 'react';
import { CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PageHeader } from '@/components/common/PageHeader';
import { PublicLegalFooter } from '@/components/common/PublicLegalFooter';
import { CalendarBlockRange } from '@/components/private/private-types';

import { CinemaVideoTab } from './tabs/CinemaVideoTab';
import { CinemaInfoTab } from './tabs/CinemaInfoTab';
import { CinemaReserveTab } from './tabs/CinemaReserveTab';
import { ProductionForm } from './ProductionForm';

type TabMode = 'video' | 'info' | 'reserva';

type CinemaScreenProps = {
  onBackToHome: () => void;
  onShowWedding: () => void;
  tab: TabMode;
  setTab: (tab: TabMode) => void;
  productionForm: ProductionForm;
  setProductionForm: Dispatch<SetStateAction<ProductionForm>>;
  requests: CalendarRequest[];
  blockedRanges: CalendarBlockRange[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onProductionSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CinemaScreen({
  onBackToHome,
  onShowWedding,
  tab,
  setTab,
  productionForm,
  setProductionForm,
  requests,
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  onProductionSubmit,
}: CinemaScreenProps) {
  return (
    <div className="page-shell page-shell-tabs">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <PageHeader
        view="cinema"
        theme="dark"
        onHome={onBackToHome}
        onCinema={() => setTab('video')}
        onWedding={onShowWedding}
      />

      <main className="content-section content-section-tabs">
        <div className="tabs">
          <button className={tab === 'video' ? 'tab active' : 'tab'} onClick={() => setTab('video')}>Showreel & Trabajos</button>
          <button className={tab === 'info' ? 'tab active' : 'tab'} onClick={() => setTab('info')}>Área Técnica, Contratos y Tarifas</button>
          <button className={tab === 'reserva' ? 'tab active' : 'tab'} onClick={() => setTab('reserva')}>Comienza tu proyecto</button>
        </div>

        {tab === 'video' && (
          <CinemaVideoTab />
        )}

        {tab === 'info' && (
          <CinemaInfoTab onReserve={() => setTab('reserva')}/>
        )}

        {tab === 'reserva' && (
          <CinemaReserveTab
            productionForm={productionForm}
            setProductionForm={setProductionForm}
            requests={requests}
            blockedRanges={blockedRanges}
            unifyCalendars={unifyCalendars}
            isSubmitting={isSubmitting}
            onProductionSubmit={onProductionSubmit}
          />
        )}
      </main>
      <PublicLegalFooter />
    </div>
  );
}
