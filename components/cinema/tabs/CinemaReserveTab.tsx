import { Dispatch, FormEvent, SetStateAction } from 'react';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PrivacyFormNotice } from '@/components/common/PrivacyFormNotice';
import { CalendarBlockRange } from '@/components/private/private-types';
import { ContactPanel } from '@/components/common/ContactPanel';

type ProductionForm = {
  nombre: string;
  email: string;
  telefono: string;
  fecha: string;
  tipo: string;
  presupuesto: string;
  descripcion: string;
};

type CinemaReserveTabProps = {
  productionForm: ProductionForm;
  setProductionForm: Dispatch<SetStateAction<ProductionForm>>;
  requests: CalendarRequest[];
  blockedRanges: CalendarBlockRange[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onProductionSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CinemaReserveTab({
  productionForm,
  setProductionForm,
  requests,
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  onProductionSubmit,
}: CinemaReserveTabProps) {
  return (
    <div className="tab-panel">
      <div className="reservation-layout">
        <div>
          <AvailabilityCalendar
            title="Calendario de Producción"
            requests={requests}
            manualBlockedRanges={blockedRanges}
            requestTypes={unifyCalendars ? undefined : ['production']}
          />

          <div className="booking-form contact-panel">
            <ContactPanel />
          </div>
        </div>

        <div className="booking-form card-dark">
          <form onSubmit={onProductionSubmit}>
            <h4>Solicitar Producción</h4>
            <div className="field-group">
              <label>Nombre / Empresa</label>
              <input value={productionForm.nombre} onChange={(e) => setProductionForm((current) => ({ ...current, nombre: e.target.value }))} required />
            </div>
            <div className="field-group">
              <label>Correo de contacto</label>
              <input type="email" value={productionForm.email} onChange={(e) => setProductionForm((current) => ({ ...current, email: e.target.value }))} placeholder="nombre@ejemplo.com" autoComplete="email" required />
            </div>
            <div className="two-col">
              <div className="field-group">
                <label>Teléfono</label>
                <InternationalPhoneInput value={productionForm.telefono} onChange={(value) => setProductionForm((current) => ({ ...current, telefono: value }))} placeholder="600 123 456" required />
              </div>
              <div className="field-group">
                <label>Fecha Realización</label>
                <input type="date" value={productionForm.fecha} onChange={(e) => setProductionForm((current) => ({ ...current, fecha: e.target.value }))} required />
              </div>
            </div>
            <div className="field-group">
              <label>Presupuesto Cliente (€)</label>
              <input type="number" value={productionForm.presupuesto} onChange={(e) => setProductionForm((current) => ({ ...current, presupuesto: e.target.value }))} required />
            </div>
            <div className="field-group">
              <label>Tipo de producción</label>
              <input value={productionForm.tipo} onChange={(e) => setProductionForm((current) => ({ ...current, tipo: e.target.value }))} placeholder="Ej: Publicidad, Videoclip, Corporativo" />
            </div>
            <div className="field-group">
              <label>Idea principal</label>
              <textarea rows={4} value={productionForm.descripcion} onChange={(e) => setProductionForm((current) => ({ ...current, descripcion: e.target.value }))} placeholder="Explícanos brevemente tu idea para el rodaje..." />
            </div>
            <PrivacyFormNotice />
            <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar solicitud técnica'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
