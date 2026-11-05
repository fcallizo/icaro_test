'use client';

import { FormEvent, ReactNode } from 'react';
import { PrivateRequestUpdate, RequestDetailsModalProps } from '@/lib/private-types';
import { PrivateModalShell } from '../PrivateModalShell';

type RequestDetailsModalFrameProps = Omit<RequestDetailsModalProps, 'onSave'> & {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: PrivateRequestUpdate;
  isDirty: boolean;
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
  isDirty,
  canConfirm = true,
  rightAction,
  children,
}: RequestDetailsModalFrameProps) {
  const isWedding = request.type === 'wedding';
  const isPending = request.status === 'pending';

  const footerActions = (
    <>
      {rightAction}
      {isPending && (
        <>
          <button
            type="button"
            className="pvm__confirm-success"
            disabled={busy || !canConfirm}
            onClick={() => onAction('confirm', values)}
            title={!canConfirm ? 'Completa el desglose técnico y guarda los importes antes de confirmar.' : undefined}
          >
            Confirmar
          </button>
          <button
            type="button"
            className="pvm__confirm-danger"
            disabled={busy}
            onClick={() => onAction('reject')}
          >
            Rechazar
          </button>
        </>
      )}
      <button type="submit" className="pvm__submit" disabled={busy}>
        {busy ? (
          <span className="pvm__spinner" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </>
  );

  return (
    <PrivateModalShell
      eyebrow={isWedding ? '💍 BODA' : '🎬 PRODUCCIÓN'}
      title={title}
      subtitle="Consulta y actualiza los datos de la solicitud."
      onClose={onClose}
      onSubmit={onSubmit}
      error={error}
      isDirty={isDirty}
      isSaving={busy}
      footerActions={footerActions}
      hint={isPending && !canConfirm
        ? 'Completa el desglose técnico y guarda los importes antes de confirmar.'
        : 'Esc para cerrar'}
      className="request-details-modal"
    >
      <div className="request-details-form-grid">{children}</div>
    </PrivateModalShell>
  );
}
