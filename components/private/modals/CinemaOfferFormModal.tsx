'use client';

import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { PageTheme } from '@/lib/properties';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  /** Por defecto se pone por encima de todo el layout del panel. */
  zIndex?: number;
  /** Elemento (o id) donde montar el portal. Por defecto: capa propia en <body>. */
  container?: HTMLElement | string;
  onClose: () => void;
  /** Se llama tras un guardado correcto; el manager recarga la lista. */
  onSaved?: (message: string) => void;
  /** Errores de servidor, por si el padre quiere mostrarlos también. */
  onServerError?: (message: string) => void;
};

export const OFFER_POSITIONS = [1, 2, 3, 4] as const;

const STYLE_ID = 'cinema-offer-modal-styles';
const LAYER_ID = 'cinema-offer-modal-layer';
const CLOSE_ANIMATION_MS = 190;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

/** Capa hermana del root, siempre el último hijo de <body>. */
function ensureLayer(): HTMLElement {
  const existing = document.getElementById(LAYER_ID);
  if (existing) {
    // Volver a ponerla al final gana a overlays inyectados más tarde.
    if (existing !== document.body.lastElementChild) {
      document.body.appendChild(existing);
    }
    return existing;
  }

  const layer = document.createElement('div');
  layer.id = LAYER_ID;
  layer.setAttribute('data-cinema-offer-modal-layer', '');

  // Inline => gana a cualquier `body > div{position:relative;z-index:0}` del proyecto.
  // No creamos stacking context: quien manda es el z-index del propio overlay.
  layer.style.position = 'static';
  layer.style.zIndex = 'auto';

  document.body.appendChild(layer);
  return layer;
}

function resolveContainer(container?: HTMLElement | string): HTMLElement {
  if (container instanceof HTMLElement) return container;
  if (typeof container === 'string') {
    const found = document.getElementById(container);
    if (found) return found;
  }
  return ensureLayer();
}

/* --- Hoja de estilos del modal (se inyecta una sola vez) ----------------- */

