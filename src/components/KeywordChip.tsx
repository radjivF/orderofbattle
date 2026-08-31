import { datasheetKeywords, keywordChipClass } from "@/lib/keywordChip";

export function KeywordChip({ keyword }: { keyword: string }) {
  return <span className={keywordChipClass(keyword)}>{keyword}</span>;
}

export function KeywordChips({ categories }: { categories: string[] }) {
  const keywords = datasheetKeywords(categories);
  if (keywords.length === 0) {
    return null;
  }
  return (
    <section className="mt-5 flex items-start gap-x-2">
      <h3 className="mt-0.5 shrink-0 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        Keywords
      </h3>
      <ul
        aria-label="Keywords"
        className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
      >
        {keywords.map((keyword) => (
          <li key={keyword}>
            <KeywordChip keyword={keyword} />
          </li>
        ))}
      </ul>
    </section>
  );
}
