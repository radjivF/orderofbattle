import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils/render";
import { SheetFormActions } from "./SheetFormActions";

describe("SheetFormActions", () => {
  it("puts create to the right of cancel", () => {
    render(
      <SheetFormActions
        primaryLabel="Create"
        onPrimary={vi.fn()}
        secondaryLabel="Cancel"
        onSecondary={vi.fn()}
      />,
    );

    const create = screen.getByRole("button", { name: "Create" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(create.parentElement).toBe(cancel.parentElement);
    expect(cancel.parentElement?.className).toContain("ios-sheet-actions");
    expect(
      cancel.compareDocumentPosition(create) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
