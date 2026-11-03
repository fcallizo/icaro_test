'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import {
  PrivateModalShell,
  type PrivateModalShellHandle,
} from './PrivateModalShell';
import {
  FormInputField,
  FormPriceField,
  FormTextareaField,
} from '@/components/common/FormFields';

/* ==========================================================================
 * Modal de creación/edición de ofertas de cine.
 * El caparazón (overlay, foco, Escape, descartar cambios, pie) lo aporta
 * PrivateModalShell; aquí solo hay campos, validación y la llamada a la API.
 * ======================================================================== */

export type CinemaOffer = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  price: number | null;
  oldPrice: number | null;
  visible: boolean;
};

export type CinemaOfferFormModalProps = {
  /** 'create' abre el formulario vacío; 'edit' precarga la oferta recibida. */
  mode: 'create' | 'edit';
  /** Oferta a editar (ignorada en modo create). */
  offer?: CinemaOffer | null;
  /** Posiciones ocupadas por OTRAS ofertas visibles. */
  occupiedPositions?: number[];
  /** Nº de ofertas visibles ahora mismo. */
  visibleCount?: number;
  /** Máximo de posiciones/publicaciones simultáneas. */
  maxVisible?: number;
  /** Mismo endpoint que usaba el formulario inline. */
  apiEndpoint?: string;
  /** Clase extra en la tarjeta, para tocar el tema sin pelearte con la especificidad. */
  className?: string;
  /** Elemento (o id) donde montar el portal. Por defecto: capa propia en <body>. */
  container?: HTMLElement | string;
  onClose: () => void;
  /** Se llama tras un guardado correcto; el manager recarga la lista. */
  onSaved?: (message: string) => void;
  /** Errores de servidor, por si el padre quiere mostrarlos también. */
  onServerError?: (message: string) => void;
};

export const OFFER_POSITIONS = [1, 2, 3, 4] as const;

type OfferDraft = {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  visible: boolean;
  position: number;
};

const EMPTY_DRAFT: OfferDraft = {
  title: '',
  description: '',
  price: '',
  oldPrice: '',
  visible: false,
  position: 1,
};

/* --- Helpers ------------------------------------------------------------- */

function draftFromOffer(offer: CinemaOffer, fallbackPosition: number): OfferDraft {
  return {
    title: offer.title,
    description: offer.description ?? '',
    price: offer.price === null ? '' : String(offer.price),
    oldPrice: offer.oldPrice === null ? '' : String(offer.oldPrice),
    visible: offer.visible,
    position:
      offer.position >= 1 && offer.position <= 4 ? offer.position : fallbackPosition,
  };
}

/** '' => null (sin precio). Nº entero >= 0, o 'invalid'. */
function parsePriceInput(raw: string): number | null | 'invalid' {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return 'invalid';
  return value;
}

/* --- Componente ---------------------------------------------------------- */

