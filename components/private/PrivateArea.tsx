'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { NotificationsTab } from '@/components/private/tabs/NotificationsTab';
import { ConfirmedTab } from '@/components/private/tabs/ConfirmedTab';
import { PrivateRequest, PrivateRequestUpdate, RequestAction } from '@/components/private/private-types';
import { AvailabilityCalendar } from '@/components/common/AvailabilityCalendar';
import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { RequestDetailsModal } from '@/components/private/RequestDetailsModal';

async function getPrivateRequests() {
  const response = await fetch('/api/private/requests', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las solicitudes.');
  return data.requests as PrivateRequest[];
}

async function getCalendarSettings() {
  const response = await fetch('/api/private/settings', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar la configuración del calendario.');
  return Boolean(data.unifyCalendars);
}

export function PrivateArea() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'confirmed'>('notifications');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [unifyCalendars, setUnifyCalendars] = useState(false);
  const [isSavingCalendarSetting, setIsSavingCalendarSetting] = useState(false);
  const [requests, setRequests] = useState<PrivateRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PrivateRequest | null>(null);
  const [busyId, setBusyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/private/session', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo comprobar el acceso.');

        setSetupRequired(Boolean(data.setupRequired));
        setSessionReady(Boolean(data.sessionReady));
        setIsAuthenticated(Boolean(data.authenticated));
        setUsername(data.username || '');
        if (data.authenticated) {
          const [privateRequests, shouldUnifyCalendars] = await Promise.all([
            getPrivateRequests(),
            getCalendarSettings(),
          ]);
          setRequests(privateRequests);
          setUnifyCalendars(shouldUnifyCalendars);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo comprobar el acceso.');
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/private/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');

      setUsername(data.username);
      setPassword('');
      setIsAuthenticated(true);
      const [privateRequests, shouldUnifyCalendars] = await Promise.all([
        getPrivateRequests(),
        getCalendarSettings(),
      ]);
      setRequests(privateRequests);
      setUnifyCalendars(shouldUnifyCalendars);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAction = async (request: PrivateRequest, action: RequestAction, values?: PrivateRequestUpdate) => {
    if (action === 'reject' && !window.confirm('¿Rechazar esta solicitud? Se conservará en el historial.')) return;

    setBusyId(request.id);
    setMessage('');
    try {
      if (action === 'confirm' && values) {
        const saveResponse = await fetch('/api/private/requests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: request.id, type: request.type, action: 'update', values }),
        });
        const saveData = await saveResponse.json();
        if (!saveResponse.ok) throw new Error(saveData.error || 'No se pudieron guardar los datos antes de confirmar.');
      }

      const response = await fetch('/api/private/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id, type: request.type, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la solicitud.');

      setRequests(await getPrivateRequests());
      setSelectedRequest(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.');
    } finally {
      setBusyId('');
    }
  };

  const handleRequestUpdate = async (request: PrivateRequest, values: PrivateRequestUpdate) => {
    setBusyId(request.id);
    setMessage('');
    try {
      const response = await fetch('/api/private/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id, type: request.type, action: 'update', values }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron guardar los cambios.');

      setRequests(await getPrivateRequests());
      setSelectedRequest(null);
      setToast({ message: 'Cambios guardados correctamente.', tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudieron guardar los cambios.', tone: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const handleViewRequest = (request: PrivateRequest) => {
    setMessage('');
    setSelectedRequest(request);
  };

  const handleLogout = async () => {
    await fetch('/api/private/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setRequests([]);
    setActiveTab('notifications');
    setSelectedDate(null);
    setMessage('');
  };

  const handleCalendarUnificationChange = async (unify: boolean) => {
    setIsSavingCalendarSetting(true);
    setMessage('');

    try {
      const response = await fetch('/api/private/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unifyCalendars: unify }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la preferencia.');

      setUnifyCalendars(Boolean(data.unifyCalendars));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la preferencia.');
    } finally {
      setIsSavingCalendarSetting(false);
    }
  };

  const visibleRequests = selectedDate ? requests.filter((request) => request.fecha === selectedDate) : requests;
  const pendingCount = visibleRequests.filter((request) => request.status === 'pending').length;
  const confirmedCount = visibleRequests.filter((request) => request.status === 'confirmed').length;
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <main className="page-shell private-page">
      <div className="grain-layer" />
      <header className="private-page-header">
        <Link href="/" className="private-brand">
          <img src="/logo_transparente.png" alt="Ícaro Studio" />
          <span>ÍCARO <strong>STUDIO</strong></span>
        </Link>
        <div className="private-page-title">
          <span className="eyebrow">WORKSPACE PRIVADO</span>
          <h1>Área privada</h1>
        </div>
        {isAuthenticated ? (
          <div className="private-toolbar">
            <span>Sesión: <strong>{username}</strong></span>
            <button type="button" className="private-logout-button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        ) : <Link href="/" className="private-back-link">Volver a la web</Link>}
      </header>

      <div className="private-area-content">
        {isCheckingSession ? (
          <p className="private-state-message">Comprobando acceso...</p>
        ) : !isAuthenticated ? (
          <div className="private-login-wrap">
            {!sessionReady && (
              <p className="private-setup-message">
                Configura PRIVATE_SESSION_SECRET en .env.local con un valor aleatorio de al menos 32 caracteres y reinicia el servidor.
              </p>
            )}
            {setupRequired && (
              <p className="private-setup-message">
                Configura ADMIN_USERNAME, ADMIN_PASSWORD y PRIVATE_SESSION_SECRET en .env.local para crear el primer usuario privado. La contraseña debe tener al menos 12 caracteres y el secreto de sesión 32.
              </p>
            )}
            <form className="private-login-form" onSubmit={handleLogin}>
              <label htmlFor="private-username">Usuario</label>
              <input id="private-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              <label htmlFor="private-password">Contraseña</label>
              <input id="private-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="submit" className="private-login-button" disabled={isSubmitting || setupRequired || !sessionReady}>
                {isSubmitting ? 'Validando...' : 'Acceder'}
              </button>
            </form>
            {!setupRequired && <p className="private-login-hint">Acceso exclusivo para usuarios autorizados.</p>}
            {message && <p className="private-error-message" role="alert">{message}</p>}
          </div>
        ) : (
          <>
            <div className="private-calendar-section">
              <div className="private-calendar-controls">
                <label className="private-calendar-toggle">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={unifyCalendars}
                    disabled={isSavingCalendarSetting}
                    onChange={(event) => void handleCalendarUnificationChange(event.currentTarget.checked)}
                  />
                  <span className="private-calendar-toggle-track" aria-hidden="true" />
                  <span>Unificar calendarios</span>
                </label>
                <p>Las fechas confirmadas de bodas y cine se bloquearán en ambos calendarios públicos.</p>
              </div>
              <AvailabilityCalendar
                title="📅 Calendario de eventos confirmados"
                requests={requests}
                showPending
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              {selectedDate && (
                <div className="private-date-filter" role="status">
                  <span>Solicitudes del {selectedDateLabel}</span>
                  <button type="button" onClick={() => setSelectedDate(null)}>Ver todas</button>
                </div>
              )}
            </div>
            <section className="private-workspace" aria-label="Gestión de solicitudes">
              <div className="private-tabs" role="tablist" aria-label="Gestión privada">
                <button type="button" role="tab" aria-selected={activeTab === 'notifications'} className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
                  Notificaciones <span>{pendingCount}</span>
                </button>
                <button type="button" role="tab" aria-selected={activeTab === 'confirmed'} className={activeTab === 'confirmed' ? 'active' : ''} onClick={() => setActiveTab('confirmed')}>
                  Confirmados <span>{confirmedCount}</span>
                </button>
              </div>

              {message && <p className="private-error-message" role="alert">{message}</p>}
              {activeTab === 'notifications' ? (
                <NotificationsTab requests={requests} selectedDate={selectedDate} onView={handleViewRequest} />
              ) : <ConfirmedTab requests={requests} selectedDate={selectedDate} onView={handleViewRequest} />}
            </section>
          </>
        )}
      </div>
      {selectedRequest && (
        <RequestDetailsModal
          key={selectedRequest.id}
          request={selectedRequest}
          busy={busyId === selectedRequest.id}
          error={message}
          onClose={() => setSelectedRequest(null)}
          onAction={(action, values) => void handleRequestAction(selectedRequest, action, values)}
          onSave={(values) => void handleRequestUpdate(selectedRequest, values)}
        />
      )}
      <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} onDismiss={() => setToast(null)} />
    </main>
  );
}