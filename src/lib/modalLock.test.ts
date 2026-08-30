// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acquireModalLayer,
  isTopModal,
  releaseModalLayer,
} from "./modalLock";

describe("modalLock", () => {
  afterEach(() => {
    document.body.style.pointerEvents = "";
    while (document.body.classList.contains("scroll-locked")) {
      document.body.classList.remove("scroll-locked");
    }
  });

  it("tracks modal stack and top dismiss handler", () => {
    const closeA = vi.fn();
    const closeB = vi.fn();

    const zA = acquireModalLayer(closeA);
    const zB = acquireModalLayer(closeB);
    expect(zB).toBeGreaterThan(zA);
    expect(isTopModal(closeB)).toBe(true);
    expect(isTopModal(closeA)).toBe(false);

    releaseModalLayer(closeB);
    expect(isTopModal(closeA)).toBe(true);

    releaseModalLayer(closeA);
    expect(document.body.style.pointerEvents).toBe("");
  });
});
