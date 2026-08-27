"use client";

import { useEffect, useId, useState } from "react";
import {
  formatPoints,
  isStandardPointsCap,
  parsePointsCap,
  STANDARD_POINTS_CAPS,
} from "@/engine/pointsCap";

type Props = {
  value: number;
  onChange: (points: number) => void;
  variant?: "ink" | "parchment";
};

export function PointsCapField({
  value,
  onChange,
  variant = "ink",
}: Props) {
  const inputId = useId();
  const [draft, setDraft] = useState(String(value));
  const unusual = !isStandardPointsCap(value);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw: string) {
    const parsed = parsePointsCap(raw);
    if (parsed == null) {
      setDraft(String(value));
      return;
    }
    onChange(parsed);
    setDraft(String(parsed));
  }

  const ink = variant === "ink";
  const chipIdle = ink
    ? "bg-ink-raised text-parchment/85 ring-1 ring-parchment/15"
    : "bg-parchment-ink/5 text-parchment-ink";
  const warnClass = ink ? "text-sigmarite" : "text-sheet-muted";

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p
          className={`shrink-0 text-sm ${ink ? "text-parchment/80" : "text-sheet-muted"}`}
        >
          Points limit
        </p>
        {STANDARD_POINTS_CAPS.map((cap) => {
          const selected = value === cap;
          return (
            <button
              key={cap}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(cap)}
              className={`min-h-11 shrink-0 rounded-xl px-2.5 text-sm sm:px-3 ${
                selected ? "gold-plate font-semibold text-ink" : chipIdle
              }`}
            >
              {formatPoints(cap)}
            </button>
          );
        })}
        <label htmlFor={inputId} className="sr-only">
          Custom points limit
        </label>
        <input
          id={inputId}
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commit(event.currentTarget.value);
            }
          }}
          className={`min-h-11 w-[4.75rem] shrink-0 rounded-xl px-2 text-center outline-none sm:w-24 sm:px-3 ${
            ink
              ? "bg-parchment text-parchment-ink"
              : "bg-parchment-ink/5 text-parchment-ink"
          }`}
        />
      </div>
      {unusual ? (
        <p className={`text-xs leading-relaxed ${warnClass}`}>
          Unusual size. Usual matched play is 1,000 / 1,500 / 2,000 / 2,500 /
          3,000. Fine if that is what you want.
        </p>
      ) : null}
    </div>
  );
}
