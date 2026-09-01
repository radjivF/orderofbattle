"use client";

import { useMemo, useState } from "react";
import {
  battleplanLayouts,
  getBattleplanLayout,
} from "@/engine/battleplanLayout";
import { battleTacticsForRealm } from "@/engine/data/load";
import {
  battleSetupGaps,
  canStartBattle,
  patchBattleRecord,
  setBattleArmy,
  setBattleplan,
  setPlayerTacticCards,
  startBattle,
  type GameSession,
} from "@/engine/gameSession";
import {
  IOS_LIQUID_CTA_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
  SITE_COLUMN_CLASS,
} from "@/lib/builderUi";
import { BattleplanBoard } from "./BattleplanBoard";
import { BattleRecordMatchFields } from "./BattleRecordMatchFields";
import { BattleTacticText } from "./BattleTacticText";
import { IosNavBackButton } from "./ios/IosNavIconButton";

type Props = {
  game: GameSession;
  onChange: (next: GameSession | ((prev: GameSession) => GameSession)) => void;
  onBack: () => void;
  /** When true, return to the live game instead of starting it. */
  editing?: boolean;
};

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";
const SELECT_CLASS =
  "min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none";

function toggleCard(selected: string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((item) => item !== id);
  }
  if (selected.length >= 2) {
    return selected;
  }
  return [...selected, id];
}

function pickRandomBattleplanId(): string {
  const index = Math.floor(Math.random() * battleplanLayouts.length);
  return battleplanLayouts[index]!.id;
}

