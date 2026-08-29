import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("expandable rule cards", () => {
  it("keeps Effect text out of the summary so collapse hides the body", () => {
    const card = readFileSync(
      path.join(here, "ExpandableRuleCard.tsx"),
      "utf8",
    );
    expect(card).toContain("RuleText");
    expect(card).toContain("<summary");
    expect(card).toContain("cursor-default list-none");
    expect(card).not.toContain("cursor-pointer list-none");
    expect(card).not.toContain("line-clamp-2");
    expect(card).not.toContain("group-open:hidden");
    expect(card).not.toContain("collapseDetails");
    expect(card).not.toContain("\n      open\n");
  });

  it("prints lore rules inline on the magic board instead of a nested collapse", () => {
    const magic = readFileSync(path.join(here, "PlayMagicBoard.tsx"), "utf8");
    expect(magic).not.toContain("ExpandableRuleCard");
    expect(magic).toContain('label="Declare · "');
    expect(magic).toContain('label="Effect · "');
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
