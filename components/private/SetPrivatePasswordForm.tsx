'use client';

import { FormEvent, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { LEVEL_LABEL, PASSWORD_MAX, PASSWORD_MIN, assessPassword } from '@/lib/password-policy';
import { StatusToast, StatusToastTone } from '../common/StatusToast';
import { PageTheme } from '@/lib/properties';
import PasswordField from '../common/PasswordField';

export function SetPrivatePasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone; surface?: PageTheme } | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const uid = useId();
  const mainId = `${uid}-password`;
  const hintId = `${uid}-hint`;
  const messageRef = useRef<HTMLParagraphElement>(null);

  const assessment = useMemo(
    () => assessPassword(password, confirmPassword),
    [password, confirmPassword],
  );

  const confirmMismatch = touchedConfirm && confirmPassword !== '' && password !== confirmPassword;
  const locked = isComplete;
  const canSubmit = Boolean(token) && assessment.ok && !isSubmitting && !locked && retryAfter === 0;

  const runCountdown = (seconds: number) => {
    setRetryAfter(seconds);
    const timer = window.setInterval(() => {
      setRetryAfter((current) => {
        if (current <= 1) window.clearInterval(timer);
        return Math.max(0, current - 1);
      });
    }, 1000);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      if (!assessment.ok) {
        setToast({ message: assessment.problems[0] ?? 'Revisa la contraseña.', tone: 'error' });
        document.getElementById(mainId)?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/private/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        const waitHeader = Number(response.headers.get('Retry-After') ?? 0);
        if (response.status === 429 && Number.isFinite(waitHeader) && waitHeader > 0) {
          runCountdown(Math.min(waitHeader, 300));
        }
        throw new Error(data.error || 'No se pudo guardar la contraseña.');
      }
      setToast({ message: data.message ?? 'Contraseña guardada. Ya puedes iniciar sesión.', tone: 'success' });
      setIsComplete(true);

      setPassword('');
      setConfirmPassword('');
      requestAnimationFrame(() => messageRef.current?.focus());
    } catch (submitError) {
      setToast({ message: submitError instanceof Error ? submitError.message : 'No se pudo guardar la contraseña.', tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthBar = (
    <div className="ppw-strength" id={hintId} data-level={assessment.level}>
      <div className="ppw-strength__track" role="meter" aria-valuenow={assessment.score}
        aria-valuemin={0} aria-valuemax={100} aria-label="Seguridad de la contraseña">
        <span className="ppw-strength__segment" />
        <span className="ppw-strength__segment" />
        <span className="ppw-strength__segment" />
        <span className="ppw-strength__segment" />
      </div>
      <span className="ppw-strength__label">Seguridad: {LEVEL_LABEL[assessment.level]}</span>
    </div>
  );

  return (
    <main className="page-shell private-page ppw-page">
      <div className="grain-layer" />
      <section className="private-account-card">
        <span className="eyebrow">ÁREA PRIVADA</span>
        <h1>Crear contraseña</h1>
        {token ? (
          <form className="private-login-form" onSubmit={handleSubmit} noValidate>
            <PasswordField
              label="Contraseña"
              name="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              inputRef={passwordRef}
              describedBy={locked ? undefined : hintId}
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              disabled={locked}
              required
              onBlur={() => setTouchedConfirm(true)}
            />

            <PasswordField
              label="Confirmar contraseña"
              name="password-confirm"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              toggleLabels={{ show: 'Mostrar la confirmación', hide: 'Ocultar la confirmación' }}
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              disabled={locked}
              required
              onBlur={() => setTouchedConfirm(true)}
            />

            {confirmMismatch && (<p className="ppw-inline-error" role="alert"> Las contraseñas no coinciden. </p>)}

            {!locked && (
              <>
                {strengthBar}

                <ul className="ppw-checks">
                  {assessment.checks
                    .filter((check) => check.id !== 'confirm')
                    .map((check) => (
                      <li key={check.id} className={check.ok ? 'is-ok' : undefined}>
                        <span aria-hidden="true" className="ppw-checks__mark">
                          {check.ok ? '✓' : '·'}
                        </span>
                        {check.label}
                      </li>
                    ))}
                </ul>
              </>
            )}

            {!locked && (
              <button type="submit" className="private-gold-button" disabled={!canSubmit}>
                {isSubmitting
                  ? 'Guardando...'
                  : retryAfter > 0
                    ? `Espera ${retryAfter} s`
                    : 'Guardar contraseña'}
              </button>
            )}
          </form>
        ) : (<p className="private-error-message" role="alert">El enlace no es válido o ha caducado.</p>)}

        <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} surface={toast?.surface} onDismiss={() => setToast(null)} />

        <Link href="/private" className="private-forgot-link">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 21.8 11.2 C 19.6 7.8 16.1 6 12 6 C 7.2 6 3.5 8.8 2 12 C 3.5 15.2 7.2 18 12 18 C 15.4 18 18.4 16.6 20.4 14.5" />
      <circle cx="12" cy="12" r="3.1" />
      {!visible && <path d="M4 20L20 4" className="ppw-eye__slash" />}
    </svg>
  );
}

export default SetPrivatePasswordForm;
