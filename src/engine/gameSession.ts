import { createId } from "@/lib/id";
import type { BattleTacticStage } from "./types";

export type BattlePlayer = "you" | "opponent";

export type GameRound = {
  /** Null until the player marks who went first that round. */
  firstPlayer: BattlePlayer | null;
  yourVp: number;
  opponentVp: number;
};

export type GameSession = {
  id: string;
  yourName: string;
  opponentName: string;
  battleplanId: string;
  allowDoubleTurn: boolean;
  paintedYou: boolean;
  paintedOpponent: boolean;
  yourTacticCardIds: [string, string];
  opponentTacticCardIds: [string, string];
  yourTacticStage: Record<string, BattleTacticStage>;
  opponentTacticStage: Record<string, BattleTacticStage>;
  /** Indexed 0–4 for battle rounds 1–5. */
  rounds: GameRound[];
  status: "active" | "done";
  createdAt: number;
  updatedAt: number;
};

export type CreateBattleRecordInput = {
  yourName: string;
  opponentName: string;
  battleplanId: string;
  allowDoubleTurn: boolean;
  yourTacticCardIds: [string, string];
  opponentTacticCardIds: [string, string];
  paintedYou?: boolean;
  paintedOpponent?: boolean;
};

const PAINTED_BONUS = 10;
const VP_PER_TACTIC_STAGE = 5;

function emptyRound(): GameRound {
  return { firstPlayer: null, yourVp: 0, opponentVp: 0 };
}

function stageMap(cardIds: [string, string]): Record<string, BattleTacticStage> {
  return {
    [cardIds[0]]: 0,
    [cardIds[1]]: 0,
  };
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

export function createBattleRecord(
  input: CreateBattleRecordInput,
): GameSession {
  const now = Date.now();
  return {
    id: createId(),
    yourName: input.yourName.trim(),
    opponentName: input.opponentName.trim(),
    battleplanId: input.battleplanId,
    allowDoubleTurn: input.allowDoubleTurn,
    paintedYou: Boolean(input.paintedYou),
    paintedOpponent: Boolean(input.paintedOpponent),
    yourTacticCardIds: input.yourTacticCardIds,
    opponentTacticCardIds: input.opponentTacticCardIds,
    yourTacticStage: stageMap(input.yourTacticCardIds),
    opponentTacticStage: stageMap(input.opponentTacticCardIds),
    rounds: Array.from({ length: 5 }, emptyRound),
    status: "active",
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

export function isDoubleTurn(
  session: GameSession,
  roundIndex: number,
): boolean {
  if (roundIndex < 1 || roundIndex >= session.rounds.length) return false;
  const prev = session.rounds[roundIndex - 1]?.firstPlayer;
  const current = session.rounds[roundIndex]?.firstPlayer;
  return Boolean(prev && current && prev === current);
}

export function canSetFirstPlayer(
  session: GameSession,
  roundIndex: number,
  firstPlayer: BattlePlayer,
): boolean {
  if (roundIndex < 0 || roundIndex >= session.rounds.length) return false;
  if (session.allowDoubleTurn || roundIndex === 0) return true;
  const prev = session.rounds[roundIndex - 1]?.firstPlayer;
  if (!prev) return true;
  return prev !== firstPlayer;
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

export function advanceTacticStage(
  session: GameSession,
  player: BattlePlayer,
  cardId: string,
  stage: BattleTacticStage,
): GameSession {
  const key = player === "you" ? "yourTacticStage" : "opponentTacticStage";
  const current = session[key][cardId] ?? 0;
  if (stage < current) {
    return session;
  }
  return touch({
    ...session,
    [key]: { ...session[key], [cardId]: stage },
  });
}
