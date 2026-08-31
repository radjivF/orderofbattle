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
    <section className="rounded-2xl bg-ink-raised text-sm text-parchment/90 ring-1 ring-parchment/12">
      <h3 className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-parchment/60">
        {title}
      </h3>
      <ul className="flex flex-col gap-4 border-t border-parchment/10 px-4 py-3">
        {cards.map((card) => {
          const stage = stages[card.id] ?? 0;
          return (
            <li key={card.id} className="flex flex-col gap-2">
              <p className="font-medium text-parchment">{card.name}</p>
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
                        aria-pressed={done}
                        onClick={() => {
                          if (done && stage === key) {
                            onStageChange(card.id, (key - 1) as BattleTacticStage);
                            return;
                          }
                          onStageChange(card.id, key);
                        }}
                        className={`flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left ring-1 ${
                          done
                            ? "bg-aether/20 ring-aether/40"
                            : next
                              ? "bg-parchment/5 ring-parchment/20"
                              : "bg-transparent ring-transparent opacity-45"
                        }`}
                      >
                        <span className="text-xs font-semibold tracking-wide uppercase text-parchment/55">
                          {label} · +5 VP
                        </span>
                        <BattleTacticText
                          text={stageText(card, key)}
                          className="text-sm text-parchment/85"
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
