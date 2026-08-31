import { keywordChipClass } from "@/lib/keywordChip";

export function KeywordChip({ keyword }: { keyword: string }) {
  return <span className={keywordChipClass(keyword)}>{keyword}</span>;
}
