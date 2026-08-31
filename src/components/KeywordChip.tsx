import { codedKeywords, keywordChipClass } from "@/lib/keywordChip";

export function KeywordChip({ keyword }: { keyword: string }) {
  return <span className={keywordChipClass(keyword)}>{keyword}</span>;
}

export function CodedKeywordChips({ categories }: { categories: string[] }) {
  const keywords = codedKeywords(categories);
  if (keywords.length === 0) {
    return null;
  }
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {keywords.map((keyword) => (
        <KeywordChip key={keyword} keyword={keyword} />
      ))}
    </span>
  );
}
