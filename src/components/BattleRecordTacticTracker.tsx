"use client";

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

type Props = {
  title: string;
  cards: BattleTacticCard[];
  stages: Record<string, BattleTacticStage>;
  onStageChange: (cardId: string, stage: BattleTacticStage) => void;
};

export function BattleRecordTacticTracker({
  title,
  cards,
  stages,
  onStageChange,
}: Props) {
  if (cards.length === 0) return null;

  return (
    <section className="parchment-card rounded-2xl text-sm text-parchment-ink">
      <h3 className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        {title}
      </h3>
      <ul className="flex flex-col gap-4 border-t border-parchment-ink/10 px-4 py-3">
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
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        disabled={disabled}
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
                        className={`w-full rounded-xl px-3 py-2.5 text-left ring-1 transition-colors disabled:cursor-default ${
                          done
                            ? "bg-aether/15 ring-aether/35"
                            : next
                              ? "bg-parchment-ink/5 ring-parchment-ink/15"
                              : "bg-transparent ring-transparent opacity-45"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
                            {label} · +5 VP
                            {done ? (
                              <span className="ml-1.5 text-aether">✓</span>
                            ) : null}
                          </p>
                          <span
                            className={`min-h-8 shrink-0 rounded-lg px-2.5 py-1 text-xs ${
                              done
                                ? "bg-aether/20 text-aether"
                                : next
                                  ? "bg-parchment-ink/10 text-parchment-ink"
                                  : "bg-parchment-ink/5 text-sheet-muted"
                            }`}
                          >
                            {done ? "Undo" : next ? "Done" : "—"}
                          </span>
                        </div>
                        <BattleTacticText
                          text={stageText(card, key)}
                          tone="sheet"
                          className="mt-2 text-sm"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
