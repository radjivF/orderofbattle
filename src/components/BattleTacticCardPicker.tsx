"use client";

import { useEffect, useState } from "react";
import { battleTactics } from "@/engine/data/load";
import type { ArmyList } from "@/engine/types";
import { BattleTacticText } from "./BattleTacticText";

export function BattleTacticCardPicker({
  list,
  cards,
  onCommit,
}: {
  list: ArmyList;
  cards: typeof battleTactics;
  onCommit: (next: ArmyList) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const cardKey = cards.map((card) => card.id).join("\0");

  useEffect(() => {
    setExpandedIds(new Set());
  }, [cardKey]);

  if (!list.scourgeRealm) {
    return (
      <p className="text-xs text-ink-muted">
        Choose Scourge of Aqshy or Scourge of Ghyran above first.
      </p>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  const selectedIds = list.battleTacticCardIds ?? [];

  function commitIds(ids: string[]) {
    const stage = { ...(list.battleTacticStage ?? {}) };
    for (const key of Object.keys(stage)) {
      if (!ids.includes(key)) {
        delete stage[key];
      }
    }
    onCommit({
      ...list,
      battleTacticCardIds: ids,
      battleTacticStage: stage,
    });
  }

  function toggleCard(cardId: string) {
    if (selectedIds.includes(cardId)) {
      commitIds(selectedIds.filter((id) => id !== cardId));
      return;
    }
    if (selectedIds.length >= 2) {
      return;
    }
    commitIds([...selectedIds, cardId]);
  }

  const atCap = selectedIds.length >= 2;

  function toggleExpanded(cardId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs text-ink-muted">
        {selectedIds.length === 0
          ? "Check up to 2 cards. Use the arrow to read details."
          : `${selectedIds.length} of 2 selected.`}
      </p>
      <ul className="flex flex-col gap-3">
        {cards.map((card) => {
          const pickIndex = selectedIds.indexOf(card.id);
          const picked = pickIndex >= 0;
          const disabled = !picked && atCap;
          const expanded = expandedIds.has(card.id);
          const shellClass = picked
            ? "bg-aether/15 ring-aether/40"
            : disabled
              ? "bg-parchment/5 ring-parchment/10 opacity-70"
              : "bg-parchment/5 ring-parchment/10";
          return (
            <li key={card.id}>
              <article
                className={`w-full rounded-xl ring-1 transition ${shellClass}`}
              >
                <div className="flex items-center gap-2 px-3 py-3">
                  <label
                    className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={picked}
                      disabled={disabled}
                      onChange={() => toggleCard(card.id)}
                      aria-label={`Select ${card.name}`}
                      className="size-5 shrink-0 accent-aether disabled:cursor-not-allowed"
                    />
                    <span
                      className={`min-w-0 flex-1 py-2 text-left text-xs leading-relaxed ${
                        picked
                          ? "text-parchment"
                          : disabled
                            ? "text-parchment/45"
                            : "text-parchment/80"
                      }`}
                    >
                      <span className="font-medium text-sm text-parchment">
                        {card.name}
                      </span>
                      {picked ? (
                        <span className="ml-2 text-aether">
                          Card {pickIndex + 1}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? `Hide ${card.name} details`
                        : `Show ${card.name} details`
                    }
                    onClick={() => toggleExpanded(card.id)}
                    className="pressable -mr-1 shrink-0 rounded-lg p-1.5 text-parchment/45 hover:bg-parchment/10 hover:text-parchment/70 min-h-11 flex items-center"
                  >
                    <BattleTacticCollapseChevron open={expanded} />
                  </button>
                </div>
                {expanded ? (
                  <div className="flex flex-col gap-4 border-t border-parchment/10 px-3 pb-4 pt-3">
                    {card.setup ? (
                      <p className="text-xs leading-6 text-parchment/65 sm:text-sm">
                        {card.setup}
                      </p>
                    ) : null}
                    {card.affray ? (
                      <BattleTacticText
                        className="text-sm sm:text-base"
                        stage="Affray"
                        text={card.affray}
                      />
                    ) : null}
                    {card.strike ? (
                      <BattleTacticText
                        className="text-sm sm:text-base"
                        stage="Strike"
                        text={card.strike}
                      />
                    ) : null}
                    {card.domination ? (
                      <BattleTacticText
                        className="text-sm sm:text-base"
                        stage="Domination"
                        text={card.domination}
                      />
                    ) : null}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BattleTacticCollapseChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
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
