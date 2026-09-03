import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlaySlotRow } from "./SheetIconButton";

describe("PlaySlotRow with subtitleBeside", () => {
  it("does not wrap long unit names - keeps Move on same row", () => {
    const { container } = render(
      <PlaySlotRow
        name="Lauka Vai, Mother of Nightmares with a Very Long Name That Would Normally Wrap"
        subtitle='Move 10"'
        subtitleBeside={true}
        sheetLabel="View datasheet"
        onOpenSheet={() => {}}
      />,
    );

    const contentWrapper = container.querySelector(
      ".flex.min-w-0.flex-1.items-baseline",
    );
    expect(contentWrapper).toBeTruthy();
    expect(contentWrapper?.className).not.toContain("flex-wrap");
    expect(contentWrapper?.className).toContain("items-baseline");
  });

  it("truncates long unit names when subtitleBeside is true", () => {
    const { container } = render(
      <PlaySlotRow
        name="Lauka Vai, Mother of Nightmares with a Very Long Name"
        subtitle='Move 10"'
        subtitleBeside={true}
        sheetLabel="View datasheet"
        onOpenSheet={() => {}}
      />,
    );

    const nameElement = container.querySelector("p.truncate");
    expect(nameElement).toBeTruthy();
    expect(nameElement?.className).toContain("min-w-0");
    expect(nameElement?.textContent).toBe(
      "Lauka Vai, Mother of Nightmares with a Very Long Name",
    );
  });

  it("keeps Move subtitle shrink-0 on same row", () => {
    const { container } = render(
      <PlaySlotRow
        name="Long Unit Name"
        subtitle='Move 12"'
        subtitleBeside={true}
        sheetLabel="View datasheet"
        onOpenSheet={() => {}}
      />,
    );

    const subtitleElement = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent?.includes("Move"),
    );
    expect(subtitleElement).toBeTruthy();
    expect(subtitleElement?.className).toContain("shrink-0");
  });

  it("does not add truncate class when subtitleBeside is false", () => {
    const { container } = render(
      <PlaySlotRow
        name="Lauka Vai, Mother of Nightmares"
        subtitle='Move 10"'
        subtitleBeside={false}
        sheetLabel="View datasheet"
        onOpenSheet={() => {}}
      />,
    );

    const nameElements = container.querySelectorAll("p");
    const nameElement = Array.from(nameElements).find((p) =>
      p.textContent?.includes("Lauka"),
    );
    expect(nameElement).toBeTruthy();
    expect(nameElement?.className).not.toContain("truncate");
  });
});
