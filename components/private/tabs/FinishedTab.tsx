'use client';

import { RequestCard } from '@/components/private/RequestCard';
import type { PrivateRequest } from '@/lib/private-types';

export function FinishedTab({
  requests,
  selectedDate,
  onView,
}: {
  requests: PrivateRequest[];
  selectedDate: string | null;
  onView: (request: PrivateRequest) => void;
}) {
  const finishedRequests = requests
    .filter((request) => {
      if (request.status !== 'finished' || !request.finished_at) return false;
      const finishedAt = new Date(request.finished_at);
      return !Number.isNaN(finishedAt.getTime());
    })
    .sort((left, right) => new Date(right.finished_at ?? 0).getTime() - new Date(left.finished_at ?? 0).getTime());
  const finishedPrimaryEvents = finishedRequests.filter((request) => !selectedDate || request.fecha === selectedDate);
  const finishedSecondaryEvents = finishedRequests.flatMap((request) => [
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
          <h2>Eventos finalizados</h2>
        </div>
        {finishedPrimaryEvents.length || finishedSecondaryEvents.length ? (
          <div className="private-confirmed-grid">
            {finishedPrimaryEvents.map((request) => (
              <RequestCard key={request.id} request={request} onView={() => onView(request)} />
            ))}
            {finishedSecondaryEvents.map(({ request, type, date }) => (
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
          <p className="private-empty-state">No hay eventos finalizados.</p>
        )}
      </section>
    </div>
  );
}
