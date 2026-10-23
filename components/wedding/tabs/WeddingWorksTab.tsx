import { WorksGallery } from '@/components/common/works/WorksGallery';
import { useState } from 'react';

export function WeddingWorksTab() {
  const [isCompact, setIsCompact] = useState(false);

  const handleTabScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsCompact(e.currentTarget.scrollTop >= 200);
  };


  return (
    <div className="tab-panel" role="tabpanel" onScroll={handleTabScroll}>
      <div className="hero-block light">
        <h1>Historias que hemos contado</h1>
        <p>Cada boda es única. Descubre nuestros reportajes y recuerdos favoritos.</p>
      </div>

      <WorksGallery kind="wedding" isCompact={isCompact} />
    </div>
  );
}

