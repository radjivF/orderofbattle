"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  formatPoints,
  isStandardPointsCap,
  parsePointsCap,
  STANDARD_POINTS_CAPS,
} from "@/engine/pointsCap";
import { pointsCapInputClass } from "@/lib/builderUi";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";

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

  const segmentedValue = useMemo(() => {
    if (isStandardPointsCap(value)) {
      return String(value);
    }
    return "";
  }, [value]);

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
  const warnClass = ink ? "text-sigmarite" : "text-sheet-muted";
  const inputClass = pointsCapInputClass(variant);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p
        className={`text-sm ${ink ? "text-parchment/80" : "text-sheet-muted"}`}
      >
        Points limit
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <IosSegmentedControl
          ariaLabel="Standard points limits"
          scrollable
          size="sm"
          value={segmentedValue}
          onChange={(next) => onChange(Number(next))}
          options={STANDARD_POINTS_CAPS.map((cap) => ({
            value: String(cap),
            label: formatPoints(cap),
          }))}
          className="min-w-0 flex-1"
        />
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
          className={inputClass}
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
