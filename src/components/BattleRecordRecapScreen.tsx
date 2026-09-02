"use client";

import { useMemo } from "react";
import { getBattleplanLayout } from "@/engine/battleplanLayout";
import { battleTactics } from "@/engine/data/load";
import {
  matchTotal,
  roundVpTotal,
  tacticVpTotal,
  type GameSession,
} from "@/engine/gameSession";
import type { BattleTacticCard, BattleTacticStage } from "@/engine/types";
import {
  IOS_LIQUID_CTA_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
  SITE_COLUMN_CLASS,
} from "@/lib/builderUi";
import {
  copyBattleRecap,
  downloadBattleRecapPng,
  shareBattleRecap,
} from "@/lib/battleRecapShare";
import { IosNavBackButton } from "./ios/IosNavIconButton";

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";
const TURN_HEADERS = ["1", "2", "3", "4", "5"] as const;
const STAGE_COLS: { key: BattleTacticStage; label: string }[] = [
  { key: 1, label: "Aff" },
  { key: 2, label: "Str" },
  { key: 3, label: "Dom" },
];
const MAX_TACTIC_VP = 30;

type Props = {
  game: GameSession;
  onBack: () => void;
  onEdit?: () => void;
};

export function BattleRecordRecapScreen({ game, onBack, onEdit }: Props) {
  const plan = getBattleplanLayout(game.battleplanId);
  const planName = plan?.name ?? "Battleplan";
  const maxPrimary = (plan?.primaryScoring.length ?? 0) * 5;
  const when = new Date(game.updatedAt).toLocaleString();
  const yourFinal = matchTotal(game, "you");
  const opponentFinal = matchTotal(game, "opponent");
  const yourCards = useMemo(
    () => cardsFor(game.yourTacticCardIds),
    [game.yourTacticCardIds],
  );
  const opponentCards = useMemo(
    () => cardsFor(game.opponentTacticCardIds),
    [game.opponentTacticCardIds],
  );

  return (
    <div className="relative z-10 min-h-full">
      <div className={`${SITE_COLUMN_CLASS} pt-2 pb-3`}>
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavBackButton label="Back to Battle record" onClick={onBack} />
          <h1 className={LIBRARY_TITLE_CLASS}>
            ({yourFinal} – {opponentFinal}) {game.yourName} vs{" "}
            {game.opponentName}
          </h1>
          <span className="h-11 w-11 shrink-0" aria-hidden="true" />
        </div>
      </div>

      <main className={`${SITE_COLUMN_CLASS} flex flex-col gap-4 pb-20`}>
        <section className={PANEL}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-sheet-muted">{when}</p>
              <p className="mt-2 font-serif text-xl leading-tight">
                {game.yourName} vs {game.opponentName}
              </p>
              <p className="mt-1 text-sm text-sheet-muted">
                {game.yourArmy} vs {game.opponentArmy}
              </p>
              <p className="mt-2 text-sm text-sheet-muted">
                Mission · {planName}
              </p>
            </div>
            <p className="shrink-0 text-right font-serif text-4xl tabular-nums tracking-tight">
              {yourFinal} – {opponentFinal}
            </p>
          </div>
        </section>

        <PlayerScorecard
          name={game.yourName}
          total={yourFinal}
          primaryTotal={roundVpTotal(game, "you")}
          maxPrimary={maxPrimary}
          tacticTotal={tacticVpTotal(game, "you")}
          missionName={planName}
          turnVp={game.rounds.map((round) => round.yourVp)}
          cards={yourCards}
          stages={game.yourTacticStage}
        />
        <PlayerScorecard
          name={game.opponentName}
          total={opponentFinal}
          primaryTotal={roundVpTotal(game, "opponent")}
          maxPrimary={maxPrimary}
          tacticTotal={tacticVpTotal(game, "opponent")}
          missionName={planName}
          turnVp={game.rounds.map((round) => round.opponentVp)}
          cards={opponentCards}
          stages={game.opponentTacticStage}
        />

        <div className="mx-auto flex w-full max-w-md flex-col gap-2">
          {onEdit ? (
            <button
              type="button"
              className={IOS_LIQUID_CTA_CLASS}
              onClick={onEdit}
            >
              Edit battle
            </button>
          ) : null}
          <button
            type="button"
            className={onEdit ? SHEET_SECONDARY_BUTTON_CLASS : IOS_LIQUID_CTA_CLASS}
            onClick={() => void shareBattleRecap(game, planName)}
          >
            Share
          </button>
          <button
            type="button"
            className={SHEET_SECONDARY_BUTTON_CLASS}
            onClick={() => void copyBattleRecap(game, planName)}
          >
            Copy result
          </button>
          <button
            type="button"
            className={SHEET_SECONDARY_BUTTON_CLASS}
            onClick={() => downloadBattleRecapPng(game, planName)}
          >
            Save picture
          </button>
        </div>
      </main>
    </div>
  );
}

