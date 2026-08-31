import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("returns a valid sitemap with URLs", () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the home page", () => {
    const result = sitemap();
    const home = result.find((entry) => {
      const url = new URL(entry.url);
      return url.pathname === "/" || url.pathname === "";
    });
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1);
    expect(home?.changeFrequency).toBe("weekly");
  });

  it("includes faction pages", () => {
    const result = sitemap();
    const hasFactionPages = result.some((entry) =>
      entry.url.includes("/factions/"),
    );
    expect(hasFactionPages).toBe(true);
  });

  it("includes guide pages with correct priority", () => {
    const result = sitemap();
    const guidePage = result.find((entry) => entry.url.includes("/guides"));
    expect(guidePage).toBeDefined();
    expect(guidePage?.priority).toBe(0.9);
  });

  it("includes FAQ page with correct priority", () => {
    const result = sitemap();
    const faqPage = result.find((entry) => entry.url.endsWith("/faq"));
    expect(faqPage).toBeDefined();
    expect(faqPage?.priority).toBe(0.9);
  });

  it("all entries have required sitemap fields", () => {
    const result = sitemap();
    for (const entry of result) {
      expect(entry.url).toBeTruthy();
      expect(typeof entry.url).toBe("string");
      expect(entry.url.startsWith("http")).toBe(true);
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBeTruthy();
      expect(typeof entry.priority).toBe("number");
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it("does not throw when environment vars are missing", () => {
    const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const originalVercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    expect(() => sitemap()).not.toThrow();
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    if (originalSiteUrl !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
    if (originalVercelUrl !== undefined) {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercelUrl;
    }
  });
});
