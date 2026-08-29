export type RuleTextBlock =
  | { kind: "prose"; text: string }
  | { kind: "bullets"; items: string[] };

/** Catalogue bullets and the common "In addition," follow-up clause. */
const SEGMENT_SPLIT =
  /\s*[•\u2022]\s*|(?<=\.)\s+(?=(?:In addition|Additionally|Also),)/i;

function splitSegments(text: string): string[] {
  return text
    .trim()
    .split(SEGMENT_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripConnectorPrefix(text: string): string {
  return text.replace(/^(?:In addition|Additionally|Also),\s+/i, "").trim();
}

function flattenBulletItems(segments: string[]): string[] {
  const items: string[] = [];
  for (const segment of segments) {
    const nested = splitSegments(segment);
    if (nested.length > 1) {
      if (nested[0]) {
        items.push(stripConnectorPrefix(nested[0]));
      }
      items.push(...flattenBulletItems(nested.slice(1)));
      continue;
    }
    items.push(stripConnectorPrefix(segment));
  }
  return items.filter(Boolean);
}

/** Split warscroll rule copy into lead prose and bullet items. */
export function parseRuleText(text: string): RuleTextBlock[] {
  const trimmed = text.trim();
  const segments = splitSegments(trimmed);
  if (segments.length === 0) {
    return [];
  }
  if (segments.length === 1) {
    return [{ kind: "prose", text: segments[0] }];
  }

  if (/^[•\u2022]/.test(trimmed)) {
    const items = flattenBulletItems(segments);
    return items.length > 0 ? [{ kind: "bullets", items }] : [];
  }

  const [lead, ...rest] = segments;
  const blocks: RuleTextBlock[] = [];
  if (lead) {
    blocks.push({ kind: "prose", text: lead });
  }

  const items = flattenBulletItems(rest);
  if (items.length > 0) {
    blocks.push({ kind: "bullets", items });
  }

  return blocks.length > 0 ? blocks : [{ kind: "prose", text: trimmed }];
}
