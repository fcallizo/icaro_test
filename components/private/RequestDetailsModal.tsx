import { PrivateRequest, RequestAction } from './private-types';

function downloadWeddingSheet(request: PrivateRequest) {
  const content = [
    'FICHA DE RODAJE - ICARO STUDIO',
    `Pareja: ${request.nombre || 'Sin nombre'}`,
    `Fecha: ${request.fecha || 'Por confirmar'}`,
    `Email: ${request.email || 'No indicado'}`,
    `Telefono novio: ${request.telNovio || 'No indicado'}`,
    `Telefono novia: ${request.telNovia || 'No indicado'}`,
    `Banquete: ${request.lugar || 'No indicado'}`,
    `Ceremonia: ${request.ceremonia || 'No indicada'}`,
    `Casa novia: ${request.novia || 'No indicada'}`,
    `Casa novio: ${request.novio || 'No indicada'}`,
    `Horarios: ${request.cronograma || 'No indicados'}`,
    `Detalles: ${request.detalles || 'Sin detalles'}`,
  ].join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ficha-boda-${request.fecha || request.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function RequestDetailsModal({
  request,
  busy,
  onClose,
  onAction,
}: {
  request: PrivateRequest;
  busy: boolean;
  onClose: () => void;
  onAction: (action: RequestAction) => void;
}) {
  const isWedding = request.type === 'wedding';
  const title = request.nombre || (isWedding ? 'Boda sin nombre' : 'Evento cinematográfico');
  const isPending = request.status === 'pending';

  return (
    <div className="request-details-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="request-details-dialog" role="dialog" aria-modal="true" aria-labelledby="request-details-title">
        <header className="request-details-header">
          <div>
            <span className={`private-request-kind ${isWedding ? 'wedding' : 'production'}`}>{isWedding ? '💍 BODA' : '🎬 PRODUCCIÓN'}</span>
            <h2 id="request-details-title">{title}</h2>
          </div>
          <button type="button" className="private-close-button" aria-label="Cerrar detalles" onClick={onClose}>×</button>
        </header>

        <dl className="private-request-details request-details-list">
          <div><dt>Fecha</dt><dd>{request.fecha || 'Por confirmar'}</dd></div>
          <div><dt>Email</dt><dd>{request.email || 'No indicado'}</dd></div>
          {isWedding ? (
            <>
              <div><dt>Teléfono novio</dt><dd>{request.telNovio || 'No indicado'}</dd></div>
              <div><dt>Teléfono novia</dt><dd>{request.telNovia || 'No indicado'}</dd></div>
              <div><dt>Banquete</dt><dd>{request.lugar || 'No indicado'}</dd></div>
              <div><dt>Ceremonia</dt><dd>{request.ceremonia || 'No indicada'}</dd></div>
              <div><dt>Casa novia</dt><dd>{request.novia || 'No indicada'}</dd></div>
              <div><dt>Casa novio</dt><dd>{request.novio || 'No indicado'}</dd></div>
              <div className="wide"><dt>Horarios</dt><dd>{request.cronograma || 'No indicados'}</dd></div>
              <div className="wide"><dt>Detalles</dt><dd>{request.detalles || 'Sin detalles adicionales'}</dd></div>
            </>
          ) : (
            <>
              <div><dt>Teléfono</dt><dd>{request.telefono || 'No indicado'}</dd></div>
              <div><dt>Presupuesto</dt><dd>{request.presupuesto ? `${request.presupuesto} €` : 'No indicado'}</dd></div>
              <div><dt>Tipo de producción</dt><dd>{request.tipo || 'No especificado'}</dd></div>
              <div className="wide"><dt>Idea principal</dt><dd>{request.descripcion || 'Sin detalles adicionales'}</dd></div>
            </>
          )}
        </dl>

        <footer className="request-details-actions">
          {isWedding && !isPending && (
            <button type="button" className="private-download-button" onClick={() => downloadWeddingSheet(request)}>
              Descargar ficha de rodaje
            </button>
          )}
          {isPending && (
            <>
              <button type="button" className="private-confirm-button" disabled={busy} onClick={() => onAction('confirm')}>
                {busy ? 'Guardando...' : 'Confirmar'}
              </button>
              <button type="button" className="private-discard-button" disabled={busy} onClick={() => onAction('reject')}>
                Rechazar
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}