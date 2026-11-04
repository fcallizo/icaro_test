'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { WeddingOffer } from '@/lib/wedding-form';
import {
  WEDDING_OFFER_CATEGORIES,
  WEDDING_OFFER_CATEGORY_LABELS,
} from '@/lib/wedding-form';

type WeddingExtrasModalProps = {
  offers: WeddingOffer[];
  onClose: () => void;
};

function formatPrice(price: number | null) {
  return price === null
    ? 'A consultar'
    : `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(price)} €`;
}

export function WeddingExtrasModal({ offers, onClose }: WeddingExtrasModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const extras = offers.filter((offer) => offer.kind === 'extra');
  const albums = offers.filter((offer) => offer.kind === 'album');
  const extraGroups = WEDDING_OFFER_CATEGORIES.map((category) => ({
    category,
    offers: extras.filter((offer) => offer.category === category),
  })).filter((group) => group.offers.length > 0);
  const albumGroups = Array.from(
    albums.reduce((groups, offer) => {
      const group = groups.get(offer.title) ?? [];
      group.push(offer);
      groups.set(offer.title, group);
      return groups;
    }, new Map<string, WeddingOffer[]>()),
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="wedding-extras-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="wedding-extras-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wedding-extras-title"
        tabIndex={-1}
      >
        <header className="wedding-extras-dialog-header">
          <div>
            <span className="wedding-extras-eyebrow">DETALLES A VUESTRA MEDIDA</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="wedding-extras-close"
            aria-label="Cerrar extras de boda"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="wedding-extras-dialog-body">
          <div>
            <h2 id="wedding-extras-title">Extras para vuestra boda</h2>
            <p>Pequeños detalles para hacer vuestro recuerdo todavía más personal.</p>
          </div>

          {offers.length === 0 && (
            <div className="wedding-extras-empty">
              <h3>Estamos preparando los extras</h3>
              <p>
                Muy pronto podréis descubrir todas las opciones y precios para
                personalizar vuestro reportaje.
              </p>
            </div>
          )}

          {extraGroups.map(({ category, offers: categoryOffers }) => (
            <section className="wedding-extras-section" key={category}>
              <h3 className="wedding-extras-section-title">
                {WEDDING_OFFER_CATEGORY_LABELS[category]}
              </h3>
              <div className="wedding-extras-grid">
                {categoryOffers.map((offer) => (
                  <article className={offer.oldPrice !== null ? 'wedding-extra-card offer-card' : 'wedding-extra-card no-offer-card'} key={offer.id}>
                    <div className="wedding-extra-card-header" >
                      <h3>{offer.title}</h3>
                      {offer.oldPrice !== null && <span className="wedding-extra-offer">Oferta</span>}
                    </div>
                    {offer.description && <p>{offer.description}</p>}
                    <div className="wedding-extra-price">
                      {offer.oldPrice !== null && <span className="wedding-extra-old-price">Antes <del>{formatPrice(offer.oldPrice)}</del></span>}
                      <strong>{formatPrice(offer.price)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {albumGroups.map(([title, variants]) => (
            <section className="wedding-extras-section" key={title}>
              <h3 className="wedding-extras-section-title">{title}</h3>
              <div className="wedding-extras-grid wedding-album-grid">
                {variants.map((offer) => (
                  <article className={offer.oldPrice !== null ? 'wedding-extra-card wedding-album-card offer-card' : 'wedding-extra-card wedding-album-card no-offer-card'} key={offer.id}>
                    <div className="wedding-extra-card-header" >
                      <span className="wedding-album-variant">{offer.variant}</span>
                      {offer.oldPrice !== null && <span className="wedding-extra-offer">Oferta</span>}
                    </div>
                    <p className="wedding-album-pages">{offer.pageRange}</p>
                    {offer.description && <p>{offer.description}</p>}
                    <div className="wedding-extra-price">
                      {offer.oldPrice !== null && <span className="wedding-extra-old-price">Antes <del>{formatPrice(offer.oldPrice)}</del></span>}
                      <strong>{formatPrice(offer.price)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}
