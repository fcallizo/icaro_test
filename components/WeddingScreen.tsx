import { Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PageHeader } from '@/components/common/PageHeader';

type WeddingTab = 'video' | 'foto' | 'reserva';

type WeddingForm = {
  nombre: string;
  email: string;
  telNovio: string;
  telNovia: string;
  fecha: string;
  lugar: string;
  novia: string;
  novio: string;
  ceremonia: string;
  horaSalidaNovio: string;
  horaSalidaNovia: string;
  horaCeremonia: string;
  horaCoctel: string;
  horaBarraLibre: string;
  detalles: string;
};

type WeddingScreenProps = {
  onBackToHome: () => void;
  onShowCinema: () => void;
  weddingForm: WeddingForm;
  setWeddingForm: Dispatch<SetStateAction<WeddingForm>>;
  requests: CalendarRequest[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onWeddingSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WeddingScreen({
  onBackToHome,
  onShowCinema,
  weddingForm,
  setWeddingForm,
  requests,
  unifyCalendars,
  isSubmitting,
  onWeddingSubmit,
}: WeddingScreenProps) {
  const [activeTab, setActiveTab] = useState<WeddingTab>('video');

  return (
    <div className="page-shell page-shell-bodas">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <PageHeader
        view="wedding"
        theme="light"
        onHome={onBackToHome}
        onCinema={onShowCinema}
        onWedding={() => setActiveTab('video')}
      />

      <main className="content-section weddings-mode">
        <div className="hero-block light">
          <span className="eyebrow">WEDDING FILMS</span>
          <h2>HISTORIAS QUE SE VUELVEN RECUERDO</h2>
          <p>Un enfoque documental, elegante y cercano para cada detalle de tu día más importante.</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Servicios de bodas">
          <button type="button" role="tab" aria-selected={activeTab === 'video'} className={activeTab === 'video' ? 'tab active' : 'tab'} onClick={() => setActiveTab('video')}>Películas Documentales</button>
          <button type="button" role="tab" aria-selected={activeTab === 'foto'} className={activeTab === 'foto' ? 'tab active' : 'tab'} onClick={() => setActiveTab('foto')}>Reportaje Fotográfico</button>
          <button type="button" role="tab" aria-selected={activeTab === 'reserva'} className={activeTab === 'reserva' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reserva')}>Consultar Calendario</button>
        </div>

        {activeTab === 'video' && (
          <div className="tab-panel" role="tabpanel">
            <div className="video-showcase">
              <div className="video-card">
                <div className="play-button light" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'foto' && (
          <div className="tab-panel" role="tabpanel">
            <div className="gallery-grid">
              <div className="gallery-card card-one-wedding" />
              <div className="gallery-card card-two-wedding" />
              <div className="gallery-card card-three-wedding" />
            </div>
          </div>
        )}

        {activeTab === 'reserva' && (
          <div className="tab-panel" role="tabpanel">
            <div className="reservation-layout">
              <AvailabilityCalendar
                title="📅 Calendario de Disponibilidad"
                requests={requests}
                requestTypes={unifyCalendars ? undefined : ['wedding']}
                variant="light"
              />

              <div className="booking-form wedding-panel">
                <form onSubmit={onWeddingSubmit}>
                  <h4>Comprobar disponibilidad / Reservar</h4>
                  <p className="sub-form-texto">Completa los detalles de vuestro enlace para verificar la viabilidad técnica.</p>
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
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Solicitar fecha de rodaje'}</button>
                </form>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
