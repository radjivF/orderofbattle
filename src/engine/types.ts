export type RegimentOption = {
  type: "unit" | "category";
  id: string;
  name: string;
};

export type UnitStats = {
  move: string;
  health: string;
  save: string;
  control: string;
};

export type UnitWeapon = {
  name: string;
  kind: "melee" | "ranged";
  range: string;
  attacks: string;
  hit: string;
  wound: string;
  rend: string;
  damage: string;
  ability: string;
};

export type UnitAbility = {
  name: string;
  kind: string;
  timing: string;
  declare: string;
  effect: string;
  keywords: string;
  castingValue: string;
  chantingValue: string;
};

export type NamedOption = {
  id: string;
  name: string;
};

export type LoreOption = NamedOption & {
  powers: UnitAbility[];
};

export type EnhancementOption = NamedOption & {
  abilities: UnitAbility[];
  /** Extra points cost from BSData, when present. */
  points?: number;
  /** Nested pack name, e.g. Brutal Beasts. */
  pack?: string;
};

export type CatalogueUnit = {
  id: string;
  name: string;
  points: number;
  hero: boolean;
  unique: boolean;
  reinforce: boolean;
  /** Base model count before reinforce. */
  models: number;
  categories: string[];
  stats: UnitStats;
  weapons: UnitWeapon[];
  abilities: UnitAbility[];
  /** Non-hero units that may join this hero's regiment. */
  regimentOptions: RegimentOption[];
  /** Other heroes that may join this hero's regiment. */
  regimentHeroes: RegimentOption[];
};

export type ManifestationModel = {
  id: string;
  name: string;
  stats: UnitStats;
  banishment: string;
  categories: string[];
  weapons: UnitWeapon[];
  abilities: UnitAbility[];
  summon: UnitAbility | null;
};

export type ManifestationLore = NamedOption & {
  manifestations: ManifestationModel[];
};

export type FactionTerrain = {
  id: string;
  name: string;
  stats: UnitStats;
  categories: string[];
  weapons: UnitWeapon[];
  abilities: UnitAbility[];
};

export type DatasheetSubject = CatalogueUnit | ManifestationModel | FactionTerrain;

export type Formation = {
  id: string;
  name: string;
  abilities: UnitAbility[];
};

export type EnhancementPick = {
  heroSelectionId: string;
  optionId: string;
};

/** Fixed warscroll inside a Regiment of Renown package. */
export type RegimentOfRenownUnit = {
  id: string;
  name: string;
  count: number;
  points: number;
  hero: boolean;
  unique: boolean;
  reinforce: boolean;
  models: number;
  categories: string[];
  stats: UnitStats;
  weapons: UnitWeapon[];
  abilities: UnitAbility[];
  /** BSData allows faction artefacts / heroic traits on this hero. */
  canTakeEnhancements: boolean;
};

export type RegimentOfRenown = {
  id: string;
  name: string;
  points: number;
  factionIds: string[];
  abilities: UnitAbility[];
  units: RegimentOfRenownUnit[];
};

export type RegimentOfRenownPick = {
  renownId: string;
  units: Selection[];
};

export type FactionCatalogue = {
  id: string;
  name: string;
  game: string;
  source: string;
  pointsCapDefault: number;
  formations: Formation[];
  /** Army-wide battle traits (always on for the faction). */
  battleTraits: Formation[];
  spellLores: LoreOption[];
  prayerLores: LoreOption[];
  manifestationLores: ManifestationLore[];
  artefacts: EnhancementOption[];
  heroicTraits: EnhancementOption[];
  monstrousTraits?: EnhancementOption[];
  visionsOfFate?: EnhancementOption[];
  terrain: FactionTerrain[];
  units: CatalogueUnit[];
  /** Parent matched-play factions. Present on Armies of Renown. */
  parentFactionIds?: string[];
};

export type Selection = {
  id: string;
  unitId: string;
  reinforced: boolean;
  /** Damage taken in Play mode (counts up). Models left are derived. */
  play?: {
    damage: number;
    /** @deprecated Migrated from remaining-health tracking. */
    health?: number;
  };
};

export type Regiment = {
  id: string;
  hero: Selection | null;
  units: Selection[];
};

export type ArmyList = {
  id: string;
  name: string;
  factionId: string;
  pointsCap: number;
  formationId: string | null;
  spellLoreId: string | null;
  prayerLoreId: string | null;
  manifestationLoreId: string | null;
  artefact: EnhancementPick | null;
  heroicTrait: EnhancementPick | null;
  monstrousTrait: EnhancementPick | null;
  visionOfFate: EnhancementPick | null;
  /** null = core datasheets; aqshy/ghyran replaces matching warscrolls. */
  scourgeRealm: "aqshy" | "ghyran" | null;
  generalRegimentId: string | null;
  regiments: Regiment[];
  auxiliaries: Selection[];
  /** At most one Regiment of Renown package. */
  regimentOfRenown: RegimentOfRenownPick | null;
  /** Play mode: spell/prayer → friendly selection id, or enemy unit name. */
  powerBinds: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};
