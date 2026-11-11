'use client';

import { isValidIdentityDocument } from '@/lib/spanish-tax-id';
import type { IdentityDocumentType } from '@/lib/spanish-tax-id';

type SpanishTaxIdFieldProps = {
  idPrefix: string;
  type: IdentityDocumentType;
  value: string;
  onTypeChange: (type: IdentityDocumentType) => void;
  onValueChange: (value: string) => void;
};

export function SpanishTaxIdField({ idPrefix, type, value, onTypeChange, onValueChange }: SpanishTaxIdFieldProps) {
  const typeId = `${idPrefix}-tipoDocumentoIdentidad`;
  const id = `${idPrefix}-documentoIdentidad`;
  const hintId = `${id}-hint`;
  const hasError = value.trim() !== '' && !isValidIdentityDocument(type, value);

  return (
    <>
      <div className="field-group col-50">
        <label htmlFor={typeId}>Tipo de documento</label>
        <select
          id={typeId}
          name="tipoDocumentoIdentidad"
          value={type}
          onChange={(event) => onTypeChange(event.target.value === 'passport' ? 'passport' : 'nif')}
        >
          <option value="nif">NIF (DNI, NIE o CIF)</option>
          <option value="passport">Pasaporte</option>
        </select>
      </div>
      <div className="field-group col-50">
        <label htmlFor={id}>{type === 'passport' ? 'Número de pasaporte' : 'Número de NIF'}</label>
        <input
          id={id}
          name="documentoIdentidad"
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
          placeholder={type === 'passport' ? '5-20 letras o números' : 'DNI, NIE o CIF'}
          aria-invalid={hasError}
          aria-describedby={hintId}
        />
      </div>
    </>
  );
}
