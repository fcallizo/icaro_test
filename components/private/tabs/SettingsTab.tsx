'use client';

import { FormEvent, useEffect, useState } from 'react';
import { WeddingPrices } from '@/lib/wedding-form';
import { createFormFields } from '@/components/common/FormFields';

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

  // Mismos campos que en los otros formularios: el borrador de precios hace de `values`
  const { input, inputSuffix } = createFormFields({
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

        <div className="settings-tab-pannel">
          <h4>Propiedades generales</h4>
          <div className="private-calendar-controls">
            <label className="private-calendar-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={unifyCalendars}
                disabled={isSavingCalendarSetting}
                onChange={(event) => onCalendarUnificationChange(event.currentTarget.checked)}
              />
              <span className="private-calendar-toggle-track" aria-hidden="true" />
              <span>Unificar calendarios</span>
            </label>
            <p>Las fechas confirmadas de bodas y cine se bloquearán en ambos calendarios públicos.</p>
          </div>
        </div>

        <hr />

        <form onSubmit={savePrices}>
          <div className="settings-tab-pannel">
            <h4>Precios de boda</h4>
            <div className="production-contract-grid-trio">
              {inputSuffix('weddingPhoto', 'Reportaje fotográfico', true)}
              {inputSuffix('weddingVideo', 'Película documental', true)}
              {inputSuffix('weddingComplete', 'Pack completo', true)}
            </div>
          </div>

          <div className="settings-tab-pannel">
            <div className="private-calendar-controls">
              <h4>Precios de preboda y postboda</h4>
              <p>El mismo precio se aplica a ambas opciones.</p>
            </div>
            
            <div className="production-contract-grid-trio">
              {inputSuffix('complementaryPhoto', 'Sesión fotográfica', true)}
              {inputSuffix('complementaryVideo', 'Película documental', true)}
              {inputSuffix('complementaryComplete', 'Pack completo', true)}
            </div>
          </div>

          <div className="settings-tab-pannel">
            <h4>Descuentos por Pack</h4>
            <div className="production-contract-grid-trio">
              {inputSuffix('discountDuo', 'Descuento DUO', true, false, false, '%')}
              {inputSuffix('discountTrio', 'Descuento TRIO', true, false, false, '%')}
            </div>
          </div>

          <button type="submit" className="private-material-save" disabled={isSavingWeddingPrices}>
            {isSavingWeddingPrices ? 'Guardando precios...' : 'Guardar precios'}
          </button>
        </form>
      </section>
    </div>
  );
}
