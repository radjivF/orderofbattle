import { describe, expect, it } from "vitest";
import {
  advanceTacticStage,
  battleSetupGaps,
  canSetFirstPlayer,
  canStartBattle,
  createBattleRecord,
  finishBattle,
  isDoubleTurn,
  matchTotal,
  paintedBonus,
  reopenBattle,
  roundVpTotal,
  setBattleplan,
  setPlayerTacticCards,
  setPrimaryClaim,
  setRoundFirstPlayer,
  setRoundVp,
  setTwistApplied,
  startBattle,
  underdog,
} from "./gameSession";

const twoCards = ["card-a", "card-b"];
const oppCards = ["card-c", "card-d"];

function fresh() {
  let game = createBattleRecord({
    yourName: "Rad",
    yourArmy: "Stormcast",
    opponentName: "Alex",
    opponentArmy: "Khorne",
    allowDoubleTurn: true,
  });
  game = setPlayerTacticCards(game, "you", twoCards);
  game = setPlayerTacticCards(game, "opponent", oppCards);
  return game;
}

describe("createBattleRecord", () => {
  it("stores both names and armies", () => {
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    expect(game.yourName).toBe("Rad");
    expect(game.yourArmy).toBe("Stormcast");
    expect(game.opponentName).toBe("Alex");
    expect(game.opponentArmy).toBe("Khorne");
    expect(game.battleplanId).toBe("");
    expect(game.yourTacticCardIds).toEqual([]);
    expect(game.opponentTacticCardIds).toEqual([]);
  });

  it("preloads tactic cards from the create input", () => {
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "My Sylvaneth",
      opponentName: "Alex",
      opponentArmy: "Stormcast",
      allowDoubleTurn: true,
      yourTacticCardIds: ["card-a", "card-b", "card-extra"],
      opponentTacticCardIds: ["card-c"],
    });
    expect(game.yourTacticCardIds).toEqual(["card-a", "card-b"]);
    expect(game.opponentTacticCardIds).toEqual(["card-c"]);
    expect(game.yourTacticStage).toEqual({ "card-a": 0, "card-b": 0 });
    expect(game.opponentTacticStage).toEqual({ "card-c": 0 });
  });

  it("starts in setup with five empty rounds", () => {
    const game = fresh();
    expect(game.status).toBe("setup");
    expect(game.rounds).toHaveLength(5);
    expect(game.rounds.every((r) => r.yourVp === 0 && r.opponentVp === 0)).toBe(
      true,
    );
  });

  it("defaults painted off and allowDoubleTurn from input", () => {
    const on = createBattleRecord({
      yourName: "A",
      yourArmy: "A army",
      opponentName: "B",
      opponentArmy: "B army",
      allowDoubleTurn: false,
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
      yourArmy: "A army",
      opponentName: "B",
      opponentArmy: "B army",
      allowDoubleTurn: true,
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

  it("lets Undo drop a card back one stage", () => {
    let game = fresh();
    game = advanceTacticStage(game, "you", "card-a", 2);
    game = advanceTacticStage(game, "you", "card-a", 1);
    expect(game.yourTacticStage["card-a"]).toBe(1);
    expect(matchTotal(game, "you")).toBe(5);
  });
});

describe("double turn", () => {
  it("detects consecutive rounds with the same first player when allowed", () => {
    let game = fresh();
    game = setRoundFirstPlayer(game, 0, "you");
    game = setRoundFirstPlayer(game, 1, "you");
    expect(isDoubleTurn(game, 1)).toBe(true);
  });

  it("skips priority entirely when double turns are off", () => {
    const game = createBattleRecord({
      yourName: "A",
      yourArmy: "A army",
      opponentName: "B",
      opponentArmy: "B army",
      allowDoubleTurn: false,
    });
    expect(canSetFirstPlayer(game, 0, "you")).toBe(false);
    expect(canSetFirstPlayer(game, 1, "opponent")).toBe(false);
    expect(setRoundFirstPlayer(game, 0, "you").rounds[0]!.firstPlayer).toBe(
      null,
    );
    expect(isDoubleTurn(setRoundFirstPlayer(game, 0, "you"), 1)).toBe(false);
  });

  it("allows same first player when double turns are on", () => {
    let game = fresh();
    game = setRoundFirstPlayer(game, 0, "opponent");
    expect(canSetFirstPlayer(game, 1, "opponent")).toBe(true);
  });
});

describe("mission primary claims", () => {
  const points = [
    { id: "primary-0", vp: 1 },
    { id: "primary-1", vp: 1 },
  ];

  it("counts primary points one by one into round VP", () => {
    let game = fresh();
    game = setPrimaryClaim(game, 0, "primary-0", "you", true, points);
    expect(game.rounds[0]!.yourVp).toBe(1);
    expect(game.rounds[0]!.primaryClaims["primary-0"]?.you).toBe(true);
    game = setPrimaryClaim(game, 0, "primary-1", "opponent", true, points);
    expect(game.rounds[0]!.opponentVp).toBe(1);
    expect(matchTotal(game, "you")).toBe(1);
  });

  it("assigns twist application only when there is an underdog", () => {
    let game = fresh();
    expect(setTwistApplied(game, 0, true).rounds[0]!.twistApplied).toBe(false);
    game = setRoundVp(game, 0, "you", 5);
    game = setTwistApplied(game, 0, true);
    expect(game.rounds[0]!.twistApplied).toBe(true);
    expect(underdog(game)).toBe("opponent");
  });
});

describe("setup → start", () => {
  it("needs only a battleplan before start; tactics are optional", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    expect(canStartBattle(game)).toBe(false);
    expect(battleSetupGaps(game)).toEqual(["a battleplan"]);
    game = setBattleplan(game, "into-the-fire");
    expect(canStartBattle(game)).toBe(true);
    expect(battleSetupGaps(game)).toEqual([]);
    game = startBattle(game);
    expect(game.status).toBe("active");
  });

  it("still starts when tactics are chosen", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = setPlayerTacticCards(game, "you", ["card-a", "card-b"]);
    game = setPlayerTacticCards(game, "opponent", ["card-c", "card-d"]);
    expect(canStartBattle(game)).toBe(true);
    game = startBattle(game);
    expect(game.status).toBe("active");
  });
});

describe("reopenBattle", () => {
  it("moves a finished battle back to active", () => {
    let game = setBattleplan(fresh(), "into-the-fire");
    game = startBattle(game);
    game = finishBattle(game);
    expect(game.status).toBe("done");

    game = reopenBattle(game);
    expect(game.status).toBe("active");
  });

  it("does nothing when the battle is not done", () => {
    let game = setBattleplan(fresh(), "into-the-fire");
    expect(reopenBattle(game).status).toBe("setup");
    game = startBattle(game);
    expect(reopenBattle(game).status).toBe("active");
  });
});
