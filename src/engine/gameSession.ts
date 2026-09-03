import { createId } from "@/lib/id";
import type { BattleTacticStage } from "./types";

export type BattlePlayer = "you" | "opponent";

export type GameRound = {
  /** Null until the player marks who went first that round. */
  firstPlayer: BattlePlayer | null;
  yourVp: number;
  opponentVp: number;
  /** Primary mission points claimed this round (ids from missionPrimaryPoints). */
  primaryClaims: Record<string, { you: boolean; opponent: boolean }>;
  /** Twist applied this round for the underdog. */
  twistApplied: boolean;
  /** Scourge of Aqshy: Rage dice granted to this player at start of this round. */
  yourRage: number;
  opponentRage: number;
  /** Flag to prevent double-granting rage when switching between turn tabs. */
  rageGranted: boolean;
  /** Command Points tracked this round (null = not yet granted). */
  yourCp: number | null;
  opponentCp: number | null;
};

export type GameSession = {
  id: string;
  yourName: string;
  yourArmy: string;
  opponentName: string;
  opponentArmy: string;
  /** Saved list id when army was picked from My lists. */
  yourListId?: string;
  opponentListId?: string;
  /** Empty until chosen during the game. */
  battleplanId: string;
  allowDoubleTurn: boolean;
  /** Optional CP tracking (default false for older sessions). */
  showCp?: boolean;
  paintedYou: boolean;
  paintedOpponent: boolean;
  yourTacticCardIds: string[];
  opponentTacticCardIds: string[];
  yourTacticStage: Record<string, BattleTacticStage>;
  opponentTacticStage: Record<string, BattleTacticStage>;
  /** Indexed 0–4 for battle rounds 1–5. */
  rounds: GameRound[];
  status: "setup" | "active" | "done";
  createdAt: number;
  updatedAt: number;
  /** Scourge of Aqshy: Fury level 0–7, persists across all rounds. */
  yourFury: number;
  opponentFury: number;
  /** Flag: fury initialized from attacker/defender during deployment. */
  furyInitialized: boolean;
};

export type CreateBattleRecordInput = {
  yourName: string;
  yourArmy: string;
  opponentName: string;
  opponentArmy: string;
  allowDoubleTurn: boolean;
  showCp?: boolean;
  paintedYou?: boolean;
  paintedOpponent?: boolean;
  yourTacticCardIds?: string[];
  opponentTacticCardIds?: string[];
  yourListId?: string;
  opponentListId?: string;
};

const PAINTED_BONUS = 10;
const VP_PER_TACTIC_STAGE = 5;

function emptyRound(): GameRound {
  return {
    firstPlayer: null,
    yourVp: 0,
    opponentVp: 0,
    primaryClaims: {},
    twistApplied: false,
    yourRage: 0,
    opponentRage: 0,
    rageGranted: false,
    yourCp: null,
    opponentCp: null,
  };
}

function stageMap(cardIds: string[]): Record<string, BattleTacticStage> {
  const stages: Record<string, BattleTacticStage> = {};
  for (const id of cardIds) {
    stages[id] = 0;
  }
  return stages;
}

function touch(session: GameSession): GameSession {
  return { ...session, updatedAt: Date.now() };
}

function stagesFor(
  session: GameSession,
  player: BattlePlayer,
): Record<string, BattleTacticStage> {
  return player === "you"
    ? session.yourTacticStage
    : session.opponentTacticStage;
}

export type BattleArmyPick = {
  label: string;
  tacticIds: string[];
  listId?: string;
  pointsLabel?: string;
};

export function createBattleRecord(
  input: CreateBattleRecordInput,
): GameSession {
  const now = Date.now();
  const yourTacticCardIds = (input.yourTacticCardIds ?? []).slice(0, 2);
  const opponentTacticCardIds = (input.opponentTacticCardIds ?? []).slice(0, 2);
  return {
    id: createId(),
    yourName: input.yourName.trim(),
    yourArmy: input.yourArmy.trim(),
    opponentName: input.opponentName.trim(),
    opponentArmy: input.opponentArmy.trim(),
    yourListId: input.yourListId || undefined,
    opponentListId: input.opponentListId || undefined,
    battleplanId: "",
    allowDoubleTurn: input.allowDoubleTurn,
    showCp: Boolean(input.showCp),
    paintedYou: Boolean(input.paintedYou),
    paintedOpponent: Boolean(input.paintedOpponent),
    yourTacticCardIds,
    opponentTacticCardIds,
    yourTacticStage: stageMap(yourTacticCardIds),
    opponentTacticStage: stageMap(opponentTacticCardIds),
    rounds: Array.from({ length: 5 }, emptyRound),
    status: "setup",
    createdAt: now,
    updatedAt: now,
    yourFury: 0,
    opponentFury: 0,
    furyInitialized: false,
  };
}

