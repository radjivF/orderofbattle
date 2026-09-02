"use client";

import { useState } from "react";
import { extraCoreKeywords, lookupCoreRule } from "@/engine/coreRules";
import {
  IOS_LIQUID_CTA_CLASS,
  SHEET_PANEL_COMPACT_CLASS,
} from "@/lib/builderUi";
import { datasheetKeywords, keywordChipClass } from "@/lib/keywordChip";
import { ModalFrame } from "./ModalFrame";

type KeywordUnit = {
  hero?: boolean;
  models?: number;
  categories?: string[];
};

export function KeywordChip({ keyword }: { keyword: string }) {
  const [open, setOpen] = useState(false);
  const rule = lookupCoreRule(keyword);
  const className = keywordChipClass(keyword);

  if (!rule) {
    return <span className={className}>{keyword}</span>;
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {keyword}
      </button>
      {open ? (
        <ModalFrame
          label={keyword}
          onClose={() => setOpen(false)}
          panelClassName={`${SHEET_PANEL_COMPACT_CLASS} p-5`}
        >
          <h2 className="font-serif text-2xl">{rule.name}</h2>
          <p className="mt-3 text-base leading-relaxed text-sheet-muted">
            {rule.effect}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`mt-5 ${IOS_LIQUID_CTA_CLASS}`}
          >
            Got it
          </button>
        </ModalFrame>
      ) : null}
    </>
  );
}

export function KeywordChips({
  categories,
  unit,
}: {
  categories: string[];
  unit?: KeywordUnit;
}) {
  const extras = unit ? extraCoreKeywords(unit) : [];
  const keywords = [...extras, ...datasheetKeywords(categories)];
  if (keywords.length === 0) {
    return null;
  }
  return (
    <section className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        Keywords
      </h3>
      {keywords.map((keyword) => (
        <KeywordChip key={keyword} keyword={keyword} />
      ))}
    </section>
  );
}
