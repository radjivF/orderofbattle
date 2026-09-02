import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@/test-utils/render";
import { TowCreateSheet } from "./TowCreateSheet";

const idle = {
  open: true,
  creating: false,
  draftFaction: null,
  draftName: "",
  draftPoints: 2000,
  onClose: vi.fn(),
  onCreate: vi.fn(),
  onDraftNameChange: vi.fn(),
  onDraftPointsChange: vi.fn(),
  onSelectFaction: vi.fn(),
  onBackToFactions: vi.fn(),
};

describe("TowCreateSheet", () => {
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

  it("lists every core Old World army and Arcane Journals", () => {
    render(<TowCreateSheet {...idle} />);

    expect(screen.getByRole("heading", { name: "Choose a faction" }));
    for (const name of [
      "Beastmen Brayherds",
      "Chaos Dwarfs",
      "Daemons of Chaos",
      "Dark Elves",
      "Dwarfen Mountain Holds",
      "Grand Cathay",
      "High Elf Realms",
      "Kingdom of Bretonnia",
      "Lizardmen",
      "Ogre Kingdoms",
      "Orc and Goblin Tribes",
      "Skaven",
      "The Empire of Man",
      "Tomb Kings of Khemri",
      "Vampire Counts",
      "Warriors of Chaos",
      "Wood Elf Realms",
    ]) {
      expect(screen.getByRole("button", { name }));
    }
    expect(screen.getByRole("heading", { name: "Arcane Journals" }));
    expect(screen.getByRole("button", { name: /Jade Fleet/ }));
    expect(screen.getByRole("button", { name: /Errantry Crusade/ }));
    expect(screen.getByRole("button", { name: /City-State of Nuln/ }));
  });
});
