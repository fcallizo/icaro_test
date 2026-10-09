import { PrivateRequest } from './private-types';

export function RequestCard({
  request,
  onView,
  dateConflict,
  eventType,
  eventDate,
}: {
  request: PrivateRequest;
  onView: () => void;
  dateConflict?: 'confirmed' | 'pending';
  eventType?: 'prewedding' | 'postwedding';
  eventDate?: string;
}) {
  const isWedding = request.type === 'wedding';
  const title = request.nombre || (isWedding ? 'Boda sin nombre' : 'Evento cinematográfico');
  const kindLabel = eventType === 'prewedding' ? 'PRE-BODA' : eventType === 'postwedding' ? 'POST-BODA' : isWedding ? 'BODA' : 'PRODUCCIÓN';
  const eventPlace = eventType === 'prewedding'
    ? request.lugarPreboda
    : eventType === 'postwedding'
      ? request.lugarPostboda
      : undefined;

  function formatFecha(iso?: string): string {
    if (!iso) return 'Fecha por confirmar';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d} / ${m} / ${y}`;
  }

  return (
    <article className={`private-request-card ${isWedding ? 'wedding' : 'production'}${dateConflict ? ` date-conflict-${dateConflict}` : ''}`}>
      <div className="private-request-heading">
        <span className="private-request-kind">{eventType ? '📸' : isWedding ? '💍' : '🎬'} {kindLabel}</span>
        <time className={dateConflict ? `date-conflict-${dateConflict}` : ''}> {formatFecha(eventDate || request.fecha)} </time>
      </div>
      <h4>{title}</h4>
      <p className="private-request-summary">{eventType ? eventPlace || 'Lugar por confirmar' : isWedding ? request.ceremonia || 'Lugar por confirmar' : request.tipo || 'Producción audiovisual'}</p>
      <button type="button" className="private-view-button" onClick={onView}>Ver detalle</button>
    </article>
  );
}