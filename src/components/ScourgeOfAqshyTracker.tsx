"use client";

import { useState } from "react";
import type { BattlePlayer, GameSession } from "@/engine/gameSession";
import {
  IOS_LIQUID_CTA_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";

type Props = {
  game: GameSession;
  roundIndex: number;
  onChangeFury: (player: BattlePlayer, fury: number) => void;
  onChangeRage: (player: BattlePlayer, rage: number) => void;
  onSetAttacker: (player: BattlePlayer) => void;
};

export function ScourgeOfAqshyTracker({
  game,
  roundIndex,
  onChangeFury,
  onChangeRage,
  onSetAttacker,
}: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<BattlePlayer | null>(null);
  const [erupting, setErupting] = useState(false);

  const round = game.rounds[roundIndex];
  if (!round) return null;

  const attacker = round.firstPlayer;
  const defender = attacker ? (attacker === "you" ? "opponent" : "you") : null;

  function adjustFury(player: BattlePlayer, delta: number) {
    const current = player === "you" ? game.yourFury : game.opponentFury;
    onChangeFury(player, Math.max(0, Math.min(7, current + delta)));
  }

  function adjustRage(player: BattlePlayer, delta: number) {
    const current = player === "you" ? round.yourRage : round.opponentRage;
    onChangeRage(player, Math.max(0, current + delta));
  }

  function spendEruption(player: BattlePlayer, amount: 1 | 2 | 3) {
    const currentRage = player === "you" ? round.yourRage : round.opponentRage;
    const spend = Math.min(amount, currentRage);
    onChangeRage(player, currentRage - spend);
    setErupting(false);
    setExpandedPlayer(null);
  }

  function spendFight(player: BattlePlayer) {
    const currentRage = player === "you" ? round.yourRage : round.opponentRage;
    const currentFury = player === "you" ? game.yourFury : game.opponentFury;
    if (currentRage >= 1) {
      onChangeRage(player, currentRage - 1);
      onChangeFury(player, Math.max(0, currentFury - 1));
    }
  }

  function renderPlayerColumn(player: BattlePlayer) {
    const isYou = player === "you";
    const name = isYou ? game.yourName : game.opponentName;
    const fury = isYou ? game.yourFury : game.opponentFury;
    const rage = isYou ? round.yourRage : round.opponentRage;
    const role =
      attacker === player ? "attacker" : defender === player ? "defender" : null;
    const isExpanded = expandedPlayer === player;

    return (
      <div className="flex-1 min-w-0">
        <p className="text-xs text-sheet-muted mb-2">
          {name}
          {role ? ` · ${role}` : ""}
        </p>
        
        {/* Fury row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-sheet-muted w-12">Fury</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i < fury
                    ? "bg-ember ring-1 ring-ember/30"
                    : "bg-parchment-ink/10"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold tabular-nums w-4">{fury}</span>
          <button
            type="button"
            onClick={() => adjustFury(player, -1)}
            disabled={fury <= 0}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-parchment-ink/5 text-xs font-semibold ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10 disabled:opacity-30"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => adjustFury(player, 1)}
            disabled={fury >= 7}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-parchment-ink/5 text-xs font-semibold ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10 disabled:opacity-30"
          >
            +
          </button>
        </div>

        {/* Rage row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpandedPlayer(isExpanded ? null : player)}
            className="pressable text-xs text-sheet-muted w-12 text-left"
          >
            Rage
          </button>
          <span className="text-sm font-semibold tabular-nums flex-1">{rage}</span>
          <span className="text-[10px] text-sheet-muted/60">this round</span>
          <button
            type="button"
            onClick={() => adjustRage(player, -1)}
            disabled={rage <= 0}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-parchment-ink/5 text-xs font-semibold ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10 disabled:opacity-30"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => adjustRage(player, 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-parchment-ink/5 text-xs font-semibold ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10"
          >
            +
          </button>
        </div>

        {/* Expanded spends */}
        {isExpanded && (
          <div className="mt-3 space-y-2 p-3 rounded-xl bg-parchment-ink/5 ring-1 ring-parchment-ink/10">
            {!erupting ? (
              <>
                <button
                  type="button"
                  onClick={() => setErupting(true)}
                  disabled={rage < 1}
                  className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-2 !text-xs disabled:opacity-40`}
                >
                  Eruption of Fury · spend 1–3
                </button>
                <button
                  type="button"
                  onClick={() => spendFight(player)}
                  disabled={rage < 1}
                  className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-2 !text-xs disabled:opacity-40`}
                >
                  Fight through pain · spend 1, fury −1
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedPlayer(null)}
                  className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-2 !text-xs`}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-parchment-ink/70">Spend how many?</p>
                <div className="grid grid-cols-3 gap-2">
                  {([1, 2, 3] as const).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => spendEruption(player, amount)}
                      disabled={rage < amount}
                      className={`${IOS_LIQUID_CTA_CLASS} !min-h-9 !text-sm disabled:opacity-40`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setErupting(false)}
                  className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-2 !text-xs`}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="parchment-card rounded-2xl px-4 py-4 text-parchment-ink">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
          Scourge of Aqshy
        </h3>
        {!game.furyInitialized && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onSetAttacker("you")}
              className="px-2 py-1 text-[10px] rounded bg-parchment-ink/5 ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10"
            >
              You = attacker
            </button>
            <button
              type="button"
              onClick={() => onSetAttacker("opponent")}
              className="px-2 py-1 text-[10px] rounded bg-parchment-ink/5 ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10"
            >
              Opp = attacker
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-4">
        {renderPlayerColumn("you")}
        <div className="w-px bg-parchment-ink/10 self-stretch" />
        {renderPlayerColumn("opponent")}
      </div>
    </section>
  );
}
