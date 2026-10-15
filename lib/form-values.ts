export function setNullValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
