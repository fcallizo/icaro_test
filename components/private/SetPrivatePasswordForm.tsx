'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export function SetPrivatePasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/private/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la contraseña.');
      setMessage(data.message);
      setIsComplete(true);
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell private-page">
      <div className="grain-layer" />
      <section className="private-account-card">
        <span className="eyebrow">ÁREA PRIVADA</span>
        <h1>Crear contraseña</h1>
        <p>Elige una contraseña de al menos 8 caracteres.</p>
        {token ? (
          <form className="private-login-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">Contraseña</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isComplete}
            />
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={256}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={isComplete}
            />
            {!isComplete && (
              <button type="submit" className="private-login-button" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            )}
          </form>
        ) : <p className="private-error-message" role="alert">El enlace no es válido o ha caducado.</p>}
        {message && <p className="private-users-message" role="status">{message}</p>}
        {error && <p className="private-error-message" role="alert">{error}</p>}
        <Link href="/private" className="private-forgot-link">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}