export function roundVpTotal(
  session: GameSession,
  player: BattlePlayer,
): number {
  return session.rounds.reduce(
    (sum, round) =>
      sum + (player === "you" ? round.yourVp : round.opponentVp),
    0,
  );
}

export function paintedBonus(
  session: GameSession,
  player: BattlePlayer,
): number {
  const painted =
    player === "you" ? session.paintedYou : session.paintedOpponent;
  return painted ? PAINTED_BONUS : 0;
}

export function tacticVpTotal(
  session: GameSession,
  player: BattlePlayer,
): number {
  const stages = stagesFor(session, player);
  return Object.values(stages).reduce(
    (sum: number, stage) => sum + stage * VP_PER_TACTIC_STAGE,
    0,
  );
}

export function matchTotal(
  session: GameSession,
  player: BattlePlayer,
): number {
  return (
    roundVpTotal(session, player) +
    paintedBonus(session, player) +
    tacticVpTotal(session, player)
  );
}

/** Match total before this round's VP is counted — the snapshot used for underdog. */
export function matchTotalAtRoundStart(
  session: GameSession,
  roundIndex: number,
  player: BattlePlayer,
): number {
  const priorRoundVp = session.rounds
    .slice(0, roundIndex)
    .reduce(
      (sum, round) =>
        sum + (player === "you" ? round.yourVp : round.opponentVp),
      0,
    );
  return (
    priorRoundVp +
    paintedBonus(session, player) +
    tacticVpTotal(session, player)
  );
}

/** Underdog for a battle round — whoever had fewer VP at the start of that round. */
export function underdog(
  session: GameSession,
  roundIndex: number,
): BattlePlayer | null {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return null;
  }
  const yours = matchTotalAtRoundStart(session, roundIndex, "you");
  const theirs = matchTotalAtRoundStart(session, roundIndex, "opponent");
  if (yours === theirs) return null;
  return yours < theirs ? "you" : "opponent";
}

/** True when this round's first player took the previous round's second turn. */
export function isDoubleTurn(
  session: GameSession,
  roundIndex: number,
): boolean {
  if (!session.allowDoubleTurn) return false;
  if (roundIndex < 1 || roundIndex >= session.rounds.length) return false;
  const prev = session.rounds[roundIndex - 1]?.firstPlayer;
  const current = session.rounds[roundIndex]?.firstPlayer;
  return Boolean(prev && current && prev !== current);
}

export function canSetFirstPlayer(
  session: GameSession,
  roundIndex: number,
  firstPlayer: BattlePlayer,
): boolean {
  void firstPlayer;
  if (!session.allowDoubleTurn) return false;
  if (roundIndex < 0 || roundIndex >= session.rounds.length) return false;
  return true;
}

export function setRoundFirstPlayer(
  session: GameSession,
  roundIndex: number,
  firstPlayer: BattlePlayer,
): GameSession {
  if (!canSetFirstPlayer(session, roundIndex, firstPlayer)) {
    return session;
  }
  const rounds = session.rounds.map((round, index) =>
    index === roundIndex ? { ...round, firstPlayer } : round,
  );
  return touch({ ...session, rounds });
}

export function setRoundVp(
  session: GameSession,
  roundIndex: number,
  player: BattlePlayer,
  vp: number,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const safeVp = Math.max(0, Math.floor(vp));
  const rounds = session.rounds.map((round, index) => {
    if (index !== roundIndex) return round;
    return player === "you"
      ? { ...round, yourVp: safeVp }
      : { ...round, opponentVp: safeVp };
  });
  return touch({ ...session, rounds });
}

function syncRoundVpFromClaims(
  round: GameRound,
  points: Array<{ id: string; vp: number }>,
): GameRound {
  let yourVp = 0;
  let opponentVp = 0;
  for (const point of points) {
    const claim = round.primaryClaims[point.id];
    if (claim?.you) yourVp += point.vp;
    if (claim?.opponent) opponentVp += point.vp;
  }
  return { ...round, yourVp, opponentVp };
}

