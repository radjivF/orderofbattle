import { codedKeywords, keywordChipClass } from "@/lib/keywordChip";

export function KeywordChip({ keyword }: { keyword: string }) {
  return <span className={keywordChipClass(keyword)}>{keyword}</span>;
}

export function UnitTypeChips({ categories }: { categories: string[] }) {
  const types = codedKeywords(categories);
  if (types.length === 0) {
    return null;
  }
  return (
    <ul
      aria-label="Unit type"
      className="mt-3 flex flex-wrap justify-center gap-1.5"
    >
      {types.map((keyword) => (
        <li key={keyword}>
          <KeywordChip keyword={keyword} />
        </li>
      ))}
    </ul>
  );
}
