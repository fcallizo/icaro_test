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
            <a href="#" onClick={(event) => { event.preventDefault(); onHome(); }}>Inicio</a>
          )}
          <a href="#" className={view === 'cinema' ? 'brand-selected' : ''} onClick={(event) => { event.preventDefault(); onCinema(); }}>
            Cinematografía
          </a>
          <a href="#" className={view === 'wedding' ? 'brand-selected' : ''} onClick={(event) => { event.preventDefault(); onWedding(); }}>
            Bodas
          </a>
          <a href="https://www.instagram.com/icarostudio_/" target="_blank" rel="noreferrer">📸 Instagram</a>
          <div className="nav-contact">
            <span>📞 +34 633 716 171</span>
            <span>✉️ icarostudio33@gmail.com</span>
          </div>
          <a href="/private" className="nav-admin-btn">🔑 Panel</a>
        </nav>
      </div>
    </header>
  );
}