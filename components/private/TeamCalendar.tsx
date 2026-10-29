'use client';

import { useEffect, useState } from 'react';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';

type AssignedEvent = {
  id: string;
  type: CalendarRequest['type'];
  date: string;
  status: string;
  clientName: string;
  colleagues: string[];
  details: Record<string, string | number | null>;
};

type TeamCalendarData = { memberName: string; events: AssignedEvent[] };
type SectionDef = { title: string; fields: string[], type: string; };

// ----- Layout por tipo (aquí ordenas los campos a tu gusto) -----
const WEDDING_TYPES = new Set(['wedding', 'prewedding', 'postwedding']);
const isWedding = (type: string) => WEDDING_TYPES.has(type);

const WEDDING_SECTIONS: SectionDef[] = [
  { title: 'Información de contacto', fields: ['nombre', 'email', 'tel_novio', 'tel_novia'], type: 'default' },
  { title: 'Ubicación y hora', fields: ['novio','hora_salida_novio', 'novia', 'hora_salida_novia','ceremonia', 
    'hora_ceremonia', 'lugar', 'hora_coctel', 'hora_barra_libre'], type: 'wedding' },
  { title: 'Ubicación y hora', fields: ['fecha_preboda','lugar_preboda'], type: 'prewedding'},
  { title: 'Ubicación y hora', fields: ['fecha_postboda','lugar_postboda'], type: 'postwedding' },
];
const PRODUCTION_SECTIONS: SectionDef[] = [
  { title: 'Información de contacto', fields: ['nombre', 'email', 'telefono', 'lugar'], type: 'default' },
  { title: 'Material del evento', fields: ['setup_camara', 'setup_drone', 'setup_iluminacion', 'setup_sonido', 'logistica'], type: 'default' },
];

function formatFieldName(value: string) {
  return value.replace(/setup_/g, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toLocaleUpperCase('es-ES'));
}
function formatFieldValue(value: string | number) {
  return typeof value === 'number' ? new Intl.NumberFormat('es-ES').format(value) : value;
}
function typeLabel(type: string) {
  if (type === 'production') return 'Producción';
  if (type === 'prewedding') return 'Preboda';
  if (type === 'postwedding') return 'Postboda';
  return 'Boda';
}

// ----- Tarjeta tipo formulario, con secciones -----
function EventCard({ event }: { event: AssignedEvent }) {
  const wedding = isWedding(event.type);
  const sections = wedding ? WEDDING_SECTIONS : PRODUCTION_SECTIONS;

  return (
    <article className={`team-assigned-event ${wedding ? 'is-wedding' : 'is-production'}`}>
      <div className="team-assigned-event-heading">
        <div>
          <span className="event-type-tag">{typeLabel(event.type)}</span>
          <h3>{event.clientName}</h3>
        </div>
        <time dateTime={event.date}>
          {new Date(`${event.date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </time>
      </div>

      {event.colleagues.length > 0 && (
        <section className="event-section team-event-colleagues">
          <h4>Compañeros</h4>
          <p>{event.colleagues.join(', ')}</p>
        </section>
      )}

      {sections.map((section) => {
        if (event.type !== section.type && section.type !== 'default') return null;
        const rows = section.fields
          .map((k) => [k, event.details[k]] as [string, string | number | null])
          .filter(([, v]) => v !== null && v !== '');
        if (rows.length === 0) return null; // oculta secciones vacías
        return (
          <section className="event-section" key={section.title}>
            <h4>{section.title}</h4>
            <dl className="team-event-details">
              {rows.map(([field, value]) => (
                <div key={field}>
                  <dt>{formatFieldName(field)}</dt>
                  <dd>{formatFieldValue(value as string | number)}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </article>
  );
}

export function TeamCalendar({ token }: { token: string }) {
  const [data, setData] = useState<TeamCalendarData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/equipo/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo cargar el calendario.');
        setData(result as TeamCalendarData);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el calendario.'))
      .finally(() => setIsLoading(false));
  }, [token]);

  const visibleEvents = data?.events.filter((event) => !selectedDate || event.date === selectedDate) || [];

  return (
    <main className="page-shell team-calendar-page">
      <header className="team-calendar-header">
        <img src="/logo_sf_c.png" alt="Ícaro Studio" />
        <div>
          <span className="eyebrow">CALENDARIO DE EQUIPO</span>
          <h1>{data ? `Hola, ${data.memberName}` : 'Eventos asignados'}</h1>
        </div>
      </header>
      <section className="team-calendar-content">
        {isLoading ? (
          <p className="private-state-message">Cargando tu calendario...</p>
        ) : error ? (
          <p className="team-calendar-error" role="alert">{error}</p>
        ) : data ? (
          <>
            <AvailabilityCalendar
              title="Tus trabajos asignados"
              requests={data.events.map((event) => ({ type: event.type, fecha: event.date, status: event.status }))}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            <div className="team-calendar-list-heading">
              <h2>{selectedDate ? `Trabajos para el día ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES')}` : 'Todos tus trabajos'}</h2>
              {selectedDate && <button type="button" onClick={() => setSelectedDate(null)}>Ver todos</button>}
            </div>
            {visibleEvents.length === 0 ? (
              <p className="private-empty-state">No tienes trabajos asignados{selectedDate ? ' para esta fecha' : ''}.</p>
            ) : (
              <div className="team-assigned-events">
                {visibleEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}