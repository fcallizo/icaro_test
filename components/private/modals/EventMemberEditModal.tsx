'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import type { EventType } from '@/lib/properties';

import {
  PrivateModalShell,
  type PrivateModalShellHandle,
} from './PrivateModalShell';

/* ==========================================================================
 * Modal de edición de un colaborador: asignación de eventos + renovación del
 * enlace personal. Mismo armazón y paleta que CinemaOfferFormModal.
 *
 * Ojo: los Set se convierten a array con setToArray() a propósito. `[...set]`
 * exige target >= ES2015 o --downlevelIteration (TS2802); así el componente
 * type-checkea con cualquier target del tsconfig.
 * ======================================================================== */

export type TeamMember = {
  id: string;
  name: string;
  createdAt: string;
  revokedAt: string | null;
};

export type ManagedEvent = {
  id: string;
  type: EventType;
  date: string;
  clientName: string;
  location: string | null;
  collaboratorIds: string[];
};

export type EventMemberEditModalProps = {
  member: TeamMember;
  events: ManagedEvent[];
  apiEndpoint?: string;
  onClose: () => void;
  /** `link` solo llega cuando se ha renovado el enlace. */
  onSaved?: (message: string, extra?: { link?: string }) => void;
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Boda',
  production: 'Producción',
  prewedding: 'Preboda',
  postwedding: 'Postboda',
};

type Filter = 'all' | 'assigned' | 'pending';


/** Etiqueta legible del tipo de evento (misma tabla que usaba el tab). */
export function eventTypeLabel(type: EventType) {
  return EVENT_TYPE_LABELS[type] ?? type;
}

