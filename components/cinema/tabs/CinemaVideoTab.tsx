import { CLOUD_NAME } from "@/lib/cloudinary";

export function CinemaVideoTab({ }) {
  const videoURL = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/v1792433650/Video_Definitvo_Motrrad.mp4`;
  
  return (
    <div className="tab-panel" role="tabpanel">
      <div className="hero-block">
        <h1>Creación audiovisual de alto impacto</h1>
        <p>Especialistas en la creación de piezas visuales con identidad propia. Flujos de trabajo avanzados y un tratamiento de color cinematográfico orientado a potenciar el mensaje.</p>
      </div>

      <video
        src={videoURL}
        autoPlay
        loop
        playsInline
        preload="metadata"
        className="hero-video"
      />
    </div>
  );
}
