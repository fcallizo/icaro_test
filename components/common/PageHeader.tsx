type PageView = 'selector' | 'cinema' | 'wedding';
type HeaderTheme = 'light' | 'dark';

type PageHeaderProps = {
  view: PageView;
  theme: HeaderTheme;
  onHome: () => void;
  onCinema: () => void;
  onWedding: () => void;
};

export function PageHeader({ view, theme, onHome, onCinema, onWedding }: PageHeaderProps) {
  return (
    <header className={`topbar topbar-${theme}`}>
      <div className="nav-container">
        <div className="brand" onClick={onHome}>
          <img src="/logo_transparente.png" alt="Ícaro Logo" className="brand-logo" />
          <span className="brand-name">ÍCARO <span className="brand-accent">STUDIO</span></span>
        </div>

        <nav className="main-nav">
          {view !== 'selector' && (
            <a href="#" className="nav-link nav-home-link" onClick={(event) => { event.preventDefault(); onHome(); }}>Inicio</a>
          )}
          <a href="#" className={view === 'cinema' ? 'brand-selected' : 'nav-link'} onClick={(event) => { event.preventDefault(); onCinema(); }}>
            Cinematografía
          </a>
          <a href="#" className={view === 'wedding' ? 'brand-selected' : 'nav-link'} onClick={(event) => { event.preventDefault(); onWedding(); }}>
            Bodas
          </a>
          <a className="nav-link nav-instagram-link" href="https://www.instagram.com/icarostudio_/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
           <img src="/instagram.png" alt="" className="nav-icon" />
           <span className="nav-label">Instagram</span>
          </a>
          <div className="nav-contact">
            <span>📞 +34 633 716 171</span>
            <span>✉️ icarostudio33@gmail.com</span>
          </div>
          <a href="/private" className="nav-admin-btn" aria-label="Panel privado" title="Panel privado">
            <span aria-hidden="true">🔑</span>
            <span className="nav-label">Panel</span>
          </a>
        </nav>
      </div>
    </header>
  );
}