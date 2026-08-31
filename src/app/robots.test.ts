import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  it("returns valid robots.txt configuration", () => {
    const result = robots();
    expect(result).toBeDefined();
    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toBe(true);
  });

  it("allows all paths by default", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const mainRule = rules.find((rule) => rule.userAgent === "*");
    expect(mainRule).toBeDefined();
    expect(mainRule?.allow).toBe("/");
  });

  it("disallows /app, /dashboard, and /lists/", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const mainRule = rules.find((rule) => rule.userAgent === "*");
    expect(mainRule?.disallow).toContain("/app");
    expect(mainRule?.disallow).toContain("/dashboard");
    expect(mainRule?.disallow).toContain("/lists/");
  });

  it("points to sitemap.xml", () => {
    const result = robots();
    expect(result.sitemap).toBeDefined();
    const sitemapUrl = Array.isArray(result.sitemap)
      ? result.sitemap[0]
      : result.sitemap;
    expect(typeof sitemapUrl).toBe("string");
    expect(sitemapUrl?.endsWith("/sitemap.xml")).toBe(true);
  });

  it("sets host URL", () => {
    const result = robots();
    expect(result.host).toBeDefined();
    expect(typeof result.host).toBe("string");
    expect(result.host?.startsWith("http")).toBe(true);
  });

  it("blocks AI crawlers from disallowed paths", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const aiCrawlers = [
      "GPTBot",
      "ClaudeBot",
      "ChatGPT-User",
      "PerplexityBot",
    ];

    for (const crawler of aiCrawlers) {
      const rule = rules.find((r) => r.userAgent === crawler);
      expect(rule).toBeDefined();
      expect(rule?.disallow).toContain("/app");
      expect(rule?.disallow).toContain("/dashboard");
      expect(rule?.disallow).toContain("/lists/");
    }
  });
});
