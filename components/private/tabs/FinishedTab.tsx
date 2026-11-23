'use client';

import { useState } from 'react';
import { RequestCard } from '@/components/private/RequestCard';
import type { PrivateRequest } from '@/lib/private-types';

type FinishedPeriod = 'month' | 'sixMonths' | 'year' | 'fiveYears' | 'all';

const periodMonths: Record<Exclude<FinishedPeriod, 'all'>, number> = {
  month: 1,
  sixMonths: 6,
  year: 12,
  fiveYears: 60,
};

function isFinishedPeriod(value: string): value is FinishedPeriod {
  return value === 'month'
    || value === 'sixMonths'
    || value === 'year'
    || value === 'fiveYears'
    || value === 'all';
}

function subtractMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() - months);
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfMonth));
  return result;
}

export function FinishedTab({
  requests,
  selectedDate,
  onView,
}: {
  requests: PrivateRequest[];
  selectedDate: string | null;
  onView: (request: PrivateRequest) => void;
}) {
  const [period, setPeriod] = useState<FinishedPeriod>('month');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = period === 'all'
    ? null
    : subtractMonths(today, periodMonths[period]);
  const finishedRequests = requests
    .filter((request) => {
      if (request.status !== 'finished' || !request.finished_at) return false;
      const finishedAt = new Date(request.finished_at);
      return !Number.isNaN(finishedAt.getTime()) && (!cutoff || finishedAt >= cutoff);
    })
    .sort((left, right) => new Date(right.finished_at ?? 0).getTime() - new Date(left.finished_at ?? 0).getTime());
  const finishedPrimaryEvents = finishedRequests.filter((request) => !selectedDate || request.fecha === selectedDate);
  const finishedSecondaryEvents = finishedRequests.flatMap((request) => [
    request.fechaPreboda && (!selectedDate || request.fechaPreboda === selectedDate)
      ? { request, type: 'prewedding' as const, date: request.fechaPreboda }
      : null,
    request.fechaPostboda && (!selectedDate || request.fechaPostboda === selectedDate)
      ? { request, type: 'postwedding' as const, date: request.fechaPostboda }
      : null,
  ].filter((event) => event !== null));

  return (
    <div className="private-tab-panel" role="tabpanel">
      <section className="private-request-section">
        <div className="finished-events-header">
          <h3>Eventos finalizados</h3>
          <label className="finished-events-filter" htmlFor="finished-events-period">
            Periodo de finalización
            <select
              id="finished-events-period"
              value={period}
              onChange={(event) => {
                if (isFinishedPeriod(event.target.value)) setPeriod(event.target.value);
              }}
            >
              <option value="month">Último mes</option>
              <option value="sixMonths">Últimos 6 meses</option>
              <option value="year">Último año</option>
              <option value="fiveYears">Últimos 5 años</option>
              <option value="all">Siempre</option>
            </select>
          </label>
        </div>
        {finishedPrimaryEvents.length || finishedSecondaryEvents.length ? (
          <div className="private-confirmed-grid">
            {finishedPrimaryEvents.map((request) => (
              <RequestCard key={request.id} request={request} onView={() => onView(request)} />
            ))}
            {finishedSecondaryEvents.map(({ request, type, date }) => (
              <RequestCard
                key={`${request.id}-${type}`}
                request={request}
                eventType={type}
                eventDate={date}
                onView={() => onView(request)}
              />
            ))}
          </div>
        ) : (
          <p className="private-empty-state">No hay eventos finalizados en este periodo.</p>
        )}
      </section>
    </div>
  );
}
