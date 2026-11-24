import { RequestCard } from '@/components/private/RequestCard';
import { PrivateRequest } from '@/lib/private-types';
import { useState } from 'react';
import { ConfirmedTab } from './ConfirmedTab';
import { FinishedTab } from './FinishedTab';
import { PendingTab } from './PendingTab';

type NotificationsTabProps = {
  pendingCount: number;
  confirmedCount: number;
  requests: PrivateRequest[];
  selectedDate: string | null;
  onView: (request: PrivateRequest) => void;
};

export function NotificationsTab({ pendingCount = 0, confirmedCount = 0, requests, selectedDate, onView }: NotificationsTabProps) {
  const [activeTab, setActiveTab] = useState<'pendings' | 'confirmed' | 'finished'>('pendings');

  return (
    <>
      <div className="private-tabs" role="tablist" aria-label="Gestión privada">
        <button type="button" role="tab" aria-selected={activeTab === 'pendings'} className={activeTab === 'pendings' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('pendings')}>
          <span className="private-tab__icon" aria-hidden="true">​⏳​</span>
          Pendientes <span className="private-tab__count">{pendingCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'confirmed'} className={activeTab === 'confirmed' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('confirmed')}>
          <span className="private-tab__icon" aria-hidden="true">✔️​</span>
          Confirmados <span className="private-tab__count">{confirmedCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'finished'} className={activeTab === 'finished' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('finished')}>
          <span className="private-tab__icon" aria-hidden="true">📦</span>
          Finalizados
        </button>
      </div>
      {activeTab === 'pendings' ? (
        <PendingTab requests={requests} selectedDate={selectedDate} onView={onView} />
      ) : activeTab === 'confirmed' ? (
        <ConfirmedTab requests={requests} selectedDate={selectedDate} onView={onView} />
      ) : (
        <FinishedTab requests={requests} selectedDate={selectedDate} onView={onView} />
      )}
    </>
  );
}