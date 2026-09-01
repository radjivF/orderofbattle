import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { APP_MENU_DRAWER_MS } from "@/lib/builderUi";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/battle-record",
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
  vi.useRealTimers();
});

describe("AppMenuSheet", () => {
  it("dims the page under the drawer instead of covering it in solid ink", () => {
    render(<Harness onSelect={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const scrim = dialog.parentElement?.querySelector(".modal-scrim");
    const classes = scrim?.className.split(/\s+/) ?? [];

    expect(classes).toContain("bg-ink/70");
    expect(classes).not.toContain("bg-ink");
    expect(dialog).toHaveTextContent("Age of Sigmar");
    expect(dialog).toHaveTextContent("Battle record");
  });

  it("shows The old world as coming soon and does not select it", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    const row = screen.getByRole("button", {
      name: "The old world (coming soon)",
    });
    expect(row).toBeDisabled();

    await user.click(row);

    expect(onSelect).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "The Old World" }),
    ).toBeNull();
  });

  it("leaves Battle record for Age of Sigmar by sliding the menu out over the swap", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      pointerEventsCheck: 0,
      advanceTimers: vi.advanceTimersByTime,
    });
    const onSelect = vi.fn();

    render(<Harness onSelect={onSelect} />);

    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Age of Sigmar" }));

    expect(onSelect).toHaveBeenCalledWith("aos");
    // Route swaps immediately under the still-open drawer.
    expect(push).toHaveBeenCalledWith("/dashboard", { scroll: false });
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Menu" }).className).toContain(
      "app-menu-drawer--out",
    );
    const leaveScrim = screen
      .getByRole("dialog", { name: "Menu" })
      .parentElement?.querySelector(".modal-scrim");
    expect(leaveScrim?.className.split(/\s+/)).toContain("bg-ink");

    vi.advanceTimersByTime(APP_MENU_DRAWER_MS);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
    });
  });
});
