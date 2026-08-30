import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils/render";
import { ExpandableRuleCard } from "./ExpandableRuleCard";

describe("ExpandableRuleCard", () => {
  it("reveals Effect text when the title is pressed", async () => {
    const user = userEvent.setup();
    render(
      <ExpandableRuleCard
        title="Artefact · Ar'gath, the King of Blades"
        effect="Ward rolls cannot be made for enemy Heroes while they are in combat with this unit."
      />,
    );

    const toggle = screen.getByRole("button", {
      name: /Artefact · Ar'gath, the King of Blades/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/Ward rolls cannot be made/i),
    ).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Ward rolls cannot be made/i)).toBeInTheDocument();
  });
});
