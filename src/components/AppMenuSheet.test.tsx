import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  it("shows each game as a title, with Lists and Battle record under Age of Sigmar", () => {
    render(<Harness onSelect={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const scrim = dialog.parentElement?.querySelector(".modal-scrim");
    const classes = scrim?.className.split(/\s+/) ?? [];

    expect(classes).toContain("bg-ink/70");
    expect(classes).not.toContain("bg-ink");
    expect(screen.getByRole("heading", { name: "Age of Sigmar" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The old world" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "40k" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lists" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Battle record" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "The old world" })).toBeNull();
    expect(screen.queryByRole("button", { name: "40k" })).toBeNull();
    expect(dialog).toHaveTextContent("Coming soon");
    expect(dialog).not.toHaveTextContent("Games");
    expect(dialog).not.toHaveTextContent("Track a game");
    expect(screen.queryByRole("button", { name: "Age of Sigmar" })).toBeNull();
  });

  it("stacks Lists and Battle record under Age of Sigmar, not inside a card with other games", () => {
    render(<Harness onSelect={vi.fn()} />);

    const lists = screen.getByRole("button", { name: "Lists" });
    const group = lists.closest("ul");
    expect(group?.className).not.toContain("rounded-xl");
    expect(group?.className).not.toContain("gap-");
    expect(group).toContainElement(
      screen.getByRole("button", { name: "Battle record" }),
    );
    expect(group).not.toHaveTextContent("The old world");
    expect(group).not.toHaveTextContent("40k");
    expect(group).not.toHaveTextContent("Coming soon");
  });

  it("does not drill into a nested game menu", () => {
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Menu" }).querySelector(".app-menu-nav-track")).toBeNull();
    expect(screen.getByRole("button", { name: "Lists" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "40k" })).toBeNull();
  });

  it("titles The old world and 40k the same way as Age of Sigmar", () => {
    render(<Harness onSelect={vi.fn()} />);

    const aos = screen.getByRole("heading", { name: "Age of Sigmar" });
    const tow = screen.getByRole("heading", { name: "The old world" });
    const fortyK = screen.getByRole("heading", { name: "40k" });
    expect(aos.tagName).toBe("H3");
    expect(tow.tagName).toBe("H3");
    expect(fortyK.tagName).toBe("H3");
    expect(tow.className).toBe(aos.className);
    expect(fortyK.className).toBe(aos.className);
    expect(aos.className).toContain("font-serif");
  });

  it("keeps hamburger order: Age of Sigmar links, then coming-soon titles", () => {
    render(<Harness onSelect={vi.fn()} />);

    const aos = screen.getByRole("heading", { name: "Age of Sigmar" });
    const lists = screen.getByRole("button", { name: "Lists" });
    const battle = screen.getByRole("button", { name: "Battle record" });
    const tow = screen.getByRole("heading", { name: "The old world" });
    const fortyK = screen.getByRole("heading", { name: "40k" });

    expect(
      aos.compareDocumentPosition(lists) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      lists.compareDocumentPosition(battle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      battle.compareDocumentPosition(tow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      tow.compareDocumentPosition(fortyK) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const towSection = tow.closest("section");
    const fortySection = fortyK.closest("section");
    expect(towSection).toHaveTextContent("Coming soon");
    expect(fortySection).toHaveTextContent("Coming soon");
    expect(towSection).not.toContainElement(lists);
    expect(fortySection).not.toContainElement(battle);
  });

  it("does not treat coming-soon games as links", () => {
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    expect(screen.getByRole("heading", { name: "40k" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /coming soon/i })).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("opens Lists by sliding the menu out over the swap", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      pointerEventsCheck: 0,
      advanceTimers: vi.advanceTimersByTime,
    });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Lists" }));

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

    await user.click(screen.getByRole("button", { name: "Battle record" }));

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

    expect(screen.getByRole("button", { name: "Lists" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Lists" }));

    expect(onSelect).toHaveBeenCalledWith("aos");
    expect(push).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });

  it("marks Battle record current on the battle record list", () => {
    navigation.pathname = "/battle-record";
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Lists" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Battle record" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
