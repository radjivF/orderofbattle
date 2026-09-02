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
    expect(layer).toContain("LIST_LANDING_CONTENT_CLASS");
    expect(layer).toContain("revealed");
    expect(layer).toContain("<Image");
    expect(layer).not.toContain("unoptimized");
    expect(layer).toContain('sizes="100vw"');
    expect(layer).toContain("priority={eager}");
    expect(layer).not.toContain("backgroundAttachment");
    expect(layer).not.toContain("backgroundImage");
  });

  it("does not let crest and wordmark steal homepage LCP from the backdrop", () => {
    const landing = readFileSync(
      path.resolve(root, "../components/TryLanding.tsx"),
      "utf8",
    );
    const motion = readFileSync(
      path.resolve(root, "../components/LandingMotion.tsx"),
      "utf8",
    );
    expect(landing).not.toContain("priority");
    expect(motion).not.toContain("opacity: 0");
  });
});
