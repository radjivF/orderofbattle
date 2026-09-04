import { createId } from "@/lib/id";
import { SITE_NAME } from "@/lib/site";
import {
  battleTactics,
  ensureAllFactions,
  getAllFactionsSync,
  ensureRegimentsOfRenown,
  getRegimentsOfRenownSync,
} from "./data/load";
import { exportArmyListText, exportFileName } from "./exportText";
import { looksLikeImportedList, parseNewRecruitLists } from "./newRecruit";
import { parsePointsCap } from "./pointsCap";
import { getListUnit } from "./queries";
import {
  catalogueForList,
  listSpearheads,
  spearheadAsFaction,
} from "./spearhead";
import type {
  ArmyList,
  ArmyListKind,
  CatalogueUnit,
  EnhancementOption,
  EnhancementPick,
  FactionCatalogue,
  Selection,
  SpecialEnhancementPick,
} from "./types";

export type ParsePortableResult =
  | { ok: true; lists: ArmyList[] }
  | { ok: false; error: string };

export const LIST_IMPORT_HELP =
  "You can import lists from the Warhammer Age of Sigmar App and New Recruit. Copy the list text as-is, paste it below, then tap Import. Order of Battle text and JSON work too, or choose a .txt or .json file.";

export type PortableFormat = "text" | "json";

const BANNER = `=== ${SITE_NAME} ===`;
const NOT_A_LIST = "That file is not an Order of Battle list.";

export function serializeListsFile(lists: ArmyList[]): string {
  return lists
    .flatMap((list) => {
      const faction = catalogueForList(list);
      return faction ? [exportArmyListText(list, faction)] : [];
    })
    .join("\n");
}

export function serializeListsJson(lists: ArmyList[]): string {
  return JSON.stringify(lists, null, 2);
}

export function serializeListsForFormat(
  lists: ArmyList[],
  format: PortableFormat,
): string {
  return format === "json" ? serializeListsJson(lists) : serializeListsFile(lists);
}

export function portableMimeType(format: PortableFormat): string {
  return format === "json"
    ? "application/json;charset=utf-8"
    : "text/plain;charset=utf-8";
}

export async function ensureCataloguesForImport(): Promise<void> {
  await Promise.all([ensureAllFactions(), ensureRegimentsOfRenown()]);
}

export function parsePortableLists(raw: string): ParsePortableResult {
  const trimmed = raw.replace(/^\uFEFF/, "").trimStart();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const json = parsePortableListsJson(raw);
    if (json.ok) {
      return json;
    }
  }

  if (looksLikeImportedList(raw)) {
    return parseNewRecruitLists(raw);
  }

  const lists = splitListBlocks(raw)
    .map((block) => parseListBlock(block))
    .filter((list): list is ArmyList => Boolean(list));
  if (lists.length === 0) {
    return { ok: false, error: NOT_A_LIST };
  }
  return { ok: true, lists };
}

export function parsePortableListsJson(raw: string): ParsePortableResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: NOT_A_LIST };
  }

  const candidates: unknown[] = [];
  if (Array.isArray(parsed)) {
    candidates.push(...parsed);
  } else if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.lists)) {
      candidates.push(...record.lists);
    } else if (looksLikeArmyList(parsed)) {
      candidates.push(parsed);
    }
  }

  const lists = candidates.filter(looksLikeArmyList);
  if (lists.length === 0) {
    return { ok: false, error: NOT_A_LIST };
  }
  return { ok: true, lists };
}

export function portableAllListsFileName(format: PortableFormat = "text"): string {
  return format === "json" ? "order-of-battle-lists.json" : "order-of-battle-lists.txt";
}

export function portableListFileName(
  listName: string,
  format: PortableFormat = "text",
): string {
  return exportFileName(listName, format === "json" ? "json" : "txt");
}

export type PortablePartition = {
  novel: ArmyList[];
  skipped: number;
};

