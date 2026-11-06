'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { NotificationsTab } from '@/components/private/tabs/NotificationsTab';
import { ConfirmedTab } from '@/components/private/tabs/ConfirmedTab';
import { ProductionMaterialsTab } from '@/components/private/tabs/ProductionMaterialsTab';
import { CalendarBlocksTab } from '@/components/private/tabs/CalendarBlocksTab';
import { EventManagementTab } from '@/components/private/tabs/EventManagementTab';
import { CalendarBlock, ProductionMaterial, ProductionMaterialCategory, PrivateRequest, PrivateRequestUpdate, RequestAction } from '@/lib/private-types';
import { AvailabilityCalendar } from '@/components/common/AvailabilityCalendar';
import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { RequestDetailsModal } from '@/components/private/modals/requestDetailsModal/RequestDetailsModal';
import { SettingsTab } from './tabs/SettingsTab';
import { DEFAULT_WEDDING_PRICES, WeddingPrices } from '@/lib/wedding-form';
import { AdminUsersTab } from '@/components/private/tabs/AdminUsersTab';
import { ConfirmationDialog } from '@/components/private/ConfirmationDialog';

async function getPrivateRequests() {
  const response = await fetch('/api/private/requests', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las solicitudes.');
  return data.requests as PrivateRequest[];
}

async function getPrivateSettings() {
  const response = await fetch('/api/private/settings', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar la configuración.');
  return {
    unifyCalendars: Boolean(data.unifyCalendars),
    weddingPrices: data.weddingPrices as WeddingPrices,
  };
}

async function getProductionMaterials() {
  const response = await fetch('/api/private/materials', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo de materiales.');
  return (data.materials as ProductionMaterial[]).map((material) => ({
    ...material,
    basePrice: material.basePrice === null ? null : String(material.basePrice),
  }));
}

async function getCalendarBlocks() {
  const response = await fetch('/api/private/calendar-blocks', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los bloqueos del calendario.');
  return (data.blocks as CalendarBlock[]).map((block) => ({
    ...block,
    startDate: String(block.startDate).slice(0, 10),
    endDate: String(block.endDate).slice(0, 10),
  }));
}

export function PrivateArea() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'confirmed' | 'materials' | 'blocks' | 'events' | 'settings' | 'users'>('notifications');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [unifyCalendars, setUnifyCalendars] = useState(false);
  const [isSavingCalendarSetting, setIsSavingCalendarSetting] = useState(false);
  const [weddingPrices, setWeddingPrices] = useState<WeddingPrices>(DEFAULT_WEDDING_PRICES);
  const [isSavingWeddingPrices, setIsSavingWeddingPrices] = useState(false);
  const [requests, setRequests] = useState<PrivateRequest[]>([]);
  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>([]);
  const [busyBlockId, setBusyBlockId] = useState('');
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [materials, setMaterials] = useState<ProductionMaterial[]>([]);
  const [busyMaterialId, setBusyMaterialId] = useState('');
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrivateRequest | null>(null);
  const [busyId, setBusyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone } | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/private/session', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo comprobar el acceso.');

        setSetupRequired(Boolean(data.setupRequired));
        setSessionReady(Boolean(data.sessionReady));
        setIsAuthenticated(Boolean(data.authenticated));
        setEmail(data.email || '');
        setIsAdmin(Boolean(data.isAdmin));
        if (data.authenticated) {
          const [privateRequests, privateSettings, productionMaterials, privateCalendarBlocks] = await Promise.all([
            getPrivateRequests(),
            getPrivateSettings(),
            getProductionMaterials(),
            getCalendarBlocks(),
          ]);
          setRequests(privateRequests);
          setUnifyCalendars(privateSettings.unifyCalendars);
          setWeddingPrices(privateSettings.weddingPrices);
          setMaterials(productionMaterials);
          setCalendarBlocks(privateCalendarBlocks);
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
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');

      setEmail(data.email);
      setIsAdmin(Boolean(data.isAdmin));
      setPassword('');
      setIsAuthenticated(true);
      const [privateRequests, privateSettings, productionMaterials, privateCalendarBlocks] = await Promise.all([
        getPrivateRequests(),
        getPrivateSettings(),
        getProductionMaterials(),
        getCalendarBlocks(),
      ]);
      setRequests(privateRequests);
      setUnifyCalendars(privateSettings.unifyCalendars);
      setWeddingPrices(privateSettings.weddingPrices);
      setMaterials(productionMaterials);
      setCalendarBlocks(privateCalendarBlocks);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAction = async (
    request: PrivateRequest,
    action: RequestAction,
    values?: PrivateRequestUpdate,
    confirmed = false,
  ) => {
    if (action === 'reject' && !confirmed) {
      setConfirmation({
        message: '¿Rechazar esta solicitud? Se conservará en el historial.',
        onConfirm: () => void handleRequestAction(request, action, values, true),
      });
      return;
    }

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

  const handleCreateCalendarBlock = async (startDate: string, endDate: string, reason: string) => {
    setIsCreatingBlock(true);
    try {
      const response = await fetch('/api/private/calendar-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo bloquear el intervalo.');

      setCalendarBlocks(await getCalendarBlocks());
      setToast({ message: 'Fechas bloqueadas correctamente.', tone: 'success' });
      return true;
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo bloquear el intervalo.', tone: 'error' });
      return false;
    } finally {
      setIsCreatingBlock(false);
    }
  };

  const handleDeleteCalendarBlock = async (id: string, confirmed = false) => {
    if (!confirmed) {
      setConfirmation({
        message: '¿Quieres desbloquear estas fechas?',
        onConfirm: () => void handleDeleteCalendarBlock(id, true),
      });
      return;
    }

    setBusyBlockId(id);
    try {
      const response = await fetch('/api/private/calendar-blocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo retirar el bloqueo.');

      setCalendarBlocks(await getCalendarBlocks());
      setToast({ message: 'Fechas desbloqueadas.', tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo retirar el bloqueo.', tone: 'error' });
    } finally {
      setBusyBlockId('');
    }
  };

  const handleCreateMaterial = async (category: ProductionMaterialCategory, name: string, basePrice: string) => {
    setIsCreatingMaterial(true);
    setMessage('');
    try {
      const response = await fetch('/api/private/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, name, basePrice }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo añadir el material.');

      setMaterials(await getProductionMaterials());
      setToast({ message: 'Material añadido correctamente.', tone: 'success' });
      return true;
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo añadir el material.', tone: 'error' });
      return false;
    } finally {
      setIsCreatingMaterial(false);
    }
  };

  const handleUpdateMaterial = async (id: string, name: string, basePrice: string) => {
    setBusyMaterialId(id);
    try {
      const response = await fetch('/api/private/materials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, basePrice }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el material.');

      setMaterials(await getProductionMaterials());
      setToast({ message: 'Material actualizado correctamente.', tone: 'success' });
      return true;
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo guardar el material.', tone: 'error' });
      return false;
    } finally {
      setBusyMaterialId('');
    }
  };

  const handleSetMaterialActive = async (id: string, active: boolean) => {
    setBusyMaterialId(id);
    try {
      const response = await fetch('/api/private/materials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el material.');

      setMaterials(await getProductionMaterials());
      setToast({ message: active ? 'Material reactivado.' : 'Material retirado del catálogo.', tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo actualizar el material.', tone: 'error' });
    } finally {
      setBusyMaterialId('');
    }
  };

  const handleViewRequest = (request: PrivateRequest) => {
    setMessage('');
    setSelectedRequest(request);
  };

  const handleLogout = async () => {
    await fetch('/api/private/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setIsAdmin(false);
    setRequests([]);
    setMaterials([]);
    setCalendarBlocks([]);
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

  const handleWeddingPricesSave = async (prices: WeddingPrices) => {
    setIsSavingWeddingPrices(true);
    setMessage('');
    try {
      const response = await fetch('/api/private/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingPrices: prices }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron guardar los precios.');
      setWeddingPrices(data.weddingPrices as WeddingPrices);
      setToast({ message: 'Precios de boda actualizados.', tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudieron guardar los precios.', tone: 'error' });
    } finally {
      setIsSavingWeddingPrices(false);
    }
  };

  const visibleRequests = selectedDate
    ? requests.filter((request) => [request.fecha, request.fechaPreboda, request.fechaPostboda].includes(selectedDate))
    : requests;
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
          <img src="/logo_sf_c.png" alt="Ícaro Studio" />
          <span>ÍCARO <strong>STUDIO</strong></span>
        </Link>
        <div className="private-page-title">
          <span className="eyebrow">WORKSPACE PRIVADO</span>
          <h1>Área privada</h1>
        </div>
        {isAuthenticated ? (
          <div className="private-toolbar">
            <span>Sesión: <strong>{email}</strong></span>
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
                No hay usuarios privados configurados. Ejecuta scripts/provision-private-user.mjs con PROVISION_USERNAME y PROVISION_PASSWORD para crear el primero.
              </p>
            )}
            <form className="private-login-form" onSubmit={handleLogin}>
              <label htmlFor="private-email">Correo electrónico</label>
              <input id="private-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <label htmlFor="private-password">Contraseña</label>
              <input id="private-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="submit" className="private-login-button" disabled={isSubmitting || setupRequired || !sessionReady}>
                {isSubmitting ? 'Validando...' : 'Acceder'}
              </button>
            </form>
            {!setupRequired && <Link href="/private/forgot-password" className="private-forgot-link">¿Has olvidado la contraseña?</Link>}
            {!setupRequired && <p className="private-login-hint">Acceso exclusivo para usuarios autorizados.</p>}
            {message && <p className="private-error-message" role="alert">{message}</p>}
          </div>
        ) : (
          <>
            <div className="private-calendar-section">
              <AvailabilityCalendar
                title="📅 Calendario de eventos confirmados"
                requests={requests}
                manualBlockedRanges={calendarBlocks}
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
                <button type="button" role="tab" aria-selected={activeTab === 'notifications'} className={activeTab === 'notifications' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('notifications')}>
                  <span className="private-tab__icon" aria-hidden="true">​🔔</span>
                  Notificaciones <span className="private-tab__count">{pendingCount}</span>
                </button>
                <button type="button" role="tab" aria-selected={activeTab === 'confirmed'} className={activeTab === 'confirmed' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('confirmed')}>
                  <span className="private-tab__icon" aria-hidden="true">​✅</span>
                  Confirmados <span className="private-tab__count">{confirmedCount}</span>
                </button>
                <button type="button" role="tab" aria-selected={activeTab === 'events'} className={activeTab === 'events' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('events')}>
                  <span className="private-tab__icon" aria-hidden="true">🤝​​​</span>
                  ​Colaboradores
                </button>
                <button type="button" role="tab" aria-selected={activeTab === 'blocks'} className={activeTab === 'blocks' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('blocks')}>
                  <span className="private-tab__icon" aria-hidden="true">🚫​</span>
                  Inactividad <span className="private-tab__count">{calendarBlocks.length}</span>
                </button>
                <button type="button" role="tab" aria-selected={activeTab === 'materials'} className={activeTab === 'materials' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('materials')}>
                  <span className="private-tab__icon" aria-hidden="true">📸​</span>
                  Materiales <span className="private-tab__count">{materials.filter((material) => material.active).length}</span>
                </button>
                <button type="button" role="tab" aria-selected={activeTab === 'settings'} className={activeTab === 'settings' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('settings')}>
                  <span className="private-tab__icon" aria-hidden="true">⚙️​​</span>
                  Cofiguración
                </button>
                {isAdmin && (
                  <button type="button" role="tab" aria-selected={activeTab === 'users'} className={activeTab === 'users' ? 'private-tab active' : 'private-tab'} onClick={() => setActiveTab('users')}>
                    <span className="private-tab__icon" aria-hidden="true">​👤</span>
                    Usuarios
                  </button>
                )}
              </div>

              {message && <p className="private-error-message" role="alert">{message}</p>}
              {activeTab === 'notifications' ? (
                <NotificationsTab requests={requests} selectedDate={selectedDate} onView={handleViewRequest} />
              ) : activeTab === 'confirmed' ? (
                <ConfirmedTab requests={requests} selectedDate={selectedDate} onView={handleViewRequest} />
              ) : activeTab === 'materials' ? (
                <ProductionMaterialsTab
                  materials={materials}
                  busyId={busyMaterialId}
                  isCreating={isCreatingMaterial}
                  onCreate={handleCreateMaterial}
                  onUpdate={handleUpdateMaterial}
                  onSetActive={(id, active) => void handleSetMaterialActive(id, active)}
                />
              ) : activeTab === 'events' ? (
                <EventManagementTab />
              ) : activeTab === 'settings' ? (
                <SettingsTab
                  unifyCalendars={unifyCalendars}
                  isSavingCalendarSetting={isSavingCalendarSetting}
                  onCalendarUnificationChange={handleCalendarUnificationChange}
                  weddingPrices={weddingPrices}
                  isSavingWeddingPrices={isSavingWeddingPrices}
                  onSaveWeddingPrices={handleWeddingPricesSave}
                />
              ) : activeTab === 'users' && isAdmin ? (
                <AdminUsersTab />
              ) : (
                <CalendarBlocksTab
                  blocks={calendarBlocks}
                  busyId={busyBlockId}
                  isCreating={isCreatingBlock}
                  onCreate={handleCreateCalendarBlock}
                  onDelete={(id) => void handleDeleteCalendarBlock(id)}
                />
              )}
            </section>
          </>
        )}
      </div>
      {selectedRequest && (
        <RequestDetailsModal
          key={selectedRequest.id}
          request={selectedRequest}
          weddingPrices={weddingPrices}
          materials={selectedRequest.type === 'production' ? materials : undefined}
          busy={busyId === selectedRequest.id}
          error={message}
          onClose={() => setSelectedRequest(null)}
          onAction={(action, values) => void handleRequestAction(selectedRequest, action, values)}
          onSave={(values) => void handleRequestUpdate(selectedRequest, values)}
        />
      )}
      <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} onDismiss={() => setToast(null)} />
      {confirmation && (
        <ConfirmationDialog
          title="Confirmar acción"
          message={confirmation.message}
          confirmLabel="Continuar"
          isDestructive
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const confirmAction = confirmation.onConfirm;
            setConfirmation(null);
            confirmAction();
          }}
        />
      )}
    </main>
  );
}