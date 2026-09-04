import { describe, expect, it, beforeAll } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy, blankSpearhead } from "@/lib/storage";
import {
  buildPhaseBoards,
  phasesForAbility,
  regimentPlayGroups,
  rosterSelectionIds,
} from "./phases";
import {
  defenceStatLine,
  getFaction,
  moveStatLine,
} from "./queries";
import { getSpearhead, spearheadAsFaction } from "./spearhead";
import type { ManifestationModel } from "./types";
import { summarize } from "./validate";
import { ensureAllFactions } from "@/engine/data/load";

describe("play stat lines", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("formats move for play phase unit rows", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    expect(moveStatLine(hero)).toBe(`Move ${hero.stats.move}`);
  });

  it("formats save and ward for combat profiles", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const lore = faction.manifestationLores.find(
      (item) => item.name === "Manifestations of Khaine",
    );
    const bladewind = lore?.manifestations.find(
      (item) => item.name === "Bladewind",
    ) as ManifestationModel | undefined;
    expect(bladewind).toBeTruthy();
    if (!bladewind) return;

    expect(defenceStatLine(bladewind)).toBe("Save 5+ · Ward 6+");
  });
});

describe("regimentPlayGroups", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("groups roster units by regiment for movement phase", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const heroSelectionId = createId();
    const unitSelectionId = createId();
    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [
            { id: unitSelectionId, unitId: companion.id, reinforced: false },
          ],
        },
      ],
    };

    const groups = regimentPlayGroups(list, faction);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.subtitle).toBe("General's regiment");
    expect(groups[0]?.entries.map((entry) => entry.unit.name)).toEqual([
      hero.name,
      companion.name,
    ]);

    const rosterIds = rosterSelectionIds(list);
    expect(rosterIds.has(heroSelectionId)).toBe(true);
    expect(rosterIds.has(unitSelectionId)).toBe(true);
  });
});

describe("spearhead army phase", () => {
  it("routes phased battle traits and regiment abilities to their phase, not Army", () => {
    const box = getSpearhead("stormcast-eternals-vigilant-brotherhood");
    expect(box).toBeTruthy();
    if (!box) return;

    const faction = spearheadAsFaction(box);
    const ability = box.regimentAbilities[0];
    const enhancement = box.enhancements[0];
    expect(ability && enhancement).toBeTruthy();
    if (!ability || !enhancement) return;

    const list = blankSpearhead(box.id);
    const generalId = list.regiments[0]?.hero?.id;
    expect(generalId).toBeTruthy();
    if (!generalId) return;

    const boards = buildPhaseBoards(
      {
        ...list,
        regimentAbilityId: ability.id,
        formationId: null,
        heroicTrait: { heroSelectionId: generalId, optionId: enhancement.id },
      },
      faction,
    );
    const namesOn = (phaseId: string) =>
      boards
        .find((board) => board.phase.id === phaseId)
        ?.abilities.map((row) => row.ability.name) ?? [];

    expect(namesOn("hero")).toContain("SHIELD OF AZYR");
    expect(namesOn("charge")).toContain("STORM CHARGE");
    expect(namesOn("movement")).toContain(ability.name);
    expect(namesOn("passive")).toContain(enhancement.abilities[0]?.name);
    expect(namesOn("passive")).not.toContain("SHIELD OF AZYR");
    expect(namesOn("passive")).not.toContain("STORM CHARGE");
    expect(namesOn("passive")).not.toContain(ability.name);

    expect(
      boards
        .find((board) => board.phase.id === "movement")
        ?.abilities.some((row) =>
          row.unitName.startsWith("Regiment ability ·"),
        ),
    ).toBe(true);
    expect(
      boards
        .find((board) => board.phase.id === "passive")
        ?.abilities.some((row) => row.unitName.includes("Enhancement")),
    ).toBe(true);
  });

  it("keeps core ward and move rules off the phase boards", () => {
    const box = getSpearhead("kruleboyz-swampskulka-gang");
    expect(box).toBeTruthy();
    if (!box) return;

    const boards = buildPhaseBoards(
      blankSpearhead(box.id),
      spearheadAsFaction(box),
    );
    const names = boards.flatMap((board) =>
      board.abilities.map((row) => row.ability.name),
    );
    expect(names).not.toContain("WARD SAVE");
    expect(names).not.toContain("NORMAL MOVE");
    expect(names).not.toContain("CHARGE");
    expect(names).not.toContain("FIGHT");
  });
});

