"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getBattleplanLayout,
  missionPrimaryPoints,
} from "@/engine/battleplanLayout";
import { battleTactics } from "@/engine/data/load";
import {
  advanceTacticStage,
  canSetFirstPlayer,
  isDoubleTurn,
  matchTotal,
  setPrimaryClaim,
  setRoundFirstPlayer,
  setTwistApplied,
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
import { BattleRecordSetupScreen } from "./BattleRecordSetupScreen";
import { BattleRecordTacticTracker } from "./BattleRecordTacticTracker";
import { IosNavBackButton } from "./ios/IosNavIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { SiteFooter } from "./SiteFooter";

type Props = { gameId: string };

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";

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

  const primaryPoints = useMemo(
    () => (layout ? missionPrimaryPoints(layout) : []),
    [layout],
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
      <p className="p-8 text-center text-parchment/80" role="status">
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
          className={`${SHEET_SECONDARY_BUTTON_CLASS} mx-auto mt-4 max-w-xs`}
          onClick={() => router.push("/battle-record")}
        >
          Back to Battle record
        </button>
      </div>
    );
  }

  if (game.status === "setup") {
    return (
      <BattleRecordSetupScreen
        game={game}
        onChange={(next) => void commit(next)}
        onBack={() => router.push("/battle-record")}
      />
    );
  }

  const round = game.rounds[roundIndex]!;
  const dog = underdog(game);
  const double = isDoubleTurn(game, roundIndex);
  const underdogName =
    dog === "you"
      ? game.yourName
      : dog === "opponent"
        ? game.opponentName
        : null;

  return (
    <div className="relative z-10 min-h-full">
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

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pb-24 sm:px-6">
        <section className={PANEL}>
          <div className="flex items-end justify-between gap-4">
            <ScoreBlock
              name={game.yourName}
              army={game.yourArmy}
              total={matchTotal(game, "you")}
              underdog={dog === "you"}
            />
            <p className="pb-1 text-sm text-sheet-muted">vs</p>
            <ScoreBlock
              name={game.opponentName}
              army={game.opponentArmy}
              total={matchTotal(game, "opponent")}
              underdog={dog === "opponent"}
              align="right"
            />
          </div>
        </section>

        <div className="parchment-card rounded-2xl p-2">
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

        <section className={PANEL}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl">Turn {roundIndex + 1}</h2>
            {double ? (
              <span className="rounded-full bg-aether/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-aether ring-1 ring-aether/30">
                Double turn
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-sheet-muted">Who went first</p>
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
                      ? "bg-aether/15 ring-aether/40 text-parchment-ink"
                      : "bg-parchment-ink/5 ring-parchment-ink/12 text-parchment-ink"
                  } ${!allowed && !selected ? "opacity-40" : ""}`}
                >
                  {player === "you" ? game.yourName : game.opponentName}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm tabular-nums text-sheet-muted">
            Turn score · {game.yourName} {round.yourVp} · {game.opponentName}{" "}
            {round.opponentVp}
          </p>
        </section>

        {layout ? (
          <section className={PANEL}>
            <h2 className="font-serif text-xl">Primary · {layout.name}</h2>
            <p className="mt-1 text-sm text-sheet-muted">
              Mark who scored each mission point this turn (+1 each).
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {primaryPoints.map((point, index) => {
                const claim = round.primaryClaims[point.id] ?? {
                  you: false,
                  opponent: false,
                };
                return (
                  <li
                    key={point.id}
                    className="rounded-xl bg-parchment-ink/5 px-3 py-3 ring-1 ring-parchment-ink/10"
                  >
                    <p className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
                      Point {index + 1}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-parchment-ink">
                      {point.label}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <ClaimButton
                        label={game.yourName}
                        pressed={claim.you}
                        onClick={() =>
                          void commit(
                            setPrimaryClaim(
                              game,
                              roundIndex,
                              point.id,
                              "you",
                              !claim.you,
                              primaryPoints,
                            ),
                          )
                        }
                      />
                      <ClaimButton
                        label={game.opponentName}
                        pressed={claim.opponent}
                        onClick={() =>
                          void commit(
                            setPrimaryClaim(
                              game,
                              roundIndex,
                              point.id,
                              "opponent",
                              !claim.opponent,
                              primaryPoints,
                            ),
                          )
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {layout ? (
          <section className={PANEL}>
            <p className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
              Twist · underdog
            </p>
            <h2 className="mt-1 font-serif text-xl">{layout.twistTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment-ink/85">
              {layout.twistEffect}
            </p>
            <p className="mt-3 text-sm text-sheet-muted">
              {underdogName
                ? `Assigned to ${underdogName} (underdog)`
                : "No underdog while scores are tied"}
            </p>
            <button
              type="button"
              disabled={!dog}
              aria-pressed={round.twistApplied}
              onClick={() =>
                void commit(
                  setTwistApplied(game, roundIndex, !round.twistApplied),
                )
              }
              className={`mt-3 min-h-11 w-full rounded-xl px-3 text-sm font-medium ring-1 ${
                round.twistApplied
                  ? "bg-aether/15 ring-aether/40 text-parchment-ink"
                  : "bg-parchment-ink/5 ring-parchment-ink/12 text-parchment-ink"
              } ${!dog ? "opacity-40" : ""}`}
            >
              {round.twistApplied
                ? "Twist applied this turn"
                : "Mark twist applied this turn"}
            </button>
          </section>
        ) : null}

        <BattleRecordTacticTracker
          title={`${game.yourName} · secondary (tactics)`}
          cards={yourCards}
          stages={game.yourTacticStage}
          onStageChange={(cardId, stage) =>
            void commit(advanceTacticStage(game, "you", cardId, stage))
          }
        />
        <BattleRecordTacticTracker
          title={`${game.opponentName} · secondary (tactics)`}
          cards={opponentCards}
          stages={game.opponentTacticStage}
          onStageChange={(cardId, stage) =>
            void commit(advanceTacticStage(game, "opponent", cardId, stage))
          }
        />

        {layout ? (
          <details className={PANEL}>
            <summary className="cursor-pointer font-serif text-lg">
              Board schematic
            </summary>
            <div className="mt-3 overflow-hidden rounded-xl bg-parchment-ink/5 p-3">
              <BattleplanBoard layout={layout} />
            </div>
          </details>
        ) : null}

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

function ClaimButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} scored this point`}
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-xl px-2 text-sm font-medium ring-1 ${
        pressed
          ? "bg-aether/15 ring-aether/40 text-parchment-ink"
          : "bg-[#efe6d2] ring-parchment-ink/15 text-parchment-ink"
      }`}
    >
      {pressed ? `✓ ${label}` : label}
    </button>
  );
}

function ScoreBlock({
  name,
  army,
  total,
  underdog: isUnderdog,
  align = "left",
}: {
  name: string;
  army: string;
  total: number;
  underdog: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : ""}`}>
      <p className="truncate text-sm text-sheet-muted">
        {name}
        {isUnderdog ? " · underdog" : ""}
      </p>
      <p className="truncate text-xs text-sheet-muted/80">{army}</p>
      <p className="font-serif text-4xl tabular-nums text-parchment-ink">
        {total}
      </p>
    </div>
  );
}
