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
 * Aporta todo lo "duro" una sola vez: capa fixed al final de <body> (fuera de
 * cualquier stacking context del layout), hoja de estilos inyectada, bloqueo
 * del fondo, cierre con Escape, protección de cambios sin guardar, foco
 * atrapado, atajo de guardar y animación de salida.
 *
 * El CSS de este archivo define además la paleta (--cof-*) que reutilizan los
 * campos de cada formulario, así que "el mismo estilo" no es una copia: es la
 * misma hoja.
 * ======================================================================== */

const STYLE_ID = 'private-modal-shell-styles';
const LAYER_ID = 'private-modal-layer';
const CLOSE_ANIMATION_MS = 190;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const SHELL_CSS = `
:root{
  --cof-ink:#f4f1ea;
  --cof-muted:#9aa3ae;
  --cof-surface:#101318;
  --cof-surface-2:#1a1e24;
  --cof-line:rgba(244,241,234,.14);
  --cof-danger:#ff6b6b;
  --cof-shadow:0 40px 90px -30px rgba(0,0,0,.8);

  /* Color de marca: hereda del tema (--gold) y cae en ámbar si no existe. */
  --cof-gold:var(--gold,#f0b429);
  --cof-gold-soft:var(--gold-soft,rgba(212,175,55,.08));
  --cof-tint-07:rgba(240,180,41,.07);
  --cof-tint-09:rgba(240,180,41,.09);
  --cof-tint-16:rgba(240,180,41,.16);
  --cof-tint-40:rgba(240,180,41,.4);
  --cof-danger-soft:rgba(255,107,107,.12);
  --cof-danger-line:rgba(255,107,107,.45);
  --cof-danger-ink:#ffc2c2;
}
@supports (color:color-mix(in srgb,red,blue)){
  :root{
    --cof-tint-07:color-mix(in srgb,var(--cof-gold) 7%,transparent);
    --cof-tint-09:color-mix(in srgb,var(--cof-gold) 9%,transparent);
    --cof-tint-16:color-mix(in srgb,var(--cof-gold) 16%,transparent);
    --cof-tint-40:color-mix(in srgb,var(--cof-gold) 40%,transparent);
    --cof-danger-soft:color-mix(in srgb,var(--cof-danger) 12%,transparent);
    --cof-danger-line:color-mix(in srgb,var(--cof-danger) 45%,transparent);
    --cof-danger-ink:color-mix(in srgb,var(--cof-danger) 55%,white);
  }
}
#${LAYER_ID}{position:static;z-index:auto}
.pvm{position:fixed;inset:0;height:100dvh;width:100%;display:grid;place-items:center;
  padding:clamp(10px,3vw,36px);box-sizing:border-box;visibility:visible;
  font-family:inherit;font-size:16px;line-height:1.45;text-align:left;direction:ltr;
  color:var(--cof-ink);-webkit-font-smoothing:antialiased}
.pvm *,.pvm *::before,.pvm *::after{box-sizing:border-box}
.pvm button,.pvm input,.pvm textarea,.pvm select,.pvm legend{font:inherit;color:inherit;letter-spacing:normal}
.pvm button{text-transform:none}
.pvm__backdrop{position:absolute;inset:0;background:rgba(6,8,11,.74);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  animation:pvm-fade .22s ease-out both}
.pvm__panel{position:relative;outline:none;display:flex;flex-direction:column;
  width:min(760px,100%);max-height:min(95vh,880px);overflow:hidden;
  border:1px solid var(--cof-line);
  background:linear-gradient(180deg,var(--cof-surface-2),var(--cof-surface));
  box-shadow:var(--cof-shadow);
  animation:pvm-rise .26s cubic-bezier(.22,1,.36,1) both}
.pvm--closing .pvm__panel{animation:pvm-leave .19s ease-in both}
.pvm--closing .pvm__backdrop{animation:pvm-fade .19s ease-in reverse both}
@keyframes pvm-fade{from{opacity:0}to{opacity:1}}
@keyframes pvm-rise{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
@keyframes pvm-leave{from{opacity:1;transform:none}to{opacity:0;transform:translateY(10px) scale(.99)}}
@media (prefers-reduced-motion:reduce){
  .pvm__panel,.pvm__backdrop,.pvm--closing .pvm__panel,.pvm--closing .pvm__backdrop{animation:none}}
.pvm__head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;
  padding:22px 24px 16px;border-bottom:1px solid var(--cof-line);
  background:linear-gradient(180deg,var(--cof-tint-07),transparent)}
.pvm__eyebrow{display:block;margin-bottom:6px;color:var(--cof-gold);
  font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.pvm__title{display:flex;gap:6px;align-items:center;margin:0;font-size:21px;letter-spacing:-.02em}
.pvm__dirty{color:var(--cof-gold);font-size:15px;line-height:1}
.pvm__subtitle{margin:6px 0 0;color:var(--cof-muted);font-size:13px}
.pvm__close{display:grid;place-items:center;width:38px;height:38px;flex:0 0 auto;
  border:1px solid var(--cof-line);background:rgba(255,255,255,.04);
  color:inherit;cursor:pointer;transition:background .18s ease,transform .18s ease}
.pvm__close:hover{background:var(--cof-danger-soft);transform:rotate(90deg)}
.pvm__close svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.pvm__form{display:flex;flex-direction:column;min-height:0}
.pvm__body{display:grid;gap:16px;padding:22px 24px 4px;overflow-y:auto;overscroll-behavior:contain}
.pvm__error{margin:12px 24px 0;padding:11px 14px;
  border:1px solid var(--cof-danger-line);
  background:var(--cof-danger-soft);color:var(--cof-danger-ink);font-size:13px}
.pvm__confirm{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;
  margin:12px 24px 0;padding:12px 14px;border:1px solid var(--cof-tint-40);
  background:var(--cof-tint-09);font-size:13px}
.pvm__confirm>div{display:flex;gap:8px}
.pvm__confirm button{padding:8px 13px;border:1px solid var(--cof-line);
  background:transparent;color:inherit;font-size:12px;cursor:pointer}
.pvm__confirm button:hover{background:rgba(255,255,255,.07)}
.pvm__confirm-danger{border-color:var(--cof-danger-line)!important;color:var(--cof-danger-ink)!important}
.pvm__foot{position:sticky;bottom:0;display:flex;flex-wrap:wrap;gap:14px;
  align-items:center;justify-content:space-between;margin-top:16px;padding:16px 24px;
  border-top:1px solid var(--cof-line);
  background:linear-gradient(180deg,rgba(16,19,24,.6),var(--cof-surface) 55%)}
.pvm__hint{color:var(--cof-muted);font-size:12px}
.pvm__actions{display:flex;gap:9px;flex-wrap:wrap}
.pvm__actions button{display:inline-flex;gap:8px;align-items:center;justify-content:center;
  padding:11px 18px;border:1px solid var(--cof-line);background:transparent;color:inherit;
  font-size:13px;cursor:pointer;
  transition:background .18s ease,opacity .18s ease,box-shadow .18s ease,border-color .18s ease}
.pvm__actions button:disabled{cursor:not-allowed;opacity:.5}
.pvm__actions button:not(.pvm__submit):hover{background:rgba(255,255,255,.06)}
.pvm__submit{border-color:var(--cof-gold)!important;background:rgba(212, 175, 55, 0.08);!important;
  color:var(--cof-gold)!important;font-weight:700}
.pvm__submit:hover:not(:disabled){background:var(--cof-tint-16)!important}
.pvm__submit[data-dirty]{box-shadow:0 0 0 3px var(--cof-tint-16)}
.pvm__submit svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round}
.pvm__spinner{width:14px;height:14px;border:2px solid var(--cof-tint-40);
  border-top-color:var(--cof-gold);border-radius:50%;animation:pvm-spin .7s linear infinite}
@keyframes pvm-spin{to{transform:rotate(360deg)}}
@media (max-width:640px){
  .pvm{align-items:end;padding:0}
  .pvm__panel{max-height:94dvh}
  .pvm__head,.pvm__body,.pvm__foot,.pvm__error,.pvm__confirm{padding-inline:18px}
  .pvm__error,.pvm__confirm{margin-inline:0}
  .pvm__foot{flex-direction:column;align-items:stretch;gap:10px}
  .pvm__actions{flex-wrap:wrap}
  .pvm__actions button{flex:1 1 auto}}
`;

/** Inyecta una hoja de estilos una sola vez (id idempotente). */
export function useInjectedStyles(id: string, css: string) {
  useEffect(() => {
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }, [id, css]);
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
  cancelLabel?: string;
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
      cancelLabel = 'Cancelar',
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

    useInjectedStyles(STYLE_ID, SHELL_CSS);

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
                <button type="button" onClick={requestClose} disabled={isSaving}>
                  {cancelLabel}
                </button>
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
