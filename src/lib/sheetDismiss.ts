/** Pure helpers for iOS-style bottom sheet pull-to-dismiss. */

export function sheetDismissEligible(input: {
  fromGrabber: boolean;
  inScrollArea: boolean;
  scrollTop: number;
}): boolean {
  if (input.fromGrabber) {
    return true;
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