/** Same army on this device — skip; do not update or replace. */
export function listContentKey(list: ArmyList): string {
  return JSON.stringify({
    name: list.name.trim(),
    factionId: list.factionId,
    kind: list.kind ?? "matched",
    spearheadId: list.spearheadId ?? null,
    regimentAbilityId: list.regimentAbilityId ?? null,
    pointsCap: list.pointsCap,
    formationId: list.formationId,
    spellLoreId: list.spellLoreId,
    prayerLoreId: list.prayerLoreId,
    manifestationLoreId: list.manifestationLoreId,
    scourgeRealm: list.scourgeRealm,
    battleTacticCardIds: [...(list.battleTacticCardIds ?? [])].sort(),
    artefact: enhancementKey(list, list.artefact),
    heroicTrait: enhancementKey(list, list.heroicTrait),
    monstrousTrait: enhancementKey(list, list.monstrousTrait),
    visionOfFate: enhancementKey(list, list.visionOfFate),
    specialEnhancements: (list.specialEnhancements ?? [])
      .map((pick) => ({
        tableId: pick.tableId,
        optionId: pick.optionId,
        bearer: selectionUnitKey(list, pick.heroSelectionId),
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    regiments: list.regiments.map((regiment) => ({
      general: regiment.id === list.generalRegimentId,
      hero: unitKey(regiment.hero),
      units: regiment.units.map((slot) => unitKey(slot)),
    })),
    auxiliaries: list.auxiliaries.map((slot) => unitKey(slot)),
    ror: list.regimentOfRenown
      ? {
          id: list.regimentOfRenown.renownId,
          units: list.regimentOfRenown.units.map((slot) => unitKey(slot)),
        }
      : null,
  });
}

function looksLikeArmyList(value: unknown): value is ArmyList {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.factionId === "string" &&
    Array.isArray(record.regiments)
  );
}

function splitListBlocks(raw: string): string[] {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    return [];
  }
  if (text.includes(BANNER)) {
    return text
      .split(BANNER)
      .map((block) => block.trim())
      .filter(Boolean);
  }
  return [text];
}

export function partitionPortableLists(
  incoming: ArmyList[],
  existing: ArmyList[],
): PortablePartition {
  const seen = new Set(existing.map(listContentKey));
  const novel: ArmyList[] = [];
  let skipped = 0;
  for (const list of incoming) {
    const key = listContentKey(list);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    novel.push(list);
  }
  return { novel, skipped };
}

function unitKey(selection: Selection | null): string | null {
  if (!selection) {
    return null;
  }
  return `${selection.unitId}:${selection.reinforced ? 1 : 0}`;
}

function selectionUnitKey(list: ArmyList, selectionId: string): string | null {
  const selections = [
    ...list.regiments.flatMap((regiment) => [
      regiment.hero,
      ...regiment.units,
    ]),
    ...list.auxiliaries,
    ...(list.regimentOfRenown?.units ?? []),
  ];
  const match = selections.find((item) => item?.id === selectionId);
  return unitKey(match ?? null);
}

function enhancementKey(
  list: ArmyList,
  pick: EnhancementPick | null,
): { optionId: string; bearer: string | null } | null {
  if (!pick) {
    return null;
  }
  return {
    optionId: pick.optionId,
    bearer: selectionUnitKey(list, pick.heroSelectionId),
  };
}

function parseListBlock(block: string): ArmyList | null {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("Built with ") && !/^https?:\/\//.test(line));
  if (lines.length < 2) {
    return null;
  }

  const name = lines[0];
  const catalogue = findCatalogue(lines[1]);
  if (!name || !catalogue) {
    return null;
  }

  const now = Date.now();
  const list: ArmyList = {
    id: createId(),
    name,
    factionId: catalogue.factionId,
    kind: catalogue.kind,
    spearheadId: catalogue.spearheadId,
    regimentAbilityId: null,
    pointsCap: catalogue.kind === "spearhead" ? 0 : 2000,
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
    scourgeRealm: catalogue.kind === "spearhead" ? null : "aqshy",
    generalRegimentId: null,
    regiments: [],
    auxiliaries: [],
    regimentOfRenown: null,
    powerBinds: {},
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  const pendingEnhancements: PendingEnhancement[] = [];
  let section: "header" | "enhancements" | "aux" | "ror" | "regiment" = "header";
  let currentRegiment: ArmyList["regiments"][number] | null = null;
  let regimentHeroPending = false;
  let rorUnits: Selection[] = [];
  let rorId: string | null = null;

  for (const line of lines.slice(2)) {
    if (line === "Army enhancements") {
      flushRegiment();
      section = "enhancements";
      continue;
    }
    if (line === "Auxiliaries") {
      flushRegiment();
      section = "aux";
      continue;
    }
    const rorHeader = line.match(/^Regiment of Renown: (.+?)(?: · .+)?$/);
    if (rorHeader) {
      flushRegiment();
      const rorName = rorHeader[1]?.replace(/ \((unknown)\)$/, "") ?? "";
      const rorList = getRegimentsOfRenownSync();
      const ror = rorList?.find((item) => item.name === rorName);
      rorId = ror?.id ?? null;
      rorUnits = [];
      section = "ror";
      continue;
    }
    const regimentHeader = line.match(/^Regiment (\d+)(?: — General)?$/);
    if (regimentHeader) {
      flushRegiment();
      currentRegiment = { id: createId(), hero: null, units: [] };
      regimentHeroPending = true;
      if (line.includes("General")) {
        list.generalRegimentId = currentRegiment.id;
      }
      section = "regiment";
      continue;
    }

    if (section === "header") {
      applyHeaderLine(list, catalogue.faction, line);
      continue;
    }
    if (section === "enhancements") {
      const pending = parseEnhancementLine(line);
      if (pending) {
        pendingEnhancements.push(pending);
      }
      continue;
    }
    if (section === "aux") {
      const selection = parseSelectionLine(line, catalogue.faction, false);
      if (selection) {
        list.auxiliaries.push(selection);
      }
      continue;
    }
    if (section === "ror") {
      const rorList = getRegimentsOfRenownSync();
      const ror = rorId && rorList
        ? rorList.find((item) => item.id === rorId)
        : undefined;
      const selection = parseRorSelectionLine(line, ror?.units ?? []);
      if (selection) {
        rorUnits.push(selection);
      }
      continue;
    }
    if (section === "regiment" && currentRegiment) {
      if (line === "- (no hero)") {
        currentRegiment.hero = null;
        regimentHeroPending = false;
        continue;
      }
      const selection = parseSelectionLine(
        line,
        catalogue.faction,
        regimentHeroPending,
      );
      if (!selection) {
        continue;
      }
      if (regimentHeroPending) {
        currentRegiment.hero = selection;
        regimentHeroPending = false;
      } else {
        currentRegiment.units.push(selection);
      }
    }
  }
  flushRegiment();
  if (rorId) {
    list.regimentOfRenown = { renownId: rorId, units: rorUnits };
  }
  if (!list.generalRegimentId) {
    list.generalRegimentId = list.regiments[0]?.id ?? null;
  }

  applyEnhancements(list, catalogue.faction, pendingEnhancements);
  return list;

  function flushRegiment() {
    if (currentRegiment) {
      list.regiments.push(currentRegiment);
      currentRegiment = null;
    }
  }
}

type CatalogueHit = {
  faction: FactionCatalogue;
  kind: ArmyListKind;
  factionId: string;
  spearheadId: string | null;
};

function findCatalogue(name: string): CatalogueHit | null {
  const allFactions = getAllFactionsSync();
  const faction = allFactions.find((item) => item.name === name);
  if (faction) {
    return {
      faction,
      kind: "matched",
      factionId: faction.id,
      spearheadId: null,
    };
  }
  const box = listSpearheads().find((item) => item.name === name);
  if (!box) {
    return null;
  }
  return {
    faction: spearheadAsFaction(box),
    kind: "spearhead",
    factionId: box.parentFactionId,
    spearheadId: box.id,
  };
}

function applyHeaderLine(
  list: ArmyList,
  faction: FactionCatalogue,
  line: string,
) {
  if (line === "Scourge of Aqshy") {
    list.scourgeRealm = "aqshy";
    return;
  }
  if (line === "Scourge of Ghyran") {
    list.scourgeRealm = "ghyran";
    return;
  }
  if (/pts · .+ used/.test(line)) {
    const cap = parsePointsCap(line.slice(0, line.indexOf("pts")));
    if (cap != null) {
      list.pointsCap = cap;
    }
    return;
  }
  const labeled = line.match(
    /^(Battle formation|Spell lore|Prayer lore|Manifestation lore|Battle tactic cards): (.+)$/,
  );
  if (!labeled) {
    return;
  }
  const label = labeled[1];
  const value = labeled[2] ?? "";
  if (label === "Battle formation") {
    const formationName = value.replace(/ \(\d+ pts\)$/, "");
    list.formationId =
      faction.formations.find((item) => item.name === formationName)?.id ??
      null;
    return;
  }
  if (label === "Spell lore") {
    list.spellLoreId =
      faction.spellLores.find((item) => item.name === value)?.id ?? null;
    return;
  }
  if (label === "Prayer lore") {
    list.prayerLoreId =
      faction.prayerLores.find((item) => item.name === value)?.id ?? null;
    return;
  }
  if (label === "Manifestation lore") {
    list.manifestationLoreId =
      faction.manifestationLores.find((item) => item.name === value)?.id ??
      null;
    return;
  }
  list.battleTacticCardIds = value
    .split(", ")
    .map((cardName) => battleTactics.find((card) => card.name === cardName)?.id)
    .filter((id): id is string => Boolean(id));
}

type PendingEnhancement = {
  label: string;
  optionName: string;
  bearer: string | null;
};

function parseEnhancementLine(line: string): PendingEnhancement | null {
  const match = line.match(/^- (.+?): (.+)$/);
  if (!match) {
    return null;
  }
  let rest = match[2] ?? "";
  let bearer: string | null = null;
  const wrapped = rest.match(/ \((.+)\)$/);
  if (wrapped) {
    bearer = wrapped[1] ?? null;
    rest = rest.slice(0, -wrapped[0].length);
  }
  return {
    label: match[1] ?? "",
    optionName: rest.replace(/ · [\d,.]+ pts$/, ""),
    bearer,
  };
}

function parseSelectionLine(
  line: string,
  faction: FactionCatalogue,
  preferHero: boolean,
): Selection | null {
  const parsed = parseUnitBullet(line);
  if (!parsed) {
    return null;
  }
  const unit = findUnit(faction.units, parsed.name, preferHero);
  if (!unit) {
    return null;
  }
  return {
    id: createId(),
    unitId: unit.id,
    reinforced: parsed.reinforced,
  };
}

function parseRorSelectionLine(
  line: string,
  units: { id: string; name: string }[],
): Selection | null {
  const parsed = parseUnitBullet(line);
  if (!parsed) {
    return null;
  }
  const unit = units.find((item) => item.name === parsed.name);
  if (!unit) {
    return null;
  }
  return {
    id: createId(),
    unitId: unit.id,
    reinforced: parsed.reinforced,
  };
}

function parseUnitBullet(
  line: string,
): { name: string; reinforced: boolean } | null {
  if (!line.startsWith("- ") || line === "- (no hero)") {
    return null;
  }
  const left = line.slice(2).split(" · ")[0]?.trim() ?? "";
  if (!left) {
    return null;
  }
  const reinforced = left.endsWith(", reinforced");
  return {
    name: reinforced ? left.slice(0, -", reinforced".length) : left,
    reinforced,
  };
}

function findUnit(
  units: CatalogueUnit[],
  name: string,
  preferHero: boolean,
): CatalogueUnit | undefined {
  const matches = units.filter((unit) => unit.name === name);
  if (preferHero) {
    return matches.find((unit) => unit.hero) ?? matches[0];
  }
  return matches.find((unit) => !unit.hero) ?? matches[0];
}

function applyEnhancements(
  list: ArmyList,
  faction: FactionCatalogue,
  pending: PendingEnhancement[],
) {
  const special: SpecialEnhancementPick[] = [];
  for (const item of pending) {
    const bearerId = bearerSelectionId(list, faction, item.bearer);
    if (!bearerId) {
      continue;
    }
    if (item.label === "Artefact") {
      list.artefact = enhancementPick(faction.artefacts, item.optionName, bearerId);
      continue;
    }
    if (item.label === "Heroic trait") {
      list.heroicTrait = enhancementPick(
        faction.heroicTraits,
        item.optionName,
        bearerId,
      );
      continue;
    }
    if (item.label === "Monstrous trait") {
      list.monstrousTrait = enhancementPick(
        faction.monstrousTraits ?? [],
        item.optionName,
        bearerId,
      );
      continue;
    }
    if (item.label === "Vision of Fate") {
      list.visionOfFate = enhancementPick(
        faction.visionsOfFate ?? [],
        item.optionName,
        bearerId,
      );
      continue;
    }
    const table = faction.specialEnhancementTables?.find(
      (entry) => entry.name === item.label,
    );
    const option = table?.options.find((entry) => entry.name === item.optionName);
    if (table && option) {
      special.push({
        tableId: table.id,
        heroSelectionId: bearerId,
        optionId: option.id,
      });
    }
  }
  list.specialEnhancements = special;
}

function enhancementPick(
  options: EnhancementOption[],
  optionName: string,
  heroSelectionId: string,
): EnhancementPick | null {
  const option = options.find((item) => item.name === optionName);
  if (!option) {
    return null;
  }
  return { heroSelectionId, optionId: option.id };
}

function bearerSelectionId(
  list: ArmyList,
  faction: FactionCatalogue,
  bearerName: string | null,
): string | null {
  const selections = [
    ...list.regiments.flatMap((regiment) => [
      regiment.hero,
      ...regiment.units,
    ]),
    ...list.auxiliaries,
    ...(list.regimentOfRenown?.units ?? []),
  ].filter((item): item is Selection => Boolean(item));
  if (bearerName) {
    for (const selection of selections) {
      if (getListUnit(list, faction, selection.unitId)?.name === bearerName) {
        return selection.id;
      }
    }
  }
  return list.regiments.find((regiment) => regiment.hero)?.hero?.id ?? null;
}
