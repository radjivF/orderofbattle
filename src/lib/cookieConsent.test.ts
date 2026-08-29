// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  getConsentStatus,
  hasUserResponded,
  setConsentStatus,
} from "./cookieConsent";

describe("cookieConsent", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("starts with no response", () => {
    expect(getConsentStatus()).toBeNull();
    expect(hasUserResponded()).toBe(false);
  });

  it("persists accepted and rejected choices", () => {
    setConsentStatus("accepted");
    expect(getConsentStatus()).toBe("accepted");
    expect(hasUserResponded()).toBe(true);

    setConsentStatus("rejected");
    expect(getConsentStatus()).toBe("rejected");
  });
});
