import { CLOUD_NAME } from "@/lib/cloudinary";

export function WeddingVideoTab({ }) {
  const videoURL = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/v1792432256/Reel_Boda_Mar%C3%ADa_Y_Javi.mp4`;

  return (
    <div className="tab-panel" role="tabpanel">
      <div className="hero-block light">
        <h1>Momentos que se vuelven recuerdos</h1>
        <p>Un enfoque documental, elegante y cercano para cada detalle de tu día más importante.</p>
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
