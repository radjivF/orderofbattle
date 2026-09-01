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
};

export type CreateBattleRecordInput = {
  yourName: string;
  yourArmy: string;
  opponentName: string;
  opponentArmy: string;
  allowDoubleTurn: boolean;
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

export function underdog(session: GameSession): BattlePlayer | null {
  const yours = matchTotal(session, "you");
  const theirs = matchTotal(session, "opponent");
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
  const dog = underdog(session);
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

export function reopenBattle(session: GameSession): GameSession {
  if (session.status !== "done") {
    return session;
  }
  return touch({ ...session, status: "active" });
}
