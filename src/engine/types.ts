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
  /** Command point cost from BSData, when present (e.g. "1", "2"). */
  cost?: string;
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

export type AnvilRank = {
  id: string;
  name: string;
  points: number;
  destiny: number;
};

export type AnvilStatPatch = {
  move?: string;
  health?: string;
  save?: string;
  control?: string;
};

export type AnvilForgeOption = {
  id: string;
  name: string;
  destiny: number;
  abilities: UnitAbility[];
  weapons: UnitWeapon[];
  stats?: AnvilStatPatch;
  statAdds?: { move?: number; health?: number; control?: number };
};

export type AnvilForgeGroup = {
  id: string;
  name: string;
  min: number;
  max: number | null;
  options: AnvilForgeOption[];
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
  /** Hidden Anvil of Apotheosis warscrolls — Path to Glory lists only. */
  pathToGloryOnly?: boolean;
  /** Destiny Point Limit ranks (Knight / Templar / Lord). */
  anvilRanks?: AnvilRank[];
  /** Named Anvil of Apotheosis picks (chamber, origin, mount, …). */
  anvilForge?: AnvilForgeGroup[];
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
  /** Extra points when this manifestation is paid separately from the lore. */
  points?: number;
};

export type ManifestationLore = NamedOption & {
  manifestations: ManifestationModel[];
  /** GHB/universal lore pack cost from BSData, when present. */
  points?: number;
};

export type FactionTerrain = {
  id: string;
  name: string;
  stats: UnitStats;
  categories: string[];
  weapons: UnitWeapon[];
  abilities: UnitAbility[];
};

export type Formation = {
  id: string;
  name: string;
  abilities: UnitAbility[];
  /** GHB/universal formation cost from BSData, when present. */
  points?: number;
};

export type EnhancementPick = {
  heroSelectionId: string;
  optionId: string;
};

export type SpecialEnhancementPick = EnhancementPick & {
  tableId: string;
};

export type SpecialEnhancementTable = {
  id: string;
  name: string;
  options: EnhancementOption[];
  /** Scourge season this table belongs to — omit for always-on tables. */
  realm?: "aqshy" | "ghyran";
  /** Aspects of the Deepwoods: non-HERO non-MONSTER only. */
  restrictTo?: "nonHeroNonMonster";
};

export type BattleTacticCard = {
  id: string;
  name: string;
  setup: string;
  affray: string;
  strike: string;
  domination: string;
  realm: "aqshy" | "ghyran";
};

/** 0 = none, 1 = Affray done, 2 = Strike, 3 = Domination. */
export type BattleTacticStage = 0 | 1 | 2 | 3;

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

export type DatasheetSubject =
  | CatalogueUnit
  | ManifestationModel
  | FactionTerrain
  | RegimentOfRenown;

export type SpearheadRosterEntry = {
  unitId: string;
  count: number;
  general?: boolean;
};

export type SpearheadCatalogue = {
  id: string;
  name: string;
  parentFactionId: string;
  game: string;
  source: string;
  roster: SpearheadRosterEntry[];
  battleTraits: Formation[];
  regimentAbilities: Formation[];
  enhancements: EnhancementOption[];
  units: CatalogueUnit[];
};

export type ArmyListKind = "matched" | "spearhead" | "pathToGlory";

export type PathToGloryBattlepackPreset =
  | "ascension"
  | "ravaged-coast"
  | "blighted-wilds"
  | "all";

export type PathToGloryPackId =
  | "ascension"
  | "ravaged-coast"
  | "blighted-wilds";

export type PathToGloryScarSeverity = "critical" | "serious" | "severe";

export type PathToGloryState = {
  packIds: PathToGloryPackId[];
  /** Spells learned in campaign — `loreId::name`, not a whole lore. */
  spellIds: string[];
  /** Manifestations learned in campaign — model ids, not a whole lore. */
  manifestationIds: string[];
};

export type PathToGlorySelectionState = {
  renown: number;
  pathId: string | null;
  pathOptionIds: string[];
  battleWoundId: string | null;
  scarId: string | null;
  /** Destiny Point Limit rank on an Anvil of Apotheosis hero. */
  anvilRankId?: string | null;
  /** Picked Anvil of Apotheosis option ids (chamber, origin, mount, …). */
  anvilPickIds?: string[];
  /** Artefact of Power on this unit — Path to Glory has no army-wide cap. */
  artefactId?: string | null;
  /** Heroic trait on this unit — Path to Glory has no army-wide cap. */
  heroicTraitId?: string | null;
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
  /** SoA-style tables with a separate one-pick slot (e.g. Scars of War). */
  specialEnhancementTables?: SpecialEnhancementTable[];
  terrain: FactionTerrain[];
  units: CatalogueUnit[];
  /** Parent matched-play factions. Present on Armies of Renown. */
  parentFactionIds?: string[];
};

export type Selection = {
  id: string;
  unitId: string;
  reinforced: boolean;
  /** Custom name. Empty or omitted uses the warscroll name. */
  nickname?: string;
  /** Path to Glory overlay. Independent of Play damage. */
  pathToGlory?: PathToGlorySelectionState;
  /** Damage taken in Play mode (counts up). Models left are derived. */
  play?: {
    damage: number;
    /** @deprecated Migrated from remaining-health tracking. */
    health?: number;
    /** Play phase ids this selection was dismissed from. */
    removedFromPhases?: string[];
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
  kind?: ArmyListKind;
  spearheadId?: string | null;
  pathToGlory?: PathToGloryState;
  regimentAbilityId?: string | null;
  pointsCap: number;
  formationId: string | null;
  spellLoreId: string | null;
  prayerLoreId: string | null;
  manifestationLoreId: string | null;
  artefact: EnhancementPick | null;
  heroicTrait: EnhancementPick | null;
  monstrousTrait: EnhancementPick | null;
  visionOfFate: EnhancementPick | null;
  specialEnhancements: SpecialEnhancementPick[];
  /** Up to 2 GHB battle tactic cards. */
  battleTacticCardIds: string[];
  /** Play mode: completed steps per card id. */
  battleTacticStage: Record<string, BattleTacticStage>;
  /** Scourge of Aqshy or Ghyran — sets battle tactic card pool and scourge warscroll season. */
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
  /** Last time the list was opened in the builder; drives library recency order. */
  lastOpenedAt?: number;
};
