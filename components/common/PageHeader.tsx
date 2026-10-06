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
          <a href="#" className={view === 'cinema' ? 'brand-selected' : 'nav-link'} onClick={(event) => { event.preventDefault(); onCinema(); }}>
            Cinematografía
          </a>
          <a href="#" className={view === 'wedding' ? 'brand-selected' : 'nav-link'} onClick={(event) => { event.preventDefault(); onWedding(); }}>
            Bodas
          </a>
          <a className="nav-link nav-instagram-link" href="https://www.instagram.com/icarostudio_/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
           <span className="icon-mask icon-instagram" aria-hidden="true" />
           <span className="nav-label">Instagram</span>
          </a>
          <div className="nav-contact">
            <p className="contact-info">
                <span className="icon-mask icon-phone" aria-hidden="true" />
                <span className="nav-label">+34 633 716 171</span>
            </p>
            <p className="contact-info">
                <span className="icon-mask icon-mail" aria-hidden="true" />
                <span className="nav-label">icarostudio33@gmail.com</span>
            </p>
          </div>
          <a href="/private" className="nav-link" aria-label="Panel privado" title="Panel privado">
            <span className="icon-mask icon-key" aria-hidden="true" />
            <span className="nav-label">Panel</span>
          </a>
        </nav>
      </div>
    </header>
  );
}