import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import nextConfig from "@/../next.config";

describe("Appzi CSP configuration", () => {
  it("uses strict.js loader in AnalyticsScripts", () => {
    const analyticsPath = join(
      process.cwd(),
      "src",
      "components",
      "AnalyticsScripts.tsx",
    );
    const source = readFileSync(analyticsPath, "utf-8");
    expect(source).toContain("strict.js");
    expect(source).toContain("https://w.appzi.io/strict.js?token=");
    expect(source).not.toContain("https://w.appzi.io/w.js?token=");
  });

  it("includes required Appzi CSP directives in next.config", async () => {
    const headers = nextConfig.headers;
    if (!headers || typeof headers !== "function") {
      throw new Error("next.config headers must be a function");
    }

    const headersList = await headers();
    const rootHeaders = headersList.find(
      (h: { source: string }) => h.source === "/:path*",
    );
    expect(rootHeaders).toBeDefined();

    const cspHeader = rootHeaders?.headers.find(
      (h: { key: string }) => h.key === "Content-Security-Policy",
    );
    expect(cspHeader).toBeDefined();

    const cspValue = cspHeader?.value || "";

    expect(cspValue).toContain("script-src");
    expect(cspValue).toContain("https://w.appzi.io");

    expect(cspValue).toContain("connect-src");
    expect(cspValue).toContain("https://api.appzi.io");
    expect(cspValue).toContain("https://w.appzi.io");

    expect(cspValue).toContain("frame-src");
    expect(cspValue).toContain("https://w.appzi.io");

    expect(cspValue).toContain("style-src");
    expect(cspValue).toContain("https://w.appzi.io");

    expect(cspValue).toContain("img-src");
    expect(cspValue).toContain("https://w.appzi.io");
    expect(cspValue).toContain("https://survey-assets.appzi.io");
  });
});
