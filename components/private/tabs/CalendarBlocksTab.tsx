import { FormEvent, useState } from 'react';
import { CalendarBlock } from '@/components/private/private-types';

type CalendarBlocksTabProps = {
  blocks: CalendarBlock[];
  busyId: string;
  isCreating: boolean;
  onCreate: (startDate: string, endDate: string, reason: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function formatDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function CalendarBlocksTab({ blocks, busyId, isCreating, onCreate, onDelete }: CalendarBlocksTabProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onCreate(startDate, endDate, reason)) {
      setStartDate('');
      setEndDate('');
      setReason('');
    }
  };

  return (
    <div className="private-tab-panel calendar-blocks-tab" role="tabpanel">
      <section className="private-request-section">
        <h3>Días no disponibles</h3>
        <p className="calendar-blocks-intro">Bloquea días libres, vacaciones u otras fechas. Se marcarán como ocupadas en el calendario.</p>

        <form className="calendar-block-form" onSubmit={(event) => void handleCreate(event)}>
          <label>
            Desde
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </label>
          <label>
            Hasta
            <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} required />
          </label>
          <label className="calendar-block-reason">
            Motivo interno (opcional)
            <input type="text" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Vacaciones, viaje..." />
          </label>
          <button type="submit" className="private-material-save" disabled={isCreating}>
            {isCreating ? 'Guardando...' : 'Bloquear fechas'}
          </button>
        </form>

        <div className="calendar-block-list" aria-live="polite">
          {blocks.length === 0 ? (
            <p className="private-empty-state">Todavía no hay días bloqueados manualmente.</p>
          ) : blocks.map((block) => (
            <article className="calendar-block-row" key={block.id}>
              <div>
                <strong>{block.startDate === block.endDate ? formatDate(block.startDate) : `${formatDate(block.startDate)} – ${formatDate(block.endDate)}`}</strong>
                <p>{block.reason || 'Sin motivo indicado'}</p>
              </div>
              <button type="button" className="private-material-toggle" disabled={busyId === block.id} onClick={() => onDelete(block.id)}>
                {busyId === block.id ? 'Quitando...' : 'Desbloquear'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
