'use client';

import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { PageTheme } from '@/lib/properties';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

/* ==========================================================================
 * Caparazón de modal compartido por los formularios del panel privado.
 *
 * Aporta la capa fixed fuera de cualquier stacking context del layout,
 * bloqueo del fondo, cierre con Escape, protección de cambios sin guardar,
 * foco atrapado, atajo de guardar y animación de salida.
 * ======================================================================== */

const LAYER_ID = 'private-modal-layer';
const CLOSE_ANIMATION_MS = 190;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  layer.setAttribute('data-private-modal-layer', '');

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

export type PrivateModalShellHandle = {
  /** Cierra tras la animación. `then` se ejecuta justo antes de desmontar. */
  close: (then?: () => void) => void;
  /** Intento de cierre: si hay cambios sin guardar pide confirmación. */
  requestClose: () => void;
};

export type PrivateModalShellProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  /** Si se define, el cuerpo + el pie van dentro de un <form> y ⌘/Ctrl+S lo envía. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel?: ReactNode;
  /** Sustituye los botones del pie por los tuyos. */
  footerActions?: ReactNode;
  /** Texto pequeño del pie; por defecto indica los atajos. */
  hint?: ReactNode;
  error?: string;
  isSaving?: boolean;
  isDirty?: boolean;
  /** Foco inicial; si no se pasa, se autofocus el primer campo. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
  container?: HTMLElement | string;
  /** Contenido extra bajo el pie (p. ej. un panel de enlace recién creado). */
  trailing?: ReactNode;
};

export const PrivateModalShell = forwardRef<PrivateModalShellHandle, PrivateModalShellProps>(
  function PrivateModalShell(
    {
      eyebrow,
      title,
      subtitle,
      children,
      onClose,
      onSubmit,
      submitLabel,
      footerActions,
      hint,
      error,
      isSaving = false,
      isDirty = false,
      initialFocusRef,
      className,
      style,
      zIndex = 2147483000,
      container,
      trailing,
    },
    ref,
  ) {
    const [mounted, setMounted] = useState(false);
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    const panelRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [toast, setToast] = useState<{ message: string; tone: StatusToastTone; surface?: PageTheme } | null>(null);

    /* --- Montaje en la capa superior + bloqueo del fondo ----------------- */

    useEffect(() => {
      previouslyFocused.current = document.activeElement as HTMLElement | null;

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

      // El portal solo existe en el cliente: montamos en microtarea para no
      // encadenar un render dentro del cuerpo del effect (set-state-in-effect).
      let cancelled = false;

      queueMicrotask(() => {
        if (cancelled) return;
        setTarget(resolveContainer(container));
        setMounted(true);
      });

      return () => {
        cancelled = true;
        document.body.style.overflow = overflow;
        document.body.style.paddingRight = paddingRight;

        for (const sibling of siblings) {
          sibling.inert = false;
        }
      };
    }, [container]);

    /* --- Autofoco (defensivo: React puede haber desmontado ya) ----------- */

    useEffect(() => {
      if (!mounted) return;

      const raf = requestAnimationFrame(() => {
        const preferred = initialFocusRef?.current;
        if (preferred && document.contains(preferred)) {
          preferred.focus();
          return;
        }

        const firstField = panelRef.current?.querySelector<HTMLElement>(
          'input:not([type="hidden"]), textarea, select',
        );
        if (firstField && document.contains(firstField)) firstField.focus();
      });

      return () => cancelAnimationFrame(raf);
    }, [mounted, initialFocusRef]);

    useEffect(
      () => () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
      },
      [],
    );

    useEffect(() => {
      const mensajeLimpio = error?.trim();

      if (mensajeLimpio) {
        setToast({ message: mensajeLimpio, tone: 'error' });
      }
    }, [error]);

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

    useImperativeHandle(
      ref,
      () => ({
        close: (then?: () => void) => animateOut(then),
        requestClose,
      }),
      [animateOut, requestClose],
    );

    /* --- Escape · foco atrapado · ⌘/Ctrl+S ------------------------------- */

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
          if (!isSaving && onSubmit) formRef.current?.requestSubmit();
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
    }, [confirmDiscard, isSaving, onSubmit, requestClose]);

    /* --- Render ---------------------------------------------------------- */

    if (!mounted || !target) return null;

    const body = (
      <>
        <div className="pvm__body">{children}</div>

        {confirmDiscard && (
          <div className="pvm__confirm" role="alertdialog" aria-live="assertive">
            <span>Tienes cambios sin guardar. ¿Descartar el formulario?</span>
            <div>
              <button type="button" onClick={() => setConfirmDiscard(false)}>
                Seguir editando
              </button>
              <button
                type="button"
                className="pvm__confirm-danger"
                onClick={() => animateOut()}
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        <footer className="pvm__foot">
          <span className="pvm__hint">
            {hint ?? (isSaving
              ? 'Guardando…'
              : onSubmit
                ? '⌘/Ctrl + S para guardar · Esc para cerrar'
                : 'Esc para cerrar')}
          </span>

          <div className="pvm__actions">
            {footerActions ?? (
              <>
                {submitLabel !== undefined && (
                  <button
                    type="submit"
                    className="pvm__submit"
                    disabled={isSaving}
                    data-dirty={isDirty || undefined}
                  >
                    {isSaving ? (
                      <span className="pvm__spinner" aria-hidden="true" />
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {submitLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </footer>

        {trailing}
      </>
    );

    return createPortal(
      <div
        className={`pvm${isClosing ? ' pvm--closing' : ''}`}
        // Crítica: inline para que sea overlay aunque el CSS inyectado no llegue a tiempo.
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        <div className="pvm__backdrop" aria-hidden="true" />

        <div
          className={`pvm__panel${className ? ` ${className}` : ''}`}
          ref={panelRef}
          style={style}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pvm-title"
          aria-describedby={subtitle ? 'pvm-subtitle' : undefined}
        >
          <header className="pvm__head">
            <div>
              {eyebrow && <span className="pvm__eyebrow">{eyebrow}</span>}
              <h5 id="pvm-title" className="pvm__title">
                {title}
                {isDirty && (
                  <span className="pvm__dirty" title="Cambios sin guardar">
                    *
                  </span>
                )}
              </h5>
              {subtitle && (
                <p id="pvm-subtitle" className="pvm__subtitle">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              className="pvm__close"
              onClick={requestClose}
              disabled={isSaving}
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {onSubmit ? (
            <form
              ref={formRef}
              className="pvm__form"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit(event);
              }}
            >
              {body}
            </form>
          ) : (
            <div className="pvm__form">{body}</div>
          )}
        </div>
        <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} surface={toast?.surface} onDismiss={() => setToast(null)} />
      </div>,
      target,
    );
  },
);

export default PrivateModalShell;
