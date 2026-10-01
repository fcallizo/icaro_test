import { FormEvent, ReactNode } from 'react';
import { PrivateRequestUpdate, RequestDetailsModalProps } from './private-types';

type RequestDetailsModalFrameProps = Omit<RequestDetailsModalProps, 'onSave'> & {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: PrivateRequestUpdate;
  canConfirm?: boolean;
  rightAction?: ReactNode;
  children: ReactNode;
};

export function RequestDetailsModalFrame({
  request,
  busy,
  error,
  title,
  onClose,
  onAction,
  onSubmit,
  values,
  canConfirm = true,
  rightAction,
  children,
}: RequestDetailsModalFrameProps) {
  const isWedding = request.type === 'wedding';
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

        <form className="request-details-form" onSubmit={onSubmit}>
          <div className="request-details-form-grid">{children}</div>
          {error && <p className="private-error-message" role="alert">{error}</p>}

          <footer className="request-details-actions">
            <div className="request-details-primary-actions">
              <button type="submit" className="private-save-button" disabled={busy}>
                {busy ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
            {(rightAction || isPending) && (
              <div className="request-details-decision-actions">
                {rightAction}
                {isPending && (
                  <>
                    <button type="button" className="private-confirm-button" disabled={busy || !canConfirm} onClick={() => onAction('confirm', values)}>
                      Confirmar
                    </button>
                    <button type="button" className="private-discard-button" disabled={busy} onClick={() => onAction('reject')}>
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            )}
          </footer>
          {isPending && !canConfirm && <p className="production-confirm-hint">Completa el desglose técnico y guarda los importes antes de confirmar.</p>}
        </form>
      </section>
    </div>
  );
}