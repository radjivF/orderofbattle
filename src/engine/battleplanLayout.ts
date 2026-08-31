import battleplanMissions from "./data/battleplan-missions.json";

export type BattleplanPoint = { x: number; y: number };

export type BattleplanLayout = {
  id: string;
  name: string;
  table: 1 | 2;
  board: { width: number; height: number };
  territories: {
    attacker: BattleplanPoint[];
    defender: BattleplanPoint[];
  };
  objectives: Array<{
    id: string;
    x: number;
    y: number;
    kind: string;
  }>;
  terrain: Array<{
    id: string;
    x: number;
    y: number;
    kind: "obscuring" | "place-of-power" | "area";
  }>;
  twistTitle: string;
  /** Full battleplan twist text for setup and score. */
  twistEffect: string;
  /** Victory-point lines scored at the end of each of your turns. */
  primaryScoring: string[];
};

export type MissionPrimaryPoint = {
  id: string;
  label: string;
  vp: number;
};

export function missionPrimaryPoints(
  layout: BattleplanLayout,
): MissionPrimaryPoint[] {
  return layout.primaryScoring.map((label, index) => ({
    id: `primary-${index}`,
    label,
    vp: 1,
  }));
}

const W = 60;
const H = 44;

function longEdgeTerritories(): BattleplanLayout["territories"] {
  return {
    attacker: [
      { x: 0, y: 0 },
      { x: W, y: 0 },
      { x: W, y: 12 },
      { x: 0, y: 12 },
    ],
    defender: [
      { x: 0, y: H - 12 },
      { x: W, y: H - 12 },
      { x: W, y: H },
      { x: 0, y: H },
    ],
  };
}

function shortEdgeTerritories(): BattleplanLayout["territories"] {
  return {
    attacker: [
      { x: 0, y: 0 },
      { x: 12, y: 0 },
      { x: 12, y: H },
      { x: 0, y: H },
    ],
    defender: [
      { x: W - 12, y: 0 },
      { x: W, y: 0 },
      { x: W, y: H },
      { x: W - 12, y: H },
    ],
  };
}

function cornerTerritories(): BattleplanLayout["territories"] {
  return {
    attacker: [
      { x: 0, y: 0 },
      { x: 18, y: 0 },
      { x: 18, y: 18 },
      { x: 0, y: 18 },
    ],
    defender: [
      { x: W - 18, y: H - 18 },
      { x: W, y: H - 18 },
      { x: W, y: H },
      { x: W - 18, y: H },
    ],
  };
}

function objs(
  points: Array<{ id: string; x: number; y: number; kind?: string }>,
): BattleplanLayout["objectives"] {
  return points.map((point) => ({
    kind: point.kind ?? "objective",
    id: point.id,
    x: point.x,
    y: point.y,
  }));
}

function terrainMarks(
  points: Array<{
    id: string;
    x: number;
    y: number;
    kind?: BattleplanLayout["terrain"][number]["kind"];
  }>,
): BattleplanLayout["terrain"] {
  return points.map((point) => ({
    kind: point.kind ?? "obscuring",
    id: point.id,
    x: point.x,
    y: point.y,
  }));
}

/** Author schematics for Scourge of Aqshy / GHB 2026–27 — not GW art. */
type BattleplanSchematic = Omit<BattleplanLayout, "twistEffect" | "primaryScoring">;