const MODAL_CSS = `
:root{
  --cof-ink:#f4f1ea;
  --cof-muted:#9aa3ae;
  --cof-surface:#15181d;
  --cof-surface-2:#1d222a;
  --cof-line:rgba(244,241,234,.14);
  --cof-shadow:0 40px 90px -30px rgba(0,0,0,.8);
}
#cinema-offer-modal-layer{position:static;z-index:auto}
.cofm{position:fixed;inset:0;height:100dvh;width:100%;display:grid;place-items:center;
  padding:clamp(10px,3vw,36px);box-sizing:border-box;visibility:visible;
  font-family:inherit;font-size:16px;line-height:1.45;text-align:left;direction:ltr;
  color:var(--cof-ink);-webkit-font-smoothing:antialiased}
.cofm *,.cofm *::before,.cofm *::after{box-sizing:border-box}
.cofm button,.cofm input,.cofm textarea,.cofm select,.cofm legend{font:inherit;color:inherit;letter-spacing:normal}
.cofm button{text-transform:none}
.cofm__backdrop{position:absolute;inset:0;background:rgba(6,8,11,.74);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  animation:cofm-fade .22s ease-out both}
.cofm__panel{position:relative;outline:none;display:flex;flex-direction:column;
  width:min(1020px,100%);max-height:min(92vh,880px);overflow:hidden;
  border:1px solid var(--cof-line);
  background:linear-gradient(180deg,#1a1e24,#101318);box-shadow:var(--cof-shadow);
  animation:cofm-rise .26s cubic-bezier(.22,1,.36,1) both}
.cofm--closing .cofm__panel{animation:cofm-leave .19s ease-in both}
.cofm--closing .cofm__backdrop{animation:cofm-fade .19s ease-in reverse both}
@keyframes cofm-fade{from{opacity:0}to{opacity:1}}
@keyframes cofm-rise{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
@keyframes cofm-leave{from{opacity:1;transform:none}to{opacity:0;transform:translateY(10px) scale(.99)}}
@media (prefers-reduced-motion:reduce){
  .cofm__panel,.cofm__backdrop,.cofm--closing .cofm__panel,.cofm--closing .cofm__backdrop{animation:none}}
.cofm__head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;
  padding:22px 24px 16px;border-bottom:1px solid var(--cof-line);
  background:linear-gradient(180deg,rgba(240,180,41,.07),transparent)}
.cofm__eyebrow{display:block;margin-bottom:6px;color:var(--gold);
  font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.cofm__title{display:flex;gap:8px;align-items:center;margin:0;font-size:21px;letter-spacing:-.02em}
.cofm__dirty{color:var(--gold);font-size:26px;line-height:.4}
.cofm__subtitle{margin:6px 0 0;color:var(--cof-muted);font-size:13px}
.cofm__close{display:grid;place-items:center;width:38px;height:38px;flex:0 0 auto;
  border:1px solid var(--cof-line);background:rgba(255,255,255,.04);
  color:inherit;cursor:pointer;transition:background .18s ease,transform .18s ease}
.cofm__close:hover{background:rgba(255,107,107,.16);transform:rotate(90deg)}
.cofm__close svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.cofm__body{align-content:start;padding:22px 24px 0;overflow-y:auto;overscroll-behavior:contain}
.cofm__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.cofm__field{display:grid;gap:7px;margin:0;padding:0;border:0}
.cofm__field>span{color:var(--cof-muted);font-size:11px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase}
.cofm__field--wide{grid-column:1/-1}
.cofm__field input,.cofm__field textarea{width:100%;padding:11px 13px;
  border:1px solid var(--cof-line);background:rgba(255,255,255,.04);
  color:var(--cof-ink);font:inherit;font-size:14px;
  transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}
.cofm__field textarea{min-height:92px;resize:vertical;line-height:1.55}
.cofm__field input:focus-visible,.cofm__field textarea:focus-visible{
  border-color:var(--gold);background:rgba(255,255,255,.07);
  box-shadow:0 0 0 3px rgba(240,180,41,.16);outline:none}
.cofm__field input::placeholder,.cofm__field textarea::placeholder{color:rgba(154,163,174,.65)}
.cofm__field em{align-self:end;color:rgba(154,163,174,.8);font-size:11px;font-style:normal}
.cofm__slots legend{padding:0;color:var(--cof-muted);font-size:11px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase}
.cofm__slots>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));
  gap:8px;margin-top:7px}
.cofm__slot{display:grid;gap:2px;padding:10px 8px;border:1px solid var(--cof-line);
  background:rgba(255,255,255,.03);color:inherit;cursor:pointer;
  font:inherit;text-align:center;transition:border-color .18s ease,background .18s ease,opacity .18s ease}
.cofm__slot strong{font-size:17px}
.cofm__slot span{color:var(--cof-muted);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.cofm__slot:hover:not(:disabled){border-color:var(--gold)}
.cofm__slot.is-selected{border-color:var(--gold);background:rgba(240,180,41,.16)}
.cofm__slot.is-selected span{color:var(--gold)}
.cofm__slot:disabled{cursor:not-allowed;opacity:.42}
.cofm__publish{display:flex;gap:11px;align-items:flex-start;grid-column:1/-1;
  padding:13px 15px;border:1px solid var(--cof-line);
  background:rgba(255,255,255,.03);cursor:pointer;font-size:13px}
.cofm__publish:hover{border-color:rgba(240,180,41,.4)}
.cofm__publish input{width:17px;height:17px;margin-top:2px;accent-color:var(--gold);cursor:pointer}
.cofm__publish>span{display:grid;gap:3px}
.cofm__publish small{color:var(--cof-muted);line-height:1.45}
.cofm__note{grid-column:1/-1;margin:0;padding:12px 15px;
  border-left:2px solid var(--gold);border-radius:0 10px 10px 0;
  background:rgba(240,180,41,.07);color:var(--cof-muted);font-size:13px;line-height:1.5}
.cofm__note strong{color:var(--gold)}
.cofm__error{grid-column:1/-1;margin:4px 0 0;padding:11px 14px;
  border:1px solid rgba(255,107,107,.45);
  background:rgba(255,107,107,.12);color:#ffc2c2;font-size:13px}
.cofm__confirm{position: absolute;top: 100px;left: 210px;display: flex;gap: 15px;
    align-items: center;justify-content: space-between;padding: 30px;font-size: 14px;
    border: 1px solid var(--cof-line); background: linear-gradient(180deg, #1a1e24, #101318);}
.cofm__confirm>div{display:flex;gap:8px}
.cofm__confirm button{padding:8px 13px;border:1px solid var(--cof-line);
  background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}
.cofm__confirm button:hover{background:rgba(255,255,255,.07)}
.cofm__confirm-danger{border-color:rgba(255,107,107,.5)!important;color:#ffc2c2!important}
.cofm__foot{position:sticky;bottom:0;grid-column:1/-1;display:flex;flex-wrap:wrap;gap:14px;
  align-items:center;justify-content:space-between;margin-top:6px;padding:16px 24px;
  border-top:1px solid var(--cof-line);
  background:linear-gradient(180deg,rgba(16,19,24,.6),#101318 55%)}
.cofm__hint{color:var(--cof-muted);font-size:12px}
.cofm__foot-actions{display:flex;gap:9px}
.cofm__foot-actions button{display:inline-flex;gap:8px;align-items:center;padding:11px 18px;
  border:1px solid var(--cof-line);background:transparent;color:inherit;
  font:inherit;font-size:13px;cursor:pointer;
  transition:background .18s ease,opacity .18s ease,box-shadow .18s ease}
.cofm__foot-actions button:disabled{cursor:not-allowed;opacity:.5}
.cofm__foot-actions button:not(.cofm__submit):hover{background:rgba(255,255,255,.06)}
.cofm__submit{border-color:var(--gold)!important; background: rgba(212, 175, 55, 0.08)!important;
  color:var(--gold)!important;font-weight:700}
.cofm__submit:hover{background: rgba(212, 175, 55, 0.16)!important;outline: none;;}
.cofm__submit[data-dirty]{box-shadow:0 0 0 3px rgba(240,180,41,.2)}
.cofm__submit svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round}
.cofm__spinner{width:14px;height:14px;border:2px solid rgba(23,19,5,.35);
  border-top-color:#171305;border-radius:50%;animation:cofm-spin .7s linear infinite}
@keyframes cofm-spin{to{transform:rotate(360deg)}}
@media (max-width:900px){
  .cofm__body{grid-template-columns:minmax(0,1fr);padding-inline:18px}
  .cofm__preview{order:-1}}
@media (max-width:620px){
  .cofm{align-items:end;padding:0}
  .cofm__panel{max-height:94dvh;border-radius:20px 20px 0 0}
  .cofm__grid{grid-template-columns:minmax(0,1fr)}
  .cofm__head,.cofm__foot{padding-inline:18px}
  .cofm__foot-actions{flex:1 1 auto}
  .cofm__foot-actions button{flex:1;justify-content:center}}
`;

function useInjectedStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = MODAL_CSS;
    document.head.appendChild(style);
  }, []);
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
  zIndex = 2147483000,
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
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone; surface?: PageTheme } | null>(null);

  useInjectedStyles();

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

  const freePositions = useMemo(
    () => OFFER_POSITIONS.filter((position) => !occupiedPositions.includes(position)),
    [occupiedPositions],
  );

  const hasFreePosition = freePositions.length > 0;

  /* --- Montaje en la capa superior + bloqueo del fondo ------------------- */

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setTarget(resolveContainer(container));
    setMounted(true);

    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    // Aislamos el resto de la app: no recibe foco ni clicks mientras el modal vive.
    const canInert = 'inert' in HTMLElement.prototype;
    const siblings: HTMLElement[] = [];

    if (canInert) {
      for (const child of Array.from(document.body.children) as HTMLElement[]) {
        if (child.id === LAYER_ID) continue;
        siblings.push(child);
        child.inert = true;
      }
    }

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;

      for (const sibling of siblings) {
        sibling.inert = false;
      }
    };
  }, [container]);

  useEffect(() => {
    if (!mounted) return;

    // Autofoco defensivo: si React desmontó el modal entre medias, no tocamos nada.
    const raf = requestAnimationFrame(() => {
      const input = titleRef.current;
      if (input && document.contains(input)) input.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  /** Cierre real: devuelve el foco al botón que abrió el modal. */
  const handleClose = useCallback(() => {
    const restore = previouslyFocused.current;

    if (restore && document.contains(restore)) {
      restore.focus();
    }

    previouslyFocused.current = null;
    onClose();
  }, [onClose]);

  const animateOut = useCallback(
    (then?: () => void) => {
      setIsClosing(true);
      closeTimer.current = setTimeout(() => {
        then?.();
        handleClose();
      }, CLOSE_ANIMATION_MS);
    },
    [handleClose],
  );

  const requestClose = useCallback(() => {
    if (isSaving) return;

    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }

    animateOut();
  }, [animateOut, isDirty, isSaving]);

  /* --- Escape · foco atrapado · ⌘/Ctrl+S -------------------------------- */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        if (confirmDiscard) {
          setConfirmDiscard(false);
          return;
        }

        requestClose();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!isSaving) formRef.current?.requestSubmit();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [confirmDiscard, isSaving, requestClose]);

  /* --- Draft ----------------------------------------------------------- */

  const updateDraft = <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (confirmDiscard) setConfirmDiscard(false);
  };

  /* --- Guardado -------------------------------------------------------- */

  const saveOffer = async () => {
    setConfirmDiscard(false);

    if (!draft.title.trim()) {
			setToast({ message: 'Escribe un título para la oferta.', tone: 'error' });
      titleRef.current?.focus();
      return;
    }

    const price = parsePriceInput(draft.price);
    const oldPrice = parsePriceInput(draft.oldPrice);

    if (price === 'invalid' || oldPrice === 'invalid') {
      setToast({ message: 'Los precios deben ser números enteros positivos o estar vacíos.', tone: 'error' });
      return;
    }

    if (price !== null && oldPrice !== null && oldPrice <= price) {
      setToast({ message: 'El precio anterior debe ser superior al precio actual.', tone: 'error' });
      return;
    }

    if (!isCreate && draft.visible && !hasFreePosition) {
      setToast({ message: `Ya hay ${maxVisible} ofertas visibles. Oculta una antes de activar otra.`, tone: 'error' });
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

      animateOut(() => {
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
      setToast({ message: message, tone: 'error' });
      onServerError?.(message);
      setIsSaving(false);
    }
  };

  /* --- Render ---------------------------------------------------------- */

  if (!mounted || !target) return null;

  return createPortal(
    <div
      className={`cofm${isClosing ? ' cofm--closing' : ''}${className ? ` ${className}` : ''}`}
      // Crítica: inline para que sea overlay aunque el CSS inyectado no llegue a tiempo.
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex,
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="cofm__backdrop" aria-hidden="true" />

      <div
        className="cofm__panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cofm-title"
        aria-describedby="cofm-subtitle"
      >
        <header className="cofm__head">
          <div>
            <span className="cofm__eyebrow">
              {isCreate ? 'NUEVO SERVICIO' : 'EDITAR SERVICIO'}
            </span>
            <h5 id="cofm-title" className="cofm__title">
              {isCreate ? 'Crear oferta' : 'Editar oferta'}
              {isDirty && (
                <span className="cofm__dirty" title="Cambios sin guardar">
                  *
                </span>
              )}
            </h5>
            <p id="cofm-subtitle" className="cofm__subtitle">
              {isCreate
                ? 'La oferta se guardará oculta como borrador.'
                : 'Los cambios se reflejan al instante en la web pública.'}
            </p>
          </div>

          <button
            type="button"
            className="cofm__close"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Cerrar formulario"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <form
          ref={formRef}
          className="cofm__body"
          onSubmit={(event) => {
            event.preventDefault();
            void saveOffer();
          }}
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

          {confirmDiscard && (
            <div className="cofm__confirm" role="alertdialog" aria-live="assertive">
              <span>Tienes cambios sin guardar. ¿Descartar el formulario?</span>
              <div>
                <button type="button" onClick={() => setConfirmDiscard(false)}>
                  Seguir editando
                </button>
                <button
                  type="button"
                  className="cofm__confirm-danger"
                  onClick={() => animateOut()}
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          <footer className="cofm__foot">
            <span className="cofm__hint">
              {isSaving ? 'Guardando…' : '⌘/Ctrl + S para guardar · Esc para cerrar'}
            </span>
            <div className="cofm__foot-actions">
              <button type="button" onClick={requestClose} disabled={isSaving}>
                Cancelar
              </button>
              <button
                type="submit"
                className="cofm__submit"
                disabled={isSaving}
                data-dirty={isDirty || undefined}
              >
                {isSaving ? (
                  <span className="cofm__spinner" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCreate ? 'Crear oferta' : 'Guardar oferta'}
              </button>
            </div>
          </footer>
        </form>
      </div>
      <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} surface={toast?.surface} onDismiss={() => setToast(null)} />
    </div>,
    target,
  );
}

export default CinemaOfferFormModal;
