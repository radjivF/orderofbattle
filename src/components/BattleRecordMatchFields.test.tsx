import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleRecordMatchFields } from "./BattleRecordMatchFields";

vi.mock("@/lib/storage", () => ({
  subscribeArmies: () => () => {},
  getArmiesSnapshot: () => mockLists,
  getArmiesServerSnapshot: () => mockLists,
}));

vi.mock("@/lib/factionAlliance", () => ({
  listFactionsByGrandAlliance: () => [],
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("BattleRecordMatchFields army picker points", () => {
  it("shows points in Your army field with pts suffix", () => {
    render(
      <BattleRecordMatchFields
        values={{
          yourName: "Player",
          yourArmyLabel: "My Army",
          yourArmyPoints: "2860pts",
          opponentName: "Opponent",
          opponentArmyLabel: "Opponent Army",
          opponentArmyPoints: "0pts",
          allowDoubleTurn: true,
          showCp: false,
          paintedYou: false,
          paintedOpponent: false,
        }}
        onYourName={() => {}}
        onOpponentName={() => {}}
        onAllowDoubleTurn={() => {}}
        onShowCp={() => {}}
        onPaintedYou={() => {}}
        onPaintedOpponent={() => {}}
        onPickArmy={() => {}}
      />,
    );

    const yourArmyButton = screen.getByRole("button", { name: "Your army" });
    expect(yourArmyButton).toHaveTextContent("My Army");
    expect(yourArmyButton).toHaveTextContent("2860pts");

    const opponentArmyButton = screen.getByRole("button", { name: "Opponent army" });
    expect(opponentArmyButton).toHaveTextContent("Opponent Army");
    expect(opponentArmyButton).toHaveTextContent("0pts");
  });
});
