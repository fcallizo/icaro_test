import { Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';
import { PageHeader } from '@/components/common/PageHeader';
import { PrivacyFormNotice } from '@/components/common/PrivacyFormNotice';
import { PublicLegalFooter } from '@/components/common/PublicLegalFooter';
import { CalendarBlockRange } from '@/components/private/private-types';

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
  blockedRanges: CalendarBlockRange[];
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
  blockedRanges,
  unifyCalendars,
  isSubmitting,
  onWeddingSubmit,
}: WeddingScreenProps) {
  const [activeTab, setActiveTab] = useState<WeddingTab>('video');

  return (
    <div className="page-shell page-shell-tabs page-shell-bodas">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <PageHeader
        view="wedding"
        theme="light"
        onHome={onBackToHome}
        onCinema={onShowCinema}
        onWedding={() => setActiveTab('video')}
      />

      <main className="content-section content-section-tabs weddings-mode">
        <div className="tabs" role="tablist" aria-label="Servicios de bodas">
          <button type="button" role="tab" aria-selected={activeTab === 'video'} className={activeTab === 'video' ? 'tab active' : 'tab'} onClick={() => setActiveTab('video')}>Mira lo que creamos</button>
          <button type="button" role="tab" aria-selected={activeTab === 'foto'} className={activeTab === 'foto' ? 'tab active' : 'tab'} onClick={() => setActiveTab('foto')}>Así hacemos realidad tu sueño</button>
          <button type="button" role="tab" aria-selected={activeTab === 'reserva'} className={activeTab === 'reserva' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reserva')}>Hablemos de vuestra boda</button>
        </div>

        {activeTab === 'video' && (
          <div className="tab-panel" role="tabpanel">
            <div className="hero-block light">
              <h2>Historias que se vuelven recuerdo</h2>
              <p>Un enfoque documental, elegante y cercano para cada detalle de tu día más importante.</p>
            </div>
            <div className="video-showcase">
              <div className="video-card">
                <div className="play-button light" />
              </div>
            </div>
          </div>
        )}


        {activeTab === 'foto' && (
          <div className="tab-panel" role="tabpanel">
            <section className="wedding-planning" aria-labelledby="wedding-planning-title">
              <div className="hero-block light">
                {/* <span className="eyebrow">VUESTRA HISTORIA, A VUESTRO RITMO</span> */}
                <h2>Cada detalle merece su momento</h2>
                <p>Empezamos por lo que hace único vuestro día. Conocemos los lugares, los momentos importantes y el estilo que imagináis para dar forma a una cobertura natural y personal.</p>
              </div>

              <div className="wedding-story-list">
                <div className="wedding-story-row">
                  <div className="wedding-story-image card-three-wedding" role="img" aria-label="Pareja celebrando su boda" />
                  <article>
                  <h4>Vuestra historia</h4>
                  <p>Compartid las personas, gestos y momentos que queréis volver a sentir cada vez que veáis vuestro recuerdo.</p>
                  </article>
                </div>
                <div className="wedding-story-row">
                  <article>
                  <h4>Imagen a vuestra medida</h4>
                  <p>Podemos orientar la cobertura hacia película documental, reportaje fotográfico o una combinación de ambos.</p>
                  </article>
                  <div className="wedding-story-image card-four-wedding" role="img" aria-label="Novios durante su celebración" />
                </div>
                <div className="wedding-story-row">
                  <div className="wedding-story-image card-two-wedding" role="img" aria-label="Celebración al aire libre" />
                  <article>
                  <h4>Un día sin prisas</h4>
                  <p>Coordinamos los horarios para estar presentes y capturar cada momento desde el principio hasta el final de su día especial.</p>
                  </article>
                </div>
              </div>
            </section>

            <div className="hero-block light">
              <h2>Nuestras Tarifas</h2>
            </div>
            <div className="cards-grid ">
              <div className="info-card booking-form wedding-panel">
                <div className="card-title">Pre Boda</div>
                <div className="price-row"><div><strong>Spot Comercial</strong><span>Publicidad, branding y contenido premium.</span></div><b>Desde 250€</b></div>
                <div className="price-row"><div><strong>Videoclip Cinematográfico</strong><span>Dirección visual y edición avanzada.</span></div><b>Desde 150€</b></div>
                <div className="price-row no-border"><div><strong>Producción Completa</strong><span>Equipo técnico y planificación avanzada.</span></div><b>A medida</b></div>
              </div>

              <div className="info-card booking-form wedding-panel">
                <div className="card-title">Boda</div>
                <div className="price-row"><div><strong>Spot Comercial</strong><span>Publicidad, branding y contenido premium.</span></div><b>Desde 250€</b></div>
                <div className="price-row"><div><strong>Videoclip Cinematográfico</strong><span>Dirección visual y edición avanzada.</span></div><b>Desde 150€</b></div>
                <div className="price-row no-border"><div><strong>Producción Completa</strong><span>Equipo técnico y planificación avanzada.</span></div><b>A medida</b></div>
              </div>

              <div className="info-card booking-form wedding-panel">
                <div className="card-title">Post Boda</div>
                <div className="price-row"><div><strong>Spot Comercial</strong><span>Publicidad, branding y contenido premium.</span></div><b>Desde 250€</b></div>
                <div className="price-row"><div><strong>Videoclip Cinematográfico</strong><span>Dirección visual y edición avanzada.</span></div><b>Desde 150€</b></div>
                <div className="price-row no-border"><div><strong>Producción Completa</strong><span>Equipo técnico y planificación avanzada.</span></div><b>A medida</b></div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'reserva' && (
          <div className="tab-panel" role="tabpanel">
            <div className="hero-block light">
                <h2>Empecemos a planificar</h2>
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
                  <h4>Contacta con nosotros</h4>
                  <p>📞 +34 633 716 171</p>
                  <p nav-link>
                      <img src="/gmail.png" alt="" className="nav-icon" />
                      <span className="nav-label">icarostudio33@gmail.com</span>
                  </p>
                  <p nav-link>
                      <img src="/instagram.png" alt="" className="nav-icon" />
                      <span className="nav-label">icarostudio_</span>
                  </p>
                  <p>📍 C/ Marqués de la ensenada, 10, 30007 Murcia</p>
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
        )}
      </main>
      <PublicLegalFooter />
    </div>
  );
}
