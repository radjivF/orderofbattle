import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogueUnit } from "@/engine/types";
import { getFaction, listRegimentsOfRenown } from "@/engine/queries";
import { resolvePathToGloryUnit } from "@/engine/pathToGlory";
import { cleanup, render, screen } from "@/test-utils/render";
import { DatasheetSheet } from "./DatasheetSheet";

function unit(overrides: Partial<CatalogueUnit> = {}): CatalogueUnit {
  return {
    id: "unit-1",
    name: "Liberator-Prime",
    points: 110,
    hero: true,
    unique: false,
    reinforce: false,
    models: 1,
    categories: ["HERO", "INFANTRY", "CASTELITE"],
    stats: { move: "5\"", health: "5", save: "3+", control: "2" },
    weapons: [],
    abilities: [],
    regimentOptions: [],
    regimentHeroes: [],
    ...overrides,
  };
}

describe("DatasheetSheet keywords", () => {
  beforeEach(() => {
    cleanup();
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
  });

  it("shows every keyword as a pill below the stats card, including faction names", () => {
    render(<DatasheetSheet sheet={unit()} onClose={vi.fn()} />);

    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();

    const keywords = screen.getByRole("heading", { name: "Keywords" }).closest("section");
    expect(keywords).toHaveTextContent("HERO");
    expect(keywords).toHaveTextContent("INFANTRY");
    expect(keywords).toHaveTextContent("CASTELITE");
  });

  it("keeps Wizard rank and hides Ward", () => {
    render(
      <DatasheetSheet
        sheet={unit({
          categories: ["HERO", "WIZARD (1)", "WARD (6+)", "CASTELITE"],
        })}
        onClose={vi.fn()}
      />,
    );

    const keywords = screen.getByRole("heading", { name: "Keywords" }).closest("section");
    expect(keywords).toHaveTextContent("WIZARD (1)");
    expect(keywords).toHaveTextContent("CASTELITE");
    expect(keywords).not.toHaveTextContent("WARD");
  });
});

describe("DatasheetSheet Regiment of Renown", () => {
  beforeEach(() => {
    cleanup();
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
  });

  it("shows Regiment of Renown abilities without a combat stat block", () => {
    const ror = listRegimentsOfRenown("gloomspite-gitz").find(
      (item) => item.abilities.length > 0,
    );
    expect(ror).toBeTruthy();
    if (!ror) {
      throw new Error("missing gloomspite Regiment of Renown");
    }
    const abilityName = ror.abilities[0]?.name;
    expect(abilityName).toBeTruthy();

    render(<DatasheetSheet sheet={ror} onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: `${ror.name} datasheet` }),
    ).toBeInTheDocument();
    expect(screen.getByText(abilityName ?? "")).toBeInTheDocument();
    expect(screen.queryByText("Move")).toBeNull();
    expect(screen.queryByText("Health")).toBeNull();
  });
});

describe("DatasheetSheet Path to Glory", () => {
  beforeEach(() => {
    cleanup();
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
  });

  it("shows picked Path abilities on Doktor Festus", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    const festus = faction?.units.find((item) => item.name === "Doktor Festus");
    expect(festus).toBeTruthy();
    if (!festus) return;

    const sheet = resolvePathToGloryUnit(festus, {
      id: "festus-1",
      unitId: festus.id,
      reinforced: false,
      pathToGlory: {
        renown: 5,
        pathId: "path-of-the-attacker",
        pathOptionIds: ["4564-988b-2147-1ba8"],
        battleWoundId: null,
        scarId: null,
        anvilRankId: null,
        anvilPickIds: [],
      },
    });

    render(<DatasheetSheet sheet={sheet} onClose={vi.fn()} />);

    expect(screen.getByText("Full-On Attack")).toBeInTheDocument();
    expect(
      screen.getByText(/add 1 to hit rolls for attacks made by units this phase/i),
    ).toBeInTheDocument();
  });
});
