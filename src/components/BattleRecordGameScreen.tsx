"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  getBattleplanLayout,
  missionPrimaryPoints,
} from "@/engine/battleplanLayout";
import { battleTactics } from "@/engine/data/load";
import {
  advanceTacticStage,
  canSetFirstPlayer,
  finishBattle,
  grantRageForRound,
  initializeFury,
  isDoubleTurn,
  matchTotal,
  paintedBonus,
  reopenBattle,
  roundVpTotal,
  setFury,
  setPrimaryClaim,
  setRage,
  setRoundFirstPlayer,
  setTwistApplied,
  syncPrimaryVp,
  tacticVpTotal,
  underdog,
  usesScourgeOfAqshy,
  type BattlePlayer,
  type GameSession,
} from "@/engine/gameSession";
import { isTowList } from "@/engine/storedList";
import type { ArmyList } from "@/engine/types";
import {
  IOS_LIQUID_CTA_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  LIST_FLOW_SLIDE_MS,
  SCOREBOARD_PLAY_BUTTON_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
  SITE_COLUMN_CLASS,
} from "@/lib/builderUi";
import { deleteGame, getGame, saveGame } from "@/lib/gameStorage";
import { listFlowTrackClass } from "@/lib/listFlowNav";
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
import { IosNavBackButton, IosNavEditButton } from "./ios/IosNavIconButton";
import { IosDatasheetIcon } from "./ios/SheetIconButton";
import { useListNav } from "./IosNavSlide";
import { SiteFooter } from "./SiteFooter";

type Props = { gameId: string };

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";

export function BattleRecordGameScreen({ gameId }: Props) {
  const { goBack } = useListNav();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [game, setGame] = useState<GameSession | null | undefined>(undefined);
  const [roundIndex, setRoundIndex] = useState(0);
  const [editMounted, setEditMounted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSettled, setEditSettled] = useState(true);
  const editAnim = useRef<{ timers: number[]; rafs: number[] }>({
    timers: [],
    rafs: [],
  });
  const [playSide, setPlaySide] = useState<{
    listId: string;
    armyName: string;
    playerName: string;
  } | null>(null);
  const [turnTab, setTurnTab] = useState<BattlePlayer>("you");
  const prevStatusRef = useRef<GameSession["status"] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void getGame(gameId).then((found) => {
      if (!cancelled) setGame(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    return () => {
      for (const id of editAnim.current.timers) {
        window.clearTimeout(id);
      }
      for (const id of editAnim.current.rafs) {
        window.cancelAnimationFrame(id);
      }
    };
  }, []);

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

  useEffect(() => {
    if (!game || game.status !== "active") {
      return;
    }
    const initialized = initializeFury(game);
    if (initialized !== game) {
      void commit(initialized);
    }
  }, [game]);

  useEffect(() => {
    if (!game || game.status !== "active") {
      return;
    }
    const withRage = grantRageForRound(game, roundIndex);
    if (withRage !== game) {
      void commit(withRage);
    }
  }, [game, roundIndex]);

  useEffect(() => {
    if (!game) {
      prevStatusRef.current = undefined;
      return;
    }
    if (prevStatusRef.current === "setup" && game.status === "active") {
      window.scrollTo(0, 0);
    }
    prevStatusRef.current = game.status;
  }, [game]);

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

  function clearEditAnim() {
    for (const id of editAnim.current.timers) {
      window.clearTimeout(id);
    }
    for (const id of editAnim.current.rafs) {
      window.cancelAnimationFrame(id);
    }
    editAnim.current = { timers: [], rafs: [] };
  }

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    );
  }

  function openEditSetup() {
    clearEditAnim();
    window.scrollTo(0, 0);
    if (prefersReducedMotion()) {
      setEditMounted(true);
      setEditOpen(true);
      setEditSettled(true);
      return;
    }
    setEditMounted(true);
    setEditOpen(false);
    setEditSettled(false);
    const outer = window.requestAnimationFrame(() => {
      const inner = window.requestAnimationFrame(() => {
        setEditOpen(true);
      });
      editAnim.current.rafs.push(inner);
    });
    editAnim.current.rafs.push(outer);
    const settle = window.setTimeout(() => {
      setEditSettled(true);
    }, LIST_FLOW_SLIDE_MS);
    editAnim.current.timers.push(settle);
  }

  function closeEditSetup() {
    clearEditAnim();
    if (prefersReducedMotion()) {
      setEditOpen(false);
      setEditMounted(false);
      setEditSettled(true);
      return;
    }
    setEditSettled(false);
    setEditOpen(false);
    const done = window.setTimeout(() => {
      setEditMounted(false);
      setEditSettled(true);
    }, LIST_FLOW_SLIDE_MS);
    editAnim.current.timers.push(done);
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
          onClick={goBack}
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
        onBack={goBack}
      />
    );
  }

  if (game.status === "done") {
    return (
      <BattleRecordRecapScreen
        game={game}
        onBack={goBack}
        onEdit={() => void commit((prev) => reopenBattle(prev))}
      />
    );
  }

  const round = game.rounds[roundIndex]!;
  const dog = underdog(game, roundIndex);
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
    <div className="relative z-10 overflow-x-hidden overflow-y-visible">
      <div className={listFlowTrackClass(editOpen, editSettled)}>
        <div className="list-flow-pane relative min-h-dvh">
          <div className="relative z-10 min-h-full">
      <div className={`${SITE_COLUMN_CLASS} pt-2 pb-3`}>
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavBackButton
            label="Back to Battle record"
            onClick={goBack}
          />
          <h1 className={LIBRARY_TITLE_CLASS}>
            {game.yourName} vs {game.opponentName}
          </h1>
          <IosNavEditButton
            label="Edit"
            onClick={openEditSetup}
          />
        </div>
      </div>

      <main className={`${SITE_COLUMN_CLASS} flex flex-col gap-4 pb-24`}>
        <section className={PANEL} aria-label="Match score">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3">
            <ScoreIdentity
              name={game.yourName}
              army={game.yourArmy}
              underdog={dog === "you"}
              className="col-start-1"
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
            <span aria-hidden="true" className="col-start-2" />
            <ScoreIdentity
              name={game.opponentName}
              army={game.opponentArmy}
              underdog={dog === "opponent"}
              align="right"
              className="col-start-3"
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
            <p className="col-start-1 font-serif text-4xl tabular-nums text-parchment-ink">
              {matchTotal(game, "you")}
            </p>
            <p className="col-start-2 self-center text-sm text-sheet-muted">
              vs
            </p>
            <p className="col-start-3 text-right font-serif text-4xl tabular-nums text-parchment-ink">
              {matchTotal(game, "opponent")}
            </p>
            <p className="col-start-1 min-h-[1rem] truncate text-xs text-sheet-muted">
              {scoreExtras(
                roundVpTotal(game, "you"),
                tacticVpTotal(game, "you"),
                paintedBonus(game, "you"),
              )}
            </p>
            <span aria-hidden="true" className="col-start-2" />
            <p className="col-start-3 min-h-[1rem] truncate text-right text-xs text-sheet-muted">
              {scoreExtras(
                roundVpTotal(game, "opponent"),
                tacticVpTotal(game, "opponent"),
                paintedBonus(game, "opponent"),
              )}
            </p>
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
            showScourge={usesScourgeOfAqshy(game)}
            yourFury={game.yourFury}
            opponentFury={game.opponentFury}
            yourRage={round.yourRage}
            opponentRage={round.opponentRage}
            onChangeFury={(player, fury) => void commit(setFury(game, player, fury))}
            onChangeRage={(player, rage) => void commit(setRage(game, roundIndex, player, rage))}
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
            void deleteGame(game.id).then(() => goBack());
          }}
        >
          Delete battle
        </button>
      </main>
      <SiteFooter showPitch={false} />
          </div>
        </div>
        <div
          className="list-flow-pane relative min-h-dvh"
          aria-hidden={!editOpen}
        >
          {editMounted ? (
            <BattleRecordSetupScreen
              game={game}
              editing
              onChange={(next) => void commit(next)}
              onBack={closeEditSetup}
            />
          ) : null}
        </div>
      </div>
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

function scoreExtras(primary: number, tactics: number, painted: number): string {
  if (tactics <= 0 && painted <= 0) {
    return "\u00a0";
  }
  return [
    `${primary} primary`,
    tactics > 0 ? `${tactics} tactics` : null,
    painted > 0 ? `${painted} painted` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function ScoreIdentity({
  name,
  army,
  underdog: isUnderdog,
  align = "left",
  className = "",
  onPlay,
}: {
  name: string;
  army: string;
  underdog: boolean;
  align?: "left" | "right";
  className?: string;
  onPlay?: () => void;
}) {
  const names = (
    <span
      className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className="block truncate text-sm text-sheet-muted">
        {name}
        {isUnderdog ? " · underdog" : ""}
      </span>
      <span className="block truncate text-xs text-sheet-muted/80">{army}</span>
    </span>
  );

  if (!onPlay) {
    return (
      <div
        className={`${align === "right" ? "min-w-0 text-right" : "min-w-0"} ${className}`.trim()}
      >
        {names}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${name}`}
      className={`pressable flex min-h-11 min-w-0 max-w-full items-start gap-2 ${
        align === "right" ? "ml-auto" : ""
      } ${className}`.trim()}
    >
      <IosDatasheetIcon className={`${SCOREBOARD_PLAY_BUTTON_CLASS} mt-0.5`} />
      {names}
    </button>
  );
}
