import { RequestCard } from '@/components/private/RequestCard';
import { PrivateRequest } from '@/components/private/private-types';

type NotificationsTabProps = {
  requests: PrivateRequest[];
  selectedDate: string | null;
  onView: (request: PrivateRequest) => void;
};

export function NotificationsTab({ requests, selectedDate, onView }: NotificationsTabProps) {
  const pendingRequests = requests.filter((request) => request.status === 'pending' && (!selectedDate || request.fecha === selectedDate));
  const pendingWeddings = pendingRequests.filter((request) => request.type === 'wedding');
  const pendingProductions = pendingRequests.filter((request) => request.type === 'production');
  const confirmedDates = new Set(
    requests
      .filter((request) => request.status === 'confirmed' && request.fecha)
      .map((request) => request.fecha),
  );
  const pendingDateCounts = new Map<string, number>();
  pendingRequests.forEach((request) => {
    if (request.fecha) pendingDateCounts.set(request.fecha, (pendingDateCounts.get(request.fecha) || 0) + 1);
  });

  const getDateConflict = (request: PrivateRequest) => {
    if (!request.fecha) return undefined;
    if (confirmedDates.has(request.fecha)) return 'confirmed' as const;
    if ((pendingDateCounts.get(request.fecha) || 0) > 1) return 'pending' as const;
    return undefined;
  };

  return (
    <div className="private-tab-panel" role="tabpanel">
      <section className="private-request-section">
        <h3>Solicitudes de boda</h3>
        {pendingWeddings.length ? (
          <div className="private-notification-grid">
            {pendingWeddings.map((request) => (
              <RequestCard key={request.id} request={request} dateConflict={getDateConflict(request)} onView={() => onView(request)} />
            ))}
          </div>
        ) : <p className="private-empty-state">No hay solicitudes de boda pendientes.</p>}
      </section>
      <section className="private-request-section">
        <h3>Solicitudes cinematográficas</h3>
        {pendingProductions.length ? (
          <div className="private-notification-grid">
            {pendingProductions.map((request) => (
              <RequestCard key={request.id} request={request} dateConflict={getDateConflict(request)} onView={() => onView(request)} />
            ))}
          </div>
        ) : <p className="private-empty-state">No hay solicitudes de cine pendientes.</p>}
      </section>
    </div>
  );
}