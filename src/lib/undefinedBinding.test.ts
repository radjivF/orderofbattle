import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.includes(".test.")) {
      continue;
    }
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

function sourceFiles(): Array<{ rel: string; source: string }> {
  return walk(srcRoot).map((full) => ({
    rel: path.relative(srcRoot, full),
    source: readFileSync(full, "utf8"),
  }));
}

function hasImport(source: string, name: string): boolean {
  return new RegExp(`import\\s*\\{[^}]*\\b${name}\\b`).test(source);
}

describe("undefined binding regressions", () => {
  it("does not reference the renamed parchment info-button class", () => {
    for (const { rel, source } of sourceFiles()) {
      expect(source, rel).not.toContain("RULE_INFO_BUTTON_PARCHMENT_CLASS");
    }
  });

  it("imports HOME_CTA_CLASS in every file that uses it", () => {
    for (const { rel, source } of sourceFiles()) {
      if (rel === "lib/builderUi.ts") {
        continue;
      }
      if (!/\bHOME_CTA_CLASS\b/.test(source)) {
        continue;
      }
      expect(hasImport(source, "HOME_CTA_CLASS"), rel).toBe(true);
    }
  });

  it("imports RuleInfoButton instead of relying on a late local definition", () => {
    const builder = sourceFiles().find((file) => file.rel === "components/BuilderReady.tsx");
    expect(builder).toBeDefined();
    expect(hasImport(builder!.source, "RuleInfoButton")).toBe(true);
    expect(builder!.source).not.toMatch(/^function RuleInfoButton\(/m);
  });
});
