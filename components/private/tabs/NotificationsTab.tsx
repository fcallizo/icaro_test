import { PrivateRequest, RequestStatus } from '@/lib/private-types';
import { useState } from 'react';
import { ConfirmedTab } from './ConfirmedTab';
import { FinishedTab } from './FinishedTab';
import { PendingTab } from './PendingTab';
import { RejectedTab } from './RejectedTab';

type NotificationsTabProps = {
  pendingCount: number;
  confirmedCount: number;
  requests: PrivateRequest[];
  selectedDate: string | null;
  onView: (request: PrivateRequest) => void;
};

export function NotificationsTab({ pendingCount = 0, confirmedCount = 0, requests, selectedDate, onView }: NotificationsTabProps) {
  const [activeTab, setActiveTab] = useState<RequestStatus>('pending');

  return (
    <>
      <div className="private-tabs" role="tablist" aria-label="Gestión privada">
        <button type="button" role="tab" aria-selected={activeTab === 'pending'} className={activeTab === 'pending' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('pending')}>
          <span className="private-tab__icon" aria-hidden="true">​⏳​</span>
          Pendientes <span className="private-tab__count">{pendingCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'confirmed'} className={activeTab === 'confirmed' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('confirmed')}>
          <span className="private-tab__icon" aria-hidden="true">👌​​</span>
          Confirmados <span className="private-tab__count">{confirmedCount}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'finished'} className={activeTab === 'finished' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('finished')}>
          <span className="private-tab__icon" aria-hidden="true">📦</span>
          Finalizados
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'rejected'} className={activeTab === 'rejected' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('rejected')}>
          <span className="private-tab__icon" aria-hidden="true">🗑️​</span>
          Rechazados
        </button>
      </div>
      {activeTab === 'pending' ? (
        <PendingTab requests={requests} selectedDate={selectedDate} onView={onView} />
      ) : activeTab === 'confirmed' ? (
        <ConfirmedTab requests={requests} selectedDate={selectedDate} onView={onView} />
      ) : activeTab === 'finished' ? (
        <FinishedTab requests={requests} selectedDate={selectedDate} onView={onView} />
      ) : (
        <RejectedTab requests={requests} selectedDate={selectedDate} onView={onView} />
      )}
    </>
  );
}