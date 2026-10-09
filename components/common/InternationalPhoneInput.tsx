import PhoneInput from 'react-phone-number-input';

type InternationalPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

export function InternationalPhoneInput({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false
}: InternationalPhoneInputProps) {
  return (
    <PhoneInput
      className="international-phone-input"
      defaultCountry="ES"
      international
      countryCallingCodeEditable={false}
      value={value || undefined}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}