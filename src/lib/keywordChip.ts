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
  HERO: "border-gold-deep/20 bg-gold-deep/10 text-gold-deep",
  INFANTRY: "border-slate/25 bg-slate/12 text-slate",
  CAVALRY: "border-aether/20 bg-aether/10 text-aether",
  MONSTER: "border-illegal/20 bg-illegal/10 text-illegal",
  BEAST: "border-legal/20 bg-legal/10 text-legal",
  "WAR MACHINE": "border-steel/30 bg-steel/15 text-steel",
  WIZARD: "border-arcane/25 bg-arcane/12 text-arcane",
  PRIEST: "border-sigmarite/35 bg-sigmarite/15 text-gold-deep",
  FLY: "border-sky/25 bg-sky/12 text-sky",
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
