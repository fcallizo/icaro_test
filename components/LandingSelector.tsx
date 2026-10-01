import { PageHeader } from '@/components/common/PageHeader';

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

      <PageHeader
        view="selector"
        theme="dark"
        onHome={() => onSelect('selector')}
        onCinema={() => onSelect('cinema')}
        onWedding={() => onSelect('wedding')}
      />

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
