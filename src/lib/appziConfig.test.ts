import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appziScriptSrc,
  getAppziToken,
  isAppziConsentAllowed,
  shouldLoadAppzi,
} from "./appziConfig";

describe("appziConfig", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APPZI_TOKEN;
    vi.unstubAllEnvs();
  });

  it("defaults to the public portal token", () => {
    expect(getAppziToken()).toBe("CLW7x");
  });

  it("reads and trims NEXT_PUBLIC_APPZI_TOKEN", () => {
    process.env.NEXT_PUBLIC_APPZI_TOKEN = "  portal-token  ";
    expect(getAppziToken()).toBe("portal-token");
  });

  it("treats a blank token as missing", () => {
    process.env.NEXT_PUBLIC_APPZI_TOKEN = "   ";
    expect(getAppziToken()).toBeUndefined();
  });

  it("builds the strict CSP script URL", () => {
    expect(appziScriptSrc("portal-token")).toBe(
      "https://w.appzi.io/strict.js?token=portal-token",
    );
  });

  it("does not load without a token", () => {
    expect(shouldLoadAppzi("www.orderofbattle.app", "production", "")).toBe(
      false,
    );
  });

  it("does not load on localhost even with a token", () => {
    expect(
      shouldLoadAppzi("localhost", "production", "portal-token"),
    ).toBe(false);
  });

  it("does not load in development even with a token", () => {
    expect(
      shouldLoadAppzi("www.orderofbattle.app", "development", "portal-token"),
    ).toBe(false);
  });

  it("loads on production remote hosts when a token is set", () => {
    expect(
      shouldLoadAppzi("www.orderofbattle.app", "production", "portal-token"),
    ).toBe(true);
  });

  it("allows Appzi when consent is not required", () => {
    expect(isAppziConsentAllowed(false, null)).toBe(true);
  });

  it("waits for accept when consent is required", () => {
    expect(isAppziConsentAllowed(true, null)).toBe(false);
    expect(isAppziConsentAllowed(true, "rejected")).toBe(false);
    expect(isAppziConsentAllowed(true, "accepted")).toBe(true);
  });
});

describe("appzi wiring", () => {
  const root = path.dirname(fileURLToPath(import.meta.url));

  it("is mounted from the root layout with the consent flag", () => {
    const layout = readFileSync(
      path.resolve(root, "../app/layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("AppziScript");
    expect(layout).toContain("consentRequired={consentRequired}");
  });

  it("allows Appzi hosts in the content security policy", () => {
    const config = readFileSync(path.resolve(root, "../../next.config.ts"), "utf8");
    expect(config).toContain("https://w.appzi.io");
    expect(config).toContain("https://api.appzi.io");
    expect(config).toContain("https://survey-assets.appzi.io");
  });

  it("names Appzi on the privacy page", () => {
    const privacy = readFileSync(
      path.resolve(root, "../app/privacy/page.tsx"),
      "utf8",
    );
    expect(privacy).toContain("Appzi");
  });
});
