/** Canonical brand copy. Same text in metadata, schema, and llms.txt. */

export const SITE_NAME = "Order of Battle";

export const SITE_DESCRIPTION =
  "Order of Battle is a free unofficial Age of Sigmar 4th edition army builder and table companion. Build lists with regiments and Regiments of Renown, then track wounds, spells, and phase abilities at the table. No account; lists stay on your device.";

export const SITE_SHORT_DESCRIPTION =
  "Free unofficial Age of Sigmar army builder and table companion. Lists stay on your device.";

export const SITE_KEYWORDS = [
  "Age of Sigmar army builder",
  "free AoS list builder",
  "Warhammer Age of Sigmar 4th edition",
  "Age of Sigmar list builder",
  "AoS army builder no account",
  "Age of Sigmar companion app",
  "Regiments of Renown builder",
  "Order of Battle",
];

export const SITE_CONTACT_EMAIL = "contact@zheat.xyz";

export const SITE_MAKER_URL = "https://zheat.xyz";

export const SITE_GITHUB_URL = "https://github.com/radjivF/orderofbattle";

export const SITE_PUBLISHED = "2026-08-27";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

export function sitePath(path: string): string {
  const base = getSiteUrl();
  if (path === "/") {
    return base;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