/** Equivalente a [...set] sin depender de --downlevelIteration ni del target. */
function setToArray<T>(set: Set<T>): T[] {
  const items: T[] = [];

  set.forEach((item) => {
    items.push(item);
  });

  return items;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* --- Componente ---------------------------------------------------------- */

export function EventMemberEditModal({
  member,
  events,
  apiEndpoint = '/api/private/event-management',
  onClose,
  onSaved,
}: EventMemberEditModalProps) {
  const assignedInitially = useMemo(
    () =>
      new Set(
        events.filter((event) => event.collaboratorIds.includes(member.id)).map((event) => event.id),
      ),
    [events, member.id],
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(assignedInitially));
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [pendingRotate, setPendingRotate] = useState(false);
  const [freshLink, setFreshLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const shellRef = useRef<PrivateModalShellHandle>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Sucio si se va a renovar el enlace o si la selección difiere de la inicial
  // (comprobación en ambos sentidos: sobran o faltan eventos).
  const isDirty = useMemo(() => {
    if (pendingRotate) return true;
    if (selected.size !== assignedInitially.size) return true;

    let differs = false;
    assignedInitially.forEach((id) => {
      if (!selected.has(id)) differs = true;
    });

    return differs;
  }, [assignedInitially, pendingRotate, selected]);

  const visibleEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return events.filter((event) => {
      const isAssigned = selected.has(event.id);
      if (filter === 'assigned' && !isAssigned) return false;
      if (filter === 'pending' && isAssigned) return false;
      if (!needle) return true;

      return `${event.clientName} ${event.location ?? ''} ${eventTypeLabel(event.type)} ${formatDate(event.date)}`
        .toLowerCase()
        .includes(needle);
    });
  }, [events, filter, query, selected]);

  const toggleEvent = useCallback((eventId: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(eventId);
      else next.delete(eventId);
      return next;
    });
    setError('');
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(freshLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      linkInputRef.current?.select();
    }
  }, [freshLink]);

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      // 1) asignaciones (payload idéntico al que ya enviaba el tab)
      await requestManagement(apiEndpoint, {
        action: 'assign',
        memberId: member.id,
        eventIds: setToArray(selected),
      });

      // 2) rotación, solo si se pidió: así "Cancelar" nunca deja un enlace cambiado
      let link: string | undefined;

      if (pendingRotate) {
        const rotated = await requestManagement<{ link: string }>(apiEndpoint, {
          action: 'rotate',
          memberId: member.id,
        });
        link = rotated.link;
        setFreshLink(rotated.link);
      }

      const message = pendingRotate
        ? `Enlace de ${member.name} renovado y asignaciones actualizadas.`
        : `Asignaciones de ${member.name} guardadas.`;

      shellRef.current?.close(() => onSaved?.(message, link ? { link } : undefined));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los cambios.');
      setIsSaving(false);
    }
  };

  return (
    <PrivateModalShell
      ref={shellRef}
      style={{ width: 'min(880px, 100%)' }}
      eyebrow="COLABORADOR"
      title={member.name}
      subtitle={`${selected.size} de ${events.length} eventos asignados · alta el ${formatDateTime(member.createdAt)}`}
      error={error}
      isDirty={isDirty}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={() => void handleSave()}
      submitLabel={pendingRotate ? 'Guardar y renovar' : 'Guardar cambios'}
      trailing={
        freshLink ? (
          <div className="eem__fresh" role="status">
            <strong>Nuevo enlace personal</strong>
            <div className="eem__link-row">
              <input
                ref={linkInputRef}
                readOnly
                value={freshLink}
                aria-label="Nuevo enlace personal"
                onFocus={(event) => event.currentTarget.select()}
              />
              <button type="button" className="eem__ghost" onClick={() => void copyLink()}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <small>
              El anterior deja de funcionar. Cópialo ahora: por seguridad solo se muestra una vez.
            </small>
          </div>
        ) : undefined
      }
    >
      <div className="eem__toolbar">
        <label className="eem__search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, lugar o tipo…"
            aria-label="Buscar eventos"
          />
        </label>

        <div className="eem__filters" role="group" aria-label="Filtrar eventos">
          {(
            [
              ['all', `Todos (${events.length})`],
              ['assigned', `Asignados (${selected.size})`],
              ['pending', `Pendientes (${events.length - selected.size})`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'is-active' : undefined}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="eem__list">
        {visibleEvents.length === 0 ? (
          <p className="eem__empty">
            {events.length === 0
              ? 'No hay eventos confirmados que asignar.'
              : 'Ningún evento coincide con el filtro.'}
          </p>
        ) : (
          visibleEvents.map((event) => {
            const isAssigned = selected.has(event.id);
            const team = event.collaboratorIds.length;

            return (
              <label className={`eem__option${isAssigned ? ' is-assigned' : ''}`} key={event.id}>
                <input
                  type="checkbox"
                  checked={isAssigned}
                  onChange={(changeEvent) => toggleEvent(event.id, changeEvent.currentTarget.checked)}
                />
                <span className="eem__option-text">
                  <span className="eem__option-text-header">
                    <strong>{event.clientName}</strong>
                    <span className="eem__badges">
                      <span className="eem__badge type">{eventTypeLabel(event.type)}</span>
                      <span className="eem__badge">
                        {team === 0 ? 'Sin equipo' : `${team} en el equipo`}
                      </span>
                      {assignedInitially.has(event.id) && (
                        <span className="eem__badge">Asignado antes</span>
                      )}
                    </span>
                  </span>
                  <small>
                    {formatDate(event.date)}
                    {event.location ? ` · ${event.location}` : ''}
                  </small>
                </span>
              </label>
            );
          })
        )}
      </div>

      <div className="eem__toolbar">
        <span className="eem__count">
          <strong>{selected.size}</strong> seleccionados
        </span>
        <div className="eem__filters">
          <button
            type="button"
            onClick={() =>
              setSelected((current) => {
                const next = new Set(current);
                visibleEvents.forEach((event) => next.add(event.id));
                return next;
              })
            }
          >
            Marcar los visibles
          </button>
          <button type="button" onClick={() => setSelected(new Set())}>
            Quitar todas
          </button>
        </div>
      </div>

      <div className="eem__section-title">
        <h6>Enlace personal</h6>
        <button
          type="button"
          className="eem__ghost"
          onClick={() => {
            setPendingRotate((current) => !current);
            setError('');
          }}
        >
          {pendingRotate ? 'Cancelar renovación' : 'Renovar enlace'}
        </button>
      </div>

      {pendingRotate ? (
        <div className="eem__pending">
          <span>
            Al guardar se generará un enlace nuevo y <strong>el actual dejará de funcionar</strong>{' '}
            para {member.name}.
          </span>
          <button type="button" onClick={() => setPendingRotate(false)}>
            Descartar
          </button>
        </div>
      ) : (
        <div className="eem__link-box">
          <p>
            Renueva el enlace si se ha compartido con alguien equivocado o si el colaborador ha
            cambiado de correo. Los cambios de eventos se aplican sin generar uno nuevo.
          </p>
        </div>
      )}
    </PrivateModalShell>
  );
}

/** MISMA forma de llamar a la API que usaba el tab (sin tocar tu ruta). */
async function requestManagement<T = unknown>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la operación.');
  }

  return data as T;
}

export default EventMemberEditModal;
