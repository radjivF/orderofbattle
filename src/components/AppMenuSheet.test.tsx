import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { APP_MENU_DRAWER_MS } from "@/lib/builderUi";

const push = vi.fn();
const navigation = vi.hoisted(() => ({ pathname: "/battle-record" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push }),
}));

import { AppMenuSheet } from "./AppMenuSheet";

function Harness({
  onSelect,
}: {
  onSelect: (menu: "aos" | "tow" | "tactics") => void;
}) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return null;
  }
  return (
    <AppMenuSheet
      active="aos"
      onSelect={onSelect}
      onClose={() => setOpen(false)}
    />
  );
}

afterEach(() => {
  cleanup();
  push.mockClear();
  navigation.pathname = "/battle-record";
  vi.useRealTimers();
});

describe("AppMenuSheet", () => {
  it("titles List builder and Battle record, with games as rows", () => {
    render(<Harness onSelect={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const scrim = dialog.parentElement?.querySelector(".modal-scrim");
    const classes = scrim?.className.split(/\s+/) ?? [];

    expect(classes).toContain("bg-ink/70");
    expect(classes).not.toContain("bg-ink");
    expect(screen.getByRole("heading", { name: "List builder" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Battle record" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "AOS lists" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "The old world lists" })).toBeNull();
    expect(screen.getByRole("button", { name: "AOS battle record" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "40k battle record" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Spearhead battle record" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Age of Sigmar" })).toBeNull();
    expect(dialog).toHaveTextContent("Coming soon");
    expect(dialog).toHaveTextContent("Spearhead");
    expect(dialog).not.toHaveTextContent("Games");
    expect(dialog).not.toHaveTextContent("Track a game");
  });

  it("keeps list rows in a plain stack, not a card", () => {
    render(<Harness onSelect={vi.fn()} />);

    const lists = screen.getByRole("button", { name: "AOS lists" });
    const group = lists.closest("ul");
    expect(group?.className).not.toContain("rounded-xl");
    expect(group?.className).not.toContain("gap-");
    expect(group).toHaveTextContent("The old world");
    expect(group).toHaveTextContent("40k");
    expect(group).not.toContainElement(
      screen.getByRole("button", { name: "AOS battle record" }),
    );
  });

  it("does not drill into a nested game menu", () => {
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Menu" }).querySelector(".app-menu-nav-track")).toBeNull();
    expect(screen.getByRole("button", { name: "AOS lists" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
  });

  it("titles List builder and Battle record the same way", () => {
    render(<Harness onSelect={vi.fn()} />);

    const lists = screen.getByRole("heading", { name: "List builder" });
    const battle = screen.getByRole("heading", { name: "Battle record" });
    expect(lists.tagName).toBe("H3");
    expect(battle.tagName).toBe("H3");
    expect(battle.className).toBe(lists.className);
    expect(lists.className).toContain("font-serif");
  });

  it("keeps hamburger order: list games, then battle record games", () => {
    render(<Harness onSelect={vi.fn()} />);

    const listTitle = screen.getByRole("heading", { name: "List builder" });
    const aosLists = screen.getByRole("button", { name: "AOS lists" });
    const listSection = listTitle.closest("section");
    const towComingSoon = listSection
      ? within(listSection).getByText("The old world")
      : null;
    const battleTitle = screen.getByRole("heading", { name: "Battle record" });
    const aosBattle = screen.getByRole("button", { name: "AOS battle record" });

    expect(towComingSoon).toBeTruthy();
    expect(
      listTitle.compareDocumentPosition(aosLists) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      aosLists.compareDocumentPosition(towComingSoon!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      towComingSoon!.compareDocumentPosition(battleTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      battleTitle.compareDocumentPosition(aosBattle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const battleSection = battleTitle.closest("section");
    expect(battleSection).toHaveTextContent("Coming soon");
    expect(battleSection).toHaveTextContent("Spearhead");
    expect(battleSection).not.toContainElement(aosLists);
  });

  it("does not treat coming-soon games as links", () => {
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    expect(screen.queryByRole("button", { name: /coming soon/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "The old world lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Spearhead battle record" })).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("mutes coming-soon rows so they do not look like links", () => {
    render(<Harness onSelect={vi.fn()} />);

    const row = screen.getByText("Spearhead").closest("div");
    const classes = row?.className.split(/\s+/) ?? [];
    expect(classes).toContain("opacity-40");
    expect(classes).toContain("pointer-events-none");
    expect(classes).toContain("cursor-default");
    expect(classes).not.toContain("cursor-pointer");
    expect(classes).not.toContain("pressable");
    expect(row).toHaveAttribute("aria-disabled", "true");
  });

  it("opens Lists by sliding the menu out over the swap", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      pointerEventsCheck: 0,
      advanceTimers: vi.advanceTimersByTime,
    });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "AOS lists" }));

    expect(onSelect).toHaveBeenCalledWith("aos");
    expect(push).toHaveBeenCalledWith("/dashboard", { scroll: false });
    expect(screen.getByRole("dialog", { name: "Menu" }).className).toContain(
      "app-menu-drawer--out",
    );
    const leaveScrim = screen
      .getByRole("dialog", { name: "Menu" })
      .parentElement?.querySelector(".modal-scrim");
    expect(leaveScrim?.className.split(/\s+/)).toContain("bg-ink/70");
    expect(leaveScrim?.className.split(/\s+/)).toContain("app-menu-scrim--out");
    expect(leaveScrim?.className.split(/\s+/)).not.toContain("bg-ink");

    vi.advanceTimersByTime(APP_MENU_DRAWER_MS);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
    });
  });

  it("opens Battle record under the dim drawer instead of covering the page in ink", async () => {
    navigation.pathname = "/dashboard";
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      pointerEventsCheck: 0,
      advanceTimers: vi.advanceTimersByTime,
    });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "AOS battle record" }));

    expect(onSelect).toHaveBeenCalledWith("tactics");
    expect(push).toHaveBeenCalledWith("/battle-record", { scroll: false });
    const leaveScrim = screen
      .getByRole("dialog", { name: "Menu" })
      .parentElement?.querySelector(".modal-scrim");
    const classes = leaveScrim?.className.split(/\s+/) ?? [];
    expect(classes).toContain("bg-ink/70");
    expect(classes).toContain("app-menu-scrim--out");
    expect(classes).not.toContain("bg-ink");
  });

  it("sends Lists from the homepage to My lists", async () => {
    navigation.pathname = "/";
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: "AOS lists" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "AOS lists" }));

    expect(onSelect).toHaveBeenCalledWith("aos");
    expect(push).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });

  it("marks Battle record current on the battle record list", () => {
    navigation.pathname = "/battle-record";
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "AOS lists" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "AOS battle record" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("returns to the Battle record list from a live game", async () => {
    navigation.pathname = "/battle-record/game-1";
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<Harness onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "AOS battle record" }));

    expect(push).toHaveBeenCalledWith("/battle-record", { scroll: false });
  });

  it("stays on the Battle record list when you pick it again", async () => {
    navigation.pathname = "/battle-record";
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<Harness onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "AOS battle record" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("does not open The old world lists before release", () => {
    navigation.pathname = "/dashboard";
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    expect(
      screen.queryByRole("button", { name: "The old world lists" }),
    ).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
