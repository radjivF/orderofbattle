import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test-utils/render";
import { ModalFrame } from "./ModalFrame";

describe("ModalFrame", () => {
  it("renders labelled dialog content and closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <ModalFrame
        label="Test sheet"
        onClose={onClose}
        panelClassName="test-panel"
        variant="center"
      >
        <p>Sheet body</p>
      </ModalFrame>,
    );

    expect(screen.getByRole("dialog", { name: "Test sheet" })).toBeInTheDocument();
    expect(screen.getByText("Sheet body")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
