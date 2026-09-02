export const TOW_CATEGORIES = [
  "characters",
  "core",
  "special",
  "rare",
] as const;

export type TowCategory = (typeof TOW_CATEGORIES)[number];

export type TowStats = {
  M: string;
  WS: string;
  BS: string;
  S: string;
  T: string;
  W: string;
  I: string;
  A: string;
  Ld: string;
};

export type TowNamedOption = {
  id: string;
  name: string;
  points: number;
  /** Present on mounts and similar linked models. */
  stats?: TowStats;
  specialRules?: TowSpecialRule[];
};

export type TowOptionGroup = {
  id: string;
  name: string;
  options: TowNamedOption[];
};

export type TowSpecialRule = {
  name: string;
  text: string;
};

export type TowWeapon = {
  name: string;
  range: string;
  strength: string;
  ap: string;
  specialRules: string;
};

export type TowCatalogueUnit = {
  id: string;
  name: string;
  category: TowCategory;
  pointsPerModel: number;
  minModels: number;
  maxModels: number;
  character: boolean;
  canTakeDetachments: boolean;
  /** Character may join a friendly regiment (not Orion-style own-unit characters). */
  canJoinUnits: boolean;
  troopType: string;
  /** Character may take Magic Items via the Anvil-style picker. */
  magicItems: boolean;
  command: TowNamedOption[];
  optionGroups: TowOptionGroup[];
  specialRules: TowSpecialRule[];
  weapons: TowWeapon[];
  stats: TowStats;
};

export type TowFactionCatalogue = {
  id: string;
  name: string;
  game: "The Old World";
  source: string;
  pointsCapDefault: number;
  journal?: boolean;
  units: TowCatalogueUnit[];
};

export type TowMagicItemCategory = {
  id: string;
  name: string;
  options: TowNamedOption[];
};

export type TowMagicItemsCatalogue = {
  id: string;
  name: string;
  game: "The Old World";
  source: string;
  categories: TowMagicItemCategory[];
};

export type TowLore = {
  id: string;
  name: string;
};

export type TowLoresCatalogue = {
  id: string;
  name: string;
  game: "The Old World";
  source: string;
  lores: TowLore[];
};

export type TowSelection = {
  id: string;
  unitId: string;
  category: TowCategory;
  models: number;
  commandIds: string[];
  optionIds: string[];
  magicItemIds: string[];
  joinSelectionId: string | null;
  detachments: TowSelection[];
  play?: {
    damage: number;
  };
};

export type TowList = {
  game: "tow";
  id: string;
  name: string;
  factionId: string;
  pointsCap: number;
  generalSelectionId: string | null;
  selections: TowSelection[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
};
