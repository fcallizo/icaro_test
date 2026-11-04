'use client';

import { useMemo, useRef, useState } from 'react';
import {
  FormInputField,
  FormPriceField,
  FormSelectField,
  FormTextareaField,
} from '@/components/common/FormFields';
import {
  PrivateModalShell,
  type PrivateModalShellHandle,
} from '@/components/private/modals/PrivateModalShell';
import {
  WEDDING_OFFER_CATEGORIES,
  WEDDING_OFFER_CATEGORY_LABELS,
  type WeddingOffer,
  type WeddingOfferCategory,
} from '@/lib/wedding-offers';

type OfferDraft = {
  kind: 'extra' | 'album';
  category: WeddingOfferCategory;
  title: string;
  variant: string;
  description: string;
  pageRange: string;
  price: string;
  oldPrice: string;
  visible: boolean;
};

type WeddingOfferFormModalProps = {
  offer?: WeddingOffer | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

function toDraft(offer?: WeddingOffer | null): OfferDraft {
  return {
    kind: offer?.kind ?? 'extra',
    category: offer?.category ?? 'celebration',
    title: offer?.title ?? '',
    variant: offer?.variant ?? '',
    description: offer?.description ?? '',
    pageRange: offer?.pageRange ?? '',
    price: offer?.price === null || offer?.price === undefined ? '' : String(offer.price),
    oldPrice: offer?.oldPrice === null || offer?.oldPrice === undefined ? '' : String(offer.oldPrice),
    visible: false,
  };
}

function parsePrice(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 9999999999.99) return undefined;
  return Number(parsed.toFixed(2));
}

export function WeddingOfferFormModal({ offer = null, onClose, onSaved }: WeddingOfferFormModalProps) {
  const initialDraft = useMemo(() => toDraft(offer), [offer]);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const shellRef = useRef<PrivateModalShellHandle>(null);

  const update = <K extends keyof OfferDraft>(field: K, value: OfferDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const save = async () => {
    setError('');
    const price = parsePrice(draft.price);
    const oldPrice = parsePrice(draft.oldPrice);

    if (!draft.title.trim()) {
      setError('Escribe el nombre del extra.');
      return;
    }
    if (draft.kind === 'album' && (!draft.variant.trim() || !draft.pageRange.trim())) {
      setError('Indica la opción y el número de páginas del álbum.');
      return;
    }
    if (price === undefined || oldPrice === undefined) {
      setError('Introduce precios válidos, iguales o superiores a cero.');
      return;
    }
    if (oldPrice !== null && (price === null || oldPrice <= price)) {
      setError('El precio anterior debe ser superior al precio actual.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/private/wedding-offers', {
        method: offer ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(offer ? { id: offer.id, visible: offer.visible } : {}),
          kind: draft.kind,
          category: draft.category,
          title: draft.title.trim(),
          variant: draft.kind === 'album' ? draft.variant.trim() : '',
          description: draft.description.trim(),
          pageRange: draft.kind === 'album' ? draft.pageRange.trim() : '',
          price,
          oldPrice,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el extra.');

      shellRef.current?.close(() =>
        onSaved(offer ? 'Extra actualizado correctamente.' : 'Extra creado como borrador.'),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el extra.');
      setIsSaving(false);
    }
  };

  return (
    <PrivateModalShell
      ref={shellRef}
      eyebrow={offer ? 'EXTRAS DE BODA' : 'NUEVO EXTRA'}
      title={offer ? 'Editar extra' : 'Añadir extra'}
      subtitle={offer ? 'Actualiza la información y las tarifas del servicio.' : 'El extra se guardará oculto hasta que decidas publicarlo.'}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      submitLabel={isSaving ? 'Guardando...' : 'Guardar extra'}
      error={error}
      isSaving={isSaving}
      isDirty={JSON.stringify(draft) !== JSON.stringify(initialDraft)}
    >
      <div className="wedding-offer-form-grid">
        <FormSelectField
          field="kind"
          idPrefix="wedding-offer"
          label="Tipo"
          value={draft.kind}
          onChange={(_, value) => update('kind', value === 'album' ? 'album' : 'extra')}
          options={[
            { value: 'extra', label: 'Extra de boda' },
            { value: 'album', label: 'Opción de álbum' },
          ]}
        />
        {draft.kind === 'extra' && (
          <FormSelectField
            field="category"
            idPrefix="wedding-offer"
            label="Categoría"
            value={draft.category}
            onChange={(_, value) => {
              const category = WEDDING_OFFER_CATEGORIES.find((candidate) => candidate === value);
              if (category) update('category', category);
            }}
            options={WEDDING_OFFER_CATEGORIES.map((category) => ({
              value: category,
              label: WEDDING_OFFER_CATEGORY_LABELS[category],
            }))}
          />
        )}
        <FormInputField
          field="title"
          idPrefix="wedding-offer"
          label="Nombre"
          value={draft.title}
          onChange={(_, value) => update('title', value)}
          required
          maxLength={120}
          placeholder={draft.kind === 'album' ? 'Álbum de fotos' : 'Ej. Entrevistas'}
        />
        {draft.kind === 'album' && (
          <>
            <FormInputField
              field="variant"
              idPrefix="wedding-offer"
              label="Opción"
              value={draft.variant}
              onChange={(_, value) => update('variant', value)}
              required
              maxLength={50}
              placeholder="Ej. Básico"
            />
            <FormInputField
              field="pageRange"
              idPrefix="wedding-offer"
              label="Número de páginas"
              value={draft.pageRange}
              onChange={(_, value) => update('pageRange', value)}
              required
              maxLength={80}
              placeholder="Ej. 70-80 páginas"
            />
          </>
        )}
        <FormPriceField
          field="price"
          idPrefix="wedding-offer"
          label="Precio actual"
          value={draft.price}
          onChange={(_, value) => update('price', value)}
          suffix="€"
          placeholder="Opcional"
        />
        <FormPriceField
          field="oldPrice"
          idPrefix="wedding-offer"
          label="Precio anterior"
          value={draft.oldPrice}
          onChange={(_, value) => update('oldPrice', value)}
          suffix="€"
          placeholder="Opcional"
        />
        <FormTextareaField
          field="description"
          idPrefix="wedding-offer"
          label="Descripción"
          value={draft.description}
          onChange={(_, value) => update('description', value)}
          placeholder="Una breve descripción para mostrar en la web."
          maxLength={1000}
          wrapperClassName="field-group wide"
        />
      </div>
    </PrivateModalShell>
  );
}
