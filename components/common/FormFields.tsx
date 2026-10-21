'use client';

import type { InputHTMLAttributes } from 'react';
import { InternationalPhoneInput } from './InternationalPhoneInput';

type StringKey<Values> = Extract<{
  [Field in keyof Values]: Values[Field] extends string ? Field : never;
}[keyof Values], string>;

type FieldProps<Field extends string> = {
  field: Field;
  idPrefix: string;
  label: string;
  value: string;
  onChange: (field: Field, value: string) => void;
  wrapperClassName?: string;
  suffix?: string;
};

type FormFieldsOptions<Values extends { [Field in keyof Values]: string }> = {
  values: Values;
  idPrefix: string;
  onChange: (field: StringKey<Values>, value: string) => void;
  wrapperClassName?: string;
  wideClassName?: string;
  textareaClassName?: string;
  emptyOption?: string;
  dateInputWrapper?: boolean;
  disabled?: boolean;
  readOnlyFields?: readonly StringKey<Values>[];
};

export function FormInputField<Field extends string>({
  field,
  idPrefix,
  label,
  value,
  onChange,
  wrapperClassName = 'field-group',
  type = 'text',
  required = false,
  disabled = false,
  readOnly = false,
  step,
  placeholder,
  autoComplete,
  dateInputWrapper = false,
}: FieldProps<Field> & {
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  step?: InputHTMLAttributes<HTMLInputElement>['step'];
  placeholder?: InputHTMLAttributes<HTMLInputElement>['placeholder'];
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
  dateInputWrapper?: boolean;
}) {
  const id = `${idPrefix}-${field}`;
  const input = (
    <input
      id={id}
      name={field}
      type={type}
      value={value}
      onChange={(event) => onChange(field, event.target.value)}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      step={step}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  );

  return (
    <div className={wrapperClassName} key={field}>
      <label htmlFor={id}>{label}</label>
      {dateInputWrapper && type === 'date' ? <div className="date-input">{input}</div> : input}
    </div>
  );
}

export function FormTextareaField<Field extends string>({
  field,
  idPrefix,
  label,
  value,
  onChange,
  wrapperClassName = 'field-group wide',
  disabled = false,
  rows = 3,
  placeholder,
}: FieldProps<Field> & { disabled?: boolean; rows?: number; placeholder?: string }) {
  const id = `${idPrefix}-${field}`;

  return (
    <div className={wrapperClassName} key={field}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        name={field}
        rows={rows}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

export function FormSelectField<Field extends string>({
  field,
  idPrefix,
  label,
  value,
  onChange,
  wrapperClassName = 'field-group',
  options,
  required = false,
  disabled = false,
  emptyOption,
}: FieldProps<Field> & {
  options: Array<string | { value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  emptyOption?: string;
}) {
  const id = `${idPrefix}-${field}`;

  return (
    <div className={wrapperClassName} key={field}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={field}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        required={required}
        disabled={disabled}
      >
        {emptyOption !== undefined && <option value="">{emptyOption}</option>}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </div>
  );
}

export function FormPhoneField<Field extends string>({
  field,
  idPrefix,
  label,
  value,
  onChange,
  wrapperClassName = 'field-group',
  required = false,
  disabled = false,
  placeholder = 'Teléfono',
}: FieldProps<Field> & {
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const id = `${idPrefix}-${field}`;

  return (
    <div className={wrapperClassName} key={field}>
      <label htmlFor={id}>{label}</label>
      <InternationalPhoneInput
        id={id}
        value={value}
        onChange={(nextValue) => onChange(field, nextValue)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

export function FormPriceField<Field extends string>({
  field,
  idPrefix,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  wrapperClassName = 'field-group',
  suffix
}: FieldProps<Field> & {
  required?: boolean;
  disabled?: boolean;
}) {
  const id = `${idPrefix}-${field}`;
  const input = (
    <input
      id={id}
      name={field}
      type='number'
      min="0"
      step="0.01"
      value={value}
      onChange={(event) => onChange(field, event.target.value)}
      required={required}
      disabled={disabled}
    />
  );

  return (
    <div className={wrapperClassName} key={field}>
      <label htmlFor={id}>{label}</label>
      <div className="input-with-suffix">
        {input}
        <span className="input-suffix">{suffix}</span>
      </div>
    </div>
  );
}

export function createFormFields<Values extends { [Field in keyof Values]: string }>({
  values,
  idPrefix,
  onChange,
  wrapperClassName = 'field-group',
  wideClassName,
  textareaClassName,
  emptyOption,
  dateInputWrapper = false,
  disabled: formDisabled = false,
  readOnlyFields = [],
}: FormFieldsOptions<Values>) {
  const fieldClassName = (wide: boolean) =>
    wide && wideClassName ? `${wrapperClassName} ${wideClassName}` : wrapperClassName;

  return {
    input: (
      field: StringKey<Values>,
      label: string,
      type: InputHTMLAttributes<HTMLInputElement>['type'] = 'text',
      required = false,
      wide = false,
      disabled = false,
      placeholder: string,
    ) => (
      <FormInputField
        field={field}
        idPrefix={idPrefix}
        label={label}
        value={values[field]}
        onChange={onChange}
        wrapperClassName={fieldClassName(wide)}
        type={type}
        required={required}
        disabled={disabled || formDisabled}
        step={type === 'number' ? 'any' : undefined}
        readOnly={readOnlyFields.includes(field)}
        placeholder={placeholder}
        dateInputWrapper={dateInputWrapper}
      />
    ),
    inputPhone: (
      field: StringKey<Values>,
      label: string,
      required = false,
      disabled = false,
    ) => (
      <FormPhoneField
        field={field}
        idPrefix={idPrefix}
        label={label}
        value={values[field]}
        onChange={onChange}
        required={required}
        disabled={disabled || formDisabled}
      />
    ),
    inputSuffix: (
      field: StringKey<Values>,
      label: string,
      required = false,
      disabled = false,
      wide = false,
      suffix = "€"
    ) => (
      <FormPriceField
        field={field}
        idPrefix={idPrefix}
        label={label}
        required={required}
        disabled={disabled || formDisabled}
        wrapperClassName={fieldClassName(wide)}
        value={values[field]}
        onChange={onChange}
        suffix={suffix}
      />
    ),
    textarea: (
      field: StringKey<Values>,
      label: string,
      disabled = false,
      placeholder?: string,
    ) => (
      <FormTextareaField
        field={field}
        idPrefix={idPrefix}
        label={label}
        value={values[field]}
        onChange={onChange}
        wrapperClassName={textareaClassName ?? (wideClassName ? fieldClassName(true) : `${wrapperClassName} wide`)}
        disabled={disabled || formDisabled}
        placeholder={placeholder}
      />
    ),
    select: (
      field: StringKey<Values>,
      label: string,
      options: Array<string | { value: string; label: string }>,
      required = false,
      wide = false,
      disabled = false,
    ) => (
      <FormSelectField
        field={field}
        idPrefix={idPrefix}
        label={label}
        value={values[field]}
        onChange={onChange}
        wrapperClassName={fieldClassName(wide)}
        options={options}
        required={required}
        disabled={disabled || formDisabled}
        emptyOption={emptyOption}
      />
    ),
  };
}
