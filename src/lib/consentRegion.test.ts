import { describe, expect, it } from "vitest";
import {
  countryFromRequestHeaders,
  normalizeCountryCode,
  requiresCookieConsent,
} from "./consentRegion";

describe("requiresCookieConsent", () => {
  it("requires consent in the EU, EEA, and UK", () => {
    expect(requiresCookieConsent("DE")).toBe(true);
    expect(requiresCookieConsent("FR")).toBe(true);
    expect(requiresCookieConsent("NO")).toBe(true);
    expect(requiresCookieConsent("GB")).toBe(true);
  });

  it("does not require consent outside Europe", () => {
    expect(requiresCookieConsent("US")).toBe(false);
    expect(requiresCookieConsent("CA")).toBe(false);
    expect(requiresCookieConsent("AU")).toBe(false);
    expect(requiresCookieConsent("JP")).toBe(false);
  });

  it("defaults to required when country is unknown", () => {
    expect(requiresCookieConsent(null)).toBe(true);
    expect(requiresCookieConsent("")).toBe(true);
    expect(requiresCookieConsent("XX")).toBe(true);
  });
});

describe("normalizeCountryCode", () => {
  it("normalizes and rejects Cloudflare placeholders", () => {
    expect(normalizeCountryCode(" us ")).toBe("US");
    expect(normalizeCountryCode("XX")).toBeNull();
    expect(normalizeCountryCode("T1")).toBeNull();
  });
});

describe("countryFromRequestHeaders", () => {
  it("reads cf-ipcountry case-insensitively", () => {
    const headers = new Headers({ "cf-ipcountry": "nl" });
    expect(countryFromRequestHeaders(headers)).toBe("NL");
  });
});
