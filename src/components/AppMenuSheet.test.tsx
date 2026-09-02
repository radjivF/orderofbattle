import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

import type { ActiveMenu } from "@/lib/activeMenu";
import { AppMenuSheet } from "./AppMenuSheet";

function Harness({
  onSelect,
}: {
  onSelect: (menu: ActiveMenu) => void;
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
  it("holds the closing drawer off-screen until it unmounts", () => {
    const root = path.dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(
      path.resolve(root, "../app/globals.css"),
      "utf8",
    );
    const rule = css.match(/\.app-menu-drawer--out\s*\{[^}]*\}/)?.[0];

    // Without a fill mode the panel snaps back to open when the animation
    // ends, which lands a frame before the matching unmount timer.
    expect(rule).toBeTruthy();
    expect(rule).toMatch(/forwards|both/);
  });

  it("groups AOS features, then 40k and The old world", () => {
    render(<Harness onSelect={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const scrim = dialog.parentElement?.querySelector(".modal-scrim");
    const classes = scrim?.className.split(/\s+/) ?? [];

    expect(classes).toContain("bg-ink/70");
    expect(classes).not.toContain("bg-ink");
    expect(screen.getByRole("heading", { name: "AOS" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "40k" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The old world" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "List builder" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "The old world lists" })).toBeNull();
    expect(screen.getByRole("button", { name: "Battle record" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Core rules" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Scourge of Aqshy rules" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "40k battle record" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Spearhead record" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "List builder" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Age of Sigmar" })).toBeNull();
    expect(dialog).toHaveTextContent("Coming soon");
    expect(dialog).toHaveTextContent("Spearhead record");
    expect(dialog).not.toHaveTextContent("Games");
    expect(dialog).not.toHaveTextContent("Track a game");
  });

  it("keeps list rows in a plain stack, not a card", () => {
    render(<Harness onSelect={vi.fn()} />);

    const lists = screen.getByRole("button", { name: "List builder" });
    const group = lists.closest("ul");
    expect(group?.className).not.toContain("rounded-xl");
    expect(group?.className).not.toContain("gap-");
    expect(group).toHaveTextContent("Spearhead record");
    expect(group).toContainElement(
      screen.getByRole("button", { name: "Battle record" }),
    );
    expect(group).not.toHaveTextContent("40k");
  });

  it("does not drill into a nested game menu", () => {
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Menu" }).querySelector(".app-menu-nav-track")).toBeNull();
    expect(screen.getByRole("button", { name: "List builder" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
  });

  it("titles AOS live and mutes games that are not out yet", () => {
    render(<Harness onSelect={vi.fn()} />);

    const aos = screen.getByRole("heading", { name: "AOS" });
    const fortyK = screen.getByRole("heading", { name: "40k" });
    const tow = screen.getByRole("heading", { name: "The old world" });
    expect(aos.tagName).toBe("H3");
    expect(fortyK.tagName).toBe("H3");
    expect(tow.tagName).toBe("H3");
    expect(aos.className).toContain("font-serif");
    expect(fortyK.className).toContain("sheet-muted");
    expect(tow.className).toContain("sheet-muted");
    expect(fortyK.className).not.toBe(aos.className);
  });

  it("keeps hamburger order: AOS features, then 40k, then The old world", () => {
    render(<Harness onSelect={vi.fn()} />);

    const aosTitle = screen.getByRole("heading", { name: "AOS" });
    const listBuilder = screen.getByRole("button", { name: "List builder" });
    const battle = screen.getByRole("button", { name: "Battle record" });
    const core = screen.getByRole("button", { name: "Core rules" });
    const scourge = screen.getByRole("button", { name: "Scourge of Aqshy rules" });
    const fortyK = screen.getByRole("heading", { name: "40k" });
    const tow = screen.getByRole("heading", { name: "The old world" });
    const aosSection = aosTitle.closest("section");
    const spearhead = aosSection
      ? within(aosSection).getByText("Spearhead record")
      : null;

    expect(spearhead).toBeTruthy();
    expect(
      aosTitle.compareDocumentPosition(listBuilder) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      listBuilder.compareDocumentPosition(battle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      battle.compareDocumentPosition(spearhead!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      spearhead!.compareDocumentPosition(core) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      core.compareDocumentPosition(scourge) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      scourge.compareDocumentPosition(fortyK) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      fortyK.compareDocumentPosition(tow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(aosSection).not.toContainElement(fortyK);
  });

  it("does not treat coming-soon games as links", () => {
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    expect(screen.queryByRole("button", { name: /coming soon/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "The old world lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "40k lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Spearhead record" })).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("mutes coming-soon rows so they do not look like links", () => {
    render(<Harness onSelect={vi.fn()} />);

    const row = screen.getByText("Spearhead record").closest("div");
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

    await user.click(screen.getByRole("button", { name: "List builder" }));

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

    expect(screen.getByRole("button", { name: "List builder" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "List builder" }));

    expect(onSelect).toHaveBeenCalledWith("aos");
    expect(push).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });

  it("marks Battle record current on the battle record list", () => {
    navigation.pathname = "/battle-record";
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "List builder" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Battle record" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("returns to the Battle record list from a live game", async () => {
    navigation.pathname = "/battle-record/game-1";
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<Harness onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Battle record" }));

    expect(push).toHaveBeenCalledWith("/battle-record", { scroll: false });
  });

  it("stays on the Battle record list when you pick it again", async () => {
    navigation.pathname = "/battle-record";
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<Harness onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Battle record" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("opens Core rules under Age of Sigmar", async () => {
    navigation.pathname = "/dashboard";
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Core rules" }));

    expect(onSelect).toHaveBeenCalledWith("core-rules");
    expect(push).toHaveBeenCalledWith("/core-rules", { scroll: false });
  });

  it("marks Core Rules current on the core rules page", () => {
    navigation.pathname = "/core-rules";
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "List builder" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Core rules" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens Scourge of Aqshy rules under Age of Sigmar", async () => {
    navigation.pathname = "/dashboard";
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Scourge of Aqshy rules" }));

    expect(onSelect).toHaveBeenCalledWith("scourge-rules");
    expect(push).toHaveBeenCalledWith("/scourge-rules", { scroll: false });
  });

  it("marks Scourge of Aqshy rules current on that page", () => {
    navigation.pathname = "/scourge-rules";
    render(<Harness onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Core rules" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      screen.getByRole("button", { name: "Scourge of Aqshy rules" }),
    ).toHaveAttribute("aria-pressed", "true");
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
