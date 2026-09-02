import { beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen, within } from "@/test-utils/render";
import { CoreRulesScreen } from "./CoreRulesScreen";

describe("CoreRulesScreen", () => {
  beforeEach(() => {
    cleanup();
  });

  it("lists core keyword rules without Ward, Run, or Scourge", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen />);

    expect(screen.getByRole("heading", { name: "Core Rules" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Guarded Hero/i })
        .closest("section.parchment-card"),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Scourge of Aqshy" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Ward/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Run/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Eruption of Fury/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /Guarded Hero/i }));
    expect(screen.getByText(/12"/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Strike-last/i }));
    expect(
      screen.getByText(/cannot be picked to use a Fight ability/i),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Strike-first/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Companion/i })).toBeTruthy();
  });

  it("lists Scourge of Aqshy rules on the season pack", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen pack="scourge" />);

    expect(screen.getByRole("heading", { name: "Scourge of Aqshy" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Guarded Hero/i })).toBeNull();
    expect(
      screen
        .getByRole("button", { name: /Eruption of Fury/i })
        .closest("section.parchment-card"),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Eruption of Fury/i }));
    expect(screen.getByText(/up to 3/i)).toBeTruthy();
    expect(screen.getByText(/combat attacks/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Strike-last/i })).toBeNull();
  });

  it("groups the core rules under headings in one card", () => {
    render(<CoreRulesScreen />);

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((node) => node.textContent);
    expect(headings).toEqual([
      "Abilities",
      "Unit types",
      "Weapon abilities",
      "Terrain",
    ]);

    expect(document.querySelectorAll("section.parchment-card")).toHaveLength(1);

    const terrain = screen
      .getByRole("heading", { name: "Terrain" })
      .closest("section");
    expect(terrain).toBeTruthy();
    expect(
      within(terrain as HTMLElement).getByRole("button", { name: /Obscuring/i }),
    ).toBeTruthy();
    expect(
      within(terrain as HTMLElement).queryByRole("button", {
        name: /Guarded Hero/i,
      }),
    ).toBeNull();
  });

  it("leaves the five Scourge rules ungrouped", () => {
    render(<CoreRulesScreen pack="scourge" />);

    expect(screen.queryByRole("heading", { name: "Abilities" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Terrain" })).toBeNull();
  });

  it("swaps the title for the field on the same row when search opens", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen />);

    expect(screen.queryByRole("searchbox", { name: "Search rules" })).toBeNull();

    const toggle = screen.getByRole("button", { name: "Search rules" });
    const title = screen.getByRole("heading", { name: "Core Rules", level: 1 });
    const titleRow = title.parentElement;
    expect(titleRow).toContainElement(toggle);

    await user.click(toggle);
    expect(
      screen.queryByRole("heading", { name: "Core Rules", level: 1 }),
    ).toBeNull();
    const search = screen.getByRole("searchbox", { name: "Search rules" });
    expect(search).toHaveAttribute("type", "search");
    expect(titleRow).toContainElement(search);
    expect(titleRow).toContainElement(
      screen.getByRole("button", { name: "Close search" }),
    );
  });

  it("hides the Scourge title behind the field too", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen pack="scourge" />);

    await user.click(screen.getByRole("button", { name: "Search rules" }));
    expect(screen.queryByRole("heading", { name: "Scourge of Aqshy" })).toBeNull();
    expect(screen.getByRole("searchbox", { name: "Search rules" })).toBeTruthy();
  });

  it("closes search from a liquid-glass icon button, not a text label", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen />);

    await user.click(screen.getByRole("button", { name: "Search rules" }));
    const close = screen.getByRole("button", { name: "Close search" });
    expect(close.className).toContain("ios-liquid-glass");
    expect(close.textContent).toBe("");

    await user.click(close);
    expect(screen.queryByRole("searchbox", { name: "Search rules" })).toBeNull();
    expect(screen.getByRole("button", { name: "Search rules" })).toBeTruthy();
  });

  it("clears the query from inside the field without closing search", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen />);

    await user.click(screen.getByRole("button", { name: "Search rules" }));
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();

    const search = screen.getByRole("searchbox", { name: "Search rules" });
    await user.type(search, "fly");
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(screen.getByRole("searchbox", { name: "Search rules" })).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    expect(document.querySelector("mark")).toBeNull();
  });

  it("counts the rules that match", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen />);

    await user.click(screen.getByRole("button", { name: "Search rules" }));
    const search = screen.getByRole("searchbox", { name: "Search rules" });

    await user.type(search, "Obscuring");
    expect(screen.getByText("1 rule matches")).toBeTruthy();

    await user.clear(search);
    await user.type(search, "Crit");
    expect(screen.getByText("3 rules match")).toBeTruthy();
  });

  it("hides groups with no match and shows an empty state", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen />);

    await user.click(screen.getByRole("button", { name: "Search rules" }));
    const search = screen.getByRole("searchbox", { name: "Search rules" });

    await user.type(search, "Obscuring");
    expect(screen.getByRole("heading", { name: "Terrain" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Unit types" })).toBeNull();

    await user.clear(search);
    await user.type(search, "xyzzy");
    expect(screen.getByText(/No rules match/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Guarded Hero/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("button", { name: /Guarded Hero/i })).toBeTruthy();
  });

  it("opens every mention and highlights the phrase you typed", async () => {
    const user = userEvent.setup();
    render(<CoreRulesScreen pack="scourge" />);

    await user.click(screen.getByRole("button", { name: "Search rules" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search rules" }),
      "Deployment Phase",
    );

    expect(
      screen.getByRole("button", { name: /Raising the Heat/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("button", { name: /Eruption of Fury/i })).toBeNull();
    const marks = screen
      .getAllByText(/deployment phase/i)
      .filter((node) => node.tagName === "MARK");
    expect(marks).toHaveLength(1);
    expect(marks[0]?.textContent).toMatch(/deployment phase/i);
  });

  it("drops the marketing footer from the rules reference", () => {
    render(<CoreRulesScreen />);

    expect(screen.queryByText(/Not affiliated with Games Workshop/i)).toBeNull();
    expect(screen.queryByRole("link", { name: /Free army builder/i })).toBeNull();
  });

  it("shows the how-this-works intro on the Scourge pack only", () => {
    render(<CoreRulesScreen pack="scourge" />);

    expect(screen.getByRole("heading", { name: "How this works" })).toBeTruthy();
    expect(screen.getByText(/Fury is a level from 0 to 7/i)).toBeTruthy();
    expect(screen.getByText(/Rage dice are the pile you spend/i)).toBeTruthy();

    cleanup();
    render(<CoreRulesScreen />);
    expect(screen.queryByRole("heading", { name: "How this works" })).toBeNull();
    expect(screen.queryByText(/Fury is a level from 0 to 7/i)).toBeNull();
  });

  it("shows the intro above the five Scourge abilities", () => {
    render(<CoreRulesScreen pack="scourge" />);

    const intro = screen.getByRole("heading", { name: "How this works" });
    const firstAbility = screen.getByRole("button", { name: /Raising the Heat/i });

    const introCard = intro.closest("section.parchment-card");
    const abilityCard = firstAbility.closest("section.parchment-card");

    expect(introCard).toBeTruthy();
    expect(abilityCard).toBeTruthy();
    expect(introCard).not.toBe(abilityCard);

    const allCards = document.querySelectorAll("section.parchment-card");
    const introIndex = Array.from(allCards).indexOf(introCard!);
    const abilityIndex = Array.from(allCards).indexOf(abilityCard!);
    expect(introIndex).toBeLessThan(abilityIndex);
  });

  it("keeps the intro visible when search is empty", () => {
    render(<CoreRulesScreen pack="scourge" />);

    expect(screen.getByRole("heading", { name: "How this works" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Raising the Heat/i })).toBeTruthy();
  });

  it("contains the exact intro copy with all paragraphs", () => {
    render(<CoreRulesScreen pack="scourge" />);

    expect(
      screen.getByText("Fury is a level from 0 to 7. It does not go up just because the round number did."),
    ).toBeTruthy();
    expect(
      screen.getByText(/End of the round, leftovers are gone\. Next round you draw again\. You do not keep a stash\./),
    ).toBeTruthy();
    expect(
      screen.getByText(/Once, in deployment: attacker Fury 1, defender Fury 2/),
    ).toBeTruthy();
    expect(
      screen.getByText(/If nobody changes Fury: attacker stays at 1/),
    ).toBeTruthy();
    expect(
      screen.getByText(/A 6 on Eruption of Fury raises the opponent's Fury\. Fight Through the Pain drops yours/),
    ).toBeTruthy();
  });
});
