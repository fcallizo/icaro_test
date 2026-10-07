import { RequestCard } from '@/components/private/RequestCard';
import { PrivateRequest } from '@/components/private/private-types';

export function ConfirmedTab({ requests, selectedDate, onView }: { requests: PrivateRequest[]; selectedDate: string | null; onView: (request: PrivateRequest) => void }) {
  const confirmedRequests = requests.filter((request) => request.status === 'confirmed');
  const confirmedPrimaryEvents = confirmedRequests.filter((request) => !selectedDate || request.fecha === selectedDate);
  const confirmedSecondaryEvents = confirmedRequests.flatMap((request) => [
    request.fechaPreboda && (!selectedDate || request.fechaPreboda === selectedDate)
      ? { request, type: 'prewedding' as const, date: request.fechaPreboda }
      : null,
    request.fechaPostboda && (!selectedDate || request.fechaPostboda === selectedDate)
      ? { request, type: 'postwedding' as const, date: request.fechaPostboda }
      : null,
  ].filter((event) => event !== null));

  return (
    <div className="private-tab-panel" role="tabpanel">
      <section className="private-request-section">
        <h3>Eventos confirmados</h3>
        {confirmedPrimaryEvents.length || confirmedSecondaryEvents.length ? (
          <div className="private-confirmed-grid">
            {confirmedPrimaryEvents.map((request) => <RequestCard key={request.id} request={request} onView={() => onView(request)} />)}
            {confirmedSecondaryEvents.map(({ request, type, date }) => (
              <RequestCard
                key={`${request.id}-${type}`}
                request={request}
                eventType={type}
                eventDate={date}
                onView={() => onView(request)}
              />
            ))}
          </div>
        ) : <p className="private-empty-state">Todavía no hay eventos confirmados.</p>}
      </section>
    </div>
  );
}