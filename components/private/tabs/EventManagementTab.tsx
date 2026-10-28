'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import {
  EventMemberEditModal,
  eventTypeLabel,
  type ManagedEvent,
  type TeamMember,
} from '../modals/EventMemberEditModal';

type ManagementData = {
  members: TeamMember[];
  events: ManagedEvent[];
};

async function requestManagement<T>(method = 'GET', body?: object): Promise<T> {
  const response = await fetch('/api/private/event-management', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
  return data as T;
}

export function EventManagementTab() {
  const [data, setData] = useState<ManagementData>({ members: [], events: [] });
  const [name, setName] = useState('');
  const [freshLink, setFreshLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadManagementData = useCallback(async () => {
    setData(await requestManagement<ManagementData>());
  }, []);

  /** Aviso breve y autodisciplinado: evita dejar un éxito colgado en la pantalla. */
  const flashSuccess = useCallback((message: string) => {
    setSuccess(message);
    setError('');
    window.setTimeout(() => setSuccess(''), 4500);
  }, []);

  useEffect(() => {
    loadManagementData()
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la gestión de eventos.'),
      )
      .finally(() => setIsLoading(false));
  }, [loadManagementData]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');
    setFreshLink('');
    try {
      const result = await requestManagement<{ link: string }>('POST', { name });
      setFreshLink(result.link);
      setName('');
      await loadManagementData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el colaborador.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (member: TeamMember) => {
    if (!window.confirm(`¿Revocar el enlace de ${member.name}? Ya no podrá acceder a su calendario.`)) return;
    setBusyId(member.id);
    setError('');
    setSuccess('');
    try {
      await requestManagement('DELETE', { memberId: member.id });
      if (editingId === member.id) setEditingId(null);
      setFreshLink('');
      await loadManagementData();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'No se pudo revocar el enlace.');
    } finally {
      setBusyId('');
    }
  };

  const memberEvents = (memberId: string) =>
    data.events.filter((managedEvent) => managedEvent.collaboratorIds.includes(memberId));

  const editingMember = editingId ? data.members.find((member) => member.id === editingId) ?? null : null;

  return (
    <div className="private-tab-panel event-management-panel" role="tabpanel">
      <section className="private-request-section">
        <h3>Gestionar colaboradores</h3>
        <p className="event-management-intro">
          Crea enlaces personales para compartir calendarios con los eventos asignados. Quien tenga el
          enlace podrá consultar todos los datos de esos eventos.
        </p>
        <form className="event-member-create" onSubmit={handleCreate}>
          <label htmlFor="event-member-name">Nombre del colaborador</label>
          <input
            id="event-member-name"
            value={name}
            onChange={(inputEvent) => setName(inputEvent.target.value)}
            maxLength={100}
            required
          />
          <button type="submit" className="private-gold-button" disabled={isCreating}>
            {isCreating ? 'Creando...' : 'Crear colaborador'}
          </button>
        </form>

        {freshLink && (
          <div className="event-member-link" role="status">
            <label htmlFor="new-team-link">Enlace personal (se muestra completo solo ahora)</label>
            <input
              id="new-team-link"
              value={freshLink}
              readOnly
              onFocus={(inputEvent) => inputEvent.currentTarget.select()}
            />
            <p>Guárdalo y compártelo de forma segura. Puedes renovarlo o revocarlo cuando quieras.</p>
          </div>
        )}
        {error && <p className="private-error-message" role="alert">{error}</p>}
        {success && <p className="private-success-message" role="status">{success}</p>}
      </section>

      <section className="private-request-section">
        <h3>Colaboradores</h3>
        {isLoading ? (
          <p className="private-empty-state">Cargando colaboradores...</p>
        ) : data.members.length === 0 ? (
          <p className="private-empty-state">Todavía no hay colaboradores.</p>
        ) : (
          <div className="event-member-list">
            {data.members.map((member) => {
              const isRevoked = Boolean(member.revokedAt);
              const assigned = memberEvents(member.id);

              return (
                <article className="event-member-card" key={member.id}>
                  <div className="event-member-heading">
                    <div>
                      <h4>{member.name}</h4>
                      <span className={isRevoked ? 'event-member-status revoked' : 'event-member-status'}>
                        {isRevoked ? 'Enlace revocado' : 'Enlace activo'}
                      </span>
                      <p className="event-member-summary">
                        {isRevoked
                          ? 'Sin acceso desde la revocación.'
                          : assigned.length === 0
                            ? 'Todavía sin eventos asignados.'
                            : `${assigned.length} ${assigned.length === 1 ? 'evento asignado' : 'eventos asignados'}: ${assigned
                                .slice(0, 2)
                                .map((managedEvent) => `${eventTypeLabel(managedEvent.type)} · ${managedEvent.clientName}`)
                                .join(', ')}${assigned.length > 2 ? ` +${assigned.length - 2}` : ''}`}
                      </p>
                    </div>

                    <div className="event-member-actions">
                      {!isRevoked && (
                        <>
                          <button
                            type="button"
                            className="private-gold-button"
                            disabled={busyId === member.id}
                            onClick={() => setEditingId(member.id)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="private-discard-button"
                            disabled={busyId === member.id}
                            onClick={() => void handleRevoke(member)}
                          >
                            Revocar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editingMember && (
        <EventMemberEditModal
          key={editingMember.id}
          member={editingMember}
          events={data.events}
          onClose={() => setEditingId(null)}
          onSaved={async (message, extra) => {
            setEditingId(null);
            if (extra?.link) setFreshLink(extra.link);

            try {
              await loadManagementData();
            } catch {
              setError('Guardado, pero no se pudo recargar la lista.');
              return;
            }

            flashSuccess(message);
          }}
        />
      )}
    </div>
  );
}

export default EventManagementTab;
