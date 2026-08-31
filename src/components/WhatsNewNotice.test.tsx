import type { MouseEventHandler, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import type { ArmyList } from "@/engine/types";
import { WHATS_NEW_AUTO_DISMISS_MS } from "@/lib/whatsNew";
import { UPDATES_PATH } from "@/lib/updatesPage";
import { act, cleanup, render, screen } from "@/test-utils/render";
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

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...props
  }: {
    children: ReactNode;
    href: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

describe("WhatsNewNotice", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    armyStore.items = undefined;
    vi.useRealTimers();
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

  it("sends See to the updates page instead of stuffing the list in the toast", () => {
    armyStore.items = [blankArmy("stormcast-eternals", "My army")];
    render(<WhatsNewNotice />);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    const see = screen.getByRole("link", { name: "See" });
    expect(see).toHaveAttribute("href", UPDATES_PATH);
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

  it("disappears by itself after a few seconds and stays gone", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    armyStore.items = [blankArmy("stormcast-eternals", "My army")];
    const { unmount } = render(<WhatsNewNotice />);

    expect(screen.getByRole("status", { name: "What's new" }));
    await act(async () => {
      vi.advanceTimersByTime(WHATS_NEW_AUTO_DISMISS_MS - 1);
    });
    expect(screen.getByRole("status", { name: "What's new" }));
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("status", { name: "What's new" })).toBeNull();

    unmount();
    render(<WhatsNewNotice />);
    expect(screen.queryByRole("status", { name: "What's new" })).toBeNull();
  });
});
