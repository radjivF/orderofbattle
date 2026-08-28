/**
 * EU + EEA + UK — regions where analytics cookies typically need opt-in consent.
 * Unknown country defaults to required (safer if geo header is missing).
 */
const CONSENT_REQUIRED_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EEA (non-EU)
  "IS",
  "LI",
  "NO",
  // UK (post-Brexit GDPR)
  "GB",
]);

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized === "XX" || normalized === "T1") return null;
  return normalized;
}

/** Cloudflare sends CF-IPCountry on deployed sites. */
export function countryFromRequestHeaders(
  headers: Headers | { get(name: string): string | null },
): string | null {
  return normalizeCountryCode(
    headers.get("cf-ipcountry") ?? headers.get("CF-IPCountry"),
  );
}

export function requiresCookieConsent(countryCode: string | null | undefined): boolean {
  const code = normalizeCountryCode(countryCode);
  if (!code) return true;
  return CONSENT_REQUIRED_COUNTRIES.has(code);
}
