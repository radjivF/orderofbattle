import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@/test-utils/render";
import { ModalFrame, useModalDismiss } from "./ModalFrame";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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

  it("keeps the drag grabber visible on full-page sheets at any viewport", () => {
    render(
      <ModalFrame
        label="Play sheet"
        onClose={() => undefined}
        fullPage
        panelClassName="test-panel"
      >
        <div className="modal-sheet-scroll">body</div>
      </ModalFrame>,
    );

    const grabber = screen
      .getByRole("dialog", { name: "Play sheet" })
      .querySelector(".modal-grabber");
    expect(grabber).not.toBeNull();
    expect(grabber?.className).not.toContain("sm:hidden");
  });

  it("hides the grabber on compact sheets from sm and up", () => {
    render(
      <ModalFrame
        label="Compact sheet"
        onClose={() => undefined}
        panelClassName="test-panel"
      >
        <p>body</p>
      </ModalFrame>,
    );

    const grabber = screen
      .getByRole("dialog", { name: "Compact sheet" })
      .querySelector(".modal-grabber");
    expect(grabber?.className).toContain("sm:hidden");
  });

  it("slides a full-page sheet down before calling onClose", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    const onClose = vi.fn();
    render(
      <ModalFrame
        label="Play sheet"
        onClose={onClose}
        fullPage
        panelClassName="test-panel"
      >
        <ClosePlayButton />
      </ModalFrame>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close play" }));

    const dialog = screen.getByRole("dialog", { name: "Play sheet" });
    expect(dialog.className).toContain("modal-sheet--animating");
    expect(dialog.style.transform).toBe("translateY(400px)");
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(280);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function ClosePlayButton() {
  const close = useModalDismiss();
  return (
    <button type="button" onClick={close}>
      Close play
    </button>
  );
}
