"use client";

import type { MissionPrimaryPoint } from "@/engine/battleplanLayout";
import type { BattlePlayer, GameSession } from "@/engine/gameSession";
import type { BattleTacticCard, BattleTacticStage } from "@/engine/types";
import { useState } from "react";
import {
  IOS_LIQUID_CTA_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { BattleRecordTacticTracker } from "./BattleRecordTacticTracker";
import { IosUnderlineTabs } from "./ios/IosUnderlineTabs";

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
  game: GameSession;
  roundIndex: number;
  onChangeFury: (player: BattlePlayer, fury: number) => void;
  onChangeRage: (player: BattlePlayer, rage: number) => void;
  onChangeCp: (player: BattlePlayer, cp: number) => void;
  onSetAttacker: (attacker: BattlePlayer) => void;
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
  game,
  roundIndex,
  onChangeFury,
  onChangeRage,
  onChangeCp,
  onSetAttacker,
}: Props) {
  const order = turnPlayerOrder(firstPlayer);
  const playerName = activePlayer === "you" ? yourName : opponentName;
  const cards = activePlayer === "you" ? yourCards : opponentCards;
  const stages = activePlayer === "you" ? yourStages : opponentStages;
  const [erupting, setErupting] = useState(false);
  const [spendsExpanded, setSpendsExpanded] = useState(false);

  const round = game.rounds[roundIndex];
  const fury = activePlayer === "you" ? game.yourFury : game.opponentFury;
  const rage = round ? (activePlayer === "you" ? round.yourRage : round.opponentRage) : 0;
  const cp = round ? (activePlayer === "you" ? round.yourCp : round.opponentCp) : null;
  
  const attacker = round?.firstPlayer;
  const defender = attacker ? (attacker === "you" ? "opponent" : "you") : null;
  const role =
    attacker === activePlayer ? "attacker" : defender === activePlayer ? "defender" : null;

  function adjustFury(delta: number) {
    onChangeFury(activePlayer, Math.max(0, Math.min(7, fury + delta)));
  }

  function adjustRage(delta: number) {
    onChangeRage(activePlayer, Math.max(0, rage + delta));
  }

  function adjustCp(delta: number) {
    if (cp === null) return;
    onChangeCp(activePlayer, Math.max(0, Math.min(99, cp + delta)));
  }

  function spendEruption(amount: 1 | 2 | 3) {
    const spend = Math.min(amount, rage);
    onChangeRage(activePlayer, rage - spend);
    setErupting(false);
    setSpendsExpanded(false);
  }

  function spendFight() {
    if (rage >= 1) {
      onChangeRage(activePlayer, rage - 1);
      onChangeFury(activePlayer, Math.max(0, fury - 1));
    }
  }

  return (
    <section className="parchment-card rounded-2xl px-4 py-4 text-parchment-ink">
      <h2 className="font-serif text-xl">Score · {battleplanName}</h2>
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
        {/* 1. Fury + Rage + Command (Scourge of Aqshy / Show CP) */}
        {(showScourge || game.showCp) && round ? (
          <div className="mb-4 rounded-xl bg-parchment-ink/5 p-4 ring-1 ring-parchment-ink/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-parchment-ink">
                {playerName}
                {role ? (
                  <span className="ml-2 text-xs text-sheet-muted font-normal">
                    {role}
                  </span>
                ) : null}
              </p>
              {!game.furyInitialized && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSetAttacker("you")}
                    className="px-3 py-1.5 text-xs rounded bg-parchment-ink/5 ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10"
                  >
                    You = attacker
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetAttacker("opponent")}
                    className="px-3 py-1.5 text-xs rounded bg-parchment-ink/5 ring-1 ring-parchment-ink/10 hover:bg-parchment-ink/10"
                  >
                    Opp = attacker
                  </button>
                </div>
              )}
            </div>
            
            {/* Command row */}
            {game.showCp && cp !== null ? (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-sheet-muted w-12">Command</span>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ${
                        i < Math.min(cp, 7)
                          ? "bg-ember ring-1 ring-ember/30 shadow-sm"
                          : "bg-parchment-ink/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold tabular-nums">{cp}</span>
                  <span className="text-[11px] text-sheet-muted/70">this round</span>
                </div>
                <div className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustCp(-1)}
                    disabled={cp <= 0}
                    aria-label="Decrease command points"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment-ink/10 text-base font-semibold ring-1 ring-parchment-ink/20 hover:bg-parchment-ink/15 active:bg-parchment-ink/20 disabled:opacity-30"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustCp(1)}
                    disabled={cp >= 99}
                    aria-label="Increase command points"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment-ink/10 text-base font-semibold ring-1 ring-parchment-ink/20 hover:bg-parchment-ink/15 active:bg-parchment-ink/20 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : null}

            {showScourge ? (
              <>
            {/* Rage row */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setSpendsExpanded(!spendsExpanded)}
                className="pressable text-xs text-sheet-muted w-12 text-left min-h-11 flex items-center"
                aria-label="Toggle rage actions"
              >
                Rage
              </button>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tabular-nums">{rage}</span>
                <span className="text-[11px] text-sheet-muted/70">this round</span>
              </div>
              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustRage(-1)}
                  disabled={rage <= 0}
                  aria-label="Decrease rage"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment-ink/10 text-base font-semibold ring-1 ring-parchment-ink/20 hover:bg-parchment-ink/15 active:bg-parchment-ink/20 disabled:opacity-30"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => adjustRage(1)}
                  aria-label="Increase rage"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment-ink/10 text-base font-semibold ring-1 ring-parchment-ink/20 hover:bg-parchment-ink/15 active:bg-parchment-ink/20"
                >
                  +
                </button>
              </div>
            </div>

            {/* Expanded spends */}
            {spendsExpanded && (
              <div className="mt-4 space-y-2">
                {!erupting ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setErupting(true)}
                      disabled={rage < 1}
                      className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-3 !text-sm disabled:opacity-40`}
                    >
                      Eruption of Fury · spend 1–3
                    </button>
                    <button
                      type="button"
                      onClick={spendFight}
                      disabled={rage < 1}
                      className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-3 !text-sm disabled:opacity-40`}
                    >
                      Fight through pain · spend 1, fury −1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpendsExpanded(false)}
                      className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-3 !text-sm`}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-parchment-ink/70 mb-2">Spend how many?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([1, 2, 3] as const).map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => spendEruption(amount)}
                          disabled={rage < amount}
                          className={`${IOS_LIQUID_CTA_CLASS} !min-h-11 !text-base disabled:opacity-40`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setErupting(false)}
                      className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full !py-3 !text-sm`}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Fury row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-sheet-muted w-12">Fury</span>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${
                      i < fury
                        ? "bg-ember ring-1 ring-ember/30 shadow-sm"
                        : "bg-parchment-ink/10"
                    }`}
                  />
                ))}
              </div>
              <span className="text-base font-semibold tabular-nums w-6">{fury}</span>
              <div className="ml-auto flex gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustFury(-1)}
                  disabled={fury <= 0}
                  aria-label="Decrease fury"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment-ink/10 text-base font-semibold ring-1 ring-parchment-ink/20 hover:bg-parchment-ink/15 active:bg-parchment-ink/20 disabled:opacity-30"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => adjustFury(1)}
                  disabled={fury >= 7}
                  aria-label="Increase fury"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-parchment-ink/10 text-base font-semibold ring-1 ring-parchment-ink/20 hover:bg-parchment-ink/15 active:bg-parchment-ink/20 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
              </>
            ) : null}
          </div>
        ) : null}

        {/* 2. Primary points */}
        <details open className="group">
          <summary className="pressable cursor-pointer flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted mb-2">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-3 w-3 transition-transform group-open:rotate-90"
            >
              <path
                d="M7 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Primary objectives
          </summary>
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
        </details>

        {/* 3. Battle tactics */}
        {cards.length > 0 ? (
          <details open className="group mt-4">
            <summary className="pressable cursor-pointer flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted mb-2">
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-3 w-3 transition-transform group-open:rotate-90"
              >
                <path
                  d="M7 5l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Battle tactics
            </summary>
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
          </details>
        ) : null}
      </div>
    </section>
  );
}
