import { describe, expect, it } from "vitest";
import {
  advanceTacticStage,
  battleSetupGaps,
  canSetFirstPlayer,
  canStartBattle,
  createBattleRecord,
  finishBattle,
  grantCpForRound,
  canCompleteBattleTactics,
  isDoubleTurn,
  isSeizingInitiative,
  matchTotal,
  paintedBonus,
  reopenBattle,
  roundVpTotal,
  setBattleplan,
  setPlayerCp,
  setPlayerTacticCards,
  setPrimaryClaim,
  setRoundFirstPlayer,
  setRoundVp,
  setAttacker,
  setTwistApplied,
  startBattle,
  syncPrimaryVp,
  tracksCommandPoints,
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

  it("marks underdog from the score at the start of each round", () => {
    let game = fresh();
    expect(underdog(game, 0)).toBeNull();
    game = setRoundVp(game, 0, "you", 10);
    expect(underdog(game, 0)).toBeNull();
    expect(underdog(game, 1)).toBe("opponent");
    game = setRoundVp(game, 1, "opponent", 20);
    expect(underdog(game, 1)).toBe("opponent");
    expect(underdog(game, 2)).toBe("you");
  });

  it("has no underdog when tied at the start of a round", () => {
    expect(underdog(fresh(), 0)).toBeNull();
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
  it("detects a double when last round's second player goes first", () => {
    let game = fresh();
    game = setRoundFirstPlayer(game, 0, "you");
    game = setRoundFirstPlayer(game, 1, "opponent");
    expect(isDoubleTurn(game, 0)).toBe(false);
    expect(isDoubleTurn(game, 1)).toBe(true);
    game = setRoundFirstPlayer(game, 2, "opponent");
    expect(isDoubleTurn(game, 2)).toBe(false);
    game = setRoundFirstPlayer(game, 2, "you");
    expect(isDoubleTurn(game, 2)).toBe(true);
  });

  it("is not a double when the same player keeps going first", () => {
    let game = fresh();
    game = setRoundFirstPlayer(game, 0, "you");
    game = setRoundFirstPlayer(game, 1, "you");
    expect(isDoubleTurn(game, 1)).toBe(false);
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

describe("setAttacker", () => {
  it("sets round 1 first player even when priority tracking is off", () => {
    const game = createBattleRecord({
      yourName: "A",
      yourArmy: "A army",
      opponentName: "B",
      opponentArmy: "B army",
      allowDoubleTurn: false,
    });
    const next = setAttacker(game, "opponent");
    expect(next.rounds[0]!.firstPlayer).toBe("opponent");
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

  it("recounts claimed lines using the printed VP", () => {
    let game = fresh();
    game = setPrimaryClaim(game, 0, "primary-0", "you", true, points);
    expect(game.rounds[0]!.yourVp).toBe(1);
    game = syncPrimaryVp(game, [
      { id: "primary-0", vp: 3 },
      { id: "primary-1", vp: 4 },
    ]);
    expect(game.rounds[0]!.yourVp).toBe(3);
    expect(game.rounds[0]!.primaryClaims["primary-0"]?.you).toBe(true);
  });

  it("assigns twist application only when there is an underdog at the round start", () => {
    let game = fresh();
    expect(setTwistApplied(game, 0, true).rounds[0]!.twistApplied).toBe(false);
    game = setRoundVp(game, 0, "you", 5);
    expect(setTwistApplied(game, 0, true).rounds[0]!.twistApplied).toBe(false);
    game = setTwistApplied(game, 1, true);
    expect(game.rounds[1]!.twistApplied).toBe(true);
    expect(underdog(game, 1)).toBe("opponent");
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

describe("createBattleRecord showCp", () => {
  it("defaults showCp to false", () => {
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    expect(game.showCp).toBe(false);
  });

  it("treats missing showCp as off", () => {
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    expect(tracksCommandPoints(game)).toBe(false);
    expect(tracksCommandPoints({ ...game, showCp: undefined })).toBe(false);
    expect(tracksCommandPoints({ ...game, showCp: false })).toBe(false);
    expect(tracksCommandPoints({ ...game, showCp: true })).toBe(true);
  });

  it("sets showCp from input", () => {
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    expect(game.showCp).toBe(true);
  });

  it("initializes rounds with null CP", () => {
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    expect(game.rounds[0]!.yourCp).toBeNull();
    expect(game.rounds[0]!.opponentCp).toBeNull();
  });
});

describe("grantCpForRound", () => {
  it("does nothing when showCp is false", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: false,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);

    const result = grantCpForRound(game, 0);
    expect(result.rounds[0]!.yourCp).toBeNull();
    expect(result.rounds[0]!.opponentCp).toBeNull();
  });

  it("grants 4 CP to each player when tied", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);

    game = grantCpForRound(game, 0);
    expect(game.rounds[0]!.yourCp).toBe(4);
    expect(game.rounds[0]!.opponentCp).toBe(4);
  });

  it("grants 5 CP to underdog when opponent leads", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    game = setRoundVp(game, 0, "opponent", 10);

    game = grantCpForRound(game, 1);
    expect(game.rounds[1]!.yourCp).toBe(5);
    expect(game.rounds[1]!.opponentCp).toBe(4);
  });

  it("grants 5 CP to underdog when you lead", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    game = setRoundVp(game, 0, "you", 10);

    game = grantCpForRound(game, 1);
    expect(game.rounds[1]!.yourCp).toBe(4);
    expect(game.rounds[1]!.opponentCp).toBe(5);
  });

  it("raises the underdog to 5 if CP was granted 4–4 before the lead existed", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    game = grantCpForRound(game, 1);
    expect(game.rounds[1]!.yourCp).toBe(4);
    expect(game.rounds[1]!.opponentCp).toBe(4);

    game = setRoundVp(game, 0, "you", 10);
    game = grantCpForRound(game, 1);
    expect(game.rounds[1]!.yourCp).toBe(4);
    expect(game.rounds[1]!.opponentCp).toBe(5);
  });

  it("does not re-grant if CP already set", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);

    game = grantCpForRound(game, 0);
    expect(game.rounds[0]!.yourCp).toBe(4);
    expect(game.rounds[0]!.opponentCp).toBe(4);

    game = setPlayerCp(game, 0, "you", 2);
    expect(game.rounds[0]!.yourCp).toBe(2);

    game = grantCpForRound(game, 0);
    expect(game.rounds[0]!.yourCp).toBe(2);
    expect(game.rounds[0]!.opponentCp).toBe(4);
  });

  it("does not carry CP to next round", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);

    game = grantCpForRound(game, 0);
    game = setPlayerCp(game, 0, "you", 7);
    expect(game.rounds[0]!.yourCp).toBe(7);

    game = grantCpForRound(game, 1);
    expect(game.rounds[1]!.yourCp).toBe(4);
    expect(game.rounds[1]!.opponentCp).toBe(4);
  });
});

