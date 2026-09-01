import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import type { StoredList } from "@/engine/storedList";

const armyStore: { items: StoredList[] } = { items: [] };

vi.mock("@/lib/storage", () => ({
  subscribeArmies: (onStoreChange: () => void) => {
    onStoreChange();
    return () => undefined;
  },
  getArmiesSnapshot: () => armyStore.items,
  getArmiesServerSnapshot: () => armyStore.items,
}));

import { BattleRecordCreateSheet } from "./BattleRecordCreateSheet";

beforeEach(() => {
  armyStore.items = [];
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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

afterEach(() => {
  cleanup();
  document.body.removeAttribute("style");
});

describe("BattleRecordCreateSheet", () => {
  it("opens as a full-page sheet so the keyboard has room to type a name", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    expect(dialog.className).toContain("modal-sheet--page");
    expect(dialog.className).not.toContain("max-h-[85vh]");
    expect(within(dialog).getByLabelText("Your name")).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Continue" }),
    ).toBeTruthy();
  });

  it("opens the army picker full-page too", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    await user.click(screen.getByLabelText("Your army"));
    const picker = await screen.findByRole("dialog", {
      name: "Choose your army",
    });
    expect(picker.className).toContain("modal-sheet--page");
    expect(picker.className).not.toContain("max-h-[85vh]");
  });

  it("asks for names, armies, priority mode, and painted only", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    expect(within(dialog).getByLabelText("Your name")).toBeTruthy();
    expect(within(dialog).getByLabelText("Your army").tagName).toBe("BUTTON");
    expect(within(dialog).getByLabelText("Opponent name")).toBeTruthy();
    expect(within(dialog).getByLabelText("Opponent army").tagName).toBe(
      "BUTTON",
    );
    expect(
      within(dialog).getByRole("group", { name: "Priority and double turn" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByText(/Track who takes each turn \(AoS priority\)/),
    ).toBeTruthy();
    expect(within(dialog).getByText("Track priority")).toBeTruthy();
    expect(within(dialog).getByText("No initiative")).toBeTruthy();
    expect(within(dialog).getByText("Yours painted")).toBeTruthy();
    expect(within(dialog).getByText("Opponent painted")).toBeTruthy();
    expect(within(dialog).queryByLabelText("Battleplan")).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "Continue" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByText(
        /Still need your name, your army, opponent name, opponent army/,
      ),
    ).toBeTruthy();
  });

  it("lets you pick a saved list and preloads its battle tactics", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCreated = vi.fn();
    const list = {
      ...blankArmy("sylvaneth", "My Sylvaneth"),
      battleTacticCardIds: ["card-a", "card-b"],
    };
    armyStore.items = [list];

    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={onCreated}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    await user.type(within(dialog).getByLabelText("Your name"), "Rad");
    await user.click(within(dialog).getByLabelText("Your army"));

    const picker = await screen.findByRole("dialog", {
      name: "Choose your army",
    });
    expect(within(picker).getByText("My lists")).toBeTruthy();
    await user.click(within(picker).getByRole("button", { name: /My Sylvaneth/ }));

    expect(within(dialog).getByLabelText("Your army")).toHaveTextContent(
      "My Sylvaneth",
    );

    await user.type(within(dialog).getByLabelText("Opponent name"), "Alex");
    await user.click(within(dialog).getByLabelText("Opponent army"));
    const oppPicker = await screen.findByRole("dialog", {
      name: "Choose opponent army",
    });
    await user.click(within(oppPicker).getByRole("button", { name: "Factions" }));
    await user.click(
      within(oppPicker).getByRole("button", { name: "Stormcast Eternals" }),
    );

    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(onCreated).toHaveBeenCalled();
    const game = onCreated.mock.calls[0]![0];
    expect(game.yourArmy).toBe("My Sylvaneth");
    expect(game.yourListId).toBe(list.id);
    expect(game.yourTacticCardIds).toEqual(["card-a", "card-b"]);
    expect(game.opponentArmy).toBe("Stormcast Eternals");
    expect(game.opponentListId).toBeUndefined();
    expect(game.opponentTacticCardIds).toEqual([]);
  });
});
