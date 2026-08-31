"use client";

import { useMemo } from "react";
import {
  battleplanLayouts,
  getBattleplanLayout,
} from "@/engine/battleplanLayout";
import { battleTacticsForRealm } from "@/engine/data/load";
import {
  canStartBattle,
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
} from "@/lib/builderUi";
import { BattleplanBoard } from "./BattleplanBoard";
import { ExpandableRuleCard } from "./ExpandableRuleCard";
import { IosNavBackButton } from "./ios/IosNavIconButton";
import { SiteFooter } from "./SiteFooter";

type Props = {
  game: GameSession;
  onChange: (next: GameSession) => void;
  onBack: () => void;
};

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";

function toggleCard(selected: string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((item) => item !== id);
  }
  if (selected.length >= 2) {
    return selected;
  }
  return [...selected, id];
}

export function BattleRecordSetupScreen({ game, onChange, onBack }: Props) {
  const aqshyCards = useMemo(() => battleTacticsForRealm("aqshy"), []);
  const layout = getBattleplanLayout(game.battleplanId);
  const ready = canStartBattle(game);

  return (
    <div className="relative z-10 min-h-full">
      <div className="mx-auto w-full max-w-3xl px-5 pt-2 pb-3 sm:px-6">
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavBackButton label="Back to Battle record" onClick={onBack} />
          <h1 className={LIBRARY_TITLE_CLASS}>Set up battle</h1>
          <span className="w-10" aria-hidden="true" />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pb-32 sm:px-6">
        <p className="text-sm text-parchment/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]">
          {game.yourName} ({game.yourArmy}) vs {game.opponentName} (
          {game.opponentArmy})
        </p>

        <section className={PANEL}>
          <h2 className="font-serif text-xl">Battleplan</h2>
          <p className="mt-1 text-sm text-sheet-muted">
            Scourge of Aqshy · GHB 2026–27
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {battleplanLayouts.map((plan) => {
              const selected = game.battleplanId === plan.id;
              return (
                <li key={plan.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange(setBattleplan(game, plan.id))}
                    className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left ring-1 ${
                      selected
                        ? "bg-aether/15 ring-aether/40"
                        : "bg-parchment-ink/5 ring-parchment-ink/10"
                    }`}
                  >
                    <span className="font-medium text-parchment-ink">
                      {plan.name}
                    </span>
                    <span className="text-xs text-sheet-muted">
                      Table {plan.table}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {layout ? (
          <section className={PANEL}>
            <h2 className="font-serif text-xl">{layout.name}</h2>
            <p className="mt-1 text-xs text-sheet-muted">
              Map schematic · not official art
            </p>
            <div className="mt-3 overflow-hidden rounded-xl bg-parchment-ink/5 p-3">
              <BattleplanBoard layout={layout} />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <ExpandableRuleCard
                kicker="Twist · underdog"
                title={layout.twistTitle}
                effect={layout.twistEffect}
              />
              {layout.primaryScoring.map((line, index) => (
                <ExpandableRuleCard
                  key={line}
                  kicker={`Primary point ${index + 1}`}
                  title={line}
                  nested
                />
              ))}
            </div>
          </section>
        ) : null}

        <TacticPick
          title={`${game.yourName} · battle tactics`}
          selected={game.yourTacticCardIds}
          cards={aqshyCards}
          onToggle={(id) =>
            onChange(
              setPlayerTacticCards(
                game,
                "you",
                toggleCard(game.yourTacticCardIds, id),
              ),
            )
          }
        />
        <TacticPick
          title={`${game.opponentName} · battle tactics`}
          selected={game.opponentTacticCardIds}
          cards={aqshyCards}
          onToggle={(id) =>
            onChange(
              setPlayerTacticCards(
                game,
                "opponent",
                toggleCard(game.opponentTacticCardIds, id),
              ),
            )
          }
        />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-parchment-ink/15 bg-[#efe6d2]/95 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:px-1">
          {!ready ? (
            <p className="text-center text-xs text-sheet-muted">
              Pick a battleplan and 2 tactics each to start
            </p>
          ) : null}
          <button
            type="button"
            disabled={!ready}
            onClick={() => onChange(startBattle(game))}
            className={IOS_LIQUID_CTA_CLASS}
          >
            Start game
          </button>
          <button
            type="button"
            onClick={onBack}
            className={SHEET_SECONDARY_BUTTON_CLASS}
          >
            Cancel
          </button>
        </div>
      </div>
      <SiteFooter showPitch={false} />
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
  return (
    <section className={PANEL}>
      <h2 className="font-serif text-xl">
        {title}{" "}
        <span className="text-base text-sheet-muted">
          ({selected.length}/2)
        </span>
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {cards.map((card) => {
          const checked = selected.includes(card.id);
          const disabled = !checked && selected.length >= 2;
          return (
            <li key={card.id}>
              <label
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 ring-1 ${
                  checked
                    ? "bg-aether/15 ring-aether/35"
                    : "bg-parchment-ink/5 ring-parchment-ink/10"
                } ${disabled ? "opacity-45" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(card.id)}
                  className="size-5 accent-aether"
                />
                <span className="font-medium text-parchment-ink">
                  {card.name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
