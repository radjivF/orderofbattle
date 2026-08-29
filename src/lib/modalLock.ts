/** Modal stack: pointer lock, z-index layering, scroll lock, and top-only dismiss. */

import { lockPageScroll, unlockPageScroll } from "./scrollLock";

const BASE_Z = 100;
const Z_STEP = 10;

let lockCount = 0;
const closeHandlers: Array<() => void> = [];

function appBody() {
  return typeof document !== "undefined" ? document.body : null;
}

function syncBodyPointerLock() {
  const body = appBody();
  if (!body) {
    return;
  }
  body.style.pointerEvents = lockCount > 0 ? "none" : "";
}

/** Reserve the next modal layer; returns its z-index. */
export function acquireModalLayer(onClose: () => void): number {
  lockCount += 1;
  closeHandlers.push(onClose);
  syncBodyPointerLock();
  lockPageScroll();
  return BASE_Z + (lockCount - 1) * Z_STEP;
}

export function releaseModalLayer(onClose: () => void) {
  const idx = closeHandlers.lastIndexOf(onClose);
  if (idx >= 0) {
    closeHandlers.splice(idx, 1);
  }
  lockCount = Math.max(0, lockCount - 1);
  syncBodyPointerLock();
  unlockPageScroll();
}

export function isTopModal(onClose: () => void): boolean {
  return closeHandlers[closeHandlers.length - 1] === onClose;
}
