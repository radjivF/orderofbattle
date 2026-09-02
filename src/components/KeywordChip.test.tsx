import { beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@/test-utils/render";
import { KeywordChip, KeywordChips } from "./KeywordChip";

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("KeywordChip", () => {
  beforeEach(() => {
    cleanup();
    stubMatchMedia();
  });

  it("opens core text for HERO and leaves faction names as labels", async () => {
    const user = userEvent.setup();
    render(
      <>
        <KeywordChip keyword="HERO" />
        <KeywordChip keyword="CASTELITE" />
      </>,
    );

    const hero = screen.getByRole("button", { name: "HERO" });
    expect(screen.queryByRole("button", { name: "CASTELITE" })).toBeNull();
    expect(screen.getByText("CASTELITE").tagName).toBe("SPAN");

    await user.click(hero);
    expect(screen.getByRole("dialog", { name: "HERO" })).toHaveTextContent(
      /Hero/i,
    );
  });

  it("opens Strike-last from the datasheet pill", async () => {
    const user = userEvent.setup();
    render(<KeywordChip keyword="STRIKE-LAST" />);

    await user.click(screen.getByRole("button", { name: "STRIKE-LAST" }));
    expect(
      screen.getByRole("dialog", { name: "STRIKE-LAST" }),
    ).toHaveTextContent(/cannot be picked/i);
  });
});

describe("KeywordChips", () => {
  beforeEach(() => {
    cleanup();
    stubMatchMedia();
  });

  it("injects Guarded Hero for an infantry hero and hides Ward", () => {
    render(
      <KeywordChips
        categories={["HERO", "INFANTRY", "CASTELITE", "WARD (6+)"]}
        unit={{ hero: true, models: 1, categories: ["HERO", "INFANTRY"] }}
      />,
    );

    expect(screen.getByRole("button", { name: "Guarded Hero" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "HERO" })).toBeTruthy();
    expect(screen.queryByText("WARD")).toBeNull();
    expect(screen.getByText("CASTELITE")).toBeTruthy();
  });

  it("does not add Guarded Hero to a monster hero", () => {
    render(
      <KeywordChips
        categories={["HERO", "MONSTER"]}
        unit={{ hero: true, models: 1, categories: ["HERO", "MONSTER"] }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Guarded Hero" })).toBeNull();
    expect(screen.getByRole("button", { name: "MONSTER" })).toBeTruthy();
  });
});
