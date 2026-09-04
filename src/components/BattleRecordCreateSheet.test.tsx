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
  it("opens as a centered sheet on large screens", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    expect(dialog.className).toContain("modal-sheet");
    expect(dialog.className).not.toContain("modal-sheet--page");
    expect(dialog.className).toContain("max-h-[85vh]");
    expect(dialog.className).toContain("max-w-lg");
    expect(within(dialog).getByLabelText("Your name")).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Continue" }),
    ).toBeTruthy();
  });

  it("opens the army picker as a centered sheet too", async () => {
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
    expect(picker.className).toContain("modal-sheet");
    expect(picker.className).not.toContain("modal-sheet--page");
    expect(picker.className).toContain("max-h-[85vh]");
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
    expect(
      within(dialog).getByRole("group", { name: "Show CP" }),
    ).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "On" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dialog).getByText("Yours painted")).toBeTruthy();
    expect(within(dialog).getByText("Opponent painted")).toBeTruthy();
    expect(within(dialog).queryByLabelText("Battleplan")).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "Continue" }),
    ).toBeEnabled();
    expect(within(dialog).queryByText("Put a name")).toBeNull();
    expect(within(dialog).queryByText("Your army is not selected")).toBeNull();
    expect(within(dialog).queryByText("Put an opponent name")).toBeNull();
    expect(
      within(dialog).queryByText("Opponent army is not selected"),
    ).toBeNull();
    const footer = within(dialog).getByRole("button", {
      name: "Continue",
    }).parentElement;
    expect(footer?.className).toMatch(/\bpt-/);
  });

  it("warns about both missing names, armies stay optional", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCreated = vi.fn();
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={onCreated}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));

    expect(onCreated).not.toHaveBeenCalled();
    expect(within(dialog).getByText("Put a name")).toBeTruthy();
    expect(within(dialog).getByText("Put an opponent name")).toBeTruthy();
    expect(within(dialog).queryByText("Your army is not selected")).toBeNull();
    expect(
      within(dialog).queryByText("Opponent army is not selected"),
    ).toBeNull();

    const name = within(dialog).getByLabelText("Your name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    const describedBy = name.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      "Put a name",
    );

    expect(within(dialog).getByLabelText("Opponent name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    const army = within(dialog).getByRole("button", { name: "Your army" });
    expect(army).not.toHaveAttribute("aria-invalid", "true");
    expect(
      within(dialog).getByRole("button", { name: "Opponent army" }),
    ).not.toHaveAttribute("aria-invalid", "true");
  });

  it("creates the record from the two names alone", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCreated = vi.fn();
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={onCreated}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    await user.type(within(dialog).getByLabelText("Your name"), "Rad");
    await user.type(within(dialog).getByLabelText("Opponent name"), "Alex");
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));

    expect(onCreated).toHaveBeenCalledTimes(1);
    const game = onCreated.mock.calls[0]![0];
    expect(game.yourName).toBe("Rad");
    expect(game.opponentName).toBe("Alex");
    expect(game.yourArmy).toBe("");
    expect(game.opponentArmy).toBe("");
    expect(game.yourTacticCardIds).toEqual([]);
    expect(game.yourListId).toBeUndefined();
    expect(game.showCp).toBe(true);
  });

  it("keeps the warnings out of the footer action row", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));

    const footer = within(dialog).getByRole("button", {
      name: "Continue",
    }).parentElement;
    expect(footer).not.toContainElement(within(dialog).getByText("Put a name"));
  });

  it("splits Cancel and Continue 50-50 with space above the row", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const continueBtn = within(dialog).getByRole("button", { name: "Continue" });
    expect(cancel.parentElement).toBe(continueBtn.parentElement);
    expect(cancel.parentElement?.className).toContain("ios-sheet-actions-row");
    expect(cancel.parentElement?.className).toMatch(/\bpt-/);
    expect(cancel.className).toContain("flex-1");
    expect(continueBtn.className).toContain("flex-1");
    expect(cancel.className).toContain("min-h-11");
    expect(continueBtn.className).toContain("min-h-11");
    expect(cancel.className).toMatch(/bg-parchment-ink/);
    expect(continueBtn.className).toContain("ios-liquid-glass");
    expect(continueBtn).toBeEnabled();
    expect(
      cancel.compareDocumentPosition(continueBtn) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("closes from Cancel", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onClose = vi.fn();
    render(
      <BattleRecordCreateSheet
        open
        onClose={onClose}
        onCreated={() => undefined}
      />,
    );

    await user.click(
      within(screen.getByRole("dialog", { name: "New battle record" })).getByRole(
        "button",
        { name: "Cancel" },
      ),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("drops a warning as soon as that field is filled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(within(dialog).getByText("Put a name")).toBeTruthy();

    const name = within(dialog).getByLabelText("Your name");
    await user.type(name, "Rad");
    expect(within(dialog).queryByText("Put a name")).toBeNull();
    expect(name).not.toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByText("Put an opponent name")).toBeTruthy();
  });

  it("comes back empty and usable after a record was created", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCreated = vi.fn();
    armyStore.items = [blankArmy("sylvaneth", "My Sylvaneth")];

    const view = render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={onCreated}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    await user.type(within(dialog).getByLabelText("Your name"), "Rad");
    await user.click(within(dialog).getByLabelText("Your army"));
    await user.click(
      within(
        await screen.findByRole("dialog", { name: "Choose your army" }),
      ).getByRole("button", { name: /My Sylvaneth/ }),
    );
    await user.type(within(dialog).getByLabelText("Opponent name"), "Alex");
    await user.click(within(dialog).getByLabelText("Opponent army"));
    await user.click(
      within(
        await screen.findByRole("dialog", { name: "Choose opponent army" }),
      ).getByRole("button", { name: "Factions" }),
    );
    await user.click(
      within(
        screen.getByRole("dialog", { name: "Choose opponent army" }),
      ).getByRole("button", { name: "Stormcast Eternals" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(onCreated).toHaveBeenCalledTimes(1);

    view.rerender(
      <BattleRecordCreateSheet
        open={false}
        onClose={() => undefined}
        onCreated={onCreated}
      />,
    );
    view.rerender(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={onCreated}
      />,
    );

    const reopened = screen.getByRole("dialog", { name: "New battle record" });
    expect(
      within(reopened).queryByRole("button", { name: "Starting…" }),
    ).toBeNull();
    expect(
      within(reopened).getByRole("button", { name: "Continue" }),
    ).toBeEnabled();
    expect(within(reopened).getByLabelText("Your name")).toHaveValue("");
    expect(within(reopened).getByLabelText("Opponent name")).toHaveValue("");
    expect(within(reopened).getByLabelText("Your army")).toHaveTextContent(
      "Choose army…",
    );
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
