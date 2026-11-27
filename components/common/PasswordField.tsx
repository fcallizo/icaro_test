'use client';

import { useId, useState, type RefObject } from 'react';

/* ==========================================================================
 * PasswordField · input de contraseña con ojo, para login y para alta
 * --------------------------------------------------------------------------
 * Diseño:
 *   · El estado "visible" es INTERNO por campo. No se sube al padre: en el
 *     formulario de alta hay dos campos y cada uno se revela aparte; si el
 *     flag viviera arriba, mostrar "Confirmar" mostraría también la otra.
 *   · Aquí viven los atributos que se repetían en cada formulario (spellCheck,
 *     autoCapitalize, autoCorrect, type conmutado) para que nadie los olvide en
 *     el siguiente sitio donde se use.
 *   · Sin etiqueta de nivel ni medidor dentro: el campo solo es campo. La
 *     robustez la compone quien la necesite (set-password) y el login no paga
 *     por ella.
 *   · inputRef para que el padre pueda enfocar el campo sin buscarlo por id.
 * ======================================================================== */

export type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 'new-password' en altas/cambios, 'current-password' en accesos. */
  autoComplete?: 'new-password' | 'current-password' | 'off';
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  /** id del bloque de ayuda (checklist, medidor) para aria-describedby. */
  describedBy?: string;
  onBlur?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Textos del botón del ojo, por si el contexto no es una contraseña normal. */
  toggleLabels?: { show: string; hide: string };
  /** Desactiva el ojo (p. ej. en un campo de PIN compartido en pantalla). */
  allowReveal?: boolean;
};

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  name = 'password',
  id,
  disabled = false,
  required = false,
  minLength,
  maxLength,
  describedBy,
  onBlur,
  inputRef,
  toggleLabels,
  allowReveal = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;

  const showLabel = toggleLabels?.show ?? 'Mostrar la contraseña';
  const hideLabel = toggleLabels?.hide ?? 'Ocultar la contraseña';

  return (
    <div className="ppw-field">
      <label htmlFor={inputId}>{label}</label>

      <input
        ref={inputRef}
        id={inputId}
        className="ppw-input"
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        aria-describedby={describedBy}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
      />

      {allowReveal && !disabled && (
        <button
          type="button"
          className="ppw-eye"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-controls={inputId}
          aria-label={visible ? hideLabel : showLabel}
        >
          <EyeIcon visible={visible} />
        </button>
      )}
    </div>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M 21.8 11.2 C 19.6 7.8 16.1 6 12 6 C 7.2 6 3.5 8.8 2 12 C 3.5 15.2 7.2 18 12 18 C 15.4 18 18.4 16.6 20.4 14.5" />
      <circle cx="12" cy="12" r="3.1" />
      {!visible && <path d="M4 20L20 4" className="ppw-eye__slash" />}
    </svg>
  );
}

export default PasswordField;