const battleplanSchematics: BattleplanSchematic[] = [
  {
    id: "into-the-fire",
    name: "Into the Fire",
    table: 1,
    board: { width: W, height: H },
    territories: longEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 15, y: 22 },
      { id: "b", x: 30, y: 22 },
      { id: "c", x: 45, y: 22 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 22, y: 14 },
      { id: "t2", x: 38, y: 30 },
    ]),
    twistTitle: "Into the Fire",
  },
  {
    id: "bloodstained-coasts",
    name: "Bloodstained Coasts",
    table: 1,
    board: { width: W, height: H },
    territories: shortEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 20, y: 11 },
      { id: "b", x: 40, y: 11 },
      { id: "c", x: 20, y: 33 },
      { id: "d", x: 40, y: 33 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 30, y: 22, kind: "area" },
    ]),
    twistTitle: "Bloodstained Coasts",
  },
  {
    id: "avalanche-of-ash",
    name: "Avalanche of Ash",
    table: 1,
    board: { width: W, height: H },
    territories: longEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 12, y: 22 },
      { id: "b", x: 30, y: 14 },
      { id: "c", x: 30, y: 30 },
      { id: "d", x: 48, y: 22 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 30, y: 22, kind: "place-of-power" },
    ]),
    twistTitle: "Avalanche of Ash",
  },
  {
    id: "caverns-of-slaughter",
    name: "Caverns of Slaughter",
    table: 1,
    board: { width: W, height: H },
    territories: cornerTerritories(),
    objectives: objs([
      { id: "a", x: 18, y: 22 },
      { id: "b", x: 30, y: 22 },
      { id: "c", x: 42, y: 22 },
      { id: "d", x: 30, y: 10 },
      { id: "e", x: 30, y: 34 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 24, y: 16 },
      { id: "t2", x: 36, y: 28 },
    ]),
    twistTitle: "Caverns of Slaughter",
  },
  {
    id: "whats-yours-is-ours",
    name: "What’s Yours Is Ours",
    table: 1,
    board: { width: W, height: H },
    territories: longEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 15, y: 15 },
      { id: "b", x: 45, y: 15 },
      { id: "c", x: 15, y: 29 },
      { id: "d", x: 45, y: 29 },
      { id: "e", x: 30, y: 22 },
    ]),
    terrain: terrainMarks([{ id: "t1", x: 30, y: 8 }]),
    twistTitle: "What’s Yours Is Ours",
  },
  {
    id: "hidden-under-ash-clouds",
    name: "Hidden Under Ash-Clouds",
    table: 1,
    board: { width: W, height: H },
    territories: shortEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 18, y: 14 },
      { id: "b", x: 42, y: 14 },
      { id: "c", x: 18, y: 30 },
      { id: "d", x: 42, y: 30 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 30, y: 22, kind: "obscuring" },
      { id: "t2", x: 12, y: 22, kind: "obscuring" },
      { id: "t3", x: 48, y: 22, kind: "obscuring" },
    ]),
    twistTitle: "Hidden Under Ash-Clouds",
  },
  {
    id: "warped-ruins",
    name: "Warped Ruins",
    table: 2,
    board: { width: W, height: H },
    territories: cornerTerritories(),
    objectives: objs([
      { id: "a", x: 20, y: 14 },
      { id: "b", x: 40, y: 14 },
      { id: "c", x: 20, y: 30 },
      { id: "d", x: 40, y: 30 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 30, y: 22, kind: "place-of-power" },
      { id: "t2", x: 15, y: 22, kind: "area" },
      { id: "t3", x: 45, y: 22, kind: "area" },
    ]),
    twistTitle: "Warped Ruins",
  },
  {
    id: "curse-of-the-gnaw",
    name: "Curse of the Gnaw",
    table: 2,
    board: { width: W, height: H },
    territories: longEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 12, y: 14 },
      { id: "b", x: 30, y: 14 },
      { id: "c", x: 48, y: 14 },
      { id: "d", x: 21, y: 30 },
      { id: "e", x: 39, y: 30 },
    ]),
    terrain: terrainMarks([{ id: "t1", x: 30, y: 22, kind: "area" }]),
    twistTitle: "Curse of the Gnaw",
  },
  {
    id: "seize-the-embers",
    name: "Seize the Embers",
    table: 2,
    board: { width: W, height: H },
    territories: shortEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 30, y: 10 },
      { id: "b", x: 18, y: 22 },
      { id: "c", x: 42, y: 22 },
      { id: "d", x: 30, y: 34 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 30, y: 22, kind: "place-of-power" },
    ]),
    twistTitle: "Seize the Embers",
  },
  {
    id: "treacherous-ground",
    name: "Treacherous Ground",
    table: 2,
    board: { width: W, height: H },
    territories: longEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 15, y: 22 },
      { id: "b", x: 30, y: 16 },
      { id: "c", x: 30, y: 28 },
      { id: "d", x: 45, y: 22 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 22, y: 22, kind: "area" },
      { id: "t2", x: 38, y: 22, kind: "area" },
    ]),
    twistTitle: "Treacherous Ground",
  },
  {
    id: "escape-from-the-coast",
    name: "Escape from the Coast",
    table: 2,
    board: { width: W, height: H },
    territories: shortEdgeTerritories(),
    objectives: objs([
      { id: "a", x: 12, y: 22 },
      { id: "b", x: 24, y: 22 },
      { id: "c", x: 36, y: 22 },
      { id: "d", x: 48, y: 22 },
    ]),
    terrain: terrainMarks([{ id: "t1", x: 30, y: 12 }, { id: "t2", x: 30, y: 32 }]),
    twistTitle: "Escape from the Coast",
  },
  {
    id: "power-of-the-realms",
    name: "Power of the Realms",
    table: 2,
    board: { width: W, height: H },
    territories: cornerTerritories(),
    objectives: objs([
      { id: "a", x: 15, y: 15 },
      { id: "b", x: 45, y: 15 },
      { id: "c", x: 15, y: 29 },
      { id: "d", x: 45, y: 29 },
      { id: "e", x: 30, y: 22 },
    ]),
    terrain: terrainMarks([
      { id: "t1", x: 30, y: 22, kind: "place-of-power" },
    ]),
    twistTitle: "Power of the Realms",
  },
];

export const battleplanLayouts: BattleplanLayout[] = battleplanSchematics.map(
  (schematic) => {
    const mission =
      battleplanMissions[schematic.id as keyof typeof battleplanMissions];
    if (!mission) {
      throw new Error(`Missing mission text for battleplan ${schematic.id}`);
    }
    return {
      ...schematic,
      twistEffect: mission.twistEffect,
      primaryScoring: mission.primaryScoring,
    };
  },
);

export function getBattleplanLayout(id: string): BattleplanLayout | undefined {
  return battleplanLayouts.find((plan) => plan.id === id);
}

export const BATTLEPLAN_IDS = [
  "into-the-fire",
  "bloodstained-coasts",
  "avalanche-of-ash",
  "caverns-of-slaughter",
  "whats-yours-is-ours",
  "hidden-under-ash-clouds",
  "warped-ruins",
  "curse-of-the-gnaw",
  "seize-the-embers",
  "treacherous-ground",
  "escape-from-the-coast",
  "power-of-the-realms",
] as const;
