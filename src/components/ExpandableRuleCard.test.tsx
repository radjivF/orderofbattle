import { beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@/test-utils/render";
import { ExpandableRuleCard } from "./ExpandableRuleCard";

describe("ExpandableRuleCard", () => {
  beforeEach(() => {
    cleanup();
  });

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
    expect(toggle.className).toContain("cursor-pointer");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/Ward rolls cannot be made/i),
    ).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Ward rolls cannot be made/i)).toBeInTheDocument();
  });

  it("keeps the filled row by default so warscroll sheets are unchanged", () => {
    render(<ExpandableRuleCard title="Fly" effect="Ignores other models." />);

    const row = screen.getByRole("button", { name: /Fly/i }).parentElement;
    expect(row?.className).toContain("bg-parchment-ink/5");
  });

  it("drops the row fill when flush, until it is expanded", async () => {
    const user = userEvent.setup();
    render(
      <ExpandableRuleCard flush title="Fly" effect="Ignores other models." />,
    );

    const toggle = screen.getByRole("button", { name: /Fly/i });
    expect(toggle.parentElement?.className).not.toContain("bg-parchment-ink/5");

    await user.click(toggle);
    expect(toggle.parentElement?.className).toContain("bg-parchment-ink/[0.07]");
    expect(toggle.parentElement?.className).toContain("my-2");
  });

  it("keeps an open default row tight against its neighbours", async () => {
    const user = userEvent.setup();
    render(<ExpandableRuleCard title="Fly" effect="Ignores other models." />);

    const toggle = screen.getByRole("button", { name: /Fly/i });
    await user.click(toggle);
    expect(toggle.parentElement?.className).not.toContain("my-2");
  });

  it("opens from a search hit and highlights the query in the effect", () => {
    render(
      <ExpandableRuleCard
        title="Raising the Heat"
        effect="The battle starts at fury level 0."
        open
        highlight="Battle Start"
      />,
    );

    expect(
      screen.getByRole("button", { name: /Raising the Heat/i }),
    ).toHaveAttribute("aria-expanded", "true");
    const marks = screen
      .getAllByText(/battle start/i)
      .filter((node) => node.tagName === "MARK");
    expect(marks).toHaveLength(1);
  });
});
