/** Warscroll casting/chanting values are shown with a trailing + (e.g. 7+). */
export function formatCastValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.endsWith("+")) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed}+`;
  }
  return trimmed;
}

export function castValueLabel(value: string): string {
  const formatted = formatCastValue(value);
  return formatted ? `Cast ${formatted}` : "";
}

export function chantValueLabel(value: string): string {
  const formatted = formatCastValue(value);
  return formatted ? `Chant ${formatted}` : "";
}
