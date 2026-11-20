
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

const photNumber = 7;

type Photo = {
  id: string;
  src: string;
  width: number;
  height: number;
};

type Folder = {
  id: string;
  name: string;
  cover: string | null;
};

type WorksGalleryProps = {
  kind: "cinema" | "wedding";
  isCompact: boolean;
};

function getPlaceholderCount(photoCount: number): number {
  if (photoCount === 0) return 0;

  const remainder = photoCount % photNumber;

  if (remainder === 0) return 0;

  return photNumber - remainder;
}

export function WorksGallery({ kind, isCompact }: WorksGalleryProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [trailerError, setTrailerError] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const placeholderCount = useMemo(
    () => getPlaceholderCount(photos.length),
    [photos.length]
  );

  function modifyCardName(name: string) {
    return name.replace(/_/g, " ").toUpperCase();
  }

  // Cargar las carpetas de la galería.
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setFolders([]);
    setPhotos([]);
    setTrailer(null);
    setTrailerError("");
    setSelectedFolder(null);
    setLightboxIndex(null);
    setIsTrailerOpen(false);

    fetch(`/api/works/folders?kind=${kind}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar las carpetas.");
        }

        setFolders(data.folders ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return;
  }, [kind]);

  // Cargar las fotos y el tráiler al abrir una carpeta.
  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setPhotos([]);
    setTrailer(null);
    setTrailerError("");
    setLightboxIndex(null);
    setIsTrailerOpen(false);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/works/photos?kind=${kind}&folder=${encodeURIComponent(folder.id)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las fotografías.");
      }

      setPhotos(data.photos ?? []);
      setTrailer(data.trailer ?? null);
      setTrailerError(data.trailerError ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las fotografías."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setSelectedFolder(null);
    setPhotos([]);
    setTrailer(null);
    setTrailerError("");
    setLightboxIndex(null);
    setIsTrailerOpen(false);
    setError("");
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setIsTrailerOpen(false);
  }, []);

  const showNext = useCallback(
    (delta: number) => {
      setLightboxIndex((current) =>
        current === null || photos.length === 0
          ? current
          : (current + delta + photos.length) % photos.length
      );
    },
    [photos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null && !isTrailerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (isTrailerOpen) return;
      if (event.key === "ArrowRight") showNext(1);
      if (event.key === "ArrowLeft") showNext(-1);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, isTrailerOpen, closeLightbox, showNext]);

  const currentPhoto = useMemo(
    () =>
      lightboxIndex === null ? null : photos[lightboxIndex] ?? null,
    [photos, lightboxIndex]
  );
  const isLightboxOpen = currentPhoto !== null || isTrailerOpen;

  return (
    <section className={`works-gallery works-gallery-${kind}`}>
      {!selectedFolder ? (
        <>
          {loading && (
            <p className="works-state">Cargando proyectos…</p>
          )}

          {error && (
            <p className="works-state works-error">{error}</p>
          )}

          {!loading && !error && folders.length === 0 && (
            <p className="works-state">
              Todavía no hay proyectos disponibles en esta galería.
            </p>
          )}

          <div className="works-project-grid">
            {folders.map((folder, index) => (
              <button
                className={`works-project-card works-card-${index % 5}`}
                key={folder.id}
                onClick={() => openFolder(folder)}
                aria-label={`Abrir proyecto ${folder.name}`}
              >
                {folder.cover && (
                  <img src={folder.cover} alt="" loading="lazy" />
                )}
                <div className="works-project-overlay">
                  <strong>{modifyCardName(folder.name)}</strong>
                  <small>Ver fotografías</small>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={`works-back-container ${isCompact ? 'is-compact' : ''}`}>
            <button
              className="works-back-button"
              onClick={goBack}
              aria-label="Regresar a los trabajos"
              title="Regresar a los trabajos"
            >
              <span className="icon-mask icon-arrow" aria-hidden="true" />
              <span className="works-back-text">Regresar</span>
            </button>
          </div>
          {trailer && !loading && (
            <div className="works-trailer-actions">
              <button
                type="button"
                className="works-back-button"
                onClick={() => {
                  setLightboxIndex(null);
                  setIsTrailerOpen(true);
                }}
              >
                <span className="icon-mask icon-clapperboard" aria-hidden="true" />
                Ver tráiler
              </button>
            </div>
          )}
          <div className="works-project-toolbar">
            <div style={{ textAlign: "center" }}>
              <h2>{modifyCardName(selectedFolder.name)}</h2>
            </div>
          </div>

          {loading && (
            <p className="works-state">Cargando fotografías…</p>
          )}

          {error && (
            <p className="works-state works-error">{error}</p>
          )}

          {!loading && !error && photos.length === 0 && !trailer && (
            <p className="works-state">
              Esta carpeta no contiene fotografías.
            </p>
          )}

          {trailerError && (
            <p className="works-state works-error">{trailerError}</p>
          )}

          <div className="works-mosaic">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                className={`works-mosaic-item works-mosaic-item-${index % photNumber}`}
                onClick={() => {
                  setIsTrailerOpen(false);
                  setLightboxIndex(index);
                }}
                aria-label={`Ampliar fotografía ${index + 1}`}
              >
                <img
                  src={photo.src}
                  alt={`${selectedFolder.name}, fotografía ${index + 1}`}
                  loading={index < 6 ? "eager" : "lazy"}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {isLightboxOpen && selectedFolder && (
        <div
          className="works-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={isTrailerOpen ? "Tráiler del proyecto" : "Fotografía ampliada"}
          onClick={closeLightbox}
        >
          <button
            className="works-lightbox-close"
            onClick={closeLightbox}
            aria-label="Cerrar"
          >
            ×
          </button>

          {!isTrailerOpen && photos.length > 1 && (
            <button
              className="works-lightbox-arrow works-lightbox-prev"
              onClick={(event) => {
                event.stopPropagation();
                showNext(-1);
              }}
              aria-label="Fotografía anterior"
            >
              <span className="icon-mask icon-arrow" aria-hidden="true" />
            </button>
          )}

          {isTrailerOpen && trailer ? (
            <video
              className="works-lightbox-video"
              src={trailer}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onClick={(event) => event.stopPropagation()}
            />
          ) : currentPhoto ? (
            <img
              src={currentPhoto.src}
              alt={`${selectedFolder.name}, fotografía ${(lightboxIndex ?? 0) + 1}`}
              onClick={(event) => event.stopPropagation()}
            />
          ) : null}

          {!isTrailerOpen && (
            <span className="works-lightbox-count">
              {(lightboxIndex ?? 0) + 1} / {photos.length}
            </span>
          )}

          {!isTrailerOpen && photos.length > 1 && (
            <button
              className="works-lightbox-arrow works-lightbox-next"
              onClick={(event) => {
                event.stopPropagation();
                showNext(1);
              }}
              aria-label="Fotografía siguiente"
            >
              <span className="icon-mask icon-arrow icon-inverted" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
