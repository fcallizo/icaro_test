import { PrivateRequest } from './private-types';

export function RequestCard({
  request,
  onView,
  dateConflict,
}: {
  request: PrivateRequest;
  onView: () => void;
  dateConflict?: 'confirmed' | 'pending';
}) {
  const isWedding = request.type === 'wedding';
  const title = request.nombre || (isWedding ? 'Boda sin nombre' : 'Evento cinematográfico');

  function formatFecha(iso?: string): string {
    if (!iso) return 'Fecha por confirmar';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d} / ${m} / ${y}`;
  }

  return (
    <article className={`private-request-card ${isWedding ? 'wedding' : 'production'}${dateConflict ? ` date-conflict-${dateConflict}` : ''}`}>
      <div className="private-request-heading">
        <span className="private-request-kind">{isWedding ? '💍 BODA' : '🎬 PRODUCCIÓN'}</span>
        <time className={dateConflict ? `date-conflict-${dateConflict}` : ''}> {formatFecha(request.fecha)} </time>
      </div>
      <h4>{title}</h4>
      <p className="private-request-summary">{isWedding ? request.lugar || 'Lugar por confirmar' : request.tipo || 'Producción audiovisual'}</p>
      <button type="button" className="private-view-button" onClick={onView}>Ver detalle</button>
    </article>
  );
}