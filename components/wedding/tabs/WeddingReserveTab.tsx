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
  customerFormPath: string;
  onWeddingSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WeddingReserveTab({
  weddingForm,
  setWeddingForm,
  requests,
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  customerFormPath,
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
          {customerFormPath && (
            <div className="customer-form-link-notice" role="status">
              <p>Solicitud recibida. Podéis completar o actualizar los detalles de vuestra boda desde este enlace privado:</p>
              <a href={customerFormPath}>Completar los detalles de la boda</a>
            </div>
          )}

          <form onSubmit={onWeddingSubmit}>
            <div className="field-group">
              <label>Nombre completo de los novios</label>
              <input type="text" value={weddingForm.nombre} onChange={(e) => setWeddingForm((current) => ({ ...current, nombre: e.target.value }))} placeholder="Ej: Paola Gómez & David Alfaro" required />
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Correo de contacto</label>
                <input type="email" value={weddingForm.email} onChange={(e) => setWeddingForm((current) => ({ ...current, email: e.target.value }))} placeholder="nombre@ejemplo.com" autoComplete="email" required />
              </div>
              <div className="field-group">
                <label>Teléfono de Contacto</label>
                <InternationalPhoneInput value={weddingForm.telNovia} onChange={(value) => setWeddingForm((current) => ({ ...current, telNovia: value }))} placeholder="600 789 012" required />
              </div>
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Fecha del enlace</label>
                <div className="date-input">
                  <input type="date" value={weddingForm.fecha} onChange={(e) => setWeddingForm((current) => ({ ...current, fecha: e.target.value }))} required />
                </div>
              </div>
              <div className="field-group">
                <label>¿Qué os interesa?</label>
                <select value={weddingForm.tipoPack} onChange={(e) => setWeddingForm((current) => ({ ...current, tipoPack: e.target.value }))} required >
                  <option value="">Seleccionen una opción</option>
                  <option value="indeciso">Aún no lo sé</option>
                  <option value="boda">Solo boda</option>
                  <option value="duo-pre">Boda + pre-boda</option>
                  <option value="duo-post">Boda + post-boda</option>
                  <option value="trio">Trío (pre-boda + boda + post-boda)</option>
                </select>
              </div>
            </div>
            <div className="field-group">
              <label>Iglesia / lugar de la ceremonia</label>
              <input type="text" value={weddingForm.ceremonia} onChange={(e) => setWeddingForm((current) => ({ ...current, ceremonia: e.target.value }))} placeholder="Nombre y dirección" />
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
