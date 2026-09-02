import { formatPoints } from "../pointsCap";
import {
  findTowMagicItem,
  getTowFaction,
  getTowUnit,
  woundsCharacteristic,
} from "./queries";
import type { TowCategory, TowList, TowSelection } from "./types";
import { TOW_CATEGORIES } from "./types";

export type TowIssue = {
  tone: "ok" | "warn" | "bad";
  text: string;
};

export type TowTotals = {
  points: number;
  remaining: number;
  issues: TowIssue[];
  byCategory: Record<TowCategory, number>;
};

const CAPS: Record<TowCategory, { max?: number; min?: number }> = {
  characters: { max: 0.5 },
  core: { min: 0.25 },
  special: { max: 0.5 },
  rare: { max: 0.25 },
};

function selectionPoints(
  selection: TowSelection,
  factionId: string,
): number {
  const faction = getTowFaction(factionId);
  const unit = faction ? getTowUnit(faction, selection.unitId) : undefined;
  if (!unit) {
    return 0;
  }
  let points = unit.pointsPerModel * selection.models;
  for (const commandId of selection.commandIds) {
    points += unit.command.find((item) => item.id === commandId)?.points ?? 0;
  }
  for (const group of unit.optionGroups) {
    for (const option of group.options) {
      if (selection.optionIds.includes(option.id)) {
        points += option.points * (unit.character ? 1 : selection.models);
      }
    }
  }
  for (const itemId of selection.magicItemIds ?? []) {
    points += findTowMagicItem(itemId)?.points ?? 0;
  }
  for (const child of selection.detachments) {
    points += selectionPoints(child, factionId);
  }
  return points;
}

function walkSelections(list: TowList): TowSelection[] {
  return list.selections.flatMap((selection) => [
    selection,
    ...selection.detachments,
  ]);
}

export function towSummarize(list: TowList): TowTotals {
  const faction = getTowFaction(list.factionId);
  const issues: TowIssue[] = [];
  const byCategory: Record<TowCategory, number> = {
    characters: 0,
    core: 0,
    special: 0,
    rare: 0,
  };

  if (!faction) {
    issues.push({ tone: "bad", text: "Unknown faction." });
    return { points: 0, remaining: list.pointsCap, issues, byCategory };
  }

  for (const selection of list.selections) {
    const unit = getTowUnit(faction, selection.unitId);
    if (!unit) {
      issues.push({ tone: "bad", text: "Unknown unit in the list." });
      continue;
    }
    if (selection.models < unit.minModels) {
      issues.push({
        tone: "bad",
        text: `${unit.name} needs at least ${unit.minModels} models.`,
      });
    }
    if (selection.models > unit.maxModels) {
      issues.push({
        tone: "bad",
        text: `${unit.name} cannot take more than ${unit.maxModels} models.`,
      });
    }
    if (selection.detachments.length > 2) {
      issues.push({
        tone: "bad",
        text: `${unit.name} can attach at most 2 detachments.`,
      });
    }
    if (selection.detachments.length > 0 && !unit.canTakeDetachments) {
      issues.push({
        tone: "bad",
        text: `${unit.name} cannot take detachments.`,
      });
    }
    byCategory[selection.category] += selectionPoints(
      selection,
      list.factionId,
    );
  }

  const points = TOW_CATEGORIES.reduce(
    (sum, category) => sum + byCategory[category],
    0,
  );

  // Force-org % is vs the chosen points limit (e.g. 50% of 2000), not spent pts.
  const armySize = list.pointsCap > 0 ? list.pointsCap : points;
  if (armySize > 0 && points > 0) {
    if (byCategory.characters / armySize > (CAPS.characters.max ?? 1)) {
      issues.push({
        tone: "bad",
        text: "Characters are over 50% of the army.",
      });
    }
    if (byCategory.core / armySize < (CAPS.core.min ?? 0)) {
      issues.push({
        tone: "bad",
        text: "Core is under 25% of the army.",
      });
    }
    if (byCategory.special / armySize > (CAPS.special.max ?? 1)) {
      issues.push({
        tone: "bad",
        text: "Special is over 50% of the army.",
      });
    }
    if (byCategory.rare / armySize > (CAPS.rare.max ?? 1)) {
      issues.push({
        tone: "bad",
        text: "Rare is over 25% of the army.",
      });
    }
  }

  if (points > list.pointsCap) {
    issues.push({
      tone: "bad",
      text: `${formatPoints(points)} pts is over the ${formatPoints(list.pointsCap)} cap.`,
    });
  }

  const hasCharacter = list.selections.some((selection) => {
    const unit = getTowUnit(faction, selection.unitId);
    return Boolean(unit?.character);
  });
  if (list.selections.length > 0 && (!list.generalSelectionId || !hasCharacter)) {
    issues.push({
      tone: "bad",
      text: "Choose a General.",
    });
  }

  const bsbCount = walkSelections(list).filter((selection) =>
    selection.commandIds.includes("battle-standard-bearer"),
  ).length;
  if (bsbCount > 1) {
    issues.push({
      tone: "bad",
      text: "Only one Battle Standard Bearer is allowed.",
    });
  }

  const magicSeen = new Set<string>();
  for (const selection of walkSelections(list)) {
    for (const itemId of selection.magicItemIds ?? []) {
      if (magicSeen.has(itemId)) {
        const item = findTowMagicItem(itemId);
        issues.push({
          tone: "bad",
          text: `${item?.name ?? "Magic item"} is taken more than once.`,
        });
      }
      magicSeen.add(itemId);
    }
  }

  const namedCounts = new Map<string, number>();
  for (const selection of list.selections) {
    const unit = getTowUnit(faction, selection.unitId);
    if (!unit?.character) {
      continue;
    }
    if (/named character/i.test(unit.troopType)) {
      namedCounts.set(unit.id, (namedCounts.get(unit.id) ?? 0) + 1);
    }
  }
  for (const [unitId, count] of namedCounts) {
    if (count > 1) {
      const unit = getTowUnit(faction, unitId);
      issues.push({
        tone: "bad",
        text: `${unit?.name ?? unitId} can only be taken once.`,
      });
    }
  }

  return {
    points,
    remaining: list.pointsCap - points,
    issues,
    byCategory,
  };
}

