import type { PrivateRequest } from '@/lib/private-types';

type HistoryTone = 'received' | 'accepted' | 'rejected' | 'finished';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  }).format(date);
}

export function RequestHistoryTimeline({ request }: { request: PrivateRequest }) {
  const history: { label: string; timestamp: string; tone: HistoryTone }[] = [];
  if (request.created_at) {
    history.push({ label: 'Solicitud recibida', timestamp: request.created_at, tone: 'received' });
  }
  if (request.decided_at && request.status !== 'pending') {
    const rejected = request.status === 'rejected';
    history.push({
      label: rejected ? 'Solicitud rechazada' : 'Solicitud aceptada',
      timestamp: request.decided_at,
      tone: rejected ? 'rejected' : 'accepted',
    });
  }
  if (request.status === 'finished' && request.finished_at) {
    history.push({ label: 'Evento finalizado', timestamp: request.finished_at, tone: 'finished' });
  }

  return (
    <details className="request-history">
      <summary>Historial</summary>
      <ol className="request-history__list">
        {history.map((item) => (
          <li className={`request-history__item request-history__item--${item.tone}`} key={`${item.label}-${item.timestamp}`}>
            <span className="request-history__marker" aria-hidden="true" />
            <div className="request-history__content">
              <strong>{item.label}</strong>
              <time dateTime={item.timestamp}>{formatTimestamp(item.timestamp)}</time>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
