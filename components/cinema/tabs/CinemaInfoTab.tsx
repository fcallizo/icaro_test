export function CinemaInfoTab({}) {
  return (
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

      <br/>

      <div className="gallery-grid">
        <div className="gallery-card card-one" />
        <div className="gallery-card card-two" />
        <div className="gallery-card card-three" />
      </div>
    </div>
  );
}
