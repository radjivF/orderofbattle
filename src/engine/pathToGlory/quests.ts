export type PathToGloryQuest = {
  id: string;
  name: string;
};

export type PathToGloryBattleplan = {
  id: string;
  name: string;
  twists: string[];
};

/** Ascension quests from Path to Glory. */
export const PATH_TO_GLORY_QUESTS: PathToGloryQuest[] = [
  { id: "search-artefact", name: "Search for the Artefact" },
  { id: "master-magical-lore", name: "Master Magical Lore" },
  { id: "learn-ancient-scriptures", name: "Learn Ancient Scriptures" },
  { id: "seek-glory", name: "Seek Glory in Battle" },
  { id: "harness-manifestation", name: "Harness Manifestation" },
  { id: "rise-champion", name: "Rise of a Champion" },
];

/** Ascension battleplans from Path to Glory. */
export const PATH_TO_GLORY_BATTLEPLANS: PathToGloryBattleplan[] = [
  {
    id: "ruined-settlement",
    name: "Ruined Settlement",
    twists: ["Unexpected Discovery", "Hidden Danger", "Ancient Power"],
  },
  {
    id: "relics-myth",
    name: "Relics of Myth",
    twists: ["Sacred Ground", "Cursed Relic", "Divine Intervention"],
  },
  {
    id: "decisive-battle",
    name: "Decisive Battle",
    twists: ["Overwhelming Force", "Last Stand", "Tactical Genius"],
  },
  {
    id: "ambush",
    name: "Ambush",
    twists: ["Perfect Timing", "Betrayal", "Swift Strike"],
  },
  {
    id: "wreck-ruin",
    name: "Wreck and Ruin",
    twists: ["Total Destruction", "Scorched Earth", "Apocalyptic End"],
  },
  {
    id: "ritual",
    name: "The Ritual",
    twists: ["Arcane Convergence", "Ritual Interrupted", "Power Unleashed"],
  },
];

export function findQuest(questId: string | null | undefined) {
  if (!questId) {
    return undefined;
  }
  return PATH_TO_GLORY_QUESTS.find((quest) => quest.id === questId);
}

export function findBattleplan(battleplanId: string | null | undefined) {
  if (!battleplanId) {
    return undefined;
  }
  return PATH_TO_GLORY_BATTLEPLANS.find((plan) => plan.id === battleplanId);
}
