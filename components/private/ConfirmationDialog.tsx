'use client';

import { useEffect, useRef } from 'react';

type ConfirmationDialogProps = {
  title?: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  isDestructive = false,
  isBusy = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    cancelButtonRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="private-confirmation-dialog"
      aria-labelledby="private-confirmation-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isBusy) onCancel();
      }}
    >
      <section className="private-confirmation-card">
        <span className="eyebrow">ÁREA PRIVADA</span>
        <h2 id="private-confirmation-title">{title}</h2>
        <p>{message}</p>
        <div className="private-confirmation-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="private-confirmation-cancel"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={isDestructive ? 'private-confirmation-submit danger' : 'private-confirmation-submit'}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </section>
    </dialog>
  );
}
