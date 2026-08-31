import { describe, expect, it } from "vitest";
import { isCommandAbility } from "@/engine/commands";
import {
  buildPhaseBoards,
  rosterSelectionIds,
  type PlayPhaseId,
} from "@/engine/phases";
import { getFaction, listFactions } from "@/engine/queries";
import {
  listSpearheads,
  spearheadAsFaction,
} from "@/engine/spearhead";
import { blankArmy, blankSpearhead } from "@/lib/storage";
import { createId } from "@/lib/id";
import type { CatalogueUnit, FactionCatalogue } from "@/engine/types";
import {
  playPhasePanelAbilities,
  playPhasePanelCommands,
} from "./playPhasePanel";

function armyWithUnits(
  faction: FactionCatalogue,
  units: CatalogueUnit[],
) {
  const [first, ...rest] = units;
  const list = blankArmy(faction.id);
  list.generalRegimentId = "reg-1";
  list.regiments = [
    {
      id: "reg-1",
      hero: first
        ? { id: createId(), unitId: first.id, reinforced: false }
        : null,
      units: rest.map((unit) => ({
        id: createId(),
        unitId: unit.id,
        reinforced: false,
      })),
    },
  ];
  return list;
}

function missingPanelRows(
  label: string,
  faction: FactionCatalogue,
  list: ReturnType<typeof blankArmy>,
): string[] {
  const boards = buildPhaseBoards(list, faction);
  const rosterIds = rosterSelectionIds(list);
  const missing: string[] = [];
  for (const board of boards) {
    const shown = playPhasePanelAbilities(
      board.phase.id as PlayPhaseId,
      board.abilities,
      rosterIds,
    );
    const commands = playPhasePanelCommands(board.abilities);
    for (const row of board.abilities) {
      const command = isCommandAbility(row.ability.kind);
      const nestedOnMovement =
        board.phase.id === "movement" && rosterIds.has(row.selectionId);
      if (nestedOnMovement && !command) {
        continue;
      }
      const pool = command ? commands : shown;
      const found = pool.some(
        (item) =>
          item.selectionId === row.selectionId &&
          item.ability.name === row.ability.name,
      );
      if (!found) {
        missing.push(
          `${label} · ${board.phase.name} · ${row.unitName} · ${row.ability.name}`,
        );
      }
    }
  }
  return missing;
}

describe("playPhasePanelAbilities", () => {
  it("keeps Vampire Lord Sanguine Blur on Hero, not only Army", () => {
    const faction = getFaction("soulblight-gravelords")!;
    const hero = faction.units.find((unit) => unit.name === "Vampire Lord")!;
    const list = armyWithUnits(faction, [hero]);
    const boards = buildPhaseBoards(list, faction);
    const heroBoard = boards.find((board) => board.phase.id === "hero")!;
    const names = playPhasePanelAbilities(
      "hero",
      heroBoard.abilities,
      rosterSelectionIds(list),
    ).map((row) => row.ability.name);
    expect(names).toContain("Sanguine Blur");
  });

  it("keeps Bloodthirsty Dominance on End of turn", () => {
    const faction = getFaction("soulblight-gravelords")!;
    const hero = faction.units.find(
      (unit) => unit.name === "Vampire Lord on Zombie Dragon",
    )!;
    const list = armyWithUnits(faction, [hero]);
    const boards = buildPhaseBoards(list, faction);
    const endBoard = boards.find((board) => board.phase.id === "end")!;
    const names = playPhasePanelAbilities(
      "end",
      endBoard.abilities,
      rosterSelectionIds(list),
    ).map((row) => row.ability.name);
    expect(names).toContain("Bloodthirsty Dominance");
    expect(names).toContain("The Hunger");
  });

  it("keeps Swampcalla Foul Elixirs on Hero", () => {
    const faction = getFaction("kruleboyz")!;
    const hero = faction.units.find(
      (unit) => unit.name === "Swampcalla Shaman with Pot-grot",
    )!;
    const list = armyWithUnits(faction, [hero]);
    const boards = buildPhaseBoards(list, faction);
    const heroBoard = boards.find((board) => board.phase.id === "hero")!;
    const names = playPhasePanelAbilities(
      "hero",
      heroBoard.abilities,
      rosterSelectionIds(list),
    ).map((row) => row.ability.name);
    expect(names).toContain("Foul Elixirs");
  });

  it("keeps Trailblazers Endrinmaster Extraordinaire on Hero", () => {
    const box = listSpearheads().find(
      (item) => item.id === "kharadron-overlords-grundstok-trailblazers",
    )!;
    const faction = spearheadAsFaction(box);
    const list = blankSpearhead(box.id);
    const boards = buildPhaseBoards(list, faction);
    const heroBoard = boards.find((board) => board.phase.id === "hero")!;
    const names = playPhasePanelAbilities(
      "hero",
      heroBoard.abilities,
      rosterSelectionIds(list),
    ).map((row) => row.ability.name);
    expect(names).toContain("ENDRINMASTER EXTRAORDINAIRE");
  });

  it("surfaces every matched-play catalogue warscroll ability on its play phase", () => {
    const missing: string[] = [];
    for (const faction of listFactions()) {
      missing.push(
        ...missingPanelRows(
          faction.id,
          faction,
          armyWithUnits(faction, faction.units),
        ),
      );
    }
    expect(missing).toEqual([]);
  });

  it("surfaces every Spearhead warscroll ability on its play phase", () => {
    const missing: string[] = [];
    for (const box of listSpearheads()) {
      missing.push(
        ...missingPanelRows(
          box.id,
          spearheadAsFaction(box),
          blankSpearhead(box.id),
        ),
      );
    }
    expect(missing).toEqual([]);
  });
});
