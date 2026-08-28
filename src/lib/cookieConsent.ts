const CONSENT_KEY = "oob-cookie-consent";

export type ConsentStatus = "accepted" | "rejected" | null;

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export function setConsentStatus(status: "accepted" | "rejected"): void {
  localStorage.setItem(CONSENT_KEY, status);
}

export function hasUserResponded(): boolean {
  return getConsentStatus() !== null;
}
