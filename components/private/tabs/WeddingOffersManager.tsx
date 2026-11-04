'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WeddingOffer } from '@/lib/wedding-offers';
import { WEDDING_OFFER_CATEGORY_LABELS } from '@/lib/wedding-offers';
import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { WeddingOfferFormModal } from '@/components/private/modals/WeddingOfferFormModal';

type EditorState = 'create' | WeddingOffer | null;

async function fetchOffers(): Promise<WeddingOffer[]> {
  const response = await fetch('/api/private/wedding-offers', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los extras.');
  return data.offers as WeddingOffer[];
}

function formatPrice(price: number | null) {
  return price === null
    ? 'A consultar'
    : `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(price)} €`;
}

export function WeddingOffersManager() {
  const [offers, setOffers] = useState<WeddingOffer[]>([]);
  const [editor, setEditor] = useState<EditorState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone } | null>(null);

  const reload = useCallback(async () => setOffers(await fetchOffers()), []);

  useEffect(() => {
    let cancelled = false;
    fetchOffers()
      .then((data) => {
        if (!cancelled) setOffers(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setToast({
            message: error instanceof Error ? error.message : 'No se pudieron cargar los extras.',
            tone: 'error',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSucceeded = async (message: string) => {
    setEditor(null);
    try {
      await reload();
      setToast({ message, tone: 'success' });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'No se pudieron actualizar los extras.',
        tone: 'error',
      });
    }
  };

  const toggleVisibility = async (offer: WeddingOffer) => {
    try {
      const response = await fetch('/api/private/wedding-offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id,
          kind: offer.kind,
          category: offer.category,
          title: offer.title,
          variant: offer.variant ?? '',
          description: offer.description,
          pageRange: offer.pageRange ?? '',
          price: offer.price,
          oldPrice: offer.oldPrice,
          visible: !offer.visible,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cambiar la publicación.');

      await reload();
      setToast({ message: 'Estado de publicación actualizado.', tone: 'success' });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'No se pudo cambiar la publicación.',
        tone: 'error',
      });
    }
  };

  if (isLoading) return <p className="cinema-offers-feedback">Cargando extras de boda...</p>;

  return (
    <section className="wedding-offers-admin">
      <div className="cinema-offers-admin-header">
        <div>
          <span className="eyebrow">BODAS</span>
          <h4>Extras y álbumes</h4>
          <p>Configura sus descripciones, precios y descuentos. Los borradores no aparecen en la web.</p>
        </div>
        <div className="cinema-offers-counter">
          <strong>{offers.filter((offer) => offer.visible).length}/{offers.length}</strong>
          <span>extras publicados</span>
        </div>
      </div>

      {offers.length === 0 ? (
        <p className="cinema-offers-feedback">Todavía no hay extras configurados.</p>
      ) : (
        <div className="cinema-offers-list">
          {offers.map((offer) => (
            <article className="cinema-offer-admin-card" key={offer.id}>
              <div className="cinema-offer-admin-info">
                <div className="cinema-offer-admin-title">
                  <h5>
                    {offer.title}
                    {offer.variant ? ` · ${offer.variant}` : ''}
                  </h5>
                  <span className={offer.visible ? 'offer-status visible' : 'offer-status'}>
                    {offer.visible ? 'Publicado' : 'Oculto'}
                  </span>
                </div>
                {offer.kind === 'extra' && (
                  <p className="wedding-offer-page-range">
                    {WEDDING_OFFER_CATEGORY_LABELS[offer.category]}
                  </p>
                )}
                {offer.pageRange && <p className="wedding-offer-page-range">{offer.pageRange}</p>}
                <p>{offer.description || 'Sin descripción.'}</p>
                <div className="cinema-offer-admin-prices">
                  <strong>{formatPrice(offer.price)}</strong>
                  {offer.oldPrice !== null && <del>{formatPrice(offer.oldPrice)}</del>}
                </div>
              </div>
              <div className="cinema-offer-admin-actions">
                <button type="button" className="private-gold-button" onClick={() => setEditor(offer)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="private-material-toggle"
                  onClick={() => void toggleVisibility(offer)}
                >
                  {offer.visible ? 'Ocultar' : 'Publicar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <button type="button" className="private-gold-button" onClick={() => setEditor('create')}>
        + Nuevo extra
      </button>

      {editor && (
        <WeddingOfferFormModal
          key={editor === 'create' ? 'create' : editor.id}
          offer={editor === 'create' ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={(message) => void saveSucceeded(message)}
        />
      )}
      <StatusToast
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'success'}
        onDismiss={() => setToast(null)}
      />
    </section>
  );
}
