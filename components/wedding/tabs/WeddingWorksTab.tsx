import { WorksGallery } from '@/components/common/works/WorksGallery';

export function WeddingWorksTab() {
  return (
    <div className="tab-panel" role="tabpanel">
      <div className="hero-block light">
        <h1>Historias que hemos contado</h1>
        <p>Cada boda es única. Descubre nuestros reportajes y recuerdos favoritos.</p>
      </div>

      <WorksGallery kind="wedding" />
    </div>
  );
}

