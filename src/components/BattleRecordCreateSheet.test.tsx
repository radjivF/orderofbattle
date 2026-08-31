import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { BattleRecordCreateSheet } from "./BattleRecordCreateSheet";

beforeEach(() => {
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
  it("keeps Start battle disabled until the form is complete", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    expect(
      within(dialog).getByRole("button", { name: "Start battle" }),
    ).toBeDisabled();
    expect(within(dialog).getByLabelText("Your name")).toBeTruthy();
    expect(within(dialog).getByLabelText("Opponent name")).toBeTruthy();
  });

  it("lists Scourge of Aqshy battleplans", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    const select = within(dialog).getByLabelText("Battleplan");
    expect(select.querySelectorAll("option")).toHaveLength(12);
  });
});
