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
    <section className="mt-5">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        Keywords
      </h3>
      <ul aria-label="Keywords" className="mt-2 flex flex-wrap gap-1.5">
        {keywords.map((keyword) => (
          <li key={keyword}>
            <KeywordChip keyword={keyword} />
          </li>
        ))}
      </ul>
    </section>
  );
}
