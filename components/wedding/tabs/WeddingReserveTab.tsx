import { Dispatch, FormEvent, SetStateAction } from 'react';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PrivacyFormNotice } from '@/components/common/PrivacyFormNotice';
import { CalendarBlockRange } from '@/components/private/private-types';
import { ContactPanel } from '@/components/common/ContactPanel';
import { WeddingForm } from '../WeddingForm';

type WeddingReserveTabProps = {
  weddingForm: WeddingForm;
  setWeddingForm: Dispatch<SetStateAction<WeddingForm>>;
  requests: CalendarRequest[];
  blockedRanges: CalendarBlockRange[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onWeddingSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WeddingReserveTab({
  weddingForm,
  setWeddingForm,
  requests,
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  onWeddingSubmit,
}: WeddingReserveTabProps) {
  return (
    <div className="tab-panel" role="tabpanel">
      <div className="hero-block light">
          <h1>Empecemos a planificar</h1>
          <p>Cuéntanos la fecha, los lugares y lo que os gustaría conservar de vuestro día.</p>
        </div>
      <div className="reservation-layout">
        <div>
          <AvailabilityCalendar
            title="Calendario de Disponibilidad"
            requests={requests}
            manualBlockedRanges={blockedRanges}
            requestTypes={unifyCalendars ? undefined : ['wedding']}
            variant="light"
          />

          <div className="booking-form wedding-panel contact-panel">
            <ContactPanel />
          </div>
        </div>
        <div className="booking-form wedding-panel">

          <form onSubmit={onWeddingSubmit}>
            <div className="field-group">
              <label>Nombre completo de los novios</label>
              <input type="text" value={weddingForm.nombre} onChange={(e) => setWeddingForm((current) => ({ ...current, nombre: e.target.value }))} placeholder="Ej: Paola Gómez & David Alfaro" required />
            </div>
            <div className="field-group">
              <label>Correo de contacto</label>
              <input type="email" value={weddingForm.email} onChange={(e) => setWeddingForm((current) => ({ ...current, email: e.target.value }))} placeholder="nombre@ejemplo.com" autoComplete="email" required />
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Teléfono del novio</label>
                <InternationalPhoneInput value={weddingForm.telNovio} onChange={(value) => setWeddingForm((current) => ({ ...current, telNovio: value }))} placeholder="600 123 456" required />
              </div>
              <div className="field-group">
                <label>Teléfono de la novia</label>
                <InternationalPhoneInput value={weddingForm.telNovia} onChange={(value) => setWeddingForm((current) => ({ ...current, telNovia: value }))} placeholder="600 789 012" required />
              </div>
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Fecha del enlace</label>
                <input type="date" value={weddingForm.fecha} onChange={(e) => setWeddingForm((current) => ({ ...current, fecha: e.target.value }))} required />
              </div>
              <div className="field-group">
                <label>Lugar de la celebración (banquete)</label>
                <input type="text" value={weddingForm.lugar} onChange={(e) => setWeddingForm((current) => ({ ...current, lugar: e.target.value }))} placeholder="Ej: Hacienda Dehesa Campoamor" required />
              </div>
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Casa de la novia (dirección exacta)</label>
                <input type="text" value={weddingForm.novia} onChange={(e) => setWeddingForm((current) => ({ ...current, novia: e.target.value }))} placeholder="Dirección para preparativos" />
              </div>
              <div className="field-group">
                <label>Casa del novio (dirección exacta)</label>
                <input type="text" value={weddingForm.novio} onChange={(e) => setWeddingForm((current) => ({ ...current, novio: e.target.value }))} placeholder="Dirección para preparativos" />
              </div>
            </div>
            <div className="field-group">
              <label>Iglesia / lugar de la ceremonia</label>
              <input type="text" value={weddingForm.ceremonia} onChange={(e) => setWeddingForm((current) => ({ ...current, ceremonia: e.target.value }))} placeholder="Nombre y dirección" />
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Salida de casa del novio</label>
                <input type="time" value={weddingForm.horaSalidaNovio} onChange={(e) => setWeddingForm((current) => ({ ...current, horaSalidaNovio: e.target.value }))} />
              </div>
              <div className="field-group">
                <label>Salida de casa de la novia</label>
                <input type="time" value={weddingForm.horaSalidaNovia} onChange={(e) => setWeddingForm((current) => ({ ...current, horaSalidaNovia: e.target.value }))} />
              </div>
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Hora de la ceremonia</label>
                <input type="time" value={weddingForm.horaCeremonia} onChange={(e) => setWeddingForm((current) => ({ ...current, horaCeremonia: e.target.value }))} />
              </div>
              <div className="field-group">
                <label>Hora del cóctel</label>
                <input type="time" value={weddingForm.horaCoctel} onChange={(e) => setWeddingForm((current) => ({ ...current, horaCoctel: e.target.value }))} />
              </div>
            </div>
            <div className="field-group">
              <label>Hora de la barra libre</label>
              <input type="time" value={weddingForm.horaBarraLibre} onChange={(e) => setWeddingForm((current) => ({ ...current, horaBarraLibre: e.target.value }))} />
            </div>
            <div className="field-group">
              <label>Cuéntanos más detalles de vuestro día</label>
              <textarea rows={3} value={weddingForm.detalles} onChange={(e) => setWeddingForm((current) => ({ ...current, detalles: e.target.value }))} placeholder="Ideas clave para el tráiler, estilo del evento..." />
            </div>
            <PrivacyFormNotice />
            <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar solicitud de boda'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
