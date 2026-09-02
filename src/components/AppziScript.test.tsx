import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@/test-utils/render";
import { setConsentStatus } from "@/lib/cookieConsent";
import { AppziScript } from "./AppziScript";

const load = vi.hoisted(() => ({
  shouldLoad: true,
  token: "portal-token" as string | undefined,
}));

vi.mock("@/lib/appziConfig", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/appziConfig")>();
  return {
    ...actual,
    getAppziToken: () => load.token,
    shouldLoadAppzi: () => load.shouldLoad,
    appziScriptSrc: (token: string) =>
      `https://w.appzi.io/strict.js?token=${token}`,
  };
});

function appziScript() {
  return document.querySelector('script[data-appzi="widget"]');
}

describe("AppziScript", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    load.shouldLoad = true;
    load.token = "portal-token";
    appziScript()?.remove();
  });

  afterEach(() => {
    appziScript()?.remove();
    localStorage.clear();
  });

  it("injects the Appzi widget script when load is allowed and consent is not required", () => {
    render(<AppziScript consentRequired={false} />);

    const script = appziScript();
    expect(script).not.toBeNull();
    expect(script).toHaveAttribute(
      "src",
      "https://w.appzi.io/strict.js?token=portal-token",
    );
    expect((script as HTMLScriptElement).async).toBe(true);
  });

  it("does not inject without a token", () => {
    load.token = undefined;
    render(<AppziScript consentRequired={false} />);
    expect(appziScript()).toBeNull();
  });

  it("does not inject when Appzi should not load", () => {
    load.shouldLoad = false;
    render(<AppziScript consentRequired={false} />);
    expect(appziScript()).toBeNull();
  });

  it("does not inject while consent is required and unanswered", () => {
    render(<AppziScript consentRequired />);
    expect(appziScript()).toBeNull();
  });

  it("does not inject after consent is rejected", () => {
    setConsentStatus("rejected");
    render(<AppziScript consentRequired />);
    expect(appziScript()).toBeNull();
  });

  it("injects immediately when consent was already accepted", () => {
    setConsentStatus("accepted");
    render(<AppziScript consentRequired />);
    expect(appziScript()).toHaveAttribute(
      "src",
      "https://w.appzi.io/strict.js?token=portal-token",
    );
  });

  it("injects after the visitor accepts cookies", () => {
    render(<AppziScript consentRequired />);
    expect(appziScript()).toBeNull();

    act(() => {
      window.dispatchEvent(new CustomEvent("cookie-consent-accepted"));
    });

    expect(appziScript()).not.toBeNull();
  });

  it("does not inject a second script if one is already present", () => {
    render(<AppziScript consentRequired={false} />);
    render(<AppziScript consentRequired={false} />);
    expect(document.querySelectorAll('script[data-appzi="widget"]')).toHaveLength(
      1,
    );
  });
});
