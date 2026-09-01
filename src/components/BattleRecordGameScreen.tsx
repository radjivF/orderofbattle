"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getBattleplanLayout,
  missionPrimaryPoints,
} from "@/engine/battleplanLayout";
import { battleTactics } from "@/engine/data/load";
import {
  advanceTacticStage,
  canSetFirstPlayer,
  finishBattle,
  isDoubleTurn,
  matchTotal,
  paintedBonus,
  reopenBattle,
  roundVpTotal,
  setPrimaryClaim,
  setRoundFirstPlayer,
  setTwistApplied,
  syncPrimaryVp,
  tacticVpTotal,
  underdog,
  type BattlePlayer,
  type GameSession,
} from "@/engine/gameSession";
import { isTowList } from "@/engine/storedList";
import type { ArmyList } from "@/engine/types";
import {
  IOS_LIQUID_CTA_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SCOREBOARD_PLAY_BUTTON_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { deleteGame, getGame, saveGame } from "@/lib/gameStorage";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import { BattleplanBoard } from "./BattleplanBoard";
import { BattleRecordPlaySheet } from "./BattleRecordPlaySheet";
import { BattleRecordRecapScreen } from "./BattleRecordRecapScreen";
import { BattleRecordSetupScreen } from "./BattleRecordSetupScreen";
import {
  BattleRecordTurnScore,
  turnPlayerOrder,
} from "./BattleRecordTurnScore";
import { IosNavBackButton } from "./ios/IosNavIconButton";
import { IosDatasheetIcon } from "./ios/SheetIconButton";
import { SiteFooter } from "./SiteFooter";

type Props = { gameId: string };

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";

export function BattleRecordGameScreen({ gameId }: Props) {
  const router = useRouter();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [game, setGame] = useState<GameSession | null | undefined>(undefined);
  const [roundIndex, setRoundIndex] = useState(0);
  const [editingSetup, setEditingSetup] = useState(false);
  const [playSide, setPlaySide] = useState<{
    listId: string;
    armyName: string;
    playerName: string;
  } | null>(null);
  const [turnTab, setTurnTab] = useState<BattlePlayer>("you");

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

  useEffect(() => {
    if (!game || primaryPoints.length === 0) {
      return;
    }
    const next = syncPrimaryVp(game, primaryPoints);
    if (next === game) {
      return;
    }
    void saveGame(next);
    setGame(next);
  }, [game, primaryPoints]);

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

  const firstPlayerOfRound =
    game != null && game.status === "active"
      ? (game.rounds[roundIndex]?.firstPlayer ?? null)
      : null;

  useEffect(() => {
    setTurnTab(turnPlayerOrder(firstPlayerOfRound)[0]!);
  }, [roundIndex, firstPlayerOfRound]);

  async function commit(
    next: GameSession | ((prev: GameSession) => GameSession),
  ) {
    setGame((prev) => {
      if (prev == null) {
        return prev;
      }
      const resolved = typeof next === "function" ? next(prev) : next;
      void saveGame(resolved);
      return resolved;
    });
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

  if (game.status === "setup" || editingSetup) {
    return (
      <BattleRecordSetupScreen
        game={game}
        editing={editingSetup}
        onChange={(next) => void commit(next)}
        onBack={() => {
          if (editingSetup) {
            setEditingSetup(false);
            return;
          }
          router.push("/battle-record");
        }}
      />
    );
  }

  if (game.status === "done") {
    return (
      <BattleRecordRecapScreen
        game={game}
        onBack={() => router.push("/battle-record")}
        onEdit={() => void commit((prev) => reopenBattle(prev))}
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
  const trackPriority = game.allowDoubleTurn;
  const yourPlayList = playableList(lists, game.yourListId, game.yourArmy);
  const opponentPlayList = playableList(
    lists,
    game.opponentListId,
    game.opponentArmy,
  );
  const playList = playSide
    ? playableList(lists, playSide.listId, playSide.armyName)
    : undefined;

  return (
    <div className="relative z-10 min-h-full">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pb-24 sm:px-6">
        <div className={`${LIBRARY_TITLE_ROW_CLASS} pt-2`}>
          <IosNavBackButton
            label="Back to Battle record"
            onClick={() => router.push("/battle-record")}
          />
          <h1 className={LIBRARY_TITLE_CLASS}>
            {game.yourName} vs {game.opponentName}
          </h1>
          <button
            type="button"
            onClick={() => setEditingSetup(true)}
            className="pressable inline-flex h-11 shrink-0 items-center text-sm font-medium text-parchment [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]"
          >
            Edit
          </button>
        </div>

        <section className={PANEL}>
          <div className="flex items-end justify-between gap-3">
            <ScoreBlock
              name={game.yourName}
              army={game.yourArmy}
              total={matchTotal(game, "you")}
              primary={roundVpTotal(game, "you")}
              tactics={tacticVpTotal(game, "you")}
              painted={paintedBonus(game, "you")}
              underdog={dog === "you"}
              onPlay={
                yourPlayList
                  ? () =>
                      setPlaySide({
                        listId: yourPlayList.id,
                        armyName: yourPlayList.name,
                        playerName: game.yourName,
                      })
                  : undefined
              }
            />
            <p className="pb-1 text-sm text-sheet-muted">vs</p>
            <ScoreBlock
              name={game.opponentName}
              army={game.opponentArmy}
              total={matchTotal(game, "opponent")}
              primary={roundVpTotal(game, "opponent")}
              tactics={tacticVpTotal(game, "opponent")}
              painted={paintedBonus(game, "opponent")}
              underdog={dog === "opponent"}
              align="right"
              onPlay={
                opponentPlayList
                  ? () =>
                      setPlaySide({
                        listId: opponentPlayList.id,
                        armyName: opponentPlayList.name,
                        playerName: game.opponentName,
                      })
                  : undefined
              }
            />
          </div>
        </section>

        <nav
          aria-label="Battle timeline"
          className="parchment-card rounded-2xl px-3 py-3"
        >
          <ol className="flex items-center gap-1 sm:gap-2">
            {[0, 1, 2, 3, 4].map((index) => {
              const selected = roundIndex === index;
              return (
                <li key={index} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    aria-current={selected ? "step" : undefined}
                    onClick={() => setRoundIndex(index)}
                    className={`min-h-10 w-full rounded-full px-1 text-sm font-semibold tabular-nums transition ${
                      selected
                        ? "bg-[#efe6d2] text-parchment-ink shadow-sm ring-1 ring-parchment-ink/20"
                        : "text-sheet-muted hover:text-parchment-ink"
                    }`}
                  >
                    T{index + 1}
                  </button>
                  <span
                    aria-hidden="true"
                    className="mx-0.5 hidden h-px flex-1 bg-parchment-ink/20 sm:block"
                  />
                </li>
              );
            })}
            <li className="shrink-0 pl-1">
              <button
                type="button"
                onClick={() => void commit((prev) => finishBattle(prev))}
                className={`${IOS_LIQUID_CTA_CLASS} !min-h-10 !w-auto !rounded-full !px-4 !text-sm`}
              >
                Done
              </button>
            </li>
          </ol>
        </nav>

        <section className={PANEL}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl">Turn {roundIndex + 1}</h2>
            {trackPriority && double ? (
              <span className="rounded-full bg-aether/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-aether ring-1 ring-aether/30">
                Double turn
              </span>
            ) : null}
          </div>

          {trackPriority ? (
            <>
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
                        void commit(
                          setRoundFirstPlayer(game, roundIndex, player),
                        )
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
            </>
          ) : null}

          <p className="mt-4 text-sm tabular-nums text-sheet-muted">
            Turn score · {game.yourName} {round.yourVp} · {game.opponentName}{" "}
            {round.opponentVp}
          </p>
        </section>

        {layout ? (
          <BattleRecordTurnScore
            battleplanName={layout.name}
            yourName={game.yourName}
            opponentName={game.opponentName}
            firstPlayer={round.firstPlayer}
            activePlayer={turnTab}
            onSelectPlayer={setTurnTab}
            primaryPoints={primaryPoints}
            claims={round.primaryClaims}
            onToggleClaim={(pointId, player) => {
              const claim = round.primaryClaims[pointId] ?? {
                you: false,
                opponent: false,
              };
              void commit(
                setPrimaryClaim(
                  game,
                  roundIndex,
                  pointId,
                  player,
                  player === "you" ? !claim.you : !claim.opponent,
                  primaryPoints,
                ),
              );
            }}
            yourCards={yourCards}
            opponentCards={opponentCards}
            yourStages={game.yourTacticStage}
            opponentStages={game.opponentTacticStage}
            onStageChange={(player, cardId, stage) =>
              void commit(advanceTacticStage(game, player, cardId, stage))
            }
          />
        ) : null}

        {layout ? (
          <section className={PANEL}>
            <p className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
              Twist · underdog
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-parchment-ink/85">
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

        {layout ? (
          <details className={PANEL}>
            <summary className="cursor-pointer font-serif text-lg">
              Battleplan map
            </summary>
            <div className="mt-3 overflow-hidden rounded-xl bg-parchment-ink/5 p-2">
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
      {playSide && playList ? (
        <BattleRecordPlaySheet
          list={playList}
          playerName={playSide.playerName}
          onClose={() => setPlaySide(null)}
        />
      ) : null}
    </div>
  );
}

function playableList(
  lists: ReturnType<typeof getArmiesSnapshot>,
  listId: string | undefined,
  armyName: string,
): ArmyList | undefined {
  const aos = (lists ?? []).filter(
    (item): item is ArmyList => !isTowList(item),
  );
  if (listId) {
    const byId = aos.find((item) => item.id === listId);
    if (byId) {
      return byId;
    }
  }
  const byName = aos.filter((item) => item.name === armyName);
  if (byName.length === 1) {
    return byName[0];
  }
  return undefined;
}

function ScoreBlock({
  name,
  army,
  total,
  primary,
  tactics,
  painted,
  underdog: isUnderdog,
  align = "left",
  onPlay,
}: {
  name: string;
  army: string;
  total: number;
  primary: number;
  tactics: number;
  painted: number;
  underdog: boolean;
  align?: "left" | "right";
  onPlay?: () => void;
}) {
  const extras =
    tactics > 0 || painted > 0
      ? [
          `${primary} primary`,
          tactics > 0 ? `${tactics} tactics` : null,
          painted > 0 ? `${painted} painted` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : ""}`}>
      {onPlay ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${name}`}
          className={`pressable flex min-h-11 min-w-0 max-w-full items-center gap-2 ${
            align === "right" ? "ml-auto" : ""
          }`}
        >
          <IosDatasheetIcon className={SCOREBOARD_PLAY_BUTTON_CLASS} />
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm text-sheet-muted">
              {name}
              {isUnderdog ? " · underdog" : ""}
            </span>
            <span className="block truncate text-xs text-sheet-muted/80">
              {army}
            </span>
          </span>
        </button>
      ) : (
        <>
          <p className="truncate text-sm text-sheet-muted">
            {name}
            {isUnderdog ? " · underdog" : ""}
          </p>
          <p className="truncate text-xs text-sheet-muted/80">{army}</p>
        </>
      )}
      <p
        className={`font-serif text-4xl tabular-nums text-parchment-ink ${
          onPlay && align !== "right" ? "ps-8" : ""
        }`}
      >
        {total}
      </p>
      {extras ? (
        <p
          className={`mt-0.5 truncate text-xs text-sheet-muted ${
            onPlay && align !== "right" ? "ps-8" : ""
          }`}
        >
          {extras}
        </p>
      ) : null}
    </div>
  );
}