export function setPrimaryClaim(
  session: GameSession,
  roundIndex: number,
  pointId: string,
  player: BattlePlayer,
  claimed: boolean,
  points: Array<{ id: string; vp: number }>,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const rounds = session.rounds.map((round, index) => {
    if (index !== roundIndex) return round;
    const prev = round.primaryClaims[pointId] ?? {
      you: false,
      opponent: false,
    };
    const nextClaims = {
      ...round.primaryClaims,
      [pointId]:
        player === "you"
          ? { ...prev, you: claimed }
          : { ...prev, opponent: claimed },
    };
    return syncRoundVpFromClaims(
      { ...round, primaryClaims: nextClaims },
      points,
    );
  });
  return touch({ ...session, rounds });
}

/** Twist belongs to the underdog; only they can mark it applied this turn. */
export function setTwistApplied(
  session: GameSession,
  roundIndex: number,
  applied: boolean,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const dog = underdog(session, roundIndex);
  if (applied && !dog) {
    return session;
  }
  const rounds = session.rounds.map((round, index) =>
    index === roundIndex ? { ...round, twistApplied: applied } : round,
  );
  return touch({ ...session, rounds });
}

export function advanceTacticStage(
  session: GameSession,
  player: BattlePlayer,
  cardId: string,
  stage: BattleTacticStage,
): GameSession {
  const key = player === "you" ? "yourTacticStage" : "opponentTacticStage";
  return touch({
    ...session,
    [key]: { ...session[key], [cardId]: stage },
  });
}

export function setBattleplan(
  session: GameSession,
  battleplanId: string,
): GameSession {
  return touch({ ...session, battleplanId });
}

export function patchBattleRecord(
  session: GameSession,
  patch: Partial<
    Pick<
      GameSession,
      | "yourName"
      | "opponentName"
      | "allowDoubleTurn"
      | "showCp"
      | "paintedYou"
      | "paintedOpponent"
    >
  >,
): GameSession {
  return touch({ ...session, ...patch });
}

export function setBattleArmy(
  session: GameSession,
  player: BattlePlayer,
  pick: BattleArmyPick,
): GameSession {
  const next =
    player === "you"
      ? {
          ...session,
          yourArmy: pick.label.trim(),
          yourListId: pick.listId || undefined,
        }
      : {
          ...session,
          opponentArmy: pick.label.trim(),
          opponentListId: pick.listId || undefined,
        };
  return setPlayerTacticCards(next, player, pick.tacticIds);
}

export function setPlayerTacticCards(
  session: GameSession,
  player: BattlePlayer,
  cardIds: string[],
): GameSession {
  const clipped = cardIds.slice(0, 2);
  if (player === "you") {
    return touch({
      ...session,
      yourTacticCardIds: clipped,
      yourTacticStage: stageMap(clipped),
    });
  }
  return touch({
    ...session,
    opponentTacticCardIds: clipped,
    opponentTacticStage: stageMap(clipped),
  });
}

/** Recalculate round VP from claims using current battleplan VP values. */
export function syncPrimaryVp(
  session: GameSession,
  points: Array<{ id: string; vp: number }>,
): GameSession {
  let changed = false;
  const rounds = session.rounds.map((round) => {
    const hasClaims = Object.values(round.primaryClaims).some(
      (claim) => claim.you || claim.opponent,
    );
    if (!hasClaims) {
      return round;
    }
    const next = syncRoundVpFromClaims(round, points);
    if (next.yourVp !== round.yourVp || next.opponentVp !== round.opponentVp) {
      changed = true;
      return next;
    }
    return round;
  });
  if (!changed) {
    return session;
  }
  return touch({ ...session, rounds });
}

export function canStartBattle(session: GameSession): boolean {
  return session.status === "setup" && session.battleplanId.length > 0;
}

/** What still blocks Start game — for setup UI copy. */
export function battleSetupGaps(session: GameSession): string[] {
  const gaps: string[] = [];
  if (session.battleplanId.length === 0) {
    gaps.push("a battleplan");
  }
  return gaps;
}

export function startBattle(session: GameSession): GameSession {
  if (!canStartBattle(session)) {
    return session;
  }
  return touch({ ...session, status: "active" });
}

export function finishBattle(session: GameSession): GameSession {
  if (session.status !== "active") {
    return session;
  }
  return touch({ ...session, status: "done" });
}

