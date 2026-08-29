export type ParsedRuleText =
  | { kind: "prose"; text: string }
  | { kind: "list"; preface?: string; items: string[] };

/** Catalogue bullets and the common "In addition," follow-up clause. */
const SEGMENT_SPLIT =
  /\s*[•\u2022]\s*|(?<=\.)\s+(?=(?:In addition|Additionally|Also),)/i;

const CONNECTOR_SPLIT =
  /(?<=\.)\s+(?=(?:In addition|Additionally|Also),)/i;

const PICK_ONE =
  /pick (?:1|one) of the following(?:\s+\w+)?(?:\s+effects)?(?:\s+to apply[^:]*)?:?\s*/i;

function splitSegments(text: string): string[] {
  return text
    .trim()
    .split(SEGMENT_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripConnectorPrefix(text: string): string {
  const stripped = text
    .replace(/^(?:In addition|Additionally|Also),\s+/i, "")
    .trim();
  if (stripped !== text.trim() && stripped) {
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }
  return stripped;
}

function flattenBulletItems(segments: string[]): string[] {
  const items: string[] = [];
  for (const segment of segments) {
    const nested = splitSegments(segment);
    if (nested.length > 1) {
      if (nested[0] && !isIntroLead(nested[0])) {
        items.push(stripConnectorPrefix(nested[0]));
      } else if (nested[0] && isIntroLead(nested[0])) {
        items.push(...flattenBulletItems(nested.slice(1)));
        continue;
      }
      items.push(...flattenBulletItems(nested.slice(1)));
      continue;
    }
    items.push(stripConnectorPrefix(segment));
  }
  return items.filter(Boolean);
}

function isIntroLead(text: string): boolean {
  return /:\s*$/.test(text.trim());
}

/** Shared parser for "Pick 1 of the following" effects with named or bulleted options. */
export function parsePickOneChoices(
  text: string,
): { preface: string; items: string[] } | null {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  const pick = PICK_ONE.exec(normalized);
  if (!pick || pick.index === undefined) {
    return null;
  }

  const preface = normalized.slice(0, pick.index + pick[0].length).trim();
  const rest = normalized.slice(pick.index + pick[0].length).trim();
  if (!rest) {
    return null;
  }

  const named = [...rest.matchAll(/\*([^*]+)\*\s*:?\s*/g)];
  if (named.length >= 2) {
    const items: string[] = [];
    for (const [index, match] of named.entries()) {
      if (!match || match.index === undefined) {
        continue;
      }
      const title = (match[1]?.trim() ?? "").replace(/:+$/, "");
      const start = match.index + match[0].length;
      const end = named[index + 1]?.index ?? rest.length;
      const body = rest
        .slice(start, end)
        .replace(/^[•\u2022]\s*/, "")
        .trim()
        .replace(/\.\s*$/, "");
      items.push(body ? `${title}: ${body}` : title);
    }
    if (items.length >= 2) {
      return { preface, items };
    }
  }

  const parts = rest
    .split(/\s*[•\u2022]\s*/)
    .map((part) => part.trim().replace(/\.\s*$/, ""))
    .filter(Boolean);
  if (parts.length >= 2) {
    return { preface, items: parts };
  }

  return null;
}

/** Split warscroll declare/effect copy into prose or a labelled bullet list. */
export function parseRuleText(text: string): ParsedRuleText {
  const trimmed = text.trim();
  if (!trimmed) {
    return { kind: "prose", text: "" };
  }

  const pickOne = parsePickOneChoices(trimmed);
  if (pickOne) {
    return { kind: "list", preface: pickOne.preface, items: pickOne.items };
  }

  const segments = splitSegments(trimmed);
  if (segments.length <= 1) {
    return { kind: "prose", text: segments[0] ?? trimmed };
  }

  if (/^[•\u2022]/.test(trimmed)) {
    const items = flattenBulletItems(segments);
    return items.length > 0
      ? { kind: "list", items }
      : { kind: "prose", text: trimmed };
  }

  if (CONNECTOR_SPLIT.test(trimmed)) {
    const items = flattenBulletItems(segments);
    return items.length > 0
      ? { kind: "list", items }
      : { kind: "prose", text: trimmed };
  }

  const [lead, ...rest] = segments;
  if (lead && isIntroLead(lead) && rest.length > 0) {
    const items = flattenBulletItems(rest);
    return items.length > 0
      ? { kind: "list", preface: lead, items }
      : { kind: "prose", text: trimmed };
  }

  const items = flattenBulletItems(segments);
  if (items.length > 1) {
    return { kind: "list", items };
  }
  if (items.length === 1) {
    return { kind: "prose", text: items[0] };
  }

  return { kind: "prose", text: trimmed };
}

/** Bold a short option title before the first colon, when present. */
export function formatRuleListItem(text: string): {
  title?: string;
  body?: string;
  plain: string;
} {
  const colon = text.indexOf(": ");
  if (colon > 0 && colon < 48) {
    return {
      title: text.slice(0, colon),
      body: text.slice(colon + 2),
      plain: text,
    };
  }
  return { plain: text };
}
