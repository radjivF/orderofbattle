/** Temporary battleplan map images in /public/battleplans — swap for generated art later. */
export function battleplanArtSrc(battleplanId: string): string {
  return `/battleplans/${battleplanId}.jpg`;
}
