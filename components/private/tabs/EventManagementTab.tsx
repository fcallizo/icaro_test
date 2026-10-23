'use client';

import { EventType } from '@/lib/properties';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type TeamMember = {
  id: string;
  name: string;
  companieros:string;
  createdAt: string;
  revokedAt: string | null;
};

type ManagedEvent = {
  id: string;
  type: EventType;
  date: string;
  clientName: string;
  location: string | null;
  collaboratorIds: string[];
};

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

function eventTypeLabel(type: ManagedEvent['type']) {
  return {
    wedding: 'Boda',
    production: 'Producción',
    prewedding: 'Preboda',
    postwedding: 'Postboda',
  }[type];
}

export function EventManagementTab() {
  const [data, setData] = useState<ManagementData>({ members: [], events: [] });
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [name, setName] = useState('');
  const [freshLink, setFreshLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const loadManagementData = useCallback(async () => {
    const loaded = await requestManagement<ManagementData>();
    setData(loaded);
    setAssignments(Object.fromEntries(
      loaded.members.map((member) => [
        member.id,
        loaded.events.filter((event) => event.collaboratorIds.includes(member.id)).map((event) => event.id),
      ]),
    ));
  }, []);

  useEffect(() => {
    loadManagementData()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la gestión de eventos.'))
      .finally(() => setIsLoading(false));
  }, [loadManagementData]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setError('');
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

  const handleSaveAssignments = async (memberId: string) => {
    setBusyId(memberId);
    setError('');
    try {
      await requestManagement('PATCH', {
        action: 'assign',
        memberId,
        eventIds: assignments[memberId] || [],
      });
      await loadManagementData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar las asignaciones.');
    } finally {
      setBusyId('');
    }
  };

  const handleRotateLink = async (memberId: string) => {
    setBusyId(memberId);
    setError('');
    try {
      const result = await requestManagement<{ link: string }>('PATCH', { action: 'rotate', memberId });
      setFreshLink(result.link);
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : 'No se pudo renovar el enlace.');
    } finally {
      setBusyId('');
    }
  };

  const handleRevoke = async (member: TeamMember) => {
    if (!window.confirm(`¿Revocar el enlace de ${member.name}? Ya no podrá acceder a su calendario.`)) return;
    setBusyId(member.id);
    setError('');
    try {
      await requestManagement('DELETE', { memberId: member.id });
      setFreshLink('');
      await loadManagementData();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'No se pudo revocar el enlace.');
    } finally {
      setBusyId('');
    }
  };

  const toggleAssignment = (memberId: string, eventId: string, checked: boolean) => {
    setAssignments((current) => {
      const currentIds = current[memberId] || [];
      const nextIds = checked
        ? [...currentIds, eventId]
        : currentIds.filter((id) => id !== eventId);
      return { ...current, [memberId]: nextIds };
    });
  };

  return (
    <div className="private-tab-panel event-management-panel" role="tabpanel">
      <section className="private-request-section">
        <h3>Gestionar colaboradores</h3>
        <p className="event-management-intro">
          Crea enlaces personales para compartir calendarios con los eventos asignados. Quien tenga el enlace podrá consultar todos los datos de esos eventos.
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
          <button type="submit" className="private-confirm-button" disabled={isCreating}>
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
      </section>

      <section className="private-request-section">
        <h3>Colaboradores y eventos</h3>
        {isLoading ? (
          <p className="private-empty-state">Cargando colaboradores y eventos...</p>
        ) : data.members.length === 0 ? (
          <p className="private-empty-state">Todavía no hay colaboradores.</p>
        ) : (
          <div className="event-member-list">
            {data.members.map((member) => {
              const isRevoked = Boolean(member.revokedAt);
              const assignedIds = assignments[member.id] || [];
              return (
                <article className="event-member-card" key={member.id}>
                  <div className="event-member-heading">
                    <div>
                      <h4>{member.name}</h4>
                      <span className={isRevoked ? 'event-member-status revoked' : 'event-member-status'}>
                        {isRevoked ? 'Enlace revocado' : 'Enlace activo'}
                      </span>
                    </div>
                    <div className="event-member-actions">
                      {!isRevoked && (
                        <>
                          <button type="button" className="private-discard-button" disabled={busyId === member.id} onClick={() => void handleRotateLink(member.id)}>
                            Renovar enlace
                          </button>
                          <button type="button" className="private-discard-button" disabled={busyId === member.id} onClick={() => void handleRevoke(member)}>
                            Revocar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isRevoked && (
                    <form
                      className="event-assignment-form"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        void handleSaveAssignments(member.id);
                      }}
                    >
                      <h5>Eventos confirmados</h5>
                      {data.events.length === 0 ? (
                        <p className="private-empty-state">No hay eventos confirmados para asignar.</p>
                      ) : (
                        <div className="event-assignment-list">
                          {data.events.map((managedEvent) => (
                            <label className="event-assignment-option" key={managedEvent.id}>
                              <input
                                type="checkbox"
                                checked={assignedIds.includes(managedEvent.id)}
                                onChange={(changeEvent) => toggleAssignment(member.id, managedEvent.id, changeEvent.currentTarget.checked)}
                              />
                              <span>
                                <strong>{eventTypeLabel(managedEvent.type)} · {managedEvent.clientName}</strong>
                                <small>
                                  {new Date(`${managedEvent.date}T00:00:00`).toLocaleDateString('es-ES')}
                                  {managedEvent.location ? ` · ${managedEvent.location}` : ''}
                                </small>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      <button type="submit" className="private-confirm-button" disabled={busyId === member.id}>
                        {busyId === member.id ? 'Guardando...' : `Guardar asignaciones (${assignedIds.length})`}
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
