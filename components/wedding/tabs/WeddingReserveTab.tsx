import { Dispatch, FormEvent, SetStateAction } from 'react';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PrivacyFormNotice } from '@/components/common/PrivacyFormNotice';
import { CalendarBlockRange } from '@/components/private/private-types';
import { ContactPanel } from '@/components/common/ContactPanel';
import { createFormFields } from '@/components/common/FormFields';
import { ReserveWeddingForm } from '../WeddingForm';
import { PACK_OPTIONS } from '@/lib/wedding-form';

type WeddingReserveTabProps = {
  weddingForm: ReserveWeddingForm;
  setWeddingForm: Dispatch<SetStateAction<ReserveWeddingForm>>;
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
  const { input, inputPhone, textarea, select } = createFormFields({
    values: weddingForm,
    idPrefix: 'wedding-reserve',
    onChange: (field, value) => setWeddingForm((current) => ({ ...current, [field]: value })),
    dateInputWrapper: true,
    textareaClassName: 'field-group',
    emptyOption: 'Seleccionen una opción',
  });

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
            <ContactPanel classType="wedding-link" />
          </div>
        </div>
        <div className="booking-form wedding-panel">
          <form onSubmit={onWeddingSubmit}>
            {input('nombre', 'Nombre completo de los novios', 'text', true, false, false, 'Ej: Paola Gómez & David Alfaro')}
            <div className="two-col">
              {input('email', 'Correo de contacto', 'email', true, false, false, 'nombre@ejemplo.com')}
              {inputPhone('telNovia', 'Teléfono de Contacto', true, false)}
            </div>
            <div className="two-col">
              {input('fecha', 'Fecha del enlace', 'date', true, false, false, '')}
              {select('tipoPack', '¿Qué os interesa?', PACK_OPTIONS, true)}
            </div>
            {input('ceremonia', 'Iglesia / lugar de la ceremonia', 'text', false, false, false, 'Nombre y dirección')}
            {textarea('detalles', 'Cuéntanos más detalles de vuestro día', false, 'Ideas clave para el tráiler, estilo del evento...')}
            <PrivacyFormNotice />
            <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar solicitud de boda'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
