'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/private/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo procesar la solicitud.');
      setMessage(data.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell private-page">
      <div className="grain-layer" />
      <section className="private-account-card">
        <span className="eyebrow">ÁREA PRIVADA</span>
        <h1>Restablecer contraseña</h1>
        <p>Introduce el correo de tu cuenta. Si está registrado, recibirás un enlace para establecer una nueva contraseña.</p>
        <form className="private-login-form" onSubmit={handleSubmit}>
          <label htmlFor="reset-email">Correo electrónico</label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" className="private-gold-button" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        {message && <p className="private-users-message" role="status">{message}</p>}
        {error && <p className="private-error-message" role="alert">{error}</p>}
        <Link href="/private" className="private-forgot-link">Volver al inicio de sesión</Link>
      </section>
    </main>
  );
}
