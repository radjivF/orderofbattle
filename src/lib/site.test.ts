import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl, sitePath, SITE_NAME } from "./site";

describe("site", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("exposes brand constants", () => {
    expect(SITE_NAME).toBe("Order of Battle");
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SITE_URL: "https://example.com/",
    };
    expect(getSiteUrl()).toBe("https://example.com");
    expect(sitePath("/faq")).toBe("https://example.com/faq");
  });

  it("falls back to localhost", () => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
