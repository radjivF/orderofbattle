"use client";

import type {
  ArmyList,
  BattleTacticCard,
  BattleTacticStage,
} from "@/engine/types";
import { battleTactics } from "@/engine/data/load";

type Props = {
  list: ArmyList;
  onStageChange: (cardId: string, stage: BattleTacticStage) => void;
};

const STAGES: { key: BattleTacticStage; label: string }[] = [
  { key: 1, label: "Affray" },
  { key: 2, label: "Strike" },
  { key: 3, label: "Domination" },
];

function stageText(card: BattleTacticCard, stage: BattleTacticStage): string {
  if (stage === 1) {
    return card.affray;
  }
  if (stage === 2) {
    return card.strike;
  }
  return card.domination;
}

export function BattleTacticTracker({ list, onStageChange }: Props) {
  const cards = (list.battleTacticCardIds ?? [])
    .map((id) => battleTactics.find((card) => card.id === id))
    .filter((card): card is BattleTacticCard => Boolean(card));

  if (cards.length === 0) {
    return null;
  }

  const summary = cards.map((card) => card.name).join(" · ");

  return (
    <details
      className="group min-w-0 rounded-2xl bg-ink-raised text-sm text-parchment/90 ring-1 ring-parchment/12 open:pb-3"
    >
      <summary
        className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden"
      >
        <span className="text-xs font-semibold tracking-wide uppercase text-parchment/60">
          Battle tactics
        </span>
        <span className="flex min-w-0 items-center gap-2 text-xs text-parchment/55">
          <span className="group-open:hidden truncate">{summary}</span>
          <span
            aria-hidden="true"
            className="shrink-0 transition group-open:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="border-t border-parchment/10 px-4 pt-3">
        <ul className="flex flex-col gap-4">
          {cards.map((card) => {
            const stage = list.battleTacticStage?.[card.id] ?? 0;
            return (
              <li key={card.id} className="flex flex-col gap-2">
                <p className="font-medium text-parchment">{card.name}</p>
                {card.setup ? (
                  <p className="text-xs leading-relaxed text-parchment/65">
                    {card.setup}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-2">
                  {STAGES.map(({ key, label }) => {
                    const done = stage >= key;
                    const next = stage + 1 === key;
                    const disabled = !done && !next;
                    const text = stageText(card, key);
                    return (
                      <li
                        key={key}
                        className={`rounded-lg px-3 py-2.5 ring-1 ${
                          done
                            ? "bg-aether/10 ring-aether/30"
                            : next
                              ? "bg-parchment/10 ring-parchment/20"
                              : "bg-parchment/5 ring-parchment/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold tracking-wide uppercase text-parchment/75">
                            {label}
                            {done ? (
                              <span className="ml-1.5 text-aether">✓</span>
                            ) : null}
                          </p>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              if (done) {
                                onStageChange(
                                  card.id,
                                  (key - 1) as BattleTacticStage,
                                );
                              } else if (next) {
                                onStageChange(card.id, key);
                              }
                            }}
                            className={`min-h-8 shrink-0 rounded-lg px-2.5 text-xs ${
                              done
                                ? "bg-aether/20 text-aether"
                                : next
                                  ? "bg-parchment/15 text-parchment"
                                  : "bg-parchment/5 text-parchment/35"
                            }`}
                          >
                            {done ? "Undo" : next ? "Done" : "—"}
                          </button>
                        </div>
                        {text ? (
                          <p className="mt-2 text-xs leading-relaxed text-parchment/80">
                            {text}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
