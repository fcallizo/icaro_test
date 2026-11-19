import { PageTheme, PageView, RUTA_LOGO_ALAS, STUDIO } from "@/lib/properties";

type PageHeaderProps = {
  view: PageView;
  theme: PageTheme;
  onHome: () => void;
  onCinema: () => void;
  onWedding: () => void;
};

export function PageHeader({ view, theme, onHome, onCinema, onWedding }: PageHeaderProps) {
  return (
    <header className={`topbar topbar-${theme}`}>
      <div className="nav-container">
        <div className="brand" onClick={onHome}>
          <img src={RUTA_LOGO_ALAS} alt="Ícaro Logo" className="brand-logo" />
          <span className="brand-name brand-name-reduce">ÍCARO <span className="brand-accent">STUDIO</span></span>
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
                <span className="nav-label">{STUDIO.phone}</span>
            </p>
            <p className="contact-info">
                <span className="icon-mask icon-mail" aria-hidden="true" />
                <span className="nav-label"><a href={STUDIO.email}>{STUDIO.email}</a></span>
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