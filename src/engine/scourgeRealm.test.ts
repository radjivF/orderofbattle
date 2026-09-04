import { describe, expect, it, beforeAll } from "vitest";
import { battleTacticsForRealm } from "./data/load";
import { getFaction, unitsForPicker } from "./queries";
import { blankArmy } from "@/lib/storage";
import { createId } from "@/lib/id";
import { inferScourgeRealm, listUsesScourgeContent } from "./scourgeRealm";
import { summarize } from "./validate";
import { ensureAllFactions } from "@/engine/data/load";

describe("listUsesScourgeContent", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
  it("is false for a core-only blank list", () => {
    const faction = getFaction("blades-of-khorne");
    expect(faction).toBeTruthy();
    if (!faction) return;

    expect(listUsesScourgeContent(blankArmy(faction.id), faction)).toBe(false);
  });

  it("is true when scourge battle tactic cards are picked", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const [card] = battleTacticsForRealm("aqshy");
    expect(card).toBeTruthy();
    if (!card) return;

    const list = {
      ...blankArmy(faction.id),
      battleTacticCardIds: [card.id],
    };
    expect(listUsesScourgeContent(list, faction)).toBe(true);
  });

  it("is true when a scourge warscroll is on the list", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const scourgeUnit = unitsForPicker(faction).find((unit) =>
      unit.name.includes("Scourge of Aqshy"),
    );
    expect(scourgeUnit).toBeTruthy();
    if (!scourgeUnit) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: scourgeUnit.id,
            reinforced: false,
          },
          units: [],
        },
      ],
    };
    expect(listUsesScourgeContent(list, faction)).toBe(true);
  });
});

describe("inferScourgeRealm", () => {
  it("keeps an explicit scourge season", () => {
    const list = {
      ...blankArmy("stormcast-eternals"),
      scourgeRealm: "ghyran" as const,
    };
    expect(inferScourgeRealm(list)).toBe("ghyran");
  });

  it("infers aqshy from tactic picks on migrated lists", () => {
    const [card] = battleTacticsForRealm("aqshy");
    expect(card).toBeTruthy();
    if (!card) return;

    const list = {
      ...blankArmy("stormcast-eternals"),
      scourgeRealm: null,
      battleTacticCardIds: [card.id],
    };
    expect(inferScourgeRealm(list)).toBe("aqshy");
  });

  it("infers the season from a single scourge warscroll", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const scourgeUnit = unitsForPicker(faction).find((unit) =>
      unit.name.includes("Scourge of Aqshy"),
    );
    expect(scourgeUnit).toBeTruthy();
    if (!scourgeUnit) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id),
      scourgeRealm: null,
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: scourgeUnit.id,
            reinforced: false,
          },
          units: [],
        },
      ],
    };
    expect(inferScourgeRealm(list)).toBe("aqshy");
  });

  it("returns null when scourge units from both seasons are present", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const aqshy = unitsForPicker(faction).find((unit) =>
      unit.name.includes("Scourge of Aqshy"),
    );
    const ghyran = unitsForPicker(faction).find((unit) =>
      unit.name.includes("Scourge of Ghyran"),
    );
    expect(aqshy && ghyran).toBeTruthy();
    if (!aqshy || !ghyran) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id),
      scourgeRealm: null,
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: aqshy.id,
            reinforced: false,
          },
          units: [
            {
              id: createId(),
              unitId: ghyran.id,
              reinforced: false,
            },
          ],
        },
      ],
    };
    expect(inferScourgeRealm(list)).toBeNull();
  });
});

describe("scourge season validation", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("warns to pick a scourge season when scourge content is on the list", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const [card] = battleTacticsForRealm("aqshy");
    expect(card).toBeTruthy();
    if (!card) return;

    const totals = summarize(
      {
        ...blankArmy(faction.id),
        battleTacticCardIds: [card.id],
        scourgeRealm: null,
      },
      faction,
    );
    expect(
      totals.issues.some((issue) =>
        issue.text.includes("Choose Scourge of Aqshy or Scourge of Ghyran"),
      ),
    ).toBe(true);
  });
});