describe("setPlayerCp", () => {
  it("sets CP for the specified player and round", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    game = grantCpForRound(game, 0);

    game = setPlayerCp(game, 0, "you", 2);
    expect(game.rounds[0]!.yourCp).toBe(2);
    expect(game.rounds[0]!.opponentCp).toBe(4);

    game = setPlayerCp(game, 0, "opponent", 1);
    expect(game.rounds[0]!.yourCp).toBe(2);
    expect(game.rounds[0]!.opponentCp).toBe(1);
  });

  it("clamps CP to 0 minimum", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    game = grantCpForRound(game, 0);

    game = setPlayerCp(game, 0, "you", -5);
    expect(game.rounds[0]!.yourCp).toBe(0);
  });

  it("clamps CP to 99 maximum", () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    game = grantCpForRound(game, 0);

    game = setPlayerCp(game, 0, "you", 150);
    expect(game.rounds[0]!.yourCp).toBe(99);
  });

  it("grants 5 CP to underdog when trailing at round start (QA regression)", () => {
    let game = createBattleRecord({
      yourName: "Me",
      yourArmy: "My Army",
      opponentName: "Rival",
      opponentArmy: "Rival Army",
      allowDoubleTurn: true,
      showCp: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);

    // Round 1: grant CP
    game = grantCpForRound(game, 0);
    // Round 1: Me scores 10, Rival scores 3
    game.rounds[0]!.yourVp = 10;
    game.rounds[0]!.opponentVp = 3;

    // Round 2 start: Me has 10, Rival has 3 → Rival is underdog → Rival gets 5, Me gets 4
    const dog = underdog(game, 1);
    expect(dog).toBe("opponent"); // Rival (opponent) is underdog

    game = grantCpForRound(game, 1);
    expect(game.rounds[1]!.yourCp).toBe(4); // Me (leader) gets 4
    expect(game.rounds[1]!.opponentCp).toBe(5); // Rival (underdog) gets 5
  });
});

