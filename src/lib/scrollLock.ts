/** Freeze page scroll while overlays are open — needed on iOS Safari. */

let lockDepth = 0;
let savedScrollY = 0;

function appRoot() {
  if (typeof document === "undefined") {
    return null;
  }
  return {
    body: document.body,
    html: document.documentElement,
  };
}

/** Prevent background scroll and pull-to-refresh while a modal is open. */
export function lockPageScroll() {
  const root = appRoot();
  if (!root) {
    return;
  }
  if (lockDepth === 0) {
    savedScrollY = window.scrollY;
    const { body, html } = root;
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
  }
  lockDepth += 1;
}

export function unlockPageScroll(restoreY?: number) {
  const root = appRoot();
  if (!root) {
    return;
  }
  if (lockDepth === 0) {
    return;
  }
  lockDepth -= 1;
  if (lockDepth > 0) {
    return;
  }
  const { body, html } = root;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
  html.style.overflow = "";
  html.style.overscrollBehavior = "";
  window.scrollTo(0, restoreY ?? savedScrollY);
}

/** @visibleForTesting */
export function pageScrollLockDepth() {
  return lockDepth;
}

/** @visibleForTesting */
export function pageScrollLockSavedY() {
  return savedScrollY;
}
