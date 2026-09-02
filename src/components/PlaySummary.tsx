"use client";

import { namedOption } from "@/engine/queries";
import { isSpearheadList } from "@/engine/spearhead";
import { isPathToGloryList, learnedSpellsForList } from "@/engine/pathToGlory";
import type { ArmyList, FactionCatalogue } from "@/engine/types";

export function PlaySummary({
  list,
  faction,
}: {
  list: ArmyList;
  faction: FactionCatalogue;
}) {
  const formation = faction.formations.find(
    (item) => item.id === (list.regimentAbilityId ?? list.formationId),
  );
  const learnedSpells = isPathToGloryList(list)
    ? learnedSpellsForList(list, faction)
    : [];
  const spell = isSpearheadList(list)
    ? undefined
    : isPathToGloryList(list)
      ? learnedSpells.length > 0
        ? { name: learnedSpells.map((item) => item.power.name).join(" · ") }
        : undefined
      : namedOption(faction.spellLores, list.spellLoreId);
  const prayer = isSpearheadList(list)
    ? undefined
    : namedOption(faction.prayerLores, list.prayerLoreId);
  const lines = [
    formation?.name,
    spell?.name,
    prayer?.name,
  ].filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-ink-raised px-4 py-3 text-sm text-parchment/85 ring-1 ring-parchment/12">
      <p>{lines.join(" · ")}</p>
    </div>
  );
}
