export function splitBattleTacticText(text: string): {
  name: string;
  body: string;
} {
  const trimmed = text.trim();
  const separator = trimmed.indexOf(":");
  if (separator <= 0) {
    return { name: "", body: trimmed };
  }
  return {
    name: trimmed.slice(0, separator).trim(),
    body: trimmed.slice(separator + 1).trim(),
  };
}
