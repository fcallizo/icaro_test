'use client';

import { RequestCard } from '@/components/private/RequestCard';
import type { PrivateRequest } from '@/lib/private-types';

export function RejectedTab({
  requests,
  selectedDate,
  onView,
}: {
  requests: PrivateRequest[];
  selectedDate: string | null;
  onView: (request: PrivateRequest) => void;
}) { 
  const rejectedRequests = requests
    .filter((request) => {
      if (request.status !== 'rejected' || !request.decided_at) return false;
      const rejectedAt = new Date(request.decided_at);
      return !Number.isNaN(rejectedAt.getTime());
    })
    .sort((left, right) => new Date(right.decided_at ?? 0).getTime() - new Date(left.decided_at ?? 0).getTime());
  const rejectedPrimaryEvents = rejectedRequests.filter((request) => !selectedDate || request.fecha === selectedDate);
  const rejectedSecondaryEvents = rejectedRequests.flatMap((request) => [
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
        <div className="closed-events-header">
          <h2>Eventos rechazados</h2>
        </div>
        {rejectedPrimaryEvents.length || rejectedSecondaryEvents.length ? (
          <div className="private-confirmed-grid">
            {rejectedPrimaryEvents.map((request) => (
              <RequestCard key={request.id} request={request} onView={() => onView(request)} />
            ))}
            {rejectedSecondaryEvents.map(({ request, type, date }) => (
              <RequestCard
                key={`${request.id}-${type}`}
                request={request}
                eventType={type}
                eventDate={date}
                onView={() => onView(request)}
              />
            ))}
          </div>
        ) : (
          <p className="private-empty-state">No hay eventos rechazados.</p>
        )}
      </section>
    </div>
  );
}
