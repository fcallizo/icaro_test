'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import {
  PrivateModalShell,
  useInjectedStyles,
  type PrivateModalShellHandle,
} from './PrivateModalShell';

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

const FIELD_STYLE_ID = 'cinema-offer-modal-styles';

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

/** CSS propio de los campos. La paleta y el armazón viven en PrivateModalShell. */
const FIELD_CSS = `
.cofm__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.cofm__field{display:grid;gap:7px;margin:0;padding:0;border:0}
.cofm__field>span{color:var(--cof-muted);font-size:11px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase}
.cofm__field--wide{grid-column:1/-1}
.cofm__field input,.cofm__field textarea{width:100%;padding:11px 13px;
  border:1px solid var(--cof-line);background:rgba(255,255,255,.04);
  color:var(--cof-ink);font-size:14px;
  transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}
.cofm__field textarea{min-height:92px;resize:vertical;line-height:1.55}
.cofm__field input:focus-visible,.cofm__field textarea:focus-visible{
  border-color:var(--cof-gold);background:rgba(255,255,255,.07);
  box-shadow:0 0 0 3px var(--cof-tint-16);outline:none}
.cofm__field input::placeholder,.cofm__field textarea::placeholder{color:rgba(154,163,174,.65)}
.cofm__field em{align-self:end;color:rgba(154,163,174,.8);font-size:11px;font-style:normal}
.cofm__slots legend{padding:0;color:var(--cof-muted);font-size:11px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase}
.cofm__slots>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));
  gap:8px;margin-top:7px}
.cofm__slot{display:grid;gap:2px;padding:10px 8px;border:1px solid var(--cof-line);
  background:rgba(255,255,255,.03);color:inherit;cursor:pointer;
  text-align:center;transition:border-color .18s ease,background .18s ease,opacity .18s ease}
.cofm__slot strong{font-size:17px}
.cofm__slot span{color:var(--cof-muted);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.cofm__slot:hover:not(:disabled){border-color:var(--cof-gold)}
.cofm__slot.is-selected{border-color:var(--cof-gold);background:var(--cof-tint-16)}
.cofm__slot.is-selected span{color:var(--cof-gold)}
.cofm__slot:disabled{cursor:not-allowed;opacity:.42}
.cofm__publish{display:flex;gap:11px;align-items:flex-start;grid-column:1/-1;
  padding:13px 15px;border:1px solid var(--cof-line);
  background:rgba(255,255,255,.03);cursor:pointer;font-size:13px}
.cofm__publish:hover{border-color:var(--cof-tint-40)}
.cofm__publish input{width:17px;height:17px;margin-top:2px;accent-color:var(--cof-gold);cursor:pointer}
.cofm__publish>span{display:grid;gap:3px}
.cofm__publish small{color:var(--cof-muted);line-height:1.45}
.cofm__note{grid-column:1/-1;margin:0;padding:12px 15px;
  border-left:2px solid var(--cof-gold);background:var(--cof-tint-07);
  color:var(--cof-muted);font-size:13px;line-height:1.5}
.cofm__note strong{color:var(--cof-gold)}
@media (max-width:640px){.cofm__grid{grid-template-columns:minmax(0,1fr)}}
`;

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

  useInjectedStyles(FIELD_STYLE_ID, FIELD_CSS);

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
      titleRef.current?.focus();
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
        <label className="cofm__field cofm__field--wide">
          <span>Título</span>
          <input
            ref={titleRef}
            value={draft.title}
            onChange={(event) => updateDraft('title', event.target.value)}
            maxLength={120}
            placeholder="Abono trimestral Cine+Book"
            required
          />
          <em>{draft.title.trim().length}/120</em>
        </label>

        <label className="cofm__field">
          <span>Precio actual (€)</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={draft.price}
            onChange={(event) => updateDraft('price', event.target.value)}
            placeholder="Vacío si es a medida"
          />
        </label>

        <label className="cofm__field">
          <span>Precio anterior (€)</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={draft.oldPrice}
            onChange={(event) => updateDraft('oldPrice', event.target.value)}
            placeholder="Solo si hay oferta"
          />
        </label>

        <label className="cofm__field cofm__field--wide">
          <span>Descripción</span>
          <textarea
            value={draft.description}
            onChange={(event) => updateDraft('description', event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Qué incluye, condiciones y duración de la promoción."
          />
          <em>{draft.description.length}/2000</em>
        </label>

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
