import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import type { ArmyList } from "@/engine/types";
import { WHATS_NEW_ITEMS } from "@/lib/whatsNew";
import { cleanup, render, screen } from "@/test-utils/render";
import { WhatsNewNotice } from "./WhatsNewNotice";

const armyStore = vi.hoisted(() => ({
  items: undefined as ArmyList[] | undefined,
}));

vi.mock("@/lib/storage", () => ({
  subscribeArmies: (onStoreChange: () => void) => {
    onStoreChange();
    return () => {};
  },
  getArmiesSnapshot: () => armyStore.items,
  getArmiesServerSnapshot: () => undefined,
}));

describe("WhatsNewNotice", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    armyStore.items = undefined;
  });

  it("does not show while lists are loading", () => {
    render(<WhatsNewNotice />);
    expect(screen.queryByRole("status", { name: "What's new" })).toBeNull();
  });

  it("does not show for a first-time visitor with an empty library", () => {
    armyStore.items = [];
    render(<WhatsNewNotice />);
    expect(screen.queryByRole("status", { name: "What's new" })).toBeNull();
  });

  it("asks a returning user if they want to see the bug fixes", () => {
    armyStore.items = [blankArmy("stormcast-eternals", "My army")];
    render(<WhatsNewNotice />);

    const notice = screen.getByRole("status", { name: "What's new" });
    expect(notice).toHaveTextContent("We fixed a few bugs. Want to see?");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("reveals the fixes without opening a blocking dialog", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "My army")];
    render(<WhatsNewNotice />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "See" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    const items = screen.getByRole("list");
    for (const line of WHATS_NEW_ITEMS) {
      expect(items).toHaveTextContent(line);
    }
  });

  it("goes away after Dismiss and stays gone", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "My army")];
    const user = userEvent.setup();
    const { unmount } = render(<WhatsNewNotice />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status", { name: "What's new" })).toBeNull();

    unmount();
    render(<WhatsNewNotice />);
    expect(screen.queryByRole("status", { name: "What's new" })).toBeNull();
  });
});
