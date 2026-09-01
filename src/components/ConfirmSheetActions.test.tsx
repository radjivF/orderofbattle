import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils/render";
import { ConfirmSheetActions } from "./ConfirmSheetActions";

describe("ConfirmSheetActions", () => {
  it("puts confirm and cancel beside each other", () => {
    render(
      <ConfirmSheetActions
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Delete" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(confirm.parentElement).toBe(cancel.parentElement);
    expect(cancel.parentElement?.className).toContain("ios-sheet-actions");
  });
});
