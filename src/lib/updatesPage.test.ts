import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STATIC_PUBLIC_ROUTES } from "./publicRoutes";
import {
  UPDATES_DATE,
  UPDATES_DESCRIPTION,
  UPDATES_PATH,
  UPDATES_TITLE,
} from "./updatesPage";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("updates page SEO", () => {
  it("uses a crawlable title and description about new builder features", () => {
    expect(UPDATES_PATH).toBe("/updates");
    expect(UPDATES_TITLE).toBe("What's new in Order of Battle");
    expect(UPDATES_DATE).toBe("2026-09-03");
    expect(UPDATES_DESCRIPTION.toLowerCase()).toContain("battle record");
    expect(UPDATES_DESCRIPTION.toLowerCase()).toContain("scourge");
  });

  it("is listed for AI crawlers", () => {
    const llms = readFileSync(path.join(root, "public/llms.txt"), "utf8");
    expect(llms).toContain("/updates");
  });

  it("is in the public sitemap routes", () => {
    expect(
      STATIC_PUBLIC_ROUTES.some((route) => route.path === UPDATES_PATH),
    ).toBe(true);
  });
});
