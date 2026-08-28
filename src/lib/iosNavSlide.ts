export type SlidePhase = "start" | "in" | "out" | "settled";

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
