'use client';

import { FormEvent, ReactNode } from 'react';
import { PrivateRequestUpdate, RequestDetailsModalProps } from '@/lib/private-types';
import { PrivateModalShell } from '../PrivateModalShell';
import { RequestHistoryTimeline } from './RequestHistoryTimeline';

type RequestDetailsModalFrameProps = Omit<RequestDetailsModalProps, 'onSave'> & {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: PrivateRequestUpdate;
  isDirty: boolean;
  canConfirm?: boolean;
  canSave?: boolean;
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
  canSave = true,
  rightAction,
  children,
}: RequestDetailsModalFrameProps) {
  const isWedding = request.type === 'wedding';
  const isPending = request.status === 'pending';
  const isConfirmed = request.status === 'confirmed';
  const isEditable = isPending || isConfirmed;

  const footerActions = (
    <>
      {rightAction}
      {isPending && (
        <>
          <button
            type="button"
            className="private-success-button"
            disabled={busy || !canConfirm}
            onClick={() => onAction('confirm', values)}
            title={
              !canSave
                ? 'Corrige el documento de identidad antes de confirmar.'
                : !canConfirm
                  ? 'Completa el desglose técnico y guarda los importes antes de confirmar.'
                  : undefined
            }
          >
            Confirmar
          </button>
          <button
            type="button"
            className="private-danger-button"
            disabled={busy}
            onClick={() => onAction('reject')}
          >
            Rechazar
          </button>
        </>
      )}
      {isConfirmed && (
        <button
          type="button"
          className="private-finished-button"
          disabled={busy}
          onClick={() => onAction('finish')}
        >
          Finalizar
        </button>
      )}
      {isEditable && (
        <button type="submit" className="private-gold-button" disabled={busy || !canSave}>
          {busy ? (
            <span className="pvm__spinner" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      )}
    </>
  );

  return (
    <PrivateModalShell
      eyebrow={isWedding ? '💍 BODA' : '🎬 PRODUCCIÓN'}
      title={title}
      subtitle={request.status === 'finished'
        ? 'Consulta el evento finalizado y su historial.'
        : 'Consulta y actualiza los datos de la solicitud.'}
      onClose={onClose}
      onSubmit={isEditable ? onSubmit : undefined}
      error={error}
      isDirty={isEditable && isDirty}
      isSaving={busy}
      footerActions={footerActions}
      hint={
        isPending && !canSave
          ? 'Corrige el documento de identidad antes de guardar o confirmar.'
          : isPending && !canConfirm
            ? 'Completa el desglose técnico y guarda los importes antes de confirmar.'
            : 'Esc para cerrar'
      }
      className="request-details-modal"
    >
      <div className="request-details-form-grid">
        <RequestHistoryTimeline request={request} />
        {children}
      </div>
    </PrivateModalShell>
  );
}
