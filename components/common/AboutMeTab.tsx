import { CarouselPhoto } from "@/hooks/useCloudinaryPhotos";
import { PhotoCarousel } from "./PhotoCarousel";

const CAROUSEL_TAG = 'sets';

const fallbackPhotos: CarouselPhoto[] = [
  'https://images.unsplash.com/photo-1741969494307-55394e3e4071?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1661693758705-4fa65572bced?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
].map((src, i) => ({ src, alt: `Foto ${i + 1}` }));

const CLOUD_BASE =
  "https://res.cloudinary.com/sp5ywaxz/image/upload";
const PHOTO_ID = "v1793005703/Presentador_sonriente_en_estudio_moderno.png";

const photo = (w: number) =>
  `${CLOUD_BASE}/f_auto,q_auto,c_fill,g_auto,ar_2:3,w_${w}/${PHOTO_ID}`;

export function AboutMeTab() {
  return (
    <div className="tab-panel" role="tabpanel">
      <header className="hero-block">
        <h1>Sobre Mí</h1>
        <p>Historias reales, contadas con alma.</p>
      </header>

      <div className="about-container">
        <figure className="about-media">
          <img
            src={photo(800)}
            srcSet={`${photo(400)} 400w, ${photo(600)} 600w, ${photo(800)} 800w, ${photo(1024)} 1024w`}
            sizes="(max-width: 900px) min(90vw, 420px), min(38vw, 520px)"
            width={1024}
            height={1536}
            alt="Guillermo Callizo Rodríguez, fotógrafo y videógrafo de Ícaro Studio, sonriendo en su estudio"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Guillermo Callizo · Ícaro Studio</figcaption>
        </figure>

        <div className="about-info">
          <p className="lead">
            Hola, soy{" "}
            <span className="important-info">Guillermo Callizo Rodríguez</span>,
            la persona que está detrás de{" "}
            <span className="important-info">Ícaro Studio</span>.
          </p>

          <p>
            Mi forma de entender la fotografía y el vídeo gira en torno a la
            autenticidad: me apasiona capturar las emociones tal y como ocurren,
            de manera natural, elegante y sin posados forzados.
          </p>

          <p>
            Trabajo con un estilo eminentemente documental y cinematográfico,
            buscando que cada imagen y cada fotograma transmitan la verdad de
            ese momento. Mi objetivo no es solo documentar un evento o una boda,
            sino crear un recuerdo vivo.
          </p>

          <blockquote className="about-quote">
            Quiero que cuando dentro de unos años volváis a ver vuestro vídeo o
            vuestro álbum, no solo recordéis lo que pasó, sino que volváis a
            sentir exactamente lo mismo: las risas, los nervios, la emoción y la
            magia de ese día, como si estuvierais dentro de vuestra propia
            película.
          </blockquote>

          <p>
            Durante el gran día, me gusta integrarme de forma discreta para
            captar esos pequeños detalles e interacciones espontáneas que de
            otro modo pasarían desapercibidos.
          </p>

          <p>
            Según la magnitud y las necesidades de cada proyecto, me rodeo de un
            equipo de profesionales de confianza que comparten mi visión y
            exigencia técnica, garantizando siempre la máxima calidad y una
            cobertura impecable.
          </p>

          <p className="closing">
            Al final, Ícaro Studio no consiste solo en hacer fotos o vídeos:
            consiste en contar historias reales con alma. Y me encantaría contar
            la tuya.
          </p>
        </div>
      </div>

      <PhotoCarousel tag={CAROUSEL_TAG} fallback={fallbackPhotos} />

    </div>
  );
}
