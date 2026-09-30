import { Dispatch, FormEvent, SetStateAction } from 'react';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
import { AvailabilityCalendar, CalendarRequest } from '@/components/common/AvailabilityCalendar';

type TabMode = 'video' | 'foto' | 'produccion';

type ProductionForm = {
  nombre: string;
  email: string;
  telefono: string;
  fecha: string;
  tipo: string;
  presupuesto: string;
  descripcion: string;
};

type CinemaScreenProps = {
  onBackToHome: () => void;
  onShowWedding: () => void;
  tab: TabMode;
  setTab: (tab: TabMode) => void;
  productionForm: ProductionForm;
  setProductionForm: Dispatch<SetStateAction<ProductionForm>>;
  requests: CalendarRequest[];
  unifyCalendars: boolean;
  isSubmitting: boolean;
  onProductionSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CinemaScreen({
  onBackToHome,
  onShowWedding,
  tab,
  setTab,
  productionForm,
  setProductionForm,
  requests,
  unifyCalendars,
  isSubmitting,
  onProductionSubmit,
}: CinemaScreenProps) {
  return (
    <div className="page-shell">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <header className="topbar">
        <div className="nav-container">
          <div className="brand" onClick={onBackToHome}>
            <img src="/logo_transparente.png" alt="Ícaro Logo" className="brand-logo" />
            <span className="brand-name">ÍCARO <span className="brand-accent">STUDIO</span></span>
          </div>

          <nav className="main-nav">
            <a href="#" onClick={onBackToHome}>Inicio</a>
            <a href="#" className="brand-selected" onClick={() => setTab('video')}>Cinematografía</a>
            <a href="#" onClick={onShowWedding}>Bodas</a>
            <a href="https://www.instagram.com/icarostudio_/" target="_blank" rel="noreferrer">📸 Instagram</a>
            <div className="nav-contact">
              <span>📞 +34 633 716 171</span>
              <span>✉️ icarostudio33@gmail.com</span>
            </div>
            <a href="/private" className="nav-admin-btn">🔑 Panel</a>
          </nav>
        </div>
      </header>

      <main className="content-section">
        <div className="hero-block">
          <span className="eyebrow">CINEMATOGRAPHY & COMMERCIALS</span>
          <h2>CREACIÓN AUDIOVISUAL DE ALTO IMPACTO</h2>
          <p>Especialistas en la creación de piezas visuales con identidad propia. Flujos de trabajo avanzados y un tratamiento de color cinematográfico orientado a potenciar el mensaje.</p>
        </div>

        <div className="tabs">
          <button className={tab === 'video' ? 'tab active' : 'tab'} onClick={() => setTab('video')}>Showreel & Trabajos</button>
          <button className={tab === 'foto' ? 'tab active' : 'tab'} onClick={() => setTab('foto')}>Dirección de Fotografía</button>
          <button className={tab === 'produccion' ? 'tab active' : 'tab'} onClick={() => setTab('produccion')}>Área Técnica, Contratos y Tarifas</button>
        </div>

        {tab === 'video' && (
          <div className="tab-panel">
            <div className="claqueta-box">
              <div className="claqueta-body">
                <div className="claqueta-strip" />
                <div className="claqueta-meta"><span>ROLL: 01</span><span>SCENE: MASTER</span><span>TAKE: 1</span></div>
              </div>
            </div>
            <div className="wide-frame">
              <div className="play-box"><div className="play-icon" /></div>
            </div>
          </div>
        )}

        {tab === 'foto' && (
          <div className="tab-panel">
            <div className="gallery-grid">
              <div className="gallery-card card-one" />
              <div className="gallery-card card-two" />
              <div className="gallery-card card-three" />
            </div>
          </div>
        )}

        {tab === 'produccion' && (
          <div className="tab-panel">
            <div className="tech-header">
              <div>
                <span className="eyebrow">PRODUCCIÓN • LOGÍSTICA • PRESUPUESTOS</span>
                <h3>Área Técnica y Planificación de Rodaje</h3>
                <p>Consulta disponibilidad, gestión técnica y orientación de presupuestos. Cada producción se adapta según necesidades reales de rodaje.</p>
              </div>
              <div className="stats-box">
                <div className="stat-card"><strong>HD / 4K</strong><span>Resoluciones</span></div>
                <div className="stat-card"><strong>24h</strong><span>Respuesta Técnica</span></div>
                <div className="stat-card"><strong>+12</strong><span>Servicios Integrables</span></div>
              </div>
            </div>

            <div className="cards-grid">
              <div className="info-card">
                <div className="card-title">💰 Tarifas Orientativas</div>
                <div className="price-row"><div><strong>Spot Comercial</strong><span>Publicidad, branding y contenido premium.</span></div><b>Desde 250€</b></div>
                <div className="price-row"><div><strong>Videoclip Cinematográfico</strong><span>Dirección visual y edición avanzada.</span></div><b>Desde 150€</b></div>
                <div className="price-row no-border"><div><strong>Producción Completa</strong><span>Equipo técnico y planificación avanzada.</span></div><b>A medida</b></div>
              </div>

              <div className="info-card">
                <div className="card-title">🛠️ Gestión Técnica</div>
                <div className="tech-list">
                  <div className="tech-item"><strong>🎥 Cámaras de cine digital:</strong><p>Uso de grandes cámaras como la Sony Alpha 7 V o la FX3 II.</p></div>
                  <div className="tech-item"><strong>💡 Iluminación profesional:</strong><p>Tienes diferentes opciones. Desde un pequeño foco hasta un set de iluminación completo.</p></div>
                  <div className="tech-item"><strong>🚁 Tomas aéreas con dron:</strong><p>Con dron DJI Mini 5 Pro conseguirás tomas alucinantes.</p></div>
                  <div className="tech-item"><strong>🎙️ Sonido directo o editado:</strong><p>Todo dependerá de si quieres el sonido más o menos tratado.</p></div>
                  <div className="tech-item"><strong>👥 Personal técnico extra:</strong><p>A cada persona extra que necesite la producción aumentará el costo.</p></div>
                  <div className="tech-item"><strong>📦 Logística y transporte:</strong><p>Puede haber un pequeño aumento de precio por la gasolina.</p></div>
                </div>
              </div>

              <div className="info-card">
                <div className="card-title">📜 Contratos y Gestión Legal</div>
                <div className="legal-box">
                  <div className="legal-line"><strong>Reserva:</strong><span>Bloqueo de fecha mediante señal o acuerdo.</span></div>
                  <div className="legal-line"><strong>Entrega:</strong><span>Plazos ajustados según proyecto.</span></div>
                  <div className="legal-line"><strong>Derechos:</strong><span>Uso regulado mediante contrato.</span></div>
                </div>
              </div>
            </div>

            <div className="reservation-layout">
              <AvailabilityCalendar
                title="🎬 Calendario de Producción"
                requests={requests}
                requestTypes={unifyCalendars ? undefined : ['production']}
              />

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
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar solicitud técnica'}</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
