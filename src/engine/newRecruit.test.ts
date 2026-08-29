import { describe, expect, it } from "vitest";
import { parsePortableLists } from "./listPortable";
import { looksLikeNewRecruit, parseNewRecruitLists } from "./newRecruit";
import { getFaction, getUnit } from "./queries";

const SOULBLIGHT_NEW_RECRUIT = `Full (2540 points) - General's Handbook 2025-26

Soulblight Gravelords
Auxiliaries: 3
Drops: 6

Battle Tactic Cards - Master the Paths
• Restless Energy
Manifestation Lore - 
Spell Lore - Lore of Undeath

General's Regiment
Prince Vhordrai (470)
• General
Wight King on Skeletal Steed (180)
Deadwalker Zombies (120)
Deathrattle Skeletons (180)
• Reinforced
• 1x Champion
• 1x Standard Bearer
Corpse Cart (Scourge of Ghyran) (80)

Regiment 1
Lauka Vai, Mother of Nightmares (200)
Dire Wolves (150)
Fell Bats (80)

Regiment 2
Vampire Lord on Nightmare Steed (180)
Blood Knights (220)
• 1x Champion
• 1x Standard Bearer
Blood Knights (220)
• 1x Champion
• 1x Standard Bearer

Auxiliary 
Vampire Lord (140)
Barrow Guard (130)
• 1x Champion
• 2x Musician
• 2x Standard Bearer
Barrow Knights (190)
• 1x Champion
• 1x Standard Bearer
• 1x Musician

Faction Terrain
Cursed Sepulchre

Created with New Recruit
Data Version: v44

Created with newrecruit.eu v35.70
`;

describe("newRecruit", () => {
  it("detects New Recruit text and ignores Order of Battle exports", () => {
    expect(looksLikeNewRecruit(SOULBLIGHT_NEW_RECRUIT)).toBe(true);
    expect(
      looksLikeNewRecruit("=== Order of Battle ===\nHammerhost\nStormcast Eternals"),
    ).toBe(false);
  });

  it("imports a New Recruit Soulblight list", () => {
    const faction = getFaction("soulblight-gravelords");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const parsed = parsePortableLists(SOULBLIGHT_NEW_RECRUIT);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const list = parsed.lists[0];
    expect(list?.name).toBe("Full");
    expect(list?.factionId).toBe("soulblight-gravelords");
    expect(list?.pointsCap).toBe(3000);
    expect(list?.spellLoreId).toBe(
      faction.spellLores.find((item) => item.name === "Lore of Undeath")?.id,
    );
    expect(list?.battleTacticCardIds).toHaveLength(2);
    expect(list?.scourgeRealm).toBe("ghyran");
    expect(list?.regiments).toHaveLength(3);
    expect(list?.auxiliaries).toHaveLength(3);

    const general = list?.regiments[0];
    expect(general?.id).toBe(list?.generalRegimentId);
    expect(getUnit(faction, general?.hero?.unitId ?? "")?.name).toBe(
      "Prince Vhordrai",
    );
    expect(
      general?.units.map((slot) => getUnit(faction, slot.unitId)?.name),
    ).toEqual([
      "Wight King on Skeletal Steed",
      "Deadwalker Zombies",
      "Deathrattle Skeletons",
      "Corpse Cart (Scourge of Ghyran)",
    ]);
    expect(
      general?.units.find(
        (slot) => getUnit(faction, slot.unitId)?.name === "Deathrattle Skeletons",
      )?.reinforced,
    ).toBe(true);

    expect(getUnit(faction, list?.regiments[1]?.hero?.unitId ?? "")?.name).toBe(
      "Lauka Vai, Mother of Nightmares",
    );
    expect(list?.regiments[2]?.units).toHaveLength(2);
    expect(getUnit(faction, list?.auxiliaries[0]?.unitId ?? "")?.name).toBe(
      "Vampire Lord",
    );
  });

  it("reads battle formation and a heroic trait from New Recruit text", () => {
    const faction = getFaction("lumineth-realm-lords");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const parsed = parseNewRecruitLists(`Host (2000 points) - General's Handbook 2025-26

Lumineth Realm-lords
Warhost of Duality
Drops: 1

Battle Tactic Cards - Master the Paths
• Restless Energy
Spell Lore - Lore of Hysh

General's Regiment
Archmage Teclis and Celennar, Spirit of Hysh (640)
• General
Vanari Bannerblade (140)
• Acolyte of the Runes

Created with New Recruit
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const list = parsed.lists[0];
    expect(list?.formationId).toBe(
      faction.formations.find((item) => item.name === "Warhost of Duality")?.id,
    );
    expect(list?.heroicTrait?.optionId).toBe(
      faction.heroicTraits.find((item) => item.name === "Acolyte of the Runes")
        ?.id,
    );
    expect(list?.heroicTrait?.heroSelectionId).toBe(
      list?.regiments[0]?.units[0]?.id,
    );
    expect(list?.pointsCap).toBe(2000);
  });

  it("imports a Regiment of Renown block", () => {
    const parsed = parseNewRecruitLists(`Cinderfall (2000 points) - General's Handbook 2025-26

Stormcast Eternals
Drops: 2

General's Regiment
Lord-Celestant (140)
• General

Regiment of Renown
Saviours of Cinderfall (290)
Callis and Toll (0)
Toll's Companions (0)

Created with New Recruit
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists[0]?.regimentOfRenown?.renownId).toBeTruthy();
    expect(parsed.lists[0]?.regimentOfRenown?.units).toHaveLength(2);
  });

  it("rejects a New Recruit list for an unknown faction", () => {
    const parsed = parseNewRecruitLists(`Host (2000 points) - General's Handbook 2025-26

Not a Real Faction
General's Regiment
Nobody (100)

Created with New Recruit
`);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("faction");
  });
});
