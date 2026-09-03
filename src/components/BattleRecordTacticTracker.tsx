"use client";

import { useState } from "react";
import type { BattleTacticCard, BattleTacticStage } from "@/engine/types";
import { BattleTacticText } from "./BattleTacticText";

const STAGES: { key: BattleTacticStage; label: string }[] = [
  { key: 1, label: "Affray" },
  { key: 2, label: "Strike" },
  { key: 3, label: "Domination" },
];

function stageText(card: BattleTacticCard, stage: BattleTacticStage): string {
  if (stage === 1) return card.affray;
  if (stage === 2) return card.strike;
  return card.domination;
}

function stageActionLabel(
  label: string,
  done: boolean,
  next: boolean,
): string {
  if (done) return `Undo ${label}`;
  if (next) return `Mark ${label} done`;
  return `${label} locked`;
}

type Props = {
  title: string;
  cards: BattleTacticCard[];
  stages: Record<string, BattleTacticStage>;
  onStageChange: (cardId: string, stage: BattleTacticStage) => void;
  embedded?: boolean;
};

export function BattleRecordTacticTracker({
  title,
  cards,
  stages,
  onStageChange,
  embedded = false,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  if (cards.length === 0) return null;

  const list = (
    <ul
      className={
        embedded
          ? "mt-2 flex flex-col gap-3"
          : "flex flex-col gap-4 border-t border-parchment-ink/10 px-4 py-3"
      }
    >
      {cards.map((card) => {
        const stage = stages[card.id] ?? 0;
        return (
          <li key={card.id} className="flex flex-col gap-2">
            <p className="font-medium text-parchment-ink">{card.name}</p>
            <ul className="flex flex-col gap-2">
              {STAGES.map(({ key, label }) => {
                const done = stage >= key;
                const next = stage + 1 === key;
                const disabled = !done && !next;
                const openKey = `${card.id}:${key}`;
                const open = Boolean(expanded[openKey]);
                return (
                  <li
                    key={key}
                    className={`rounded-xl px-3 py-2 ring-1 ${
                      done
                        ? "bg-aether/15 ring-aether/35"
                        : next
                          ? "bg-parchment-ink/5 ring-parchment-ink/15"
                          : "bg-transparent ring-transparent opacity-45"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
                        {label} · +5 VP
                        {done ? (
                          <span className="ml-1.5 text-aether">✓</span>
                        ) : null}
                      </p>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-label={
                          open
                            ? `Hide ${label} details`
                            : `Show ${label} details`
                        }
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [openKey]: !prev[openKey],
                          }))
                        }
                        className="pressable shrink-0 rounded-lg p-1.5 text-sheet-muted hover:bg-parchment-ink/10 hover:text-parchment-ink"
                      >
                        <CollapseChevron open={open} />
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        aria-label={stageActionLabel(label, done, next)}
                        onClick={() => {
                          if (done) {
                            onStageChange(
                              card.id,
                              (key - 1) as BattleTacticStage,
                            );
                            return;
                          }
                          if (next) {
                            onStageChange(card.id, key);
                          }
                        }}
                        className={`min-h-8 shrink-0 rounded-lg px-2.5 py-1 text-xs disabled:cursor-default ${
                          done
                            ? "bg-aether/20 text-aether"
                            : next
                              ? "bg-parchment-ink/10 text-parchment-ink"
                              : "bg-parchment-ink/5 text-sheet-muted"
                        }`}
                      >
                        {done ? "✓ Undo" : next ? "Done" : "—"}
                      </button>
                    </div>
                    {open ? (
                      <BattleTacticText
                        text={stageText(card, key)}
                        tone="sheet"
                        className="mt-2 text-sm"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );

  if (embedded) {
    return <div>{list}</div>;
  }

  return (
    <section className="parchment-card rounded-2xl text-sm text-parchment-ink">
      <h3 className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        {title}
      </h3>
      {list}
    </section>
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
