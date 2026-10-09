
export function CinemaVideoTab({ }) {
  return (
    <div className="tab-panel">
      <div className="hero-block">
        <h2>CREACIÓN AUDIOVISUAL DE ALTO IMPACTO</h2>
        <p>Especialistas en la creación de piezas visuales con identidad propia. Flujos de trabajo avanzados y un tratamiento de color cinematográfico orientado a potenciar el mensaje.</p>
      </div>

      <video
        src="/video.mp4"
        autoPlay
        loop
        playsInline
        preload="metadata"
        poster="/videos/boda-poster.jpg"
        className="hero-video"
      />
    </div>
  );
}
