import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("expandable rule cards", () => {
  it("clamps Effect text in the summary so the truncated line is tappable", () => {
    const card = readFileSync(
      path.join(here, "ExpandableRuleCard.tsx"),
      "utf8",
    );
    expect(card).toContain("line-clamp-2");
    expect(card).toContain("Effect · ");
    expect(card).toContain("group-open:hidden");
    expect(card).toContain("collapseDetails");
    expect(card).not.toContain("\n      open\n");
  });
});

describe("manifestation lore title", () => {
  it("opens the lore picker instead of only focusing the select", () => {
    const card = readFileSync(
      path.join(here, "ManifestationCard.tsx"),
      "utf8",
    );
    expect(card).toContain("openNativeSelect");
    expect(card).not.toContain("selectRef.current?.focus()");
  });
});
