export type SlidePhase = "start" | "in" | "out" | "settled";

/** Hold the return cover long enough to hide the route swap on mobile Safari. */
export const LIBRARY_RETURN_COVER_MS = 280;

/** CSS class for iOS-style push transition on the list builder stack. */
export function iosPushSlideClass(phase: SlidePhase): string {
  if (phase === "start") {
    return "ios-push-start";
  }
  if (phase === "in") {
    return "ios-push-in";
  }
  if (phase === "out") {
    return "ios-push-out";
  }
  return "";
}

/** True once My lists is mounted and the army cache is ready to paint. */
export function libraryReturnCoverCanDismiss(input: {
  isBuilder: boolean;
  listsReady: boolean;
}): boolean {
  return !input.isBuilder && input.listsReady;
}

export function libraryReturnCoverRemainingMs(
  startedAt: number,
  now: number,
): number {
  return Math.max(0, LIBRARY_RETURN_COVER_MS - (now - startedAt));
}
