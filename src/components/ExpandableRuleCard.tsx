"use client";

import { useState, type ReactNode } from "react";
import { HighlightedText } from "./HighlightedText";
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
  /** Reference lists: no resting fill, so 20+ rows read as a page not a stack of buttons. */
  flush?: boolean;
  open?: boolean;
  highlight?: string;
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
  flush = false,
  open: openProp,
  highlight,
}: Props) {
  const [toggled, setToggled] = useState(false);
  const expanded = openProp ?? toggled;
  const expandable = Boolean(declareText || effect || meta);
  const pad = nested ? "px-2.5 py-2.5" : "px-3 py-3";
  const shell = nested ? "rounded-lg" : "rounded-xl";
  const resting = flush ? "" : "bg-parchment-ink/5";
  /** Flush rows sit on hairline dividers, so an open one needs air to read as its own block. */
  const openGap = flush && expanded ? "my-2" : "";
  const bodyPad = flush ? "pt-3 pb-4" : "pt-2 pb-3";

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
            <HighlightedText text={title} query={highlight} />
          </p>
        ) : null}
        {timing ? (
          <p className="mt-1 font-serif text-base leading-snug text-parchment-ink">
            <HighlightedText text={timing} query={highlight} />
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        {expandable ? (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center">
            <CollapseChevron open={expanded} />
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!expandable) {
    return (
      <article className={`w-full ${shell} ${resting} ${pad} text-left`}>
        {header}
      </article>
    );
  }

  return (
    <div
      className={`w-full ${shell} ${resting} ${expanded ? "bg-parchment-ink/[0.07]" : ""} ${openGap}`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        className={`pressable w-full cursor-pointer ${pad} text-left`}
        onClick={() => {
          if (openProp !== undefined) {
            return;
          }
          setToggled((value) => !value);
        }}
      >
        {header}
      </button>
      {expanded ? (
        <div
          className={`border-t border-parchment-ink/10 ${nested ? "px-2.5" : "px-3"} ${bodyPad}`}
        >
          {meta ? (
            <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
              <HighlightedText text={meta} query={highlight} />
            </p>
          ) : null}
          {declareText ? (
            <RuleText
              text={declareText}
              label="Declare · "
              className="mt-2 text-sm"
              highlight={highlight}
            />
          ) : null}
          {effect ? (
            <RuleText
              text={effect}
              label="Effect · "
              className={declareText ? "mt-1 text-sm" : "mt-2 text-sm"}
              highlight={highlight}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CollapseChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-sheet-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
