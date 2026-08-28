import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { INDEX_BACKDROP_ART_CLASS, INDEX_BACKDROP_SRC } from "./siteArt";

const root = path.dirname(fileURLToPath(import.meta.url));

describe("index backdrop", () => {
  it("covers the viewport with an image, not a fixed CSS background", () => {
    expect(INDEX_BACKDROP_SRC).toBe("/brand/index-backdrop.webp");
    expect(INDEX_BACKDROP_ART_CLASS).toContain("object-cover");
    expect(INDEX_BACKDROP_ART_CLASS).toContain("object-[center_58%]");

    const layer = readFileSync(
      path.resolve(root, "../components/IndexBackdrop.tsx"),
      "utf8",
    );
    expect(layer).toContain("INDEX_BACKDROP_ART_CLASS");
    expect(layer).toContain("<Image");
    expect(layer).toContain("unoptimized");
    expect(layer).not.toContain("backgroundAttachment");
    expect(layer).not.toContain("backgroundImage");
  });
});