/** Grant CP at the start of a round: 4 base, 5 if underdog. Only grant once. */
export function grantCpForRound(
  session: GameSession,
  roundIndex: number,
): GameSession {
  if (!session.showCp) return session;
  if (roundIndex < 0 || roundIndex >= session.rounds.length) return session;
  const round = session.rounds[roundIndex]!;
  if (round.yourCp !== null && round.opponentCp !== null) {
    return session;
  }
  const dog = underdog(session, roundIndex);
  const yourCp = dog === "you" ? 5 : 4;
  const opponentCp = dog === "opponent" ? 5 : 4;
  const nextRounds = [...session.rounds];
  nextRounds[roundIndex] = { ...round, yourCp, opponentCp };
  return touch({ ...session, rounds: nextRounds });
}

export function setPlayerCp(
  session: GameSession,
  roundIndex: number,
  player: BattlePlayer,
  cp: number,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) return session;
  const clamped = Math.max(0, Math.min(cp, 99));
  const round = session.rounds[roundIndex]!;
  const nextRound =
    player === "you"
      ? { ...round, yourCp: clamped }
      : { ...round, opponentCp: clamped };
  const nextRounds = [...session.rounds];
  nextRounds[roundIndex] = nextRound;
  return touch({ ...session, rounds: nextRounds });
}

export function reopenBattle(session: GameSession): GameSession {
  if (session.status !== "done") {
    return session;
  }
  return touch({ ...session, status: "active" });
}

/** True when this game uses Scourge of Aqshy battlepack (all current battleplans). */
export function usesScourgeOfAqshy(session: GameSession): boolean {
  return session.battleplanId.length > 0;
}

/** Initialize fury from attacker/defender when battle starts. */
export function initializeFury(session: GameSession): GameSession {
  if (session.furyInitialized || session.status !== "active") {
    return session;
  }
  if (!usesScourgeOfAqshy(session)) {
    return session;
  }
  const round0 = session.rounds[0];
  if (!round0?.firstPlayer) {
    return session;
  }
  const attacker = round0.firstPlayer;
  const defender = attacker === "you" ? "opponent" : "you";
  return touch({
    ...session,
    yourFury: defender === "you" ? 2 : 1,
    opponentFury: defender === "opponent" ? 2 : 1,
    furyInitialized: true,
  });
}

/** Grant rage at start of round if not already granted. */
export function grantRageForRound(
  session: GameSession,
  roundIndex: number,
): GameSession {
  if (!usesScourgeOfAqshy(session)) {
    return session;
  }
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const round = session.rounds[roundIndex];
  if (!round || round.rageGranted) {
    return session;
  }
  const rounds = session.rounds.map((r, index) =>
    index === roundIndex
      ? {
          ...r,
          yourRage: session.yourFury,
          opponentRage: session.opponentFury,
          rageGranted: true,
        }
      : r,
  );
  return touch({ ...session, rounds });
}

/** Update fury level for a player (0-7). */
export function setFury(
  session: GameSession,
  player: BattlePlayer,
  fury: number,
): GameSession {
  const clamped = Math.max(0, Math.min(7, Math.floor(fury)));
  const key = player === "you" ? "yourFury" : "opponentFury";
  if (session[key] === clamped) {
    return session;
  }
  return touch({ ...session, [key]: clamped });
}

/** Update rage dice for a player in a specific round. */
export function setRage(
  session: GameSession,
  roundIndex: number,
  player: BattlePlayer,
  rage: number,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const safeRage = Math.max(0, Math.floor(rage));
  const rounds = session.rounds.map((round, index) => {
    if (index !== roundIndex) return round;
    return player === "you"
      ? { ...round, yourRage: safeRage }
      : { ...round, opponentRage: safeRage };
  });
  return touch({ ...session, rounds });
}

/** Spend rage dice (Eruption of Fury: spend 1-3). */
export function spendRageEruption(
  session: GameSession,
  roundIndex: number,
  player: BattlePlayer,
  amount: number,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const round = session.rounds[roundIndex];
  if (!round) return session;
  const currentRage = player === "you" ? round.yourRage : round.opponentRage;
  const spend = Math.max(1, Math.min(3, Math.min(amount, currentRage)));
  return setRage(session, roundIndex, player, currentRage - spend);
}

/** Fight through the pain: spend 1 rage and reduce fury by 1. */
export function spendRageFight(
  session: GameSession,
  roundIndex: number,
  player: BattlePlayer,
): GameSession {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) {
    return session;
  }
  const round = session.rounds[roundIndex];
  if (!round) return session;
  const currentRage = player === "you" ? round.yourRage : round.opponentRage;
  if (currentRage < 1) {
    return session;
  }
  const afterRage = setRage(session, roundIndex, player, currentRage - 1);
  const currentFury = player === "you" ? afterRage.yourFury : afterRage.opponentFury;
  return setFury(afterRage, player, currentFury - 1);
}
