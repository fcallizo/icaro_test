import { Dispatch, FormEvent, SetStateAction } from 'react';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PrivacyFormNotice } from '@/components/common/PrivacyFormNotice';
import { CalendarBlockRange } from '@/components/private/private-types';
import { ContactPanel } from '@/components/common/ContactPanel';
import { ReserveProductionForm } from '../ProductionForm';
import { createFormFields } from '@/components/common/FormFields';

type CinemaReserveTabProps = {
  productionForm: ReserveProductionForm;
  setProductionForm: Dispatch<SetStateAction<ReserveProductionForm>>;
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
    const { input, inputPhone, textarea, inputSuffix } = createFormFields({
      values: productionForm,
      idPrefix: 'wedding-reserve',
      onChange: (field, value) => setProductionForm((current) => ({ ...current, [field]: value })),
      dateInputWrapper: true,
      textareaClassName: 'field-group',
      emptyOption: 'Seleccionen una opción',
    });

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
            <ContactPanel classType="dark-link" />
          </div>
        </div>

        <div className="booking-form card-dark">
          <form onSubmit={onProductionSubmit}>
            <h4>Solicitar Producción</h4>
            {input('nombre', 'Nombre / Empresa', 'text', true, false, false, '')}
            <div className="two-col">
              {input('email', 'Correo de contacto', 'email', true, false, false, 'nombre@ejemplo.com')}
              {inputPhone('telefono', 'Teléfono de Contacto', true, false)}
            </div>
            <div className="two-col">
              {input('fecha', 'Fecha de Realización', 'date', true, false, false, '')}
              {inputSuffix('presupuesto', 'Presupuesto estimado', true, false, false)}
            </div>
            {input('tipo', 'Tipo de producción', 'text', true, false, false, 'Ej: Publicidad, Videoclip, Corporativo')}
            {textarea('detalles', 'Idea principal', false, 'Explícanos brevemente tu idea para el rodaje...')}
            <PrivacyFormNotice />
            <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar solicitud técnica'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