describe("buildPhaseBoards movement split", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("keeps roster abilities on unit selection ids for movement grouping", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) =>
      unit.abilities.some((ability) =>
        ability.timing.toLowerCase().includes("movement phase"),
      ),
    );
    expect(hero).toBeTruthy();
    if (!hero) return;

    const heroSelectionId = createId();
    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: "reg-1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
    };

    const movement =
      buildPhaseBoards(list, faction).find((board) => board.phase.id === "movement") ??
      null;
    expect(movement).toBeTruthy();
    if (!movement) return;

    const rosterIds = rosterSelectionIds(list);
    expect(
      movement.abilities.some(
        (row) =>
          rosterIds.has(row.selectionId) &&
          row.selectionId === heroSelectionId,
      ),
    ).toBe(true);
  });
});

describe("manifestation lore points", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("counts paid GHB manifestation lores in army totals", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const freeLore = faction.manifestationLores.find(
      (item) => item.name === "Manifestations of Khaine",
    );
    const paidLore = faction.manifestationLores.find(
      (item) => item.name === "Forbidden Power",
    );
    expect(freeLore && paidLore?.points).toBeTruthy();
    if (!freeLore || !paidLore?.points) return;

    const base = summarize(blankArmy(faction.id), faction).points;
    const withFree = summarize(
      { ...blankArmy(faction.id), manifestationLoreId: freeLore.id },
      faction,
    ).points;
    const withPaid = summarize(
      { ...blankArmy(faction.id), manifestationLoreId: paidLore.id },
      faction,
    ).points;

    expect(withFree).toBe(base);
    expect(withPaid - base).toBe(paidLore.points);
  });
});

describe("formation phase routing", () => {
  it("maps Once Per Turn (Army), End of Any Turn to end of turn only", () => {
    expect(
      phasesForAbility({
        name: "Higher Purpose",
        kind: "Activated",
        timing: "Once Per Turn (Army), End of Any Turn",
        declare: "",
        effect: "",
        keywords: "",
        castingValue: "",
        chantingValue: "",
        cost: "",
      }),
    ).toEqual(["end"]);
  });

  it("puts Coven Zealots Higher Purpose on End of turn, not Army", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const formation = faction.formations.find(
      (item) => item.name === "Coven Zealots",
    );
    expect(formation).toBeTruthy();
    if (!formation) return;

    const boards = buildPhaseBoards(
      { ...blankArmy(faction.id), formationId: formation.id },
      faction,
    );
    const namesOn = (phaseId: string) =>
      boards
        .find((board) => board.phase.id === phaseId)
        ?.abilities.map((row) => row.ability.name) ?? [];

    expect(namesOn("end")).toContain("Higher Purpose");
    expect(namesOn("passive")).not.toContain("Higher Purpose");
  });
});

describe("battle formation points", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("counts paid GHB battle formations in army totals", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const free = faction.formations.find((item) => item.name === "Coven Zealots");
    const paid = faction.formations.find(
      (item) => item.name === "Arena Veterans",
    );
    expect(free && paid?.points).toBeTruthy();
    if (!free || !paid?.points) return;

    const base = summarize(blankArmy(faction.id), faction).points;
    const withFree = summarize(
      { ...blankArmy(faction.id), formationId: free.id },
      faction,
    ).points;
    const withPaid = summarize(
      { ...blankArmy(faction.id), formationId: paid.id },
      faction,
    ).points;

    expect(withFree).toBe(base);
    expect(withPaid - base).toBe(paid.points);
  });
});
