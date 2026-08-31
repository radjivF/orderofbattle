"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBattleplanLayout } from "@/engine/battleplanLayout";
import { battleTactics } from "@/engine/data/load";
import {
  advanceTacticStage,
  canSetFirstPlayer,
  isDoubleTurn,
  matchTotal,
  setRoundFirstPlayer,
  setRoundVp,
  underdog,
  type BattlePlayer,
  type GameSession,
} from "@/engine/gameSession";
import {
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { deleteGame, getGame, saveGame } from "@/lib/gameStorage";
import { BattleplanBoard } from "./BattleplanBoard";
import { BattleRecordTacticTracker } from "./BattleRecordTacticTracker";
import { ExpandableRuleCard } from "./ExpandableRuleCard";
import { IosNavBackButton } from "./ios/IosNavIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { SiteFooter } from "./SiteFooter";

type Props = { gameId: string };

export function BattleRecordGameScreen({ gameId }: Props) {
  const router = useRouter();
  const [game, setGame] = useState<GameSession | null | undefined>(undefined);
  const [roundIndex, setRoundIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getGame(gameId).then((found) => {
      if (!cancelled) setGame(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const layout = useMemo(
    () => (game ? getBattleplanLayout(game.battleplanId) : undefined),
    [game],
  );

  const yourCards = useMemo(() => {
    if (!game) return [];
    return game.yourTacticCardIds
      .map((id) => battleTactics.find((card) => card.id === id))
      .filter((card): card is NonNullable<typeof card> => Boolean(card));
  }, [game]);

  const opponentCards = useMemo(() => {
    if (!game) return [];
    return game.opponentTacticCardIds
      .map((id) => battleTactics.find((card) => card.id === id))
      .filter((card): card is NonNullable<typeof card> => Boolean(card));
  }, [game]);

  async function commit(next: GameSession) {
    setGame(next);
    await saveGame(next);
  }

  if (game === undefined) {
    return (
      <p className="p-8 text-center text-parchment/70" role="status">
        Loading battle…
      </p>
    );
  }

  if (game === null) {
    return (
      <div className="p-8 text-center text-parchment">
        <p>Battle not found.</p>
        <button
          type="button"
          className={`${SHEET_SECONDARY_BUTTON_CLASS} mt-4`}
          onClick={() => router.push("/battle-record")}
        >
          Back to Battle record
        </button>
      </div>
    );
  }

  const round = game.rounds[roundIndex]!;
  const dog = underdog(game);
  const double = isDoubleTurn(game, roundIndex);

  return (
    <div className="relative z-10 min-h-full text-parchment">
      <div className="mx-auto w-full max-w-3xl px-5 pt-2 pb-3 sm:px-6">
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavBackButton
            label="Back to Battle record"
            onClick={() => router.push("/battle-record")}
          />
          <h1 className={LIBRARY_TITLE_CLASS}>
            {game.yourName} vs {game.opponentName}
          </h1>
          <span className="w-10" aria-hidden="true" />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 pb-24 sm:px-6">
        <section className="rounded-2xl bg-ink-raised px-4 py-4 ring-1 ring-parchment/12">
          <div className="flex items-end justify-between gap-4">
            <ScoreBlock
              name={game.yourName}
              total={matchTotal(game, "you")}
              underdog={dog === "you"}
            />
            <p className="pb-1 text-sm text-parchment/50">vs</p>
            <ScoreBlock
              name={game.opponentName}
              total={matchTotal(game, "opponent")}
              underdog={dog === "opponent"}
              align="right"
            />
          </div>
        </section>

        <div>
          <IosSegmentedControl
            ariaLabel="Battle round"
            value={String(roundIndex)}
            onChange={(next) => setRoundIndex(Number(next))}
            options={[0, 1, 2, 3, 4].map((index) => ({
              value: String(index),
              label: `T${index + 1}`,
            }))}
          />
        </div>

        <section className="rounded-2xl bg-ink-raised px-4 py-4 ring-1 ring-parchment/12">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl">Turn {roundIndex + 1}</h2>
            {double ? (
              <span className="rounded-full bg-sigmarite/25 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-parchment">
                Double turn
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-parchment/65">Who went first</p>
          <div className="mt-2 flex gap-2">
            {(["you", "opponent"] as BattlePlayer[]).map((player) => {
              const allowed = canSetFirstPlayer(game, roundIndex, player);
              const selected = round.firstPlayer === player;
              return (
                <button
                  key={player}
                  type="button"
                  disabled={!allowed && !selected}
                  onClick={() =>
                    void commit(setRoundFirstPlayer(game, roundIndex, player))
                  }
                  className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-medium ring-1 ${
                    selected
                      ? "bg-aether/25 ring-aether/50"
                      : "bg-parchment/5 ring-parchment/15"
                  } ${!allowed && !selected ? "opacity-40" : ""}`}
                >
                  {player === "you" ? game.yourName : game.opponentName}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <VpStepper
              label={game.yourName}
              value={round.yourVp}
              onChange={(vp) =>
                void commit(setRoundVp(game, roundIndex, "you", vp))
              }
            />
            <VpStepper
              label={game.opponentName}
              value={round.opponentVp}
              onChange={(vp) =>
                void commit(setRoundVp(game, roundIndex, "opponent", vp))
              }
            />
          </div>
        </section>

        {layout ? (
          <section className="rounded-2xl bg-ink-raised px-4 py-4 ring-1 ring-parchment/12">
            <h2 className="font-serif text-xl">{layout.name}</h2>
            <p className="mt-1 text-xs text-parchment/55">
              Table {layout.table} · schematic
            </p>
            <div className="mt-3 overflow-hidden rounded-xl bg-parchment/5 p-3">
              <BattleplanBoard layout={layout} />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <ExpandableRuleCard kicker="Twist" title={layout.twistTitle} />
              {layout.primaryScoring.map((line) => (
                <ExpandableRuleCard
                  key={line}
                  kicker="Primary scoring"
                  title={line}
                  nested
                />
              ))}
            </div>
          </section>
        ) : null}

        <BattleRecordTacticTracker
          title={`${game.yourName} · tactics`}
          cards={yourCards}
          stages={game.yourTacticStage}
          onStageChange={(cardId, stage) =>
            void commit(advanceTacticStage(game, "you", cardId, stage))
          }
        />
        <BattleRecordTacticTracker
          title={`${game.opponentName} · tactics`}
          cards={opponentCards}
          stages={game.opponentTacticStage}
          onStageChange={(cardId, stage) =>
            void commit(advanceTacticStage(game, "opponent", cardId, stage))
          }
        />

        <button
          type="button"
          className={SHEET_SECONDARY_BUTTON_CLASS}
          onClick={() => {
            void deleteGame(game.id).then(() =>
              router.push("/battle-record"),
            );
          }}
        >
          Delete battle
        </button>
      </main>
      <SiteFooter showPitch={false} />
    </div>
  );
}

function ScoreBlock({
  name,
  total,
  underdog: isUnderdog,
  align = "left",
}: {
  name: string;
  total: number;
  underdog: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : ""}`}>
      <p className="truncate text-sm text-parchment/65">
        {name}
        {isUnderdog ? " · underdog" : ""}
      </p>
      <p className="font-serif text-4xl tabular-nums">{total}</p>
    </div>
  );
}

function VpStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (vp: number) => void;
}) {
  return (
    <div className="rounded-xl bg-parchment/5 px-3 py-3">
      <p className="truncate text-xs text-parchment/55">{label} VP</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label} VP`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex size-10 items-center justify-center rounded-full bg-ink-raised text-xl ring-1 ring-parchment/20"
        >
          −
        </button>
        <span className="font-serif text-3xl tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label} VP`}
          onClick={() => onChange(value + 1)}
          className="flex size-10 items-center justify-center rounded-full bg-ink-raised text-xl ring-1 ring-parchment/20"
        >
          +
        </button>
      </div>
    </div>
  );
}
