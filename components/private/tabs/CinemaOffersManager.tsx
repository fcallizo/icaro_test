'use client';

import { useEffect, useState } from 'react';

import {
  CinemaOfferFormModal,
  type CinemaOffer,
  OFFER_POSITIONS,
} from '../modals/CinemaOfferFormModal';
import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';


export type { CinemaOffer };

type EditorState =
  | { mode: 'create' }
  | { mode: 'edit'; offer: CinemaOffer }
  | null;

async function fetchOffers(): Promise<CinemaOffer[]> {
  const response = await fetch('/api/private/cinema-offers', {
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'No se pudieron cargar las ofertas.');
  }

  return data.offers;
}

export function CinemaOffersManager() {
  const [offers, setOffers] = useState<CinemaOffer[]>([]);
  const [editor, setEditor] = useState<EditorState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone } | null>(null);

  const reloadOffers = async () => {
    setOffers(await fetchOffers());
  };

  useEffect(() => {
    let cancelled = false;

    fetchOffers()
      .then((data) => {
        if (!cancelled) setOffers(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setToast({ message: err instanceof Error
            ? err.message : 'No se pudieron cargar las ofertas.', 
            tone: 'error' });

        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleOffers = offers.filter((offer) => offer.visible);

  /* --- El modal se encarga del alta/edición; aquí solo se abre/cierra --- */

  const closeModal = () => setEditor(null);

  const handleSaved = async (message: string) => {
    setEditor(null);

    try {
      await reloadOffers();      
      setToast({ message: message, tone: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error
            ? err.message : 'No se pudieron recargar las ofertas.', 
            tone: 'error' });
    }
  };

  const toggleVisibility = async (offer: CinemaOffer) => {
    const newVisibility = !offer.visible;

    let position = offer.position;

    if (newVisibility) {
      const freePosition = OFFER_POSITIONS.find(
        (candidate) =>
          !visibleOffers.some((item) => item.position === candidate),
      );

      if (!freePosition) {
        setToast({ message: `Ya hay ${OFFER_POSITIONS.length} ofertas visibles. Oculta una antes de mostrar otra.`, 
            tone: 'error' });
        return;
      }

      position = freePosition;
    }

    try {
      const response = await fetch('/api/private/cinema-offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id,
          title: offer.title,
          description: offer.description ?? '',
          price: offer.price,
          oldPrice: offer.oldPrice,
          visible: newVisibility,
          position,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cambiar la visibilidad.');
      }

      await reloadOffers();
      setToast({ message: newVisibility ? 'Oferta publicada.' : 'Oferta ocultada.', tone: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error
          ? err.message
          : 'No se pudo cambiar la visibilidad.', tone: 'error' });
    }
  };

  if (isLoading) {
    return <p className="cinema-offers-feedback">Cargando ofertas...</p>;
  }

  const editingOffer = editor?.mode === 'edit' ? editor.offer : null;

  // Posiciones ocupadas por otras ofertas visibles (la que se edita no se bloquea a sí misma).
  const occupiedPositions = visibleOffers
    .filter((offer) => offer.id !== editingOffer?.id)
    .map((offer) => offer.position);

  return (
    <section className="cinema-offers-admin">
      <div className="cinema-offers-admin-header">
        <div>
          <span className="eyebrow">CINEMATOGRAFÍA</span>
          <h4>Tarifas y ofertas</h4>
          <p>
            Gestiona los precios que aparecen en la web pública. Las ofertas
            ocultas se conservan como borradores.
          </p>
        </div>

        <div className="cinema-offers-counter">
          <strong>
            {visibleOffers.length}/{OFFER_POSITIONS.length}
          </strong>
          <span>ofertas visibles</span>
        </div>
      </div>

      <div className="cinema-offers-slots">
        {OFFER_POSITIONS.map((position) => {
          const offer = visibleOffers.find((item) => item.position === position);

          return (
            <div
              key={position}
              className={`cinema-offer-slot${offer ? ' occupied' : ''}`}
            >
              <span>POSICIÓN {position}</span>
              <strong>{offer?.title ?? 'Disponible'}</strong>
            </div>
          );
        })}
      </div>

      <div className="cinema-offers-list">
        {offers.map((offer) => (
          <article className="cinema-offer-admin-card" key={offer.id}>
            <div className="cinema-offer-admin-info">
              <div className="cinema-offer-admin-title">
                <h5>{offer.title}</h5>
                <span
                  className={offer.visible ? 'offer-status visible' : 'offer-status'}
                >
                  {offer.visible ? 'Visible ' : 'Oculta'}
                  {offer.visible && <span>&nbsp;· Posición {offer.position}</span>}
                </span>
              </div>

              <p>{offer.description || 'Sin descripción.'}</p>

              <div className="cinema-offer-admin-prices">
                <strong>
                  {offer.price === null ? 'A medida' : `${offer.price} €`}
                </strong>

                {offer.oldPrice !== null && <del>{offer.oldPrice} €</del>}
              </div>
            </div>

            <div className="cinema-offer-admin-actions">
              <button
                type="button"
                className="private-gold-button"
                onClick={() => { setEditor({ mode: 'edit', offer }); }}
              >
                Editar
              </button>

              <button
                type="button"
                className="private-material-toggle"
                onClick={() => void toggleVisibility(offer)}
                disabled={!offer.visible && visibleOffers.length >= OFFER_POSITIONS.length}
                title={
                  !offer.visible && visibleOffers.length >= OFFER_POSITIONS.length
                    ? 'Oculta otra oferta para liberar una posición'
                    : undefined
                }
              >
                {offer.visible ? 'Ocultar' : 'Publicar'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="private-gold-button"
        onClick={() => {setEditor({ mode: 'create' });}}
      >
        + Nueva oferta
      </button>

      {editor && (
        <CinemaOfferFormModal
          key={editor.mode === 'edit' ? editor.offer.id : 'create'}
          mode={editor.mode}
          offer={editingOffer}
          occupiedPositions={occupiedPositions}
          visibleCount={visibleOffers.length}
          maxVisible={OFFER_POSITIONS.length}
          onClose={closeModal}
          onSaved={(message) => void handleSaved(message)}
        />
      )}
      <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} onDismiss={() => setToast(null)} />
    </section>
  );
}

export default CinemaOffersManager;
