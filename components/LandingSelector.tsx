type View = 'selector' | 'cinema' | 'wedding';

type LandingSelectorProps = {
  onSelect: (view: View) => void;
};

export function LandingSelector({ onSelect }: LandingSelectorProps) {
  return (
    <div className="page-shell">
      <div className="grain-layer" />
      <div className="cursor-dot" />

      <div className="intro-screen">
        <div className="intro-inner">
          <img src="/logo_transparente.png" alt="Ícaro Studio" className="intro-logo flicker-anim" />
          <h1 className="intro-title">ÍCARO STUDIO</h1>
          <div className="intro-progress" />
        </div>
      </div>

      <header className="topbar">
        <div className="nav-container">
          <div className="brand" onClick={() => onSelect('selector')}>
            <img src="/logo_transparente.png" alt="Ícaro Logo" className="brand-logo" />
            <span className="brand-name">ÍCARO <span className="brand-accent">STUDIO</span></span>
          </div>

          <nav className="main-nav">
            <a href="#" onClick={() => onSelect('cinema')}>Cinematografía</a>
            <a href="#" onClick={() => onSelect('wedding')}>Bodas</a>
            <a href="https://www.instagram.com/icarostudio_/" target="_blank" rel="noreferrer">📸 Instagram</a>
            <div className="nav-contact">
              <span>📞 +34 633 716 171</span>
              <span>✉️ icarostudio33@gmail.com</span>
            </div>
            <a href="#" className="nav-admin-btn">🔑 Panel <span className="nav-badge">1</span></a>
          </nav>
        </div>
      </header>

      <section className="selector-screen">
        <div className="selector-grid">
          <div className="selector-panel panel-cine" onClick={() => onSelect('cinema')}>
            <div className="panel-overlay" />
            <div className="panel-content">
              <h2>PRODUCCIÓN CINEMATOGRÁFICA</h2>
              <div className="divider" />
              <p>Narrativa Audiovisual • Publicidad de Autor • Piezas de Ficción</p>
              <span className="cta">Entrar al Set</span>
            </div>
          </div>

          <div className="selector-panel panel-weddings" onClick={() => onSelect('wedding')}>
            <div className="panel-overlay" />
            <div className="panel-content">
              <h2>WEDDING FILM & PHOTO</h2>
              <div className="divider" />
              <p>Enfoque Documental • Historias Reales • Estética Editorial</p>
              <span className="cta">Ver Historias</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