export function BattleRecordSetupScreen({
  game,
  onChange,
  onBack,
  editing = false,
}: Props) {
  const aqshyCards = useMemo(() => battleTacticsForRealm("aqshy"), []);
  const layout = getBattleplanLayout(game.battleplanId);
  const ready = canStartBattle(game);
  const gaps = battleSetupGaps(game);

  return (
    <div className="relative z-10 min-h-full">
      <div className={`${SITE_COLUMN_CLASS} pt-2 pb-3`}>
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavBackButton
            label={editing ? "Close setup" : "Back to Battle record"}
            onClick={onBack}
          />
          <h1 className={LIBRARY_TITLE_CLASS}>Set up battle</h1>
          <span className="w-10" aria-hidden="true" />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pb-20 sm:px-6">
        <section className={`${PANEL} flex flex-col gap-5`}>
          <h2 className="font-serif text-xl">Match</h2>
          <BattleRecordMatchFields
            values={{
              yourName: game.yourName,
              yourArmyLabel: game.yourArmy,
              opponentName: game.opponentName,
              opponentArmyLabel: game.opponentArmy,
              allowDoubleTurn: game.allowDoubleTurn,
              paintedYou: game.paintedYou,
              paintedOpponent: game.paintedOpponent,
            }}
            onYourName={(value) =>
              onChange((prev) => patchBattleRecord(prev, { yourName: value }))
            }
            onOpponentName={(value) =>
              onChange((prev) =>
                patchBattleRecord(prev, { opponentName: value }),
              )
            }
            onAllowDoubleTurn={(value) =>
              onChange((prev) =>
                patchBattleRecord(prev, { allowDoubleTurn: value }),
              )
            }
            onPaintedYou={(value) =>
              onChange((prev) =>
                patchBattleRecord(prev, { paintedYou: value }),
              )
            }
            onPaintedOpponent={(value) =>
              onChange((prev) =>
                patchBattleRecord(prev, { paintedOpponent: value }),
              )
            }
            onPickArmy={(side, pick) =>
              onChange((prev) => setBattleArmy(prev, side, pick))
            }
          />
        </section>

        <section className={PANEL}>
          <h2 className="font-serif text-xl">Battleplan</h2>
          <p className="mt-1 text-sm text-sheet-muted">
            Scourge of Aqshy · GHB 2026–27
          </p>
          <label className="mt-3 flex flex-col gap-2 text-base text-sheet-muted">
            Choose battleplan
            <select
              value={game.battleplanId}
              onChange={(event) => {
                const id = event.target.value;
                onChange((prev) => setBattleplan(prev, id));
              }}
              className={SELECT_CLASS}
            >
              <option value="">Choose battleplan…</option>
              <optgroup label="Table 1">
                {battleplanLayouts
                  .filter((plan) => plan.table === 1)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Table 2">
                {battleplanLayouts
                  .filter((plan) => plan.table === 2)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              onChange((prev) => setBattleplan(prev, pickRandomBattleplanId()))
            }
            className={`${SHEET_SECONDARY_BUTTON_CLASS} mt-3`}
          >
            Choose random
          </button>
        </section>

        {layout ? (
          <section className={PANEL}>
            <h2 className="font-serif text-xl">{layout.name}</h2>
            <p className="mt-1 text-xs text-sheet-muted">
              Temporary map reference — replace with generated art later
            </p>
            <div className="mt-3 overflow-hidden rounded-xl bg-parchment-ink/5 p-2">
              <BattleplanBoard layout={layout} />
            </div>
            <div className="mt-3 flex flex-col gap-4">
              <div className="rounded-lg bg-parchment-ink/5 px-3 py-3">
                <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                  Victory points
                </p>
                <p className="mt-1 text-xs text-sheet-muted">
                  Score at the end of each of your turns
                </p>
                <ol className="mt-2 list-decimal space-y-2 pl-5">
                  {layout.primaryScoring.map((line) => (
                    <li
                      key={line}
                      className="font-serif text-base leading-snug text-parchment-ink"
                    >
                      {line}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-lg bg-parchment-ink/5 px-3 py-3">
                <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                  Twist
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-parchment-ink">
                  {layout.twistEffect}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <TacticPick
          title={`${game.yourName} · battle tactics`}
          selected={game.yourTacticCardIds}
          cards={aqshyCards}
          onToggle={(id) =>
            onChange((prev) =>
              setPlayerTacticCards(
                prev,
                "you",
                toggleCard(prev.yourTacticCardIds, id),
              ),
            )
          }
        />
        <TacticPick
          title={`${game.opponentName} · battle tactics`}
          selected={game.opponentTacticCardIds}
          cards={aqshyCards}
          onToggle={(id) =>
            onChange((prev) =>
              setPlayerTacticCards(
                prev,
                "opponent",
                toggleCard(prev.opponentTacticCardIds, id),
              ),
            )
          }
        />

        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 pt-2">
          {editing ? (
            <button
              type="button"
              onClick={onBack}
              className={`${IOS_LIQUID_CTA_CLASS} w-full`}
            >
              Back to battle
            </button>
          ) : (
            <>
              {!ready ? (
                <p className="text-center text-xs text-parchment [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]">
                  Still need {gaps.join(", ")}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!ready}
                onClick={() => onChange((prev) => startBattle(prev))}
                className={`${IOS_LIQUID_CTA_CLASS} w-full disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Start game
              </button>
              <button
                type="button"
                onClick={onBack}
                className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full`}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TacticPick({
  title,
  selected,
  cards,
  onToggle,
}: {
  title: string;
  selected: string[];
  cards: ReturnType<typeof battleTacticsForRealm>;
  onToggle: (id: string) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

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
    <section className={PANEL}>
      <h2 className="font-serif text-xl">
        {title}{" "}
        <span className="text-base text-sheet-muted">
          ({selected.length}/2)
        </span>
      </h2>
      <p className="mt-1 text-xs text-sheet-muted">
        Optional — pick up to 2, or none. Use the arrow to read details.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {cards.map((card) => {
          const checked = selected.includes(card.id);
          const disabled = !checked && selected.length >= 2;
          const expanded = expandedIds.has(card.id);
          return (
            <li key={card.id}>
              <article
                className={`rounded-xl ring-1 ${
                  checked
                    ? "bg-aether/15 ring-aether/35"
                    : "bg-parchment-ink/5 ring-parchment-ink/10"
                } ${disabled ? "opacity-45" : ""}`}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <label
                    className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggle(card.id)}
                      className="size-5 shrink-0 accent-aether"
                    />
                    <span className="font-medium text-parchment-ink">
                      {card.name}
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
                    className="pressable shrink-0 rounded-lg p-1.5 text-sheet-muted hover:bg-parchment-ink/10 hover:text-parchment-ink"
                  >
                    <CollapseChevron open={expanded} />
                  </button>
                </div>
                {expanded ? (
                  <div className="flex flex-col gap-3 border-t border-parchment-ink/10 px-3 pb-3 pt-3">
                    {card.setup ? (
                      <p className="text-sm leading-relaxed text-parchment-ink/80">
                        {card.setup}
                      </p>
                    ) : null}
                    {card.affray ? (
                      <BattleTacticText
                        tone="sheet"
                        className="text-sm"
                        stage="Affray"
                        text={card.affray}
                      />
                    ) : null}
                    {card.strike ? (
                      <BattleTacticText
                        tone="sheet"
                        className="text-sm"
                        stage="Strike"
                        text={card.strike}
                      />
                    ) : null}
                    {card.domination ? (
                      <BattleTacticText
                        tone="sheet"
                        className="text-sm"
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
    </section>
  );
}

function CollapseChevron({ open }: { open: boolean }) {
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
