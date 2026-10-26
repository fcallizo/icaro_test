import { Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PageHeader } from '@/components/common/PageHeader';
import { PublicLegalFooter } from '@/components/common/PublicLegalFooter';
import { CalendarBlockRange } from '@/components/private/private-types';

import { CinemaVideoTab } from './tabs/CinemaVideoTab';
import { CinemaInfoTab } from './tabs/CinemaInfoTab';
import { CinemaReserveTab } from './tabs/CinemaReserveTab';
import { CinemaWorksTab } from './tabs/CinemaWorksTab';
import { ReserveProductionForm } from './ProductionForm';
import { TabMode } from '@/lib/properties';
import { CinemaAboutMeTab } from './tabs/CinemaAboutMeTab';

type CinemaScreenProps = {
  onBackToHome: () => void;
  onShowWedding: () => void;
  productionForm: ReserveProductionForm;
  setProductionForm: Dispatch<SetStateAction<ReserveProductionForm>>;
  requests: CalendarRequest[];
  blockedRanges: CalendarBlockRange[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onProductionSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CinemaScreen({
  onBackToHome,
  onShowWedding,
  productionForm,
  setProductionForm,
  requests,
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  onProductionSubmit,
}: CinemaScreenProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('video');

  return (
    <div className="page-shell page-shell-tabs">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <PageHeader
        view="cinema"
        theme="dark"
        onHome={onBackToHome}
        onCinema={() => setActiveTab('video')}
        onWedding={onShowWedding}
      />

      <main className="content-section content-section-tabs">
        <div className="tabs">
          <button className={activeTab === 'video' ? 'tab active' : 'tab'} onClick={() => setActiveTab('video')}>Inicio</button>
          <button className={activeTab === 'info' ? 'tab active' : 'tab'} onClick={() => setActiveTab('info')}>Área Técnica, Contratos y Tarifas</button>
          <button className={activeTab === 'trabajos' ? 'tab active' : 'tab'} onClick={() => setActiveTab('trabajos')}>Eventos realizados</button>
          <button className={activeTab === 'reserva' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reserva')}>Comienza tu proyecto</button>
          <button className={activeTab === 'sobreMi' ? 'tab active' : 'tab'} onClick={() => setActiveTab('sobreMi')}>Sobre Mi</button>
        </div>

        {activeTab === 'video' && (
          <CinemaVideoTab />
        )}

        {activeTab === 'trabajos' && <CinemaWorksTab />}

        {activeTab === 'info' && (
          <CinemaInfoTab onReserve={() => setActiveTab('reserva')} />
        )}

        {activeTab === 'reserva' && (
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

        {activeTab === 'sobreMi' && (
          <CinemaAboutMeTab />
        )}
      </main>
      <PublicLegalFooter />
    </div>
  );
}
