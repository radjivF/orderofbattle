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
  it("asks for names, armies, double turn, and painted only", () => {
    render(
      <BattleRecordCreateSheet
        open
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "New battle record" });
    expect(within(dialog).getByLabelText("Your name")).toBeTruthy();
    expect(within(dialog).getByLabelText("Your army").tagName).toBe("SELECT");
    expect(within(dialog).getByLabelText("Opponent name")).toBeTruthy();
    expect(within(dialog).getByLabelText("Opponent army").tagName).toBe(
      "SELECT",
    );
    expect(
      within(dialog).getByRole("group", { name: "Allow double turn" }),
    ).toBeTruthy();
    expect(within(dialog).getByText("Yours painted")).toBeTruthy();
    expect(within(dialog).getByText("Opponent painted")).toBeTruthy();
    expect(within(dialog).queryByLabelText("Battleplan")).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "Continue" }),
    ).toBeDisabled();
  });
});
