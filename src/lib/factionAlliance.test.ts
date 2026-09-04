import { describe, expect, it, beforeAll } from "vitest";
import { listFactions } from "@/engine/queries";
import {
  GRAND_ALLIANCE_ORDER,
  grandAllianceForFaction,
  listFactionsByGrandAlliance,
} from "./factionAlliance";
import { ensureAllFactions } from "@/engine/data/load";

describe("factionAlliance", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
  it("maps every core faction to a Grand Alliance", () => {
    for (const faction of listFactions()) {
      expect(() => grandAllianceForFaction(faction.id)).not.toThrow();
    }
  });

  it("groups all core factions in Order → Destruction → Chaos → Death", () => {
    const groups = listFactionsByGrandAlliance();
    expect(groups.map((group) => group.alliance)).toEqual(GRAND_ALLIANCE_ORDER);
    expect(groups.flatMap((group) => group.factions)).toHaveLength(
      listFactions().length,
    );
  });

  it("keeps Stormcast Eternals first within Order", () => {
    const order = listFactionsByGrandAlliance().find(
      (group) => group.alliance === "order",
    );
    expect(order?.factions[0]?.id).toBe("stormcast-eternals");
  });
});
