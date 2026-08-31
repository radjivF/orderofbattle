import type { ArmyList } from "@/engine/types";
import { getFaction } from "@/engine/queries";
import { getSpearhead } from "@/engine/spearhead";
import { inferScourgeRealm } from "@/engine/scourgeRealm";
import { pruneOrphanEnhancements } from "@/engine/validate";
import { createId } from "@/lib/id";

const MAX_REGIMENTS = 5;

export function normalizeArmyList(list: ArmyList): ArmyList {
  const scourgeRealm = inferScourgeRealm(list);
  return pruneOrphanEnhancements({
    ...list,
    game: "aos",
    regimentOfRenown: list.regimentOfRenown ?? null,
    powerBinds: list.powerBinds ?? {},
    monstrousTrait: list.monstrousTrait ?? null,
    visionOfFate: list.visionOfFate ?? null,
    specialEnhancements: list.specialEnhancements ?? [],
    battleTacticCardIds: list.battleTacticCardIds ?? [],
    battleTacticStage: list.battleTacticStage ?? {},
    scourgeRealm,
    lastOpenedAt: list.lastOpenedAt ?? list.updatedAt,
    kind: list.kind === "spearhead" ? "spearhead" : "matched",
    spearheadId: list.spearheadId ?? null,
    regimentAbilityId: list.regimentAbilityId ?? null,
  });
}

export function blankArmy(
  factionId = "stormcast-eternals",
  name?: string,
  pointsCap?: number,
): ArmyList {
  const faction = getFaction(factionId);
  const now = Date.now();
  return {
    id: createId(),
    name: name?.trim() || faction?.name || "New list",
    factionId,
    pointsCap: pointsCap ?? faction?.pointsCapDefault ?? 2000,
    formationId: faction?.formations[0]?.id ?? null,
    spellLoreId:
      faction?.spellLores.length === 1 ? faction.spellLores[0].id : null,
    prayerLoreId:
      faction?.prayerLores.length === 1 ? faction.prayerLores[0].id : null,
    manifestationLoreId: null,
    artefact: null,
    heroicTrait: null,
    monstrousTrait: null,
    visionOfFate: null,
    specialEnhancements: [],
    battleTacticCardIds: [],
    battleTacticStage: {},
    scourgeRealm: "aqshy",
    generalRegimentId: null,
    regiments: [],
    auxiliaries: [],
    regimentOfRenown: null,
    powerBinds: {},
    kind: "matched",
    spearheadId: null,
    regimentAbilityId: null,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    game: "aos",
  };
}

export function appendRegimentWithHero(
  list: ArmyList,
  unitId: string,
  ids: { regimentId: string; heroSelectionId: string },
): ArmyList | null {
  if (list.regiments.length >= MAX_REGIMENTS) {
    return null;
  }
  return {
    ...list,
    regiments: [
      ...list.regiments,
      {
        id: ids.regimentId,
        hero: {
          id: ids.heroSelectionId,
          unitId,
          reinforced: false,
        },
        units: [],
      },
    ],
    generalRegimentId: list.generalRegimentId ?? ids.regimentId,
  };
}

export function blankSpearhead(spearheadId: string, name?: string): ArmyList {
  const box = getSpearhead(spearheadId);
  const now = Date.now();
  const regimentId = createId();
  const generalEntry =
    box?.roster.find((item) => item.general) ?? box?.roster[0] ?? null;
  const hero = generalEntry
    ? { id: createId(), unitId: generalEntry.unitId, reinforced: false }
    : null;
  const units = (box?.roster ?? []).flatMap((entry) => {
    const copies = entry.general ? Math.max(0, entry.count - 1) : entry.count;
    return Array.from({ length: copies }, () => ({
      id: createId(),
      unitId: entry.unitId,
      reinforced: false,
    }));
  });
  return {
    id: createId(),
    name: name?.trim() || box?.name || "New Spearhead",
    factionId: box?.parentFactionId ?? "stormcast-eternals",
    kind: "spearhead",
    spearheadId,
    regimentAbilityId: null,
    pointsCap: 0,
    formationId: null,
    spellLoreId: null,
    prayerLoreId: null,
    manifestationLoreId: null,
    artefact: null,
    heroicTrait: null,
    monstrousTrait: null,
    visionOfFate: null,
    specialEnhancements: [],
    battleTacticCardIds: [],
    battleTacticStage: {},
    scourgeRealm: null,
    generalRegimentId: regimentId,
    regiments: [{ id: regimentId, hero, units }],
    auxiliaries: [],
    regimentOfRenown: null,
    powerBinds: {},
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    game: "aos",
  };
}

export function duplicateArmy<
  T extends {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    lastOpenedAt?: number;
  },
>(list: T): T {
  const now = Date.now();
  return {
    ...structuredClone(list),
    id: createId(),
    name: `${list.name} copy`,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
}

/** Clone a list from an import file with a new id so it never overwrites a local list. */
export function prepareImportedArmy(list: ArmyList): ArmyList {
  const now = Date.now();
  const cloned = structuredClone(list);
  return normalizeArmyList({
    ...cloned,
    id: createId(),
    name: cloned.name.trim() || "Imported list",
    pointsCap:
      typeof cloned.pointsCap === "number" ? cloned.pointsCap : 2000,
    formationId: cloned.formationId ?? null,
    spellLoreId: cloned.spellLoreId ?? null,
    prayerLoreId: cloned.prayerLoreId ?? null,
    manifestationLoreId: cloned.manifestationLoreId ?? null,
    artefact: cloned.artefact ?? null,
    heroicTrait: cloned.heroicTrait ?? null,
    generalRegimentId: cloned.generalRegimentId ?? null,
    regiments: Array.isArray(cloned.regiments) ? cloned.regiments : [],
    auxiliaries: Array.isArray(cloned.auxiliaries) ? cloned.auxiliaries : [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  });
}