function PlayerScorecard({
  name,
  total,
  primaryTotal,
  maxPrimary,
  tacticTotal,
  missionName,
  turnVp,
  cards,
  stages,
}: {
  name: string;
  total: number;
  primaryTotal: number;
  maxPrimary: number;
  tacticTotal: number;
  missionName: string;
  turnVp: number[];
  cards: BattleTacticCard[];
  stages: Record<string, BattleTacticStage>;
}) {
  return (
    <section className={PANEL}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl">{name}</h2>
        <span className="rounded-lg bg-aether/15 px-2.5 py-1 text-sm font-semibold tabular-nums text-aether ring-1 ring-aether/30">
          {total} VP
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-parchment-ink/10">
        <SectionHead
          label="Primary mission"
          value={`${primaryTotal}/${maxPrimary || "–"}`}
        />
        <div
          className="grid gap-px bg-parchment-ink/10 text-center text-xs"
          style={{
            gridTemplateColumns: "minmax(0,1.5fr) repeat(5, minmax(0,1fr))",
          }}
        >
          <div className="bg-[#efe6d2] px-2 py-2 text-left text-[10px] font-semibold tracking-wide uppercase text-sheet-muted">
            Mission
          </div>
          {TURN_HEADERS.map((turn) => (
            <div
              key={turn}
              className="bg-parchment-ink/[0.04] px-1 py-1 text-[10px] font-semibold tracking-wide text-sheet-muted"
            >
              T{turn}
            </div>
          ))}
          <div className="bg-[#efe6d2] px-2 py-2.5 text-left text-sm font-medium leading-snug text-parchment-ink">
            {missionName}
          </div>
          {turnVp.map((vp, index) => (
            <ScoreCell key={index} value={vp} />
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-parchment-ink/10">
        <SectionHead
          label="Battle tactics"
          value={`${tacticTotal}/${MAX_TACTIC_VP}`}
        />
        {cards.length === 0 ? (
          <p className="bg-[#efe6d2] px-3 py-3 text-sm text-sheet-muted">
            No tactics chosen
          </p>
        ) : (
          <div
            className="grid gap-px bg-parchment-ink/10 text-center text-xs"
            style={{
              gridTemplateColumns: "minmax(0,1.5fr) repeat(3, minmax(0,1fr))",
            }}
          >
            <div className="bg-parchment-ink/[0.04] px-2 py-1 text-left text-[10px] font-semibold tracking-wide uppercase text-sheet-muted">
              Card
            </div>
            {STAGE_COLS.map((col) => (
              <div
                key={col.key}
                className="bg-parchment-ink/[0.04] px-1 py-1 text-[10px] font-semibold tracking-wide uppercase text-sheet-muted"
              >
                {col.label}
              </div>
            ))}
            {cards.map((card) => {
              const stage = stages[card.id] ?? 0;
              return (
                <div key={card.id} className="contents">
                  <div className="bg-[#efe6d2] px-2 py-2.5 text-left text-sm font-medium leading-snug text-parchment-ink">
                    {card.name}
                  </div>
                  {STAGE_COLS.map((col) => (
                    <ScoreCell
                      key={col.key}
                      value={stage >= col.key ? 5 : null}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHead({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-parchment-ink/[0.06] px-3 py-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ScoreCell({ value }: { value: number | null }) {
  const empty = value === null;
  return (
    <div
      className={`flex min-h-10 items-center justify-center px-1 py-2 tabular-nums ${
        empty || value === 0
          ? "bg-[#efe6d2] text-sheet-muted/70"
          : "bg-aether/12 font-semibold text-parchment-ink"
      }`}
    >
      {empty ? "–" : value}
    </div>
  );
}

function cardsFor(ids: string[]): BattleTacticCard[] {
  return ids
    .map((id) => battleTactics.find((card) => card.id === id))
    .filter((card): card is BattleTacticCard => Boolean(card));
}
