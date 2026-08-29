import { createId } from "@/lib/id";
import { battleTactics, factions, regimentsOfRenown } from "./data/load";
import { STANDARD_POINTS_CAPS } from "./pointsCap";
import { unitBaseName } from "./queries";
import { inferScourgeRealm } from "./scourgeRealm";
import { listSpearheads, spearheadAsFaction } from "./spearhead";
import type {
  ArmyList,
  ArmyListKind,
  CatalogueUnit,
  EnhancementOption,
  FactionCatalogue,
  Selection,
  SpecialEnhancementPick,
} from "./types";

export type NewRecruitParseResult =
  | { ok: true; lists: ArmyList[] }
  | { ok: false; error: string };

const NOT_READABLE = "That list could not be read.";
const UNKNOWN_FACTION = "That list is not a faction we support.";
const NO_UNITS = "Could not match the units in that list.";

type CatalogueHit = {
  faction: FactionCatalogue;
  kind: ArmyListKind;
  factionId: string;
  spearheadId: string | null;
};

type Section = "header" | "regiment" | "aux" | "ror" | "terrain";

function isOrderOfBattleExport(raw: string): boolean {
  return /^===\s*Order of Battle\s*===/m.test(raw);
}

export function looksLikeNewRecruit(raw: string): boolean {
  if (isOrderOfBattleExport(raw)) {
    return false;
  }
  return (
    /Created with New Recruit/i.test(raw) ||
    /newrecruit\.eu/i.test(raw) ||
    /General's Regiment/i.test(raw) ||
    /\(\d+\s*points?\)\s*[-–—].*General's Handbook/i.test(raw)
  );
}

export function looksLikeAosApp(raw: string): boolean {
  if (isOrderOfBattleExport(raw)) {
    return false;
  }
  return (
    /Created with Warhammer Age of Sigmar:\s*The App/i.test(raw) ||
    /Grand Alliance\s+(Order|Chaos|Death|Destruction)\s*\|/i.test(raw)
  );
}

export function looksLikeImportedList(raw: string): boolean {
  return looksLikeNewRecruit(raw) || looksLikeAosApp(raw);
}

export function parseNewRecruitLists(raw: string): NewRecruitParseResult {
  const list = parseNewRecruitList(raw);
  if (!list.ok) {
    return list;
  }
  return { ok: true, lists: [list.list] };
}

