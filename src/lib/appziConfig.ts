import { shouldLoadAnalytics } from "@/lib/analyticsEnv";
import type { ConsentStatus } from "@/lib/cookieConsent";

const DEFAULT_APPZI_TOKEN = "CLW7x";

export function getAppziToken(): string | undefined {
  if (process.env.NEXT_PUBLIC_APPZI_TOKEN !== undefined) {
    return process.env.NEXT_PUBLIC_APPZI_TOKEN.trim() || undefined;
  }
  return DEFAULT_APPZI_TOKEN;
}

export function appziScriptSrc(token: string): string {
  return `https://w.appzi.io/strict.js?token=${token}`;
}

export function shouldLoadAppzi(
  hostname: string,
  nodeEnv?: string,
  token = getAppziToken(),
): boolean {
  return Boolean(token) && shouldLoadAnalytics(hostname, nodeEnv);
}

export function isAppziConsentAllowed(
  consentRequired: boolean,
  status: ConsentStatus,
): boolean {
  return !consentRequired || status === "accepted";
}
