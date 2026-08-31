import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STATIC_PUBLIC_ROUTES } from "./publicRoutes";
import {
  PATH_TO_GLORY_GUIDE_DATE,
  PATH_TO_GLORY_GUIDE_DESCRIPTION,
  PATH_TO_GLORY_GUIDE_PATH,
  PATH_TO_GLORY_GUIDE_TITLE,
} from "./pathToGloryGuide";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("Path to Glory guide SEO", () => {
  it("uses a crawlable title and description", () => {
    expect(PATH_TO_GLORY_GUIDE_PATH).toBe("/guides/path-to-glory-age-of-sigmar");
    expect(PATH_TO_GLORY_GUIDE_TITLE.toLowerCase()).toContain("path to glory");
    expect(PATH_TO_GLORY_GUIDE_DATE).toBe("2026-08-31");
    expect(PATH_TO_GLORY_GUIDE_DESCRIPTION.toLowerCase()).toContain(
      "age of sigmar",
    );
    expect(PATH_TO_GLORY_GUIDE_DESCRIPTION.toLowerCase()).toContain(
      "anvil of apotheosis",
    );
  });

  it("is listed for AI crawlers", () => {
    const llms = readFileSync(path.join(root, "public/llms.txt"), "utf8");
    expect(llms).toContain(PATH_TO_GLORY_GUIDE_PATH);
  });

  it("is in the public sitemap routes", () => {
    expect(
      STATIC_PUBLIC_ROUTES.some(
        (route) => route.path === PATH_TO_GLORY_GUIDE_PATH,
      ),
    ).toBe(true);
  });
});
