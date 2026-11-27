/* ==========================================================================
 * Política de contraseñas · compartida por el formulario y la API
 * --------------------------------------------------------------------------
 * Diseñada para que no se pueda usar maliciosamente contra nosotros:
 *   · Sin regex: todo el análisis es una pasada lineal sobre code points con
 *     comparaciones de rango numérico. Nada de cuantificadores anidados ni de
 *     patrones construidos a partir de la entrada => sin ReDoS y sin coste
 *     exponencial por muy raro que sea el payload.
 *   · Sin flag `u` ni `\p{...}` (exigen target ES2018+) y sin iterar strings
 *     (exige ES2015/downlevelIteration): los rangos se resuelven con
 *     codePointAt(), así que esto compila con cualquier target del tsconfig.
 *   · Se rechazan (no se transforman) los caracteres de control y formato:
 *     U+200B/200C/200D/2060, RLO/LRO U+202E/202D, soft hyphen, NBSP, BOM,
 *     tag chars U+E0020… Es lo que convierte una contraseña "visualmente
 *     igual" en otra distinta o rompe el campo al pegarla.
 *   · El conjunto de símbolos es una lista explícita: si mañana cambia el
 *     teclado del gestor de contraseñas, la política no se abre sola.
 *   · NO se normaliza ni se recorta lo que se guarda: si aquí hiciéramos
 *     normalize()/trim() y la ruta de login no, el usuario se quedaría fuera.
 *     Solo se valida; se hashéa exactamente lo que se escribió.
 * ======================================================================== */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 256;

/**
 * Símbolos admitidos. Todo lo demás (emoji, ¶, ¤, U+202E…) se rechaza.
 * Se recorre con indexOf: son 32 caracteres, más rápido que montar un Set y
 * sin depender de la sobrecarga iterable del constructor.
 */
export const ALLOWED_SYMBOLS = "!@#$%^&*()_+-=[]{};:'\",.<>/?~`\\|";

/** Cosas que nunca deberían ser una contraseña, por obvias o por internas. */
const DENYLIST = [
  'password',
  'contraseña',
  'contrasena',
  'icaro',
  'icaro123',
  'admin123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'abc12345',
];

/* --- Rangos de code points (equivalente a las clases Unicode que usábamos) - */

type Range = readonly [number, number];

/** A-Z, Latin-1, latino extendido, griego, cirílico. */
const UPPER_RANGES: Range[] = [
  [0x41, 0x5a],
  [0xc0, 0xd6],
  [0xd8, 0xde],
  [0x100, 0x13f],
  [0x140, 0x17e],
  [0x391, 0x3a9],
  [0x410, 0x42f],
];

const LOWER_RANGES: Range[] = [
  [0x61, 0x7a],
  [0xdf, 0xf6],
  [0xf8, 0xff],
  [0x101, 0x13f],
  [0x140, 0x17e],
  [0x3b1, 0x3c9],
  [0x430, 0x44f],
];

/** Letras y marcas combinantes admitidas (LAT/latín extendido, griego, cirílico). */
const LETTER_RANGES: Range[] = [
  [0x41, 0x5a],
  [0x61, 0x7a],
  [0xaa, 0xaa],
  [0xb5, 0xb5],
  [0xba, 0xba],
  [0xc0, 0xd6],
  [0xd8, 0xf6],
  [0xf8, 0x2ff],
  [0x300, 0x36f], // marcas combinantes (acentos descompuestos)
  [0x370, 0x3ff],
  [0x400, 0x4ff],
];

/** Control, formato, espacios no ASCII y puntuación tipográfica: fuera. */
const FORBIDDEN_RANGES: Range[] = [
  [0x00, 0x1f], // controles (el espacio 0x20 se admite y se trata aparte)
  [0x7f, 0xa0], // DEL, C1 y NBSP
  [0xad, 0xad], // soft hyphen
  [0x2000, 0x200f], // espacios tipográficos, ZWSP, ZWNJ, ZWJ, LRM/RLM
  [0x2028, 0x202f], // separadores de línea/párrafo, RLO, LRO, LRE, RLE, narrow NBSP
  [0x205f, 0x2064], // media space, word joiner, U+2060…
  [0xfeff, 0xfeff], // BOM
  [0xfff9, 0xfffb], // annotators
  [0xe0001, 0xe0001], // language tag
  [0xe0020, 0xe007f], // tag chars
];

function inRanges(codePoint: number, ranges: Range[]): boolean {
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (codePoint >= range[0] && codePoint <= range[1]) return true;
  }

  return false;
}