export function CinemaOfferFormModal({
  mode,
  offer = null,
  occupiedPositions = [],
  visibleCount = 0,
  maxVisible = 4,
  apiEndpoint = '/api/private/cinema-offers',
  className,
  container,
  onClose,
  onSaved,
  onServerError,
}: CinemaOfferFormModalProps) {
  const isCreate = mode === 'create';
  const freePosition =
    OFFER_POSITIONS.find((position) => !occupiedPositions.includes(position)) ?? 1;

  // El draft se inicializa una sola vez: el padre clavea el modal por oferta.
  const initialDraft = useMemo<OfferDraft>(
    () =>
      offer
        ? draftFromOffer(offer, freePosition)
        : { ...EMPTY_DRAFT, position: freePosition },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [draft, setDraft] = useState<OfferDraft>(initialDraft);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const shellRef = useRef<PrivateModalShellHandle>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

  // occupiedPositions ya excluye la oferta que se está editando (lo calcula el
  // manager), así que quedar una posición libre = se puede publicar sin molestar.
  const hasFreePosition = useMemo(
    () => OFFER_POSITIONS.some((position) => !occupiedPositions.includes(position)),
    [occupiedPositions],
  );

  const updateDraft = useCallback(
    <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
      setError('');
    },
    [],
  );

  /* --- Guardado ---------------------------------------------------------- */

  const saveOffer = async () => {
    setError('');

    if (!draft.title.trim()) {
      setError('Escribe un título para la oferta.');
      document.getElementById('cinema-offer-title')?.focus();
      return;
    }

    const price = parsePriceInput(draft.price);
    const oldPrice = parsePriceInput(draft.oldPrice);

    if (price === 'invalid' || oldPrice === 'invalid') {
      setError('Los precios deben ser números enteros positivos o estar vacíos.');
      return;
    }

    if (price !== null && oldPrice !== null && oldPrice <= price) {
      setError('El precio anterior debe ser superior al precio actual.');
      return;
    }

    if (!isCreate && draft.visible && !hasFreePosition) {
      setError(
        `Ya hay ${maxVisible} ofertas visibles. Oculta una antes de activar otra.`,
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(offer ? { id: offer.id } : {}),
          title: draft.title.trim(),
          description: draft.description.trim(),
          price,
          oldPrice,
          visible: isCreate ? false : draft.visible,
          position: draft.position,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo guardar la oferta.');
      }

      shellRef.current?.close(() => {
        onSaved?.(
          isCreate
            ? 'Oferta creada como borrador.'
            : draft.visible
              ? 'Oferta actualizada y publicada.'
              : 'Oferta actualizada correctamente.',
        );
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo guardar la oferta.';
      setError(message);
      onServerError?.(message);
      setIsSaving(false);
    }
  };

  return (
    <PrivateModalShell
      ref={shellRef}
      className={className}
      container={container}
      initialFocusRef={titleRef}
      eyebrow={isCreate ? 'NUEVO SERVICIO' : 'EDITAR SERVICIO'}
      title={isCreate ? 'Crear oferta' : 'Editar oferta'}
      subtitle={
        isCreate
          ? 'La oferta se guardará oculta como borrador.'
          : 'Los cambios se reflejan al instante en la web pública.'
      }
      error={error}
      isDirty={isDirty}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={() => void saveOffer()}
      submitLabel={isCreate ? 'Crear oferta' : 'Guardar oferta'}
    >
      <div className="cofm__grid">
        <FormInputField
          field="title"
          idPrefix="cinema-offer"
          label="Título"
          wrapperClassName="field-group wide"
          value={draft.title}
          onChange={(_, value) => updateDraft('title', value)}
          maxLength={120}
          placeholder="Abono trimestral Cine+Book"
          required
          hint={`${draft.title.trim().length}/120`}
          inputRef={titleRef}
        />

        <FormPriceField
          field="price"
          idPrefix="cinema-offer"
          label="Precio actual"
          wrapperClassName="field-group"
          value={draft.price}
          onChange={(_, value) => updateDraft('price', value)}
          min="0"
          step="1"
          inputMode="numeric"
          placeholder="Vacío si es a medida"
          suffix="€"
        />

        <FormPriceField
          field="oldPrice"
          idPrefix="cinema-offer"
          label="Precio anterior"
          wrapperClassName="field-group"
          value={draft.oldPrice}
          onChange={(_, value) => updateDraft('oldPrice', value)}
          min="0"
          step="1"
          inputMode="numeric"
          placeholder="Solo si hay oferta"
          suffix="€"
        />

        <FormTextareaField
          field="description"
          idPrefix="cinema-offer"
          label="Descripción"
          wrapperClassName="field-group wide"
          value={draft.description}
          onChange={(_, value) => updateDraft('description', value)}
          rows={4}
          maxLength={2000}
          placeholder="Qué incluye, condiciones y duración de la promoción."
          hint={`${draft.description.length}/2000`}
        />

        {!isCreate && (
          <fieldset className="cofm__field cofm__field--wide cofm__slots">
            <legend>Posición en la web pública</legend>
            <div>
              {OFFER_POSITIONS.map((position) => {
                const occupied = occupiedPositions.includes(position);
                const selected = draft.visible && draft.position === position;

                return (
                  <button
                    key={position}
                    type="button"
                    className={`cofm__slot${selected ? ' is-selected' : ''}`}
                    disabled={!draft.visible || occupied}
                    onClick={() => updateDraft('position', position)}
                    title={
                      occupied
                        ? 'Ocupada por otra oferta visible'
                        : !draft.visible
                          ? 'Activa la oferta para elegir posición'
                          : `Colocar en la posición ${position}`
                    }
                  >
                    <strong>{position}</strong>
                    <span>{occupied ? 'Ocupada' : 'Libre'}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {!isCreate && (
          <label className="cofm__publish">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(event) => updateDraft('visible', event.target.checked)}
            />
            <span>
              <strong>Mostrar esta oferta en la web pública</strong>
              <small>
                {hasFreePosition
                  ? 'Desmárcala para conservarla como borrador privado.'
                  : `Ya hay ${maxVisible} ofertas visibles: libera una posición antes de publicar.`}
              </small>
            </span>
          </label>
        )}

        {isCreate && (
          <p className="cofm__note">
            Podrás publicarla después desde la lista, cuando haya una posición
            disponible. Ahora mismo quedan{' '}
            <strong>{Math.max(maxVisible - visibleCount, 0)}</strong> de {maxVisible}.
          </p>
        )}
      </div>
    </PrivateModalShell>
  );
}

export default CinemaOfferFormModal;