export function serializeTowListText(list: TowList): string {
  const faction = getTowFaction(list.factionId);
  const totals = towSummarize(list);
  const lines = [
    list.name,
    faction?.name ?? list.factionId,
    `${formatPoints(totals.points)} / ${formatPoints(list.pointsCap)} pts`,
  ];
  for (const selection of list.selections) {
    const unit = faction ? getTowUnit(faction, selection.unitId) : undefined;
    const extras = [
      ...selection.commandIds
        .map((id) => unit?.command.find((item) => item.id === id)?.name)
        .filter(Boolean),
      ...selection.optionIds.flatMap((id) =>
        unit?.optionGroups.flatMap((group) =>
          group.options.filter((option) => option.id === id).map((option) => option.name),
        ) ?? [],
      ),
      ...(selection.magicItemIds ?? [])
        .map((id) => findTowMagicItem(id)?.name)
        .filter(Boolean),
    ];
    const suffix = extras.length > 0 ? ` [${extras.join(", ")}]` : "";
    lines.push(`${selection.models} ${unit?.name ?? selection.unitId}${suffix}`);
    for (const child of selection.detachments) {
      const childUnit = faction ? getTowUnit(faction, child.unitId) : undefined;
      lines.push(`  ${child.models} ${childUnit?.name ?? child.unitId}`);
    }
  }
  return lines.join("\n");
}

export function towPlayRemaining(selection: TowSelection, factionId: string) {
  const faction = getTowFaction(factionId);
  const unit = faction ? getTowUnit(faction, selection.unitId) : undefined;
  const damage = selection.play?.damage ?? 0;
  if (!unit) {
    return { kind: "models" as const, current: selection.models, max: selection.models };
  }
  if (unit.character || unit.maxModels === 1) {
    const max = woundsCharacteristic(unit.stats.W);
    return {
      kind: "wounds" as const,
      current: Math.max(0, max - damage),
      max,
    };
  }
  return {
    kind: "models" as const,
    current: Math.max(0, selection.models - damage),
    max: selection.models,
  };
}

export function towPlayTrack(
  selection: TowSelection,
  factionId: string,
): {
  damage: number;
  health: number;
  healthMax: number;
  healthPerModel: number;
  models: number;
  modelsMax: number;
} {
  const remaining = towPlayRemaining(selection, factionId);
  const damage = remaining.max - remaining.current;
  if (remaining.kind === "wounds") {
    return {
      damage,
      health: remaining.current,
      healthMax: remaining.max,
      healthPerModel: remaining.max,
      models: remaining.current > 0 ? 1 : 0,
      modelsMax: 1,
    };
  }
  return {
    damage,
    health: remaining.current,
    healthMax: remaining.max,
    healthPerModel: 1,
    models: remaining.current,
    modelsMax: remaining.max,
  };
}

export { walkSelections, selectionPoints };
