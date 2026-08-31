const PILL_CLASS =
  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase";

const CODED_ORDER = [
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

/** Battlefield roles plus Fly / Wizard / Priest, in display order. */
export function codedKeywords(categories: string[]): string[] {
  const present = new Set(
    categories
      .map(codedKey)
      .filter((keyword): keyword is (typeof CODED_ORDER)[number] =>
        Boolean(keyword),
      ),
  );
  return CODED_ORDER.filter((keyword) => present.has(keyword));
}
