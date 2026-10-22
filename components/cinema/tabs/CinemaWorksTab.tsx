import { WorksGallery } from '@/components/common/works/WorksGallery';

export function CinemaWorksTab() {
  return (
    <div className="tab-panel">
      <div className="hero-block">
        <h1>Proyectos realizados</h1>
        <p>Una selección de proyectos audiovisuales que hemos creado.</p>
      </div>

      <WorksGallery kind="cinema" />
    </div>
  );
}
