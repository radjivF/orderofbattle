import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BattleTacticCard } from "@/engine/types";
import { BattleRecordTacticTracker } from "./BattleRecordTacticTracker";

const card: BattleTacticCard = {
  id: "flanking-firestorm",
  name: "Flanking Firestorm",
  realm: "aqshy",
  setup: "Place markers.",
  affray: "Ambuscade condition text.",
  strike: "Surround the enemy condition text.",
  domination: "Domination condition text.",
};

afterEach(() => {
  cleanup();
});

describe("BattleRecordTacticTracker", () => {
  it("shows Done on the next stage and Undo on completed stages like play mode", () => {
    render(
      <BattleRecordTacticTracker
        title="Rad · secondary (tactics)"
        cards={[card]}
        stages={{ [card.id]: 1 }}
        onStageChange={() => undefined}
      />,
    );

    const stages = screen.getAllByRole("button");
    expect(stages[0]).toHaveTextContent("Undo");
    expect(stages[0]).toHaveTextContent("✓");
    expect(stages[1]).toHaveTextContent("Done");
    expect(stages[2]).toHaveTextContent("—");
    expect(stages[2]).toBeDisabled();
  });

  it("Done advances the next stage and Undo steps the current stage back", async () => {
    const user = userEvent.setup();
    const onStageChange = vi.fn();

    const { rerender } = render(
      <BattleRecordTacticTracker
        title="Rad · secondary (tactics)"
        cards={[card]}
        stages={{ [card.id]: 0 }}
        onStageChange={onStageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Done/ }));
    expect(onStageChange).toHaveBeenCalledWith(card.id, 1);

    rerender(
      <BattleRecordTacticTracker
        title="Rad · secondary (tactics)"
        cards={[card]}
        stages={{ [card.id]: 1 }}
        onStageChange={onStageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Undo/ }));
    expect(onStageChange).toHaveBeenCalledWith(card.id, 0);
  });
});