function parseNewRecruitList(
  raw: string,
): { ok: true; list: ArmyList } | { ok: false; error: string } {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !/^Created with\b/i.test(line) &&
        !/^Data Version:/i.test(line) &&
        !/^App:\s/i.test(line) &&
        !/^-{3,}$/.test(line) &&
        !/^https?:\/\//.test(line),
    );
  if (lines.length < 2) {
    return { ok: false, error: NOT_READABLE };
  }

  const title = parseTitle(lines[0] ?? "");
  const catalogue = findCatalogueLine(lines);
  if (!catalogue) {
    return { ok: false, error: UNKNOWN_FACTION };
  }

  const now = Date.now();
  const list: ArmyList = {
    id: createId(),
    name: title.name,
    factionId: catalogue.factionId,
    kind: catalogue.kind,
    spearheadId: catalogue.spearheadId,
    regimentAbilityId: null,
    pointsCap:
      catalogue.kind === "spearhead"
        ? 0
        : title.cap && title.cap >= 1
          ? title.cap
          : inferPointsCap(title.points, catalogue.faction.pointsCapDefault),
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
    generalRegimentId: null,
    regiments: [],
    auxiliaries: [],
    regimentOfRenown: null,
    powerBinds: {},
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  let section: Section = "header";
  let currentRegiment: ArmyList["regiments"][number] | null = null;
  let regimentHeroPending = false;
  let currentSelection: Selection | null = null;
  let rorUnits: Selection[] = [];
  let rorId: string | null = null;

  for (const rawLine of lines.slice(1)) {
    if (namesEqual(rawLine, catalogue.faction.name)) {
      continue;
    }
    const { head, extras } = splitInlineBullets(rawLine);

    if (head.includes("|") || /^Grand Alliance\b/i.test(head)) {
      applyAllianceLine(list, catalogue.faction, head);
      continue;
    }
    if (isSkipMeta(head)) {
      continue;
    }
    if (/^Faction Terrain$/i.test(head)) {
      flushRegiment();
      section = "terrain";
      continue;
    }

    const generalHeader = /^General's Regiment$/i.test(head);
    const regimentHeader = head.match(/^Regiment\s+(\d+)$/i);
    const auxHeader = /^Auxiliar(?:y|ies)(?:\s+Units?)?$/i.test(head);
    const rorHeader = head.match(/^Regiments? of Renown(?:\s*[:–-]\s*(.+))?$/i);

    if (generalHeader || regimentHeader || auxHeader || rorHeader) {
      flushRegiment();
      currentSelection = null;
      if (auxHeader) {
        section = "aux";
        continue;
      }
      if (rorHeader) {
        const named = (rorHeader[1] ?? "").trim();
        const ror = named ? findRenown(named) : undefined;
        rorId = ror?.id ?? null;
        rorUnits = [];
        section = "ror";
        continue;
      }
      currentRegiment = { id: createId(), hero: null, units: [] };
      regimentHeroPending = true;
      if (generalHeader) {
        list.generalRegimentId = currentRegiment.id;
      }
      section = "regiment";
      continue;
    }

    if (section === "terrain") {
      continue;
    }

    if (section === "header") {
      applyHeaderLine(list, catalogue.faction, head);
      for (const extra of extras) {
        applyHeaderLine(list, catalogue.faction, extra);
      }
      continue;
    }

    if (isBullet(head)) {
      applyModifier(
        list,
        catalogue.faction,
        stripBullet(head),
        currentSelection,
        currentRegiment?.id ?? null,
      );
      continue;
    }

    if (section === "ror") {
      if (!rorId) {
        const ror = findRenown(stripPoints(head));
        rorId = ror?.id ?? null;
        continue;
      }
      const ror = regimentsOfRenown.find((item) => item.id === rorId);
      const selection = parseRorUnit(head, ror?.units ?? []);
      if (selection) {
        rorUnits.push(selection);
        currentSelection = selection;
      }
      continue;
    }

    if (section === "aux") {
      const selection = parseUnitLine(head, catalogue.faction, false);
      if (selection) {
        list.auxiliaries.push(selection);
        currentSelection = selection;
        for (const extra of extras) {
          applyModifier(list, catalogue.faction, extra, selection, null);
        }
      }
      continue;
    }

    if (section === "regiment" && currentRegiment) {
      const selection = parseUnitLine(
        head,
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
      currentSelection = selection;
      for (const extra of extras) {
        applyModifier(
          list,
          catalogue.faction,
          extra,
          selection,
          currentRegiment.id,
        );
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

  const unitCount =
    list.regiments.reduce(
      (count, regiment) =>
        count + (regiment.hero ? 1 : 0) + regiment.units.length,
      0,
    ) +
    list.auxiliaries.length +
    (list.regimentOfRenown?.units.length ?? 0);
  if (unitCount === 0) {
    return { ok: false, error: NO_UNITS };
  }

  list.scourgeRealm = inferScourgeRealm(list);
  return { ok: true, list };

  function flushRegiment() {
    if (currentRegiment) {
      list.regiments.push(currentRegiment);
      currentRegiment = null;
    }
  }
}

function parseTitle(
  line: string,
): { name: string; points: number | null; cap: number | null } {
  const usedCap = line.match(/^(.+?)\s+(\d+)\s*\/\s*(\d+)\s*pts\.?$/i);
  if (usedCap) {
    return {
      name: tidyTitleName(usedCap[1] ?? ""),
      points: Number.parseInt(usedCap[2] ?? "", 10) || null,
      cap: Number.parseInt(usedCap[3] ?? "", 10) || null,
    };
  }
  const match = line.match(
    /^(.+?)\s*\((\d+)\s*points?\)(?:\s*[-–—]\s*.+)?$/i,
  );
  if (match) {
    return {
      name: tidyTitleName(match[1] ?? ""),
      points: Number.parseInt(match[2] ?? "", 10) || null,
      cap: null,
    };
  }
  return { name: tidyTitleName(line) || "Imported list", points: null, cap: null };
}

function tidyTitleName(value: string): string {
  return value.replace(/[’‘‛]/g, "'").trim() || "Imported list";
}

function inferPointsCap(used: number | null, fallback: number): number {
  if (used == null || used < 1) {
    return fallback;
  }
  const standard = STANDARD_POINTS_CAPS.find((cap) => used <= cap);
  return standard ?? used;
}

function findCatalogueLine(lines: string[]): CatalogueHit | null {
  for (const line of lines.slice(0, 12)) {
    for (const candidate of catalogueCandidates(line)) {
      const hit = findCatalogue(candidate);
      if (hit) {
        return hit;
      }
    }
  }
  return null;
}

function catalogueCandidates(line: string): string[] {
  const parts = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return parts;
  }
  return [stripPoints(line)];
}

function findCatalogue(name: string): CatalogueHit | null {
  const faction = factions.find((item) => namesEqual(item.name, name));
  if (faction) {
    return {
      faction,
      kind: "matched",
      factionId: faction.id,
      spearheadId: null,
    };
  }
  const box = listSpearheads().find((item) => namesEqual(item.name, name));
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
  if (isBullet(line)) {
    addBattleTactic(list, stripBullet(line));
    return;
  }
  const labeled = line.match(
    /^(Battle Tactic Cards|Spell Lore|Prayer Lore|Manifestation Lore|Battle Formation)\s*[-–—:]\s*(.*)$/i,
  );
  if (labeled) {
    const label = (labeled[1] ?? "").toLowerCase();
    const value = stripTrailingPoints(labeled[2] ?? "");
    if (label === "battle tactic cards") {
      for (const card of value.split(/\s*,\s*/)) {
        addBattleTactic(list, card);
      }
      return;
    }
    if (label === "spell lore") {
      list.spellLoreId = findNamed(faction.spellLores, value);
      return;
    }
    if (label === "prayer lore") {
      list.prayerLoreId = findNamed(faction.prayerLores, value);
      return;
    }
    if (label === "manifestation lore") {
      list.manifestationLoreId = findNamed(faction.manifestationLores, value);
      return;
    }
    list.formationId = findNamed(faction.formations, value);
    return;
  }
  if (!list.formationId) {
    list.formationId = findNamed(faction.formations, line);
  }
}

function addBattleTactic(list: ArmyList, name: string) {
  const id = battleTactics.find((card) => namesEqual(card.name, name))?.id;
  if (!id || list.battleTacticCardIds.includes(id)) {
    return;
  }
  if (list.battleTacticCardIds.length >= 2) {
    return;
  }
  list.battleTacticCardIds.push(id);
}

function applyModifier(
  list: ArmyList,
  faction: FactionCatalogue,
  raw: string,
  selection: Selection | null,
  regimentId: string | null,
) {
  const text = stripBullet(raw);
  if (!text || !selection) {
    return;
  }
  if (/^general$/i.test(text)) {
    if (regimentId) {
      list.generalRegimentId = regimentId;
    }
    return;
  }
  if (/^reinforced$/i.test(text)) {
    selection.reinforced = true;
    return;
  }
  if (/^\d+\s*x\s/i.test(text)) {
    return;
  }
  assignEnhancement(list, faction, stripTrailingPoints(text), selection);
}

function assignEnhancement(
  list: ArmyList,
  faction: FactionCatalogue,
  optionName: string,
  bearer: Selection,
) {
  if (!optionName) {
    return;
  }
  const labeled = optionName.match(
    /^(Artefact|Heroic Trait|Monstrous Trait|Vision of Fate):\s*(.+)$/i,
  );
  const name = labeled ? labeled[2]!.trim() : optionName;
  if (takeEnhancement(faction.artefacts, name) && !list.artefact) {
    const option = findOption(faction.artefacts, name);
    if (option) {
      list.artefact = { heroSelectionId: bearer.id, optionId: option.id };
    }
    return;
  }
  if (takeEnhancement(faction.heroicTraits, name) && !list.heroicTrait) {
    const option = findOption(faction.heroicTraits, name);
    if (option) {
      list.heroicTrait = { heroSelectionId: bearer.id, optionId: option.id };
    }
    return;
  }
  if (
    takeEnhancement(faction.monstrousTraits ?? [], name) &&
    !list.monstrousTrait
  ) {
    const option = findOption(faction.monstrousTraits ?? [], name);
    if (option) {
      list.monstrousTrait = { heroSelectionId: bearer.id, optionId: option.id };
    }
    return;
  }
  if (
    takeEnhancement(faction.visionsOfFate ?? [], name) &&
    !list.visionOfFate
  ) {
    const option = findOption(faction.visionsOfFate ?? [], name);
    if (option) {
      list.visionOfFate = { heroSelectionId: bearer.id, optionId: option.id };
    }
    return;
  }
  const special: SpecialEnhancementPick[] = [...(list.specialEnhancements ?? [])];
  for (const table of faction.specialEnhancementTables ?? []) {
    const option = findOption(table.options, name);
    if (!option) {
      continue;
    }
    special.push({
      tableId: table.id,
      heroSelectionId: bearer.id,
      optionId: option.id,
    });
    list.specialEnhancements = special;
    return;
  }
}

function takeEnhancement(options: EnhancementOption[], name: string): boolean {
  return Boolean(findOption(options, name));
}

function findOption(
  options: EnhancementOption[],
  name: string,
): EnhancementOption | undefined {
  return options.find((item) => namesEqual(item.name, name));
}

function parseUnitLine(
  line: string,
  faction: FactionCatalogue,
  preferHero: boolean,
): Selection | null {
  const parsed = parseUnitName(line);
  if (!parsed) {
    return null;
  }
  const unit = findUnit(faction.units, parsed, preferHero);
  if (!unit) {
    return null;
  }
  return {
    id: createId(),
    unitId: unit.id,
    reinforced: false,
  };
}

function parseRorUnit(
  line: string,
  units: { id: string; name: string }[],
): Selection | null {
  const parsed = parseUnitName(line);
  if (!parsed) {
    return null;
  }
  const unit = units.find((item) => namesEqual(item.name, parsed));
  if (!unit) {
    return null;
  }
  return {
    id: createId(),
    unitId: unit.id,
    reinforced: false,
  };
}

function parseUnitName(line: string): string | null {
  const name = stripPoints(line);
  return name || null;
}

function findUnit(
  units: CatalogueUnit[],
  name: string,
  preferHero: boolean,
): CatalogueUnit | undefined {
  const candidates = [name, scourgeCanonicalName(name)].filter(
    (item, index, all) => all.indexOf(item) === index,
  );
  for (const candidate of candidates) {
    const matches = units.filter((unit) => namesEqual(unit.name, candidate));
    if (matches.length > 0) {
      return preferHero
        ? (matches.find((unit) => unit.hero) ?? matches[0])
        : (matches.find((unit) => !unit.hero) ?? matches[0]);
    }
  }
  const base = unitBaseName(scourgeCanonicalName(name));
  const family = units.filter((unit) =>
    namesEqual(unitBaseName(unit.name), base),
  );
  if (family.length === 0) {
    return undefined;
  }
  return preferHero
    ? (family.find((unit) => unit.hero) ?? family[0])
    : (family.find((unit) => !unit.hero) ?? family[0]);
}

function scourgeCanonicalName(name: string): string {
  const prefixed = name.match(/^(Scourge of (?:Aqshy|Ghyran))\s+(.+)$/i);
  if (prefixed) {
    return `${prefixed[2]} (${prefixed[1]})`;
  }
  return name;
}

function findRenown(name: string) {
  return regimentsOfRenown.find((item) => namesEqual(item.name, name));
}

function findNamed(
  options: { id: string; name: string }[],
  name: string,
): string | null {
  if (!name) {
    return null;
  }
  return options.find((item) => namesEqual(item.name, name))?.id ?? null;
}

function applyAllianceLine(
  list: ArmyList,
  faction: FactionCatalogue,
  line: string,
) {
  const parts = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!list.formationId) {
    for (const part of parts) {
      const formationId = findNamed(faction.formations, part);
      if (formationId) {
        list.formationId = formationId;
        return;
      }
    }
  }
}

function isSkipMeta(line: string): boolean {
  return (
    /^Auxiliaries?:\s*\d+/i.test(line) ||
    /^Drops:\s*\d+/i.test(line) ||
    /General's Handbook/i.test(line)
  );
}

function splitInlineBullets(line: string): { head: string; extras: string[] } {
  if (isBullet(line)) {
    return { head: line, extras: [] };
  }
  const parts = line.split(/\s*[•·]\s*/).map((part) => part.trim());
  if (parts.length < 2) {
    return { head: line, extras: [] };
  }
  return { head: parts[0] ?? line, extras: parts.slice(1).filter(Boolean) };
}

function isBullet(line: string): boolean {
  return /^[-•·]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[-•·]\s+/, "").trim();
}

function stripPoints(line: string): string {
  return line.replace(/\s*\(\d+\)\s*$/, "").trim();
}

function stripTrailingPoints(value: string): string {
  return value.replace(/\s*\(\d+\)\s*$/, "").trim();
}

function namesEqual(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[^\p{L}]+/u, "")
    .replace(/[’‘‛]/g, "'")
    .replace(/[-–—]/g, "-")
    .replace(/[✦★☆]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
