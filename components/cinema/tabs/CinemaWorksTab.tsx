import { WorksGallery } from '@/components/common/works/WorksGallery';
import { useState } from 'react';

export function CinemaWorksTab() {
  const [isCompact, setIsCompact] = useState(false);

  const handleTabScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsCompact(e.currentTarget.scrollTop >= 200);
  };

  return (
    <div className="tab-panel" role="tabpanel" onScroll={handleTabScroll}>
      <div className="hero-block">
        <h1>Eventos realizados</h1>
        <p>Una selección de proyectos audiovisuales que hemos creado.</p>
      </div>

      <WorksGallery kind="cinema" isCompact={isCompact} />
    </div>
  );
}
