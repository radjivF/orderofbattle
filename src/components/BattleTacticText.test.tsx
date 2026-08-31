import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@/test-utils/render";
import { BattleTacticText } from "./BattleTacticText";

describe("BattleTacticText", () => {
  beforeEach(() => {
    cleanup();
  });

  it("emphasizes the tactic name against the stage and rule text", () => {
    render(
      <BattleTacticText
        stage="Affray"
        text="Master of Arms: You complete this battle tactic at the end of your turn."
      />,
    );

    const name = screen.getByRole("strong");
    expect(name).toHaveTextContent("Master of Arms");
    expect(screen.getByText(/Affray/)).toBeInTheDocument();
    expect(
      screen.getByText(/You complete this battle tactic at the end of your turn/),
    ).toBeInTheDocument();
  });

  it("renders plain text when there is no tactic name", () => {
    render(<BattleTacticText text="You complete this battle tactic." />);

    expect(screen.queryByRole("strong")).toBeNull();
    expect(
      screen.getByText("You complete this battle tactic."),
    ).toBeInTheDocument();
  });
});
