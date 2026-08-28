/** Blocks pointer events on the page while one or more modals are open. */
let lockCount = 0;

function appBody() {
  return typeof document !== "undefined" ? document.body : null;
}

export function lockAppPointerEvents() {
  lockCount += 1;
  if (lockCount === 1) {
    const body = appBody();
    if (body) {
      body.style.pointerEvents = "none";
    }
  }
}

export function unlockAppPointerEvents() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const body = appBody();
    if (body) {
      body.style.pointerEvents = "";
    }
  }
}
