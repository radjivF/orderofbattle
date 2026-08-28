export type RuleTextBlock =
  | { kind: "prose"; text: string }
  | { kind: "bullets"; items: string[] };

const BULLET_SPLIT = /\s*[•\u2022]\s*/;

/** Split warscroll rule copy into lead prose and bullet items. */
export function parseRuleText(text: string): RuleTextBlock[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (!BULLET_SPLIT.test(trimmed)) {
    return [{ kind: "prose", text: trimmed }];
  }

  const parts = trimmed.split(BULLET_SPLIT);
  const lead = parts[0]?.trim() ?? "";
  const items = parts
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean);

  const blocks: RuleTextBlock[] = [];
  if (lead) {
    blocks.push({ kind: "prose", text: lead });
  }
  if (items.length > 0) {
    blocks.push({ kind: "bullets", items });
  }

  return blocks.length > 0 ? blocks : [{ kind: "prose", text: trimmed }];
}
