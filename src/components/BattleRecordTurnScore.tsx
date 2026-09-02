"use client";

import type { MissionPrimaryPoint } from "@/engine/battleplanLayout";
import type { BattlePlayer } from "@/engine/gameSession";
import type { BattleTacticCard, BattleTacticStage } from "@/engine/types";
import { useState } from "react";
import { BattleRecordTacticTracker } from "./BattleRecordTacticTracker";
import { IosUnderlineTabs } from "./ios/IosUnderlineTabs";
import { ScourgeOfAqshyChip } from "./ScourgeOfAqshyChip";
import { ScourgeOfAqshySheet } from "./ScourgeOfAqshySheet";

export function turnPlayerOrder(
  firstPlayer: BattlePlayer | null,
): BattlePlayer[] {
  if (firstPlayer === "opponent") {
    return ["opponent", "you"];
  }
  return ["you", "opponent"];
}

type Props = {
  battleplanName: string;
  yourName: string;
  opponentName: string;
  firstPlayer: BattlePlayer | null;
  activePlayer: BattlePlayer;
  onSelectPlayer: (player: BattlePlayer) => void;
  primaryPoints: MissionPrimaryPoint[];
  claims: Record<string, { you: boolean; opponent: boolean }>;
  onToggleClaim: (pointId: string, player: BattlePlayer) => void;
  yourCards: BattleTacticCard[];
  opponentCards: BattleTacticCard[];
  yourStages: Record<string, BattleTacticStage>;
  opponentStages: Record<string, BattleTacticStage>;
  onStageChange: (
    player: BattlePlayer,
    cardId: string,
    stage: BattleTacticStage,
  ) => void;
  showScourge: boolean;
  yourFury: number;
  opponentFury: number;
  yourRage: number;
  opponentRage: number;
  onChangeFury: (player: BattlePlayer, fury: number) => void;
  onChangeRage: (player: BattlePlayer, rage: number) => void;
};

export function BattleRecordTurnScore({
  battleplanName,
  yourName,
  opponentName,
  firstPlayer,
  activePlayer,
  onSelectPlayer,
  primaryPoints,
  claims,
  onToggleClaim,
  yourCards,
  opponentCards,
  yourStages,
  opponentStages,
  onStageChange,
  showScourge,
  yourFury,
  opponentFury,
  yourRage,
  opponentRage,
  onChangeFury,
  onChangeRage,
}: Props) {
  const order = turnPlayerOrder(firstPlayer);
  const playerName = activePlayer === "you" ? yourName : opponentName;
  const cards = activePlayer === "you" ? yourCards : opponentCards;
  const stages = activePlayer === "you" ? yourStages : opponentStages;
  const [scourgeSheetOpen, setScourgeSheetOpen] = useState(false);

  const fury = activePlayer === "you" ? yourFury : opponentFury;
  const rage = activePlayer === "you" ? yourRage : opponentRage;

  return (
    <section className="parchment-card rounded-2xl px-4 py-4 text-parchment-ink">
      <h2 className="font-serif text-xl">Primary · {battleplanName}</h2>
      <IosUnderlineTabs
        variant="parchment"
        ariaLabel="Turn players"
        className="ios-tab-underline--spread mt-3"
        value={activePlayer}
        onChange={(next) => onSelectPlayer(next as BattlePlayer)}
        tabs={order.map((player) => ({
          value: player,
          label: player === "you" ? yourName : opponentName,
        }))}
      />
      <div role="tabpanel" className="mt-4">
        <ul className="flex flex-col gap-2">
          {primaryPoints.map((point, index) => {
            const claim = claims[point.id] ?? { you: false, opponent: false };
            const pressed =
              activePlayer === "you" ? claim.you : claim.opponent;
            return (
              <li key={point.id}>
                <button
                  type="button"
                  aria-label={`${playerName} scored point ${index + 1}`}
                  aria-pressed={pressed}
                  onClick={() => onToggleClaim(point.id, activePlayer)}
                  className={`flex min-h-11 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ${
                    pressed
                      ? "bg-aether/15 ring-aether/40 text-parchment-ink"
                      : "bg-parchment-ink/5 ring-parchment-ink/12 text-parchment-ink"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold tracking-wide uppercase text-sheet-muted">
                      Point {index + 1} · {point.vp} VP
                    </span>
                    <span className="mt-1 block text-sm leading-snug">
                      {point.label}
                    </span>
                  </span>
                  <span
                    className="w-4 shrink-0 pt-0.5 text-sm text-aether"
                    aria-hidden
                  >
                    {pressed ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {cards.length > 0 ? (
          <div className="mt-4">
            <BattleRecordTacticTracker
              key={activePlayer}
              embedded
              title={`${playerName} · secondary (tactics)`}
              cards={cards}
              stages={stages}
              onStageChange={(cardId, stage) =>
                onStageChange(activePlayer, cardId, stage)
              }
            />
          </div>
        ) : null}
        {showScourge ? (
          <div className="mt-4 flex justify-center">
            <ScourgeOfAqshyChip
              fury={fury}
              rage={rage}
              onClick={() => setScourgeSheetOpen(true)}
            />
          </div>
        ) : null}
      </div>
      {scourgeSheetOpen && showScourge ? (
        <ScourgeOfAqshySheet
          fury={fury}
          rage={rage}
          playerName={playerName}
          onChangeFury={(newFury) => onChangeFury(activePlayer, newFury)}
          onChangeRage={(newRage) => onChangeRage(activePlayer, newRage)}
          onClose={() => setScourgeSheetOpen(false)}
        />
      ) : null}
    </section>
  );
}
