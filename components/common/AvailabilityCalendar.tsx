'use client';

import { useState } from 'react';
import { CalendarBlockRange } from '@/lib/private-types';
import { EventType, PageTheme } from '@/lib/properties';

export type CalendarRequest = {
  type: EventType;
  fecha?: string;
  fechaPreboda?: string | null;
  fechaPostboda?: string | null;
  status?: string;
};

type AvailabilityCalendarProps = {
  title: string;
  requests: CalendarRequest[];
  manualBlockedRanges?: CalendarBlockRange[];
  requestTypes?: CalendarRequest['type'][];
  variant?: PageTheme;
  showPending?: boolean;
  showFinishing?: boolean;
  selectedDate?: string | null;
  onDateSelect?: (date: string | null) => void;
};

export function AvailabilityCalendar({
  title,
  requests,
  manualBlockedRanges = [],
  requestTypes,
  variant = 'dark',
  showPending = false,
  showFinishing = false,
  selectedDate = null,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date());
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = displayedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const isIncludedRequest = (request: CalendarRequest) => !requestTypes
    || requestTypes.includes(request.type)
    || (['prewedding', 'postwedding'].includes(request.type) && requestTypes.includes('wedding'));
  const getRequestDates = (request: CalendarRequest) => [
    request.fecha,
    ...(request.type === 'wedding' ? [request.fechaPreboda, request.fechaPostboda] : []),
  ].filter((date): date is string => Boolean(date));
  const bookedDates = new Set(
    requests
      .filter((request) => (request.status === 'confirmed' || request.status === 'finished') && isIncludedRequest(request))
      .flatMap(getRequestDates),
  );
  const pendingDates = new Set(
    showPending
      ? requests
          .filter((request) => request.status === 'pending' && isIncludedRequest(request))
          .flatMap(getRequestDates)
      : [],
  );
  const finishedDates = new Set(
    showFinishing
      ? requests
          .filter((request) => request.status === 'finished' && isIncludedRequest(request))
          .flatMap(getRequestDates)
      : [],
  );
  const calendarClass = variant === 'light' ? 'calendar-block wedding-calendar' : 'calendar-block';
  const calendarBoxClass = variant === 'light' ? 'calendar-box' : 'calendar-box dark';

  type DayClassProps = {
    isBooked: boolean;
    isPending: boolean;
    isFinished: boolean;
    isPassed: boolean;
  }

  function getDayClass({ isBooked, isPending, isFinished, isPassed }: DayClassProps) {
    if (isFinished && showFinishing) return 'day finished';
    if (isBooked) return 'day busy';
    if (isPending) return 'day pending';
    if (!isPassed) return 'day free';

    return 'day passed';
  }

  return (
    <section className={calendarClass}>
      <h3>{title}</h3>
      <div className={calendarBoxClass}>
        <div className="calendar-header">
          <button type="button" aria-label="Mes anterior" onClick={() => setDisplayedMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
            <span className="icon-mask icon-arrow " aria-hidden="true" />
          </button>
          <span>{monthLabel.charAt(0).toLocaleUpperCase('es-ES') + monthLabel.slice(1)}</span>
          <button type="button" aria-label="Mes siguiente" onClick={() => setDisplayedMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
            <span className="icon-mask icon-arrow icon-inverted" aria-hidden="true" />
          </button>
        </div>
        <div className="weekday-row"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
        <div className="days-grid">
          {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} className="day empty" />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isManuallyBlocked = manualBlockedRanges.some((range) => {
              const startDate = range.startDate.slice(0, 10);
              const endDate = range.endDate.slice(0, 10);
              return date >= startDate && date <= endDate;
            });
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isBooked = bookedDates.has(date) || isManuallyBlocked;
            const isPending = !isBooked && pendingDates.has(date);
            const isFinished = finishedDates.has(date);
            const isPassed = new Date(date) < today; 
            const dayClass = getDayClass({ isBooked, isPending, isFinished, isPassed });
            const dayTitle = isBooked
              ? isManuallyBlocked && !bookedDates.has(date)
                ? 'Fecha no disponible' : 'Fecha ocupada'
              : isPending
                ? 'Solicitud pendiente'
                : isPassed ? 'Fecha no disponible' : 'Fecha disponible';
            const isSelected = selectedDate === date;
            const selectedClass = isSelected ? ' selected' : '';

            if (onDateSelect) {
              const fullDateLabel = new Date(year, month, day).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              return (
                <button
                  key={date}
                  type="button"
                  className={`${dayClass}${selectedClass} calendar-day-button`}
                  title={dayTitle}
                  aria-label={`${fullDateLabel}, ${dayTitle.toLocaleLowerCase('es-ES')}`}
                  aria-pressed={isSelected}
                  onClick={() => onDateSelect(isSelected ? null : date)}
                >
                  {day}
                </button>
              );
            }

            return <span key={date} className={`${dayClass}${selectedClass}`} title={dayTitle}>{day}</span>;
          })}
        </div>
      </div>
      <p className={`calendar-legend${variant === 'dark' ? ' calendar-legend-dark' : ''}`}>
        <span className="legend-free" /> Disponible 
        <span className="legend-busy" /> Ocupado
        {showPending && <><span className="legend-pending" /> Pendiente</>}
        {showFinishing && <><span className="legend-finished" /> Finalizado</>}
      </p>
    </section>
  );
}