/** Pure helpers for iOS-style bottom sheet pull-to-dismiss. */

const SHEET_DRAG_CONTROL_SELECTOR =
  "button, a, input, textarea, select, label, [role='tab'], [role='slider']";

export function isSheetDragControl(target: EventTarget | null): boolean {
  return Boolean(
    target instanceof Element && target.closest(SHEET_DRAG_CONTROL_SELECTOR),
  );
}

export function sheetDismissEligible(input: {
  fromGrabber: boolean;
  fromControl?: boolean;
  inScrollArea: boolean;
  scrollTop: number;
}): boolean {
  if (input.fromGrabber) {
    return true;
  }
  if (input.fromControl) {
    return false;
  }
  if (!input.inScrollArea) {
    return true;
  }
  return input.scrollTop <= 0;
}

export function shouldBeginSheetDrag(input: {
  dismissEligible: boolean;
  scrollTop: number;
  dy: number;
  thresholdPx?: number;
}): boolean {
  if (!input.dismissEligible) {
    return false;
  }
  if (input.scrollTop > 0) {
    return false;
  }
  if (input.dy <= 0) {
    return false;
  }
  return input.dy > (input.thresholdPx ?? 4);
}

export function shouldCommitSheetDismiss(
  offset: number,
  panelHeight: number,
  thresholdRatio = 0.22,
): boolean {
  return offset >= panelHeight * thresholdRatio;
}
