import { describe, expect, it } from "vitest";
import { getBattleplanLayout } from "@/engine/battleplanLayout";
import {
  createBattleRecord,
  finishBattle,
  matchTotal,
  setBattleplan,
  setRoundVp,
  startBattle,
} from "@/engine/gameSession";
import { formatBattleRecapText } from "@/engine/battleRecap";

function activeGame() {
  let game = createBattleRecord({
    yourName: "Rad",
    yourArmy: "Stormcast",
    opponentName: "Alex",
    opponentArmy: "Khorne",
    allowDoubleTurn: true,
  });
  game = setBattleplan(game, "into-the-fire");
  game = startBattle(game);
  game = setRoundVp(game, 0, "you", 5);
  game = setRoundVp(game, 0, "opponent", 2);
  game = setRoundVp(game, 1, "you", 3);
  game = setRoundVp(game, 1, "opponent", 4);
  return game;
}

describe("finishBattle", () => {
  it("marks an active battle as done", () => {
    const game = finishBattle(activeGame());
    expect(game.status).toBe("done");
  });

  it("does nothing when still in setup", () => {
    const setup = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    expect(finishBattle(setup).status).toBe("setup");
  });
});

describe("formatBattleRecapText", () => {
  it("includes mission, when, turn scores, and final score", () => {
    const game = finishBattle(activeGame());
    const plan = getBattleplanLayout(game.battleplanId)!;
    const text = formatBattleRecapText(game, plan.name);

    expect(text).toContain("Into the Fire");
    expect(text).toContain("Rad");
    expect(text).toContain("Alex");
    expect(text).toMatch(/Turn 1/i);
    expect(text).toContain("5");
    expect(text).toContain("2");
    expect(text).toMatch(/Final/i);
    expect(text).toContain(String(matchTotal(game, "you")));
    expect(text).toContain(String(matchTotal(game, "opponent")));
    expect(text).toMatch(/\d{4}|\d{1,2}[:/]/);
  });
});
