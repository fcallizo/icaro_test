'use client';

import { useEffect } from 'react';

export type StatusToastTone = 'success' | 'error';

export function StatusToast({
  message,
  tone,
  surface = 'dark',
  onDismiss,
}: {
  message: string;
  tone: StatusToastTone;
  surface?: 'dark' | 'light';
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className={`status-toast status-toast-${tone} status-toast-${surface}`} role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}>
      <p>{message}</p>
      <button type="button" aria-label="Cerrar aviso" onClick={onDismiss}>×</button>
    </div>
  );
}