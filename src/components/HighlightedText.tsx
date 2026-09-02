import { Fragment } from "react";
import { highlightQueryParts } from "@/lib/highlightQuery";

export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query?: string;
}) {
  const parts = highlightQueryParts(text, query ?? "");
  return (
    <>
      {parts.map((part, index) =>
        part.hit ? (
          <mark
            key={index}
            className="rounded-sm bg-gold-deep/45 text-parchment-ink"
          >
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
