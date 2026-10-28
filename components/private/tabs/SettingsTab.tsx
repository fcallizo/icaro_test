'use client';

import { FormEvent, useEffect, useState } from 'react';
import { WeddingPrices } from '@/lib/wedding-form';
import { createFormFields } from '@/components/common/FormFields';
import { CinemaOffersManager } from '@/components/private/tabs/CinemaOffersManager';

type SettingsTabProps = {
  unifyCalendars: boolean;
  isSavingCalendarSetting: boolean;
  onCalendarUnificationChange: (unify: boolean) => void;
  weddingPrices: WeddingPrices;
  isSavingWeddingPrices: boolean;
  onSaveWeddingPrices: (prices: WeddingPrices) => void;
};

type PriceDraft = Record<keyof WeddingPrices, string>;

const toDraft = (prices: WeddingPrices): PriceDraft => ({
  weddingPhoto: String(prices.weddingPhoto),
  weddingVideo: String(prices.weddingVideo),
  weddingComplete: String(prices.weddingComplete),
  complementaryPhoto: String(prices.complementaryPhoto),
  complementaryVideo: String(prices.complementaryVideo),
  complementaryComplete: String(prices.complementaryComplete),
  discountDuo: String(prices.discountDuo),
  discountTrio: String(prices.discountTrio),
});

export function SettingsTab({
  unifyCalendars,
  isSavingCalendarSetting,
  onCalendarUnificationChange,
  weddingPrices,
  isSavingWeddingPrices,
  onSaveWeddingPrices,
}: SettingsTabProps) {
  const [draft, setDraft] = useState<PriceDraft>(() => toDraft(weddingPrices));

  useEffect(() => {
    setDraft(toDraft(weddingPrices));
  }, [weddingPrices]);

  const { inputSuffix } = createFormFields({
    values: draft,
    idPrefix: 'settings',
    onChange: (field, value) => setDraft((current) => ({ ...current, [field]: value })),
    wideClassName: 'wide',
    emptyOption: 'Seleccionar...',
  });

  const savePrices = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prices = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, Number(value)]),
    ) as WeddingPrices;
    onSaveWeddingPrices(prices);
  };

  return (
    <div className="private-tab-panel calendar-blocks-tab" role="tabpanel">
      <section className="private-request-section">
        <h3>Panel de configuración</h3>

        {/* Tu bloque actual de propiedades generales */}
        <div className="settings-tab-pannel">
          <h4>Propiedades generales</h4>

          <div className="private-calendar-controls">
            <label className="private-calendar-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={unifyCalendars}
                disabled={isSavingCalendarSetting}
                onChange={(event) =>
                  onCalendarUnificationChange(event.currentTarget.checked)
                }
              />
              <span className="private-calendar-toggle-track" aria-hidden="true" />
              <span>Unificar calendarios</span>
            </label>

            <p>
              Las fechas confirmadas de bodas y cine se bloquearán en ambos
              calendarios públicos.
            </p>
          </div>
        </div>

        <hr className='setting-divider' />

        {/* NUEVO: tarifas cinematográficas */}
        <CinemaOffersManager />

        <hr className='setting-divider' />

        <form className="wedding-prices-editor" onSubmit={savePrices}>
          <div className="wedding-prices-admin-header">
            <div>
              <span className="eyebrow">BODAS</span>
              <h4>Tarifas y descuentos</h4>
              <p>
                Define las tarifas de tus servicios y los descuentos que se
                aplicarán al contratar varios servicios.
              </p>
            </div>
          </div>

          <section className="wedding-price-group">
            <div className="wedding-price-group-heading">
              <span className="wedding-price-group-number">01</span>
              <div>
                <h4>Servicios de boda</h4>
                <p>Tarifas principales para el día de la boda.</p>
              </div>
            </div>

            <div className="wedding-price-cards">
              <article className="wedding-price-card">
                {inputSuffix('weddingPhoto', 'Reportaje fotográfico', true)}
              </article>

              <article className="wedding-price-card">
                {inputSuffix('weddingVideo', 'Película documental', true)}
              </article>

              <article className="wedding-price-card">
                {inputSuffix('weddingComplete', 'Pack completo', true)}
              </article>
            </div>
          </section>

          <section className="wedding-price-group">
            <div className="wedding-price-group-heading">
              <span className="wedding-price-group-number">02</span>
              <div>
                <h4>Preboda y postboda</h4>
                <p>Los mismos precios para ambas opciones.</p>
              </div>
            </div>

            <div className="wedding-price-cards">
              <article className="wedding-price-card">
                {inputSuffix('complementaryPhoto', 'Sesión fotográfica', true)}
              </article>

              <article className="wedding-price-card">
                {inputSuffix('complementaryVideo', 'Película documental', true)}
              </article>

              <article className="wedding-price-card">
                {inputSuffix('complementaryComplete', 'Pack completo', true)}
              </article>
            </div>
          </section>

          <section className="wedding-price-group wedding-discounts-group">
            <div className="wedding-price-group-heading">
              <span className="wedding-price-group-number">03</span>
              <div>
                <h4>Descuentos por pack</h4>
              </div>
            </div>

            <div className="wedding-discount-cards">
              <article className="wedding-discount-card">
                <div>
                  <span className="wedding-discount-label">PACK DUO</span>
                  <h5>Dos servicios</h5>
                  <p>Descuento al combinar dos servicios.</p>
                </div>

                {inputSuffix('discountDuo', 'Descuento DUO', true, false, false, '%')}
              </article>

              <article className="wedding-discount-card">
                <div>
                  <span className="wedding-discount-label">PACK TRÍO</span>
                  <h5>Tres servicios</h5>
                  <p>Descuento al contratar los tres servicios.</p>
                </div>

                {inputSuffix('discountTrio', 'Descuento TRÍO', true, false, false, '%')}
              </article>
            </div>
          </section>

          <div className="wedding-prices-footer">
            <p>Los cambios se aplicarán cuando guardes la configuración.</p>

            <button
              type="submit"
              className="private-material-save"
              disabled={isSavingWeddingPrices}
            >
              {isSavingWeddingPrices ? 'Guardando precios...' : 'Guardar precios de boda'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
