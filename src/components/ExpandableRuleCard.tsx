"use client";

import type { MouseEvent, ReactNode } from "react";
import { RuleText } from "./RuleText";

type Props = {
  title?: string;
  kicker?: string;
  timing?: string;
  declare?: string;
  effect?: string;
  meta?: string;
  trailing?: ReactNode;
  nested?: boolean;
};

export function ExpandableRuleCard({
  title,
  kicker,
  timing,
  declare: declareText,
  effect,
  meta,
  trailing,
  nested = false,
}: Props) {
  const expandable = Boolean(declareText || effect || meta);
  const pad = nested ? "px-2.5 py-2.5" : "px-3 py-3";
  const shell = nested ? "rounded-lg" : "rounded-xl";
  const preview = effect || declareText;
  const previewLabel = effect ? "Effect · " : "Declare · ";

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        {kicker ? (
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            {kicker}
          </p>
        ) : null}
        {title ? (
          <p
            className={`font-serif text-lg leading-tight ${kicker ? "mt-1" : ""}`}
          >
            {title}
          </p>
        ) : null}
        {timing ? (
          <p className="mt-1 font-serif text-base leading-snug text-parchment-ink">
            {timing}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        {expandable ? <CollapseChevron /> : null}
      </div>
    </div>
  );

  if (!expandable) {
    return (
      <article className={`w-full ${shell} bg-parchment-ink/5 ${pad} text-left`}>
        {header}
      </article>
    );
  }

  return (
    <details
      className={`group w-full ${shell} bg-parchment-ink/5 open:bg-parchment-ink/[0.07]`}
    >
      <summary
        className={`cursor-pointer list-none ${pad} [&::-webkit-details-marker]:hidden`}
      >
        {header}
        {preview ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-parchment-ink/75 group-open:hidden">
            <span className="text-sheet-muted">{previewLabel}</span>
            {preview}
          </p>
        ) : null}
      </summary>
      <div
        className={`border-t border-parchment-ink/10 ${nested ? "px-2.5" : "px-3"} pb-3 pt-2`}
        onClick={collapseDetails}
      >
        {meta ? (
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            {meta}
          </p>
        ) : null}
        {declareText ? (
          <RuleText
            text={declareText}
            label="Declare · "
            className="mt-2 text-sm"
          />
        ) : null}
        {effect ? (
          <RuleText
            text={effect}
            label="Effect · "
            className={declareText ? "mt-1 text-sm" : "mt-2 text-sm"}
          />
        ) : null}
      </div>
    </details>
  );
}

function collapseDetails(event: MouseEvent<HTMLDivElement>) {
  const details = event.currentTarget.closest("details");
  if (details) {
    details.open = false;
  }
}

function CollapseChevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-sheet-muted transition-transform duration-200 group-open:rotate-180"
    >
      <path
        d="M5 8l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
