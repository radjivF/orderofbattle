import { describe, expect, it } from "vitest";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import { RuleInfoButton } from "./RuleInfoButton";

describe("RuleInfoButton", () => {
  it("opens a labelled sheet with the rule text", async () => {
    const user = userEvent.setup();
    render(
      <RuleInfoButton
        label="Auxiliary rules"
        title="Auxiliaries"
        text="Each auxiliary adds an extra drop."
      />,
    );

    await user.click(screen.getByRole("button", { name: "Auxiliary rules" }));

    expect(
      screen.getByRole("dialog", { name: "Auxiliary rules" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Auxiliaries" })).toBeVisible();
    expect(screen.getByText("Each auxiliary adds an extra drop.")).toBeVisible();
  });
});
