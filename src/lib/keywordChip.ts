const PILL_CLASS =
  "inline-flex h-5 min-h-0 items-center rounded-full border px-2.5 text-xs font-semibold leading-none tracking-wide uppercase";

const CODED_ORDER = [
  "GUARDED HERO",
  "CHAMPION",
  "HERO",
  "INFANTRY",
  "CAVALRY",
  "MONSTER",
  "BEAST",
  "WAR MACHINE",
  "WIZARD",
  "PRIEST",
  "FLY",
] as const;

const COLOR_CLASS: Record<(typeof CODED_ORDER)[number], string> = {
  "GUARDED HERO": "border-illegal/40 bg-illegal-lit/40 text-illegal",
  CHAMPION: "border-steel/40 bg-steel/20 text-steel",
  HERO: "border-gold-deep/35 bg-gold-deep/18 text-gold-deep",
  INFANTRY: "border-olive/40 bg-olive/20 text-olive",
  CAVALRY: "border-aether/35 bg-aether/18 text-aether",
  MONSTER: "border-illegal/35 bg-illegal/18 text-illegal",
  BEAST: "border-legal/35 bg-legal/18 text-legal",
  "WAR MACHINE": "border-copper/40 bg-copper/20 text-copper",
  WIZARD: "border-arcane/40 bg-arcane/20 text-arcane",
  PRIEST: "border-sigmarite/45 bg-sigmarite/25 text-gold-deep",
  FLY: "border-sky/40 bg-sky/20 text-sky",
};

const DEFAULT_CLASS =
  "border-parchment-ink/15 bg-parchment-ink/8 text-parchment-ink";

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toUpperCase();
}

function codedKey(keyword: string): (typeof CODED_ORDER)[number] | undefined {
  const key = normalizeKeyword(keyword);
  return CODED_ORDER.find(
    (coded) =>
      key === coded ||
      key.startsWith(`${coded} `) ||
      key.startsWith(`${coded}(`),
  );
}

export function keywordChipClass(keyword: string): string {
  const coded = codedKey(keyword);
  const color = coded ? COLOR_CLASS[coded] : DEFAULT_CLASS;
  return `${PILL_CLASS} ${color}`;
}

function isWardKeyword(keyword: string): boolean {
  return /^WARD(\s*\(.+\))?$/i.test(keyword.trim());
}

/** Datasheet keyword pills: original labels, minus Ward (already a stat). */
export function datasheetKeywords(categories: string[]): string[] {
  return categories.filter((keyword) => !isWardKeyword(keyword));
}
