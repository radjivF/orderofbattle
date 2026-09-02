export type HighlightQueryPart = {
  text: string;
  hit: boolean;
};

/** Split `text` so the UI can wrap each case-insensitive phrase match. */
export function highlightQueryParts(
  text: string,
  query: string,
): HighlightQueryPart[] {
  const needle = query.trim();
  if (!needle) {
    return [{ text, hit: false }];
  }
  const haystack = text.toLowerCase();
  const find = needle.toLowerCase();
  if (!haystack.includes(find)) {
    return [{ text, hit: false }];
  }
  const parts: HighlightQueryPart[] = [];
  let cursor = 0;
  let index = haystack.indexOf(find, cursor);
  while (index !== -1) {
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), hit: false });
    }
    parts.push({
      text: text.slice(index, index + find.length),
      hit: true,
    });
    cursor = index + find.length;
    index = haystack.indexOf(find, cursor);
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), hit: false });
  }
  return parts;
}
