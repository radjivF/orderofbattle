import { describe, expect, it } from "vitest";
import {
  advanceTacticStage,
  canSetFirstPlayer,
  createBattleRecord,
  isDoubleTurn,
  matchTotal,
  paintedBonus,
  roundVpTotal,
  setRoundFirstPlayer,
  setRoundVp,
  underdog,
} from "./gameSession";

const twoCards = ["card-a", "card-b"] as [string, string];
const oppCards = ["card-c", "card-d"] as [string, string];

function fresh() {
  return createBattleRecord({
    yourName: "Rad",
    opponentName: "Alex",
    battleplanId: "into-the-fire",
    allowDoubleTurn: true,
    yourTacticCardIds: twoCards,
    opponentTacticCardIds: oppCards,
  });
}

describe("createBattleRecord", () => {
  it("stores both names and battleplan", () => {
    const game = fresh();
    expect(game.yourName).toBe("Rad");
    expect(game.opponentName).toBe("Alex");
    expect(game.battleplanId).toBe("into-the-fire");
  });

  it("stores two tactic cards per side", () => {
    const game = fresh();
    expect(game.yourTacticCardIds).toEqual(twoCards);
    expect(game.opponentTacticCardIds).toEqual(oppCards);
  });

  it("starts active with five empty rounds", () => {
    const game = fresh();
    expect(game.status).toBe("active");
    expect(game.rounds).toHaveLength(5);
    expect(game.rounds.every((r) => r.yourVp === 0 && r.opponentVp === 0)).toBe(
      true,
    );
  });

  it("defaults painted off and allowDoubleTurn from input", () => {
    const on = createBattleRecord({
      yourName: "A",
      opponentName: "B",
      battleplanId: "warped-ruins",
      allowDoubleTurn: false,
      yourTacticCardIds: twoCards,
      opponentTacticCardIds: oppCards,
      paintedYou: true,
      paintedOpponent: true,
    });
    expect(on.allowDoubleTurn).toBe(false);
    expect(on.paintedYou).toBe(true);
    expect(on.paintedOpponent).toBe(true);
    expect(paintedBonus(on, "you")).toBe(10);
    expect(paintedBonus(on, "opponent")).toBe(10);
  });
});

describe("VP and match totals", () => {
  it("sums round VP per player", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 5);
    game = setRoundVp(game, 1, "you", 3);
    game = setRoundVp(game, 0, "opponent", 2);
    expect(roundVpTotal(game, "you")).toBe(8);
    expect(roundVpTotal(game, "opponent")).toBe(2);
  });

  it("adds painted bonus into match total", () => {
    let game = createBattleRecord({
      yourName: "A",
      opponentName: "B",
      battleplanId: "into-the-fire",
      allowDoubleTurn: true,
      yourTacticCardIds: twoCards,
      opponentTacticCardIds: oppCards,
      paintedYou: true,
    });
    game = setRoundVp(game, 0, "you", 4);
    expect(matchTotal(game, "you")).toBe(14);
    expect(matchTotal(game, "opponent")).toBe(0);
  });

  it("marks underdog when scores diverge", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 10);
    expect(underdog(game)).toBe("opponent");
    game = setRoundVp(game, 0, "opponent", 20);
    expect(underdog(game)).toBe("you");
  });

  it("has no underdog when tied", () => {
    expect(underdog(fresh())).toBeNull();
  });
});

describe("battle tactics Affray / Strike / Domination", () => {
  it("scores +5 VP when a card reaches Affray (stage 1)", () => {
    let game = fresh();
    game = advanceTacticStage(game, "you", "card-a", 1);
    expect(game.yourTacticStage["card-a"]).toBe(1);
    expect(matchTotal(game, "you")).toBe(5);
  });

  it("scores +10 at Strike (2), +15 at Domination (3) on one card", () => {
    let game = fresh();
    game = advanceTacticStage(game, "you", "card-a", 2);
    expect(matchTotal(game, "you")).toBe(10);
    game = advanceTacticStage(game, "you", "card-a", 3);
    expect(matchTotal(game, "you")).toBe(15);
  });

  it("does not let a card drop below its current stage", () => {
    let game = fresh();
    game = advanceTacticStage(game, "you", "card-a", 2);
    game = advanceTacticStage(game, "you", "card-a", 1);
    expect(game.yourTacticStage["card-a"]).toBe(2);
    expect(matchTotal(game, "you")).toBe(10);
  });
});

describe("double turn", () => {
  it("detects consecutive rounds with the same first player when allowed", () => {
    let game = fresh();
    game = setRoundFirstPlayer(game, 0, "you");
    game = setRoundFirstPlayer(game, 1, "you");
    expect(isDoubleTurn(game, 1)).toBe(true);
  });

  it("blocks same first player next round when double turns are off", () => {
    const game = createBattleRecord({
      yourName: "A",
      opponentName: "B",
      battleplanId: "into-the-fire",
      allowDoubleTurn: false,
      yourTacticCardIds: twoCards,
      opponentTacticCardIds: oppCards,
    });
    const after = setRoundFirstPlayer(game, 0, "you");
    expect(canSetFirstPlayer(after, 1, "you")).toBe(false);
    expect(canSetFirstPlayer(after, 1, "opponent")).toBe(true);
  });

  it("allows same first player when double turns are on", () => {
    let game = fresh();
    game = setRoundFirstPlayer(game, 0, "opponent");
    expect(canSetFirstPlayer(game, 1, "opponent")).toBe(true);
  });
});
