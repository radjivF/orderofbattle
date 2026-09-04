import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from "vitest";
import sitemap from "@/app/sitemap";
import * as publicRoutes from "@/lib/publicRoutes";
import { ensureAllFactions } from "@/engine/data/load";

describe("sitemap", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
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

describe("sitemap fail-closed behavior", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("returns static fallback when listPublicRoutes throws", () => {
    vi.spyOn(publicRoutes, "listPublicRoutes").mockImplementation(() => {
      throw new Error("Simulated listPublicRoutes failure");
    });

    expect(() => sitemap()).not.toThrow();
    const result = sitemap();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Sitemap generation failed"),
      expect.any(Error),
    );
  });

  it("fallback sitemap includes all static routes", () => {
    vi.spyOn(publicRoutes, "listPublicRoutes").mockImplementation(() => {
      throw new Error("Simulated failure");
    });

    const result = sitemap();
    const paths = result.map((entry) => new URL(entry.url).pathname);

    expect(paths).toContain("/");
    expect(paths).toContain("/faq");
    expect(paths).toContain("/guides");
    expect(paths).toContain("/factions");
    expect(paths).toContain("/compare");
    expect(paths).toContain("/play");
  });

  it("fallback sitemap has valid XML structure", () => {
    vi.spyOn(publicRoutes, "listPublicRoutes").mockImplementation(() => {
      throw new Error("Simulated failure");
    });

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

  it("never returns empty sitemap even on catastrophic failure", () => {
    vi.spyOn(publicRoutes, "listPublicRoutes").mockImplementation(() => {
      throw new Error("Catastrophic failure");
    });

    const result = sitemap();
    expect(result.length).toBeGreaterThan(0);
  });

  it("fallback sitemap prioritizes homepage correctly", () => {
    vi.spyOn(publicRoutes, "listPublicRoutes").mockImplementation(() => {
      throw new Error("Simulated failure");
    });

    const result = sitemap();
    const home = result.find((entry) => {
      const url = new URL(entry.url);
      return url.pathname === "/" || url.pathname === "";
    });

    expect(home).toBeDefined();
    expect(home?.priority).toBe(1);
    expect(home?.changeFrequency).toBe("weekly");
  });
});
