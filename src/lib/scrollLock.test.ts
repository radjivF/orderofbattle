import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  lockPageScroll,
  pageScrollLockDepth,
  pageScrollLockSavedY,
  unlockPageScroll,
} from "./scrollLock";

function styleBag() {
  return {} as Record<string, string>;
}

function installDom(scrollY = 240) {
  const body = { style: styleBag() };
  const html = { style: styleBag() };
  const scrollTo = vi.fn();
  vi.stubGlobal("document", {
    body,
    documentElement: html,
  });
  vi.stubGlobal("window", { scrollY, scrollTo });
  return { body, html, scrollTo };
}

describe("scrollLock", () => {
  beforeEach(() => {
    installDom();
  });

  afterEach(() => {
    while (pageScrollLockDepth() > 0) {
      unlockPageScroll();
    }
    vi.unstubAllGlobals();
  });

  it("freezes the page at the current scroll position", () => {
    const { body, html } = installDom(240);
    lockPageScroll();
    expect(pageScrollLockDepth()).toBe(1);
    expect(pageScrollLockSavedY()).toBe(240);
    expect(body.style.position).toBe("fixed");
    expect(body.style.top).toBe("-240px");
    expect(html.style.overscrollBehavior).toBe("none");
  });

  it("restores scroll after nested locks unwind", () => {
    const { scrollTo } = installDom(120);
    lockPageScroll();
    lockPageScroll();
    unlockPageScroll();
    expect(pageScrollLockDepth()).toBe(1);
    unlockPageScroll();
    expect(pageScrollLockDepth()).toBe(0);
    expect(scrollTo).toHaveBeenCalledWith(0, 120);
  });
});
