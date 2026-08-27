export const STANDARD_POINTS_CAPS = [1000, 1500, 2000, 2500, 3000] as const;

export function isStandardPointsCap(points: number): boolean {
  return (STANDARD_POINTS_CAPS as readonly number[]).includes(points);
}

export function parsePointsCap(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value) || value < 1) {
    return null;
  }
  return Math.min(value, 99_999);
}

export function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}
