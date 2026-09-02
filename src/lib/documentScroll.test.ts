import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function cssBlock(css: string, marker: string): string {
  const start = css.indexOf(marker);
  if (start === -1) {
    return "";
  }
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  if (open === -1 || close === -1) {
    return "";
  }
  return css.slice(open + 1, close);
}

function quotedClassNames(source: string): string[] {
  return [...source.matchAll(/className="([^"]+)"/g)].map((match) => match[1]);
}

describe("document scrollport", () => {
  it("does not pin <html> to the viewport with h-full", () => {
    const layout = readSource("app/layout.tsx");
    const htmlOpen = layout.match(/<html[\s\S]*?>/)?.[0] ?? "";
    expect(htmlOpen).toContain("<html");
    expect(htmlOpen).not.toMatch(/\bh-full\b/);
  });

  it("uses a single html scrollport so wheel can scroll long pages", () => {
    const css = readSource("app/globals.css");
    const htmlAndBody = cssBlock(css, "html,\nbody");
    const htmlRuleStart = css.indexOf("\nhtml {");
    expect(htmlRuleStart).toBeGreaterThan(-1);
    const fromHtmlRule = css.slice(htmlRuleStart);
    const html = cssBlock(fromHtmlRule, "html");
    const body = cssBlock(fromHtmlRule, "\nbody");

    expect(htmlAndBody).not.toMatch(/overflow/);
    expect(html).toMatch(/height:\s*auto/);
    expect(html).toMatch(/overflow-x:\s*hidden/);
    expect(html).toMatch(/overflow-y:\s*scroll/);
    expect(body).not.toMatch(/overflow/);
  });

  it("keeps list-flow shells from becoming nested overflow-y scrollers", () => {
    const files = [
      "components/IosNavSlide.tsx",
      "components/BuilderReady.tsx",
      "components/FactionBackdrop.tsx",
    ];
    for (const file of files) {
      const overflowXHidden = quotedClassNames(readSource(file)).filter((cls) =>
        cls.includes("overflow-x-hidden"),
      );
      expect(overflowXHidden.length, file).toBeGreaterThan(0);
      for (const cls of overflowXHidden) {
        expect(cls, file).toContain("overflow-y-visible");
      }
    }
  });
});
