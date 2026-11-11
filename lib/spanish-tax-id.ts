const DNI_CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

export type IdentityDocumentType = 'nif' | 'passport';

export function normalizeSpanishTaxId(value: string) {
  return value.toUpperCase().replace(/[\s.-]/g, '');
}

export function isValidIdentityDocument(type: IdentityDocumentType, value: string) {
  const document = normalizeSpanishTaxId(value);

  if (type === 'passport') {
    return /^[A-Z0-9]{5,20}$/.test(document);
  }

  const dni = /^(\d{8})([A-Z])$/.exec(document);
  if (dni) {
    return DNI_CONTROL_LETTERS[Number(dni[1]) % 23] === dni[2];
  }

  const nie = /^([XYZ])(\d{7})([A-Z])$/.exec(document);
  if (nie) {
    const prefix = 'XYZ'.indexOf(nie[1]);
    return DNI_CONTROL_LETTERS[Number(`${prefix}${nie[2]}`) % 23] === nie[3];
  }

  const cif = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(document);
  if (!cif) return false;

  const [, prefix, digits, control] = cif;
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[index]);
    if (index % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }

  const controlDigit = (10 - (sum % 10)) % 10;
  const expectedLetter = CIF_CONTROL_LETTERS[controlDigit];
  const requiresDigit = 'ABEH'.includes(prefix);
  const requiresLetter = 'PQS'.includes(prefix);

  if (requiresDigit) return control === String(controlDigit);
  if (requiresLetter) return control === expectedLetter;
  return control === String(controlDigit) || control === expectedLetter;
}
