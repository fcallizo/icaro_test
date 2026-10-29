
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export function WorksGallery({ kind, isCompact }: WorksGalleryProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    setSelectedFolder(null);
    setLightboxIndex(null);

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

  // Cargar las fotos únicamente al abrir una carpeta.
  const openFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setPhotos([]);
    setLightboxIndex(null);
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
    setLightboxIndex(null);
    setError("");
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
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
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") showNext(1);
      if (event.key === "ArrowLeft") showNext(-1);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, showNext]);

  const currentPhoto = useMemo(
    () =>
      lightboxIndex === null ? null : photos[lightboxIndex] ?? null,
    [photos, lightboxIndex]
  );

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

          {!loading && !error && photos.length === 0 && (
            <p className="works-state">
              Esta carpeta no contiene fotografías.
            </p>
          )}

          <div className="works-mosaic">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                className={`works-mosaic-item works-mosaic-item-${index % 7}`}
                onClick={() => setLightboxIndex(index)}
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

      {currentPhoto && (
        <div
          className="works-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Fotografía ampliada"
          onClick={closeLightbox}
        >
          <button
            className="works-lightbox-close"
            onClick={closeLightbox}
            aria-label="Cerrar"
          >
            ×
          </button>

          {photos.length > 1 && (
            <button
              className="works-lightbox-arrow works-lightbox-prev"
              onClick={(event) => {
                event.stopPropagation();
                showNext(-1);
              }}
              aria-label="Fotografía anterior"
            >
              ‹
            </button>
          )}

          <img
            src={currentPhoto.src}
            alt={`${selectedFolder?.name}, fotografía ${(lightboxIndex ?? 0) + 1}`}
            onClick={(event) => event.stopPropagation()}
          />

          <span className="works-lightbox-count">
            {(lightboxIndex ?? 0) + 1} / {photos.length}
          </span>

          {photos.length > 1 && (
            <button
              className="works-lightbox-arrow works-lightbox-next"
              onClick={(event) => {
                event.stopPropagation();
                showNext(1);
              }}
              aria-label="Fotografía siguiente"
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  );
}