const isUpperCp = (cp: number) => inRanges(cp, UPPER_RANGES);
const isLowerCp = (cp: number) => inRanges(cp, LOWER_RANGES);
const isDigitCp = (cp: number) => cp >= 0x30 && cp <= 0x39;
const isLetterCp = (cp: number) => inRanges(cp, LETTER_RANGES);
const isForbiddenCp = (cp: number) => inRanges(cp, FORBIDDEN_RANGES);

const isAllowedSymbol = (char: string) => ALLOWED_SYMBOLS.indexOf(char) !== -1;

export type PasswordCheckId = 'length' | 'upper' | 'lower' | 'digit' | 'special' | 'confirm';

export type PasswordCheck = {
  id: PasswordCheckId;
  label: string;
  ok: boolean;
  /** Los `required` son los que bloquean el envío; los demás puntúan. */
  required: boolean;
};

export type PasswordLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PasswordAssessment = {
  /** Verdadero si pasa todo lo obligatorio. */
  ok: boolean;
  checks: PasswordCheck[];
  /** Mensajes de error listos para pintar (vacío si `ok`). */
  problems: string[];
  /** 0..100 para la barra. */
  score: number;
  level: PasswordLevel;
  /** Code points (no unidades UTF-16): '😀😀😀😀😀😀😀😀' no pasa por larga. */
  length: number;
};

type PasswordSignals = {
  length: number;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
};

/**
 * Reglas obligatorias. Cada una trae su propio predicado a propósito: con una
 * lista de id's + un `switch` para evaluarlos, añadir 'digit' y olvidarse del
 * `case` dejaba la comprobación en `false` para SIEMPRE (contraseña imposible de
 * aceptar, y eso solo se ve en producción). Aquí es imposible: si hay regla,
 * hay test, y el tipo obliga.
 */
const REQUIRED: { id: PasswordCheckId; label: string; test: (s: PasswordSignals) => boolean }[] = [
  {
    id: 'length',
    label: `Al menos ${PASSWORD_MIN} caracteres`,
    test: (s) => s.length >= PASSWORD_MIN && s.length <= PASSWORD_MAX,
  },
  { id: 'upper', label: 'Al menos una mayúscula', test: (s) => s.hasUpper },
  { id: 'lower', label: 'Al menos una minúscula', test: (s) => s.hasLower },
  { id: 'digit', label: 'Al menos un número', test: (s) => s.hasDigit },
  { id: 'special', label: 'Al menos un símbolo', test: (s) => s.hasSymbol },
];

/** Mayor repetición de un mismo carácter, en unidades UTF-16 (basta para detectar 'aaa'). */
function longestRun(text: string): number {
  let best = 0;
  let run = 0;
  let previous = '';

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    run = char === previous ? run + 1 : 1;
    previous = char;
    if (run > best) best = run;
  }

  return best;
}

