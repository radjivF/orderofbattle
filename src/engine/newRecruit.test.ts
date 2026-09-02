import { describe, expect, it } from "vitest";
import { parsePortableLists } from "./listPortable";
import {
  looksLikeAosApp,
  looksLikeNewRecruit,
  parseNewRecruitLists,
} from "./newRecruit";
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
    expect(
      looksLikeNewRecruit(
        "=== Order of Battle ===\nRotgarden\nMaggotkin of Nurgle\nPath to Glory · Ascension",
      ),
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

  it("imports a Warhammer Age of Sigmar App list", () => {
    const faction = getFaction("cities-of-sigmar");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const raw = `T’es 440/1500 pts
-----
Grand Alliance Order | Cities of Sigmar | Zealous Hordes
General's Handbook 2026-27
Drops: 1
-----
Regiment 1
Alchemite Warforger (130)
Flagellants (80)
Freeguild Steelhelms (90)
Ironweld Great Cannon (140)
-----
Created with Warhammer Age of Sigmar: The App
App: v1.37.0 (1) | Data: v476
`;
    expect(looksLikeAosApp(raw)).toBe(true);
    expect(looksLikeNewRecruit(raw)).toBe(false);

    const parsed = parsePortableLists(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const list = parsed.lists[0];
    expect(list?.name).toBe("T'es");
    expect(list?.factionId).toBe("cities-of-sigmar");
    expect(list?.pointsCap).toBe(1500);
    expect(list?.formationId).toBe(
      faction.formations.find((item) => item.name === "Zealous Hordes")?.id,
    );
    expect(list?.regiments).toHaveLength(1);
    expect(getUnit(faction, list?.regiments[0]?.hero?.unitId ?? "")?.name).toBe(
      "Alchemite Warforger",
    );
    expect(
      list?.regiments[0]?.units.map((slot) => getUnit(faction, slot.unitId)?.name),
    ).toEqual([
      "Flagellants",
      "Freeguild Steelhelms",
      "Ironweld Great Cannon",
    ]);
    expect(list?.generalRegimentId).toBe(list?.regiments[0]?.id);
  });

  it("reads comma-separated battle tactic cards from the App format", () => {
    const parsed = parseNewRecruitLists(`Host 2000/2000 pts
-----
Grand Alliance Order | Cities of Sigmar | Fearless Exemplars
Battle Tactic Cards: Scouting Force, Intercept and Recover
-----
General's Regiment
Alchemite Warforger (110)
• General
Flagellants (80)
-----
Created with Warhammer Age of Sigmar: The App
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists[0]?.battleTacticCardIds).toHaveLength(2);
  });

  it("imports a New Recruit Path to Glory list", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find(
      (unit) => unit.name === "Anvil of Apotheosis: Maggotkin of Nurgle Hero",
    );
    const infected = anvil?.anvilForge
      ?.flatMap((group) => group.options)
      .find((option) => option.name === "Infected Warrior");
    const parasitic = anvil?.anvilForge
      ?.flatMap((group) => group.options)
      .find((option) => option.name === "Parasitic Infection");
    expect(anvil && infected && parasitic).toBeTruthy();
    if (!anvil || !infected || !parasitic) return;

    const parsed = parseNewRecruitLists(`Rotgarden (850 points) - Path to Glory: Ravaged Coast

Maggotkin of Nurgle
Affliction Cyst
Drops: 1

General's Regiment
Anvil of Apotheosis: Maggotkin of Nurgle Hero (350)
• General
• Lord of Decay
• Infected Warrior · 4 dest
• Parasitic Infection
• Path of the Attacker
• Full-On Attack
• The Carrion Dirge

Plaguebearers (140)

Created with New Recruit
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const list = parsed.lists[0];
    expect(list?.kind).toBe("pathToGlory");
    expect(list?.pathToGlory?.packIds).toEqual(["ascension", "ravaged-coast"]);
    expect(list?.pointsCap).toBe(1000);
    expect(list?.scourgeRealm).toBeNull();
    expect(list?.battleTacticCardIds).toEqual([]);
    expect(getUnit(faction, list?.regiments[0]?.hero?.unitId ?? "")?.name).toBe(
      anvil.name,
    );

    const hero = list?.regiments[0]?.hero?.pathToGlory;
    expect(hero?.anvilRankId).toBe(
      anvil.anvilRanks?.find((rank) => rank.name === "Lord of Decay")?.id,
    );
    expect(hero?.anvilPickIds).toEqual(
      expect.arrayContaining([infected.id, parasitic.id]),
    );
    expect(hero?.pathId).toBe("path-of-the-attacker");
    expect(hero?.pathOptionIds).toContain("4564-988b-2147-1ba8");
    expect(hero?.artefactId).toBe(
      faction.artefacts.find((item) => item.name === "The Carrion Dirge")?.id,
    );
    expect(getUnit(faction, list?.regiments[0]?.units[0]?.unitId ?? "")?.name).toBe(
      "Plaguebearers",
    );
  });

  it("imports an Age of Sigmar App Path to Glory list", () => {
    const raw = `Rotgarden 850/1000 pts
-----
Grand Alliance Chaos | Maggotkin of Nurgle | Affliction Cyst
Path to Glory: Ascension
Drops: 1
-----
General's Regiment
Anvil of Apotheosis: Maggotkin of Nurgle Hero (350)
• General
• Lord of Decay
-----
Created with Warhammer Age of Sigmar: The App
`;
    expect(looksLikeAosApp(raw)).toBe(true);
    const parsed = parsePortableLists(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists[0]?.kind).toBe("pathToGlory");
    expect(parsed.lists[0]?.pathToGlory?.packIds).toEqual(["ascension"]);
    expect(parsed.lists[0]?.pointsCap).toBe(1000);
  });
});