describe("seizing the initiative (GHB 2026–27)", () => {
  function withPriority(
    game: ReturnType<typeof fresh>,
    round0: "you" | "opponent",
    round1: "you" | "opponent",
  ) {
    game = setRoundFirstPlayer(game, 0, round0);
    return setRoundFirstPlayer(game, 1, round1);
  }

  it("is a seize when the player who went second last round goes first and the lead is under 11", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 10);
    game = withPriority(game, "you", "opponent");
    expect(isDoubleTurn(game, 1)).toBe(true);
    expect(isSeizingInitiative(game, 1)).toBe(true);
    expect(isSeizingInitiative(game, 0)).toBe(false);
  });

  it("is not a seize when the opponent already leads by 11 or more", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 15);
    game = setRoundVp(game, 0, "opponent", 4);
    game = withPriority(game, "you", "opponent");
    expect(isDoubleTurn(game, 1)).toBe(true);
    expect(isSeizingInitiative(game, 1)).toBe(false);
  });

  it("is still a seize when the lead is exactly 10", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 10);
    game = setRoundVp(game, 0, "opponent", 0);
    game = withPriority(game, "you", "opponent");
    expect(isSeizingInitiative(game, 1)).toBe(true);
  });

  it("makes the seizing player the underdog (not VP-based) until the opponent seizes", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 5);
    game = withPriority(game, "you", "opponent");
    // Opponent seized R2 → opponent is underdog
    expect(underdog(game, 1)).toBe("opponent");
    // R3 no seize — sticky
    game = setRoundFirstPlayer(game, 2, "opponent");
    expect(underdog(game, 2)).toBe("opponent");
  });

  it("flips underdog when the other player later seizes", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 5);
    game = withPriority(game, "you", "opponent"); // opponent seizes R2
    game = setRoundFirstPlayer(game, 2, "opponent"); // no seize
    game = setRoundFirstPlayer(game, 3, "you"); // you seize R4
    expect(underdog(game, 3)).toBe("you");
  });

  it("keeps VP underdog when nobody has seized", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 3);
    game = setRoundVp(game, 0, "opponent", 8);
    game = withPriority(game, "you", "you"); // no double turn
    expect(underdog(game, 1)).toBe("you");
  });

  it("blocks the seizing player from completing tactics that turn only", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 5);
    game = withPriority(game, "you", "opponent");
    expect(canCompleteBattleTactics(game, 1, "opponent")).toBe(false);
    expect(canCompleteBattleTactics(game, 1, "you")).toBe(true);
  });

  it("still lets a catch-up double turn complete tactics when the lead is 11+", () => {
    let game = fresh();
    game = setRoundVp(game, 0, "you", 15);
    game = setRoundVp(game, 0, "opponent", 4);
    game = withPriority(game, "you", "opponent");
    expect(isDoubleTurn(game, 1)).toBe(true);
    expect(isSeizingInitiative(game, 1)).toBe(false);
    expect(canCompleteBattleTactics(game, 1, "opponent")).toBe(true);
  });
});