export function assessPassword(raw: string, confirm?: string): PasswordAssessment {
  const value = typeof raw === 'string' ? raw : '';
  const problems: string[] = [];

  let length = 0;
  let hasUpper = false;
  let hasLower = false;
  let hasDigit = false;
  let hasSymbol = false;
  let hasSpace = false;
  let badChar = false;
  let distinct = 0;

  const seen = new Set<string>();

  // Una sola pasada, sin backtracking y sin construir arrays intermedios.
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index) as number;
    const char = value.charAt(index);

    // Nos saltamos el bajo de un par sustituto: se cuenta con su alto.
    if (codePoint > 0xffff) {
      index += 1;
    }

    length += 1;

    if (!seen.has(char)) {
      seen.add(char);
      distinct += 1;
    }

    if (isForbiddenCp(codePoint)) {
      badChar = true;
      continue;
    }

    if (codePoint === 0x20) {
      hasSpace = true;
      continue;
    }

    if (isAllowedSymbol(char)) {
      hasSymbol = true;
      continue;
    }

    if (isDigitCp(codePoint)) {
      hasDigit = true;
      continue;
    }

    if (isUpperCp(codePoint)) {
      hasUpper = true;
      continue;
    }

    if (isLowerCp(codePoint)) {
      hasLower = true;
      continue;
    }

    // Letra con diacrítico o marca combinante: admitida si está en rango de letra.
    if (!isLetterCp(codePoint)) badChar = true;
  }

  if (length === 0) problems.push('Escribe una contraseña.');
  if (badChar) {
    problems.push('La contraseña tiene caracteres no permitidos (controles, invisibles o símbolos raros).');
  }
  if (length > 0 && length < PASSWORD_MIN) {
    problems.push(`Tiene ${length} caracteres; hacen falta al menos ${PASSWORD_MIN}.`);
  }
  if (length > PASSWORD_MAX) {
    problems.push(`Máximo ${PASSWORD_MAX} caracteres.`);
  }
  if (value !== value.trim()) {
    problems.push('Quita los espacios del principio y del final.');
  }
  if (hasSpace && value.trim().length === 0) {
    problems.push('La contraseña no puede ser solo espacios.');
  }
  if (distinct === 1 && length > 1) {
    problems.push('No uses siempre el mismo carácter.');
  }
  if (!hasUpper) problems.push('Añade al menos una mayúscula.');
  if (!hasLower) problems.push('Añade al menos una minúscula.');
  if (!hasSymbol) problems.push(`Añade al menos un símbolo (uno de ${ALLOWED_SYMBOLS}).`);

  const lowerValue = value.toLowerCase();
  if (DENYLIST.some((word) => lowerValue.indexOf(word) !== -1)) {
    problems.push('Esa contraseña es demasiado previsible; usa una frase distinta.');
  }

  const signals: PasswordSignals = { length, hasUpper, hasLower, hasDigit, hasSymbol };

  const checks: PasswordCheck[] = REQUIRED.map((rule) => ({
    id: rule.id,
    label: rule.label,
    required: true,
    ok: rule.test(signals),
  }));

  if (typeof confirm === 'string') {
    checks.push({
      id: 'confirm',
      label: 'Las dos contraseñas coinciden',
      ok: confirm === value,
      required: true,
    });
  }

  const requiredOk =
    length > 0 &&
    problems.length === 0 &&
    checks.every((check) => !check.required || check.ok);

  /* Puntuación. Calibrada para que los cuatro niveles tengan bandas anchas y
     separadas: con la fórmula anterior `fair` caía en un único valor (70) y
     cualquier contraseña con dígito lo saltaba directo a `good`. Aquí longitud
     pesa la mitad del total, y la variedad de caracteres y la penalización por
     repetición deciden el resto, así que `Aa1!Aa1!Aa1!Aa1!` no puede salir
     fuerte aunque tenga las cuatro clases. */
  let score = 0;

  if (length >= PASSWORD_MIN) score += 18;
  if (length >= 10) score += 8;
  if (length >= 12) score += 8;
  if (length >= 16) score += 10;
  if (length >= 20) score += 6;

  if (hasUpper && hasLower) score += 12;
  if (hasSymbol) score += 10;
  // OJO: antes había un `+5` por tener dígito. Al pasar el dígito a obligatorio,
  // ese bonus se lo lleva todo el mundo y la escala entera subía 5 puntos (fair se
  // leía como good sin ser mejor contraseña). El peso se lo lleva la longitud.
  if (length >= 14) score += 5;

  const diversity = length > 0 ? distinct / length : 0;
  if (diversity >= 0.75) score += 10;
  else if (diversity >= 0.55) score += 6;
  else if (diversity >= 0.35) score += 2;
  else score -= 12;

  const run = longestRun(value);
  if (run <= 2) score += 5;
  else if (run >= 4) score -= 8;

  if (hasSpace && length >= 15) score += 8;

  // Con el dígito obligatorio, la salida fácil es pegar un año al final
  // ('Caballo#2026'). No se rechaza —sería fricción sin ganar casi nada—, pero
  // la barra lo refleja, que es para lo que sirve la barra.
  if (/(19|20)[0-9]{2}$/.test(value)) score -= 4;
  if (/[0-9]{1,3}$/.test(value) && length <= 10) score -= 3;

  score = Math.max(0, Math.min(100, score));

  // Quien no cumple lo obligatorio no puntúa: se queda en débil pase lo que pase.
  if (!requiredOk) score = Math.min(score, 44);

  const level: PasswordLevel =
    length === 0
      ? 'empty'
      : !requiredOk || score < 55
        ? 'weak'
        : score >= 85
          ? 'strong'
          : score >= 70
            ? 'good'
            : 'fair';

  return { ok: requiredOk, checks, problems, score, level, length };
}

/** Etiqueta legible del nivel, para el texto de la barra. */
export const LEVEL_LABEL: Record<PasswordLevel, string> = {
  empty: 'sin contraseña',
  weak: 'débil',
  fair: 'aceptable',
  good: 'buena',
  strong: 'fuerte',
};
