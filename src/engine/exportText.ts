import { formatPoints } from "./pointsCap";
import { battleTactics } from "./data/load";
import { SITE_EXPORT_URL, SITE_NAME } from "@/lib/site";
import {
  getListUnit,
  getRegimentOfRenown,
  getSelection,
  selectionPoints,
  unitSizeLabel,
} from "./queries";
import type {
  ArmyList,
  EnhancementOption,
  EnhancementPick,
  FactionCatalogue,
  Selection,
} from "./types";
import { summarize } from "./validate";

function selectionLine(
  list: ArmyList,
  faction: FactionCatalogue,
  selection: Selection,
  opts?: { omitPoints?: boolean },
): string {
  const unit = getListUnit(list, faction, selection.unitId);
  if (!unit) {
    return "- Unknown unit";
  }
  const size = unitSizeLabel(unit, selection.reinforced);
  const reinforced = selection.reinforced ? ", reinforced" : "";
  if (opts?.omitPoints) {
    return `- ${unit.name}${reinforced} · ${size}`;
  }
  const pts = selectionPoints(unit, selection.reinforced);
  return `- ${unit.name}${reinforced} · ${size} · ${formatPoints(pts)} pts`;
}

function bearerName(
  list: ArmyList,
  faction: FactionCatalogue,
  pick: EnhancementPick | null,
): string | null {
  if (!pick) {
    return null;
  }
  const selection = getSelection(list, pick.heroSelectionId);
  if (!selection) {
    return null;
  }
  return getListUnit(list, faction, selection.unitId)?.name ?? null;
}

function enhancementOptionName(
  options: EnhancementOption[],
  optionId: string | null | undefined,
): string | undefined {
  if (!optionId) {
    return undefined;
  }
  const option = options.find((item) => item.id === optionId);
  if (!option) {
    return undefined;
  }
  if (option.points) {
    return `${option.name} · ${formatPoints(option.points)} pts`;
  }
  return option.name;
}

function enhancementLine(
  label: string,
  options: EnhancementOption[],
  pick: EnhancementPick | null,
  list: ArmyList,
  faction: FactionCatalogue,
): string | null {
  const name = enhancementOptionName(options, pick?.optionId);
  if (!name || !pick) {
    return null;
  }
  const bearer = bearerName(list, faction, pick);
  return bearer ? `- ${label}: ${name} (${bearer})` : `- ${label}: ${name}`;
}

/** Plain-text army list for clipboard / .txt download. */
export function exportArmyListText(
  list: ArmyList,
  faction: FactionCatalogue,
): string {
  const lines: string[] = [];

  lines.push(`=== ${SITE_NAME} ===`);
  lines.push("");
  lines.push(list.name.trim() || "Untitled list");
  lines.push(faction.name);
  if (list.scourgeRealm) {
    lines.push(
      list.scourgeRealm === "aqshy"
        ? "Scourge of Aqshy"
        : "Scourge of Ghyran",
    );
  }
  lines.push(
    `${formatPoints(list.pointsCap)} pts · ${formatPoints(
      summarize(list, faction).points,
    )} used`,
  );

  const formation = faction.formations.find(
    (item) => item.id === list.formationId,
  );
  if (formation) {
    lines.push(
      formation.points
        ? `Battle formation: ${formation.name} (${formation.points} pts)`
        : `Battle formation: ${formation.name}`,
    );
  }

  const spellLore = faction.spellLores.find(
    (lore) => lore.id === list.spellLoreId,
  );
  if (spellLore) {
    lines.push(`Spell lore: ${spellLore.name}`);
  }

  const prayerLore = faction.prayerLores.find(
    (lore) => lore.id === list.prayerLoreId,
  );
  if (prayerLore) {
    lines.push(`Prayer lore: ${prayerLore.name}`);
  }

  const manifestationLore = faction.manifestationLores.find(
    (lore) => lore.id === list.manifestationLoreId,
  );
  if (manifestationLore) {
    lines.push(`Manifestation lore: ${manifestationLore.name}`);
  }

  const tacticNames = (list.battleTacticCardIds ?? [])
    .map((id) => battleTactics.find((card) => card.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  if (tacticNames.length > 0) {
    lines.push(`Battle tactic cards: ${tacticNames.join(", ")}`);
  }

  const enhancementLines = [
    enhancementLine(
      "Artefact",
      faction.artefacts,
      list.artefact,
      list,
      faction,
    ),
    enhancementLine(
      "Heroic trait",
      faction.heroicTraits,
      list.heroicTrait,
      list,
      faction,
    ),
    enhancementLine(
      "Monstrous trait",
      faction.monstrousTraits ?? [],
      list.monstrousTrait,
      list,
      faction,
    ),
    enhancementLine(
      "Vision of Fate",
      faction.visionsOfFate ?? [],
      list.visionOfFate,
      list,
      faction,
    ),
  ].filter((line): line is string => Boolean(line));

  for (const pick of list.specialEnhancements ?? []) {
    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === pick.tableId,
    );
    if (!table) {
      continue;
    }
    const line = enhancementLine(
      table.name,
      table.options,
      pick,
      list,
      faction,
    );
    if (line) {
      enhancementLines.push(line);
    }
  }

  if (enhancementLines.length > 0) {
    lines.push("");
    lines.push("Army enhancements");
    lines.push(...enhancementLines);
  }

  list.regiments.forEach((regiment, index) => {
    const isGeneral = list.generalRegimentId === regiment.id;
    lines.push("");
    lines.push(
      isGeneral ? `Regiment ${index + 1} — General` : `Regiment ${index + 1}`,
    );
    if (regiment.hero) {
      lines.push(selectionLine(list, faction, regiment.hero));
    } else {
      lines.push("- (no hero)");
    }
    for (const slot of regiment.units) {
      lines.push(selectionLine(list, faction, slot));
    }
  });

  if (list.auxiliaries.length > 0) {
    lines.push("");
    lines.push("Auxiliaries");
    for (const slot of list.auxiliaries) {
      lines.push(selectionLine(list, faction, slot));
    }
  }

  const rorPick = list.regimentOfRenown;
  if (rorPick) {
    const ror = getRegimentOfRenown(rorPick.renownId);
    lines.push("");
    if (ror) {
      lines.push(
        `Regiment of Renown: ${ror.name} · ${formatPoints(ror.points)} pts`,
      );
    } else {
      lines.push("Regiment of Renown: (unknown)");
    }
    for (const slot of rorPick.units) {
      lines.push(selectionLine(list, faction, slot, { omitPoints: true }));
    }
  }

  lines.push("");
  lines.push(`Built with ${SITE_NAME}`);
  lines.push(SITE_EXPORT_URL);
  return lines.join("\n");
}

export function exportFileName(listName: string, extension = "txt"): string {
  const base = listName
    .trim()
    .replace(/[^\w\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base || "army-list"}.${extension}`;
}
