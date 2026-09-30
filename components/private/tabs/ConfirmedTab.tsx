import { RequestCard } from '@/components/private/RequestCard';
import { PrivateRequest } from '@/components/private/private-types';

export function ConfirmedTab({ requests, selectedDate }: { requests: PrivateRequest[]; selectedDate: string | null }) {
  const confirmedRequests = requests.filter((request) => request.status === 'confirmed' && (!selectedDate || request.fecha === selectedDate));

  return (
    <div className="private-tab-panel" role="tabpanel">
      <section className="private-request-section">
        <h3>Eventos confirmados</h3>
        {confirmedRequests.length ? (
          <div className="private-confirmed-grid">
            {confirmedRequests.map((request) => <RequestCard key={request.id} request={request} busy={false} />)}
          </div>
        ) : <p className="private-empty-state">Todavía no hay eventos confirmados.</p>}
      </section>
    </div>
  );
}