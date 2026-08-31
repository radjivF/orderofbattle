import { isCommandAbility } from "@/engine/commands";
import type { PhaseAbilityRow, PlayPhaseId } from "@/engine/phases";

/**
 * Abilities tab rows for a play phase.
 * Movement already nests roster abilities under each unit, so that tab
 * only lists army-level (formation / trait / terrain) abilities.
 * Every other phase must include warscroll abilities — otherwise Hero,
 * Combat, and End of turn silently drop the rules that win games.
 */
export function playPhasePanelAbilities(
  phaseId: PlayPhaseId,
  rows: PhaseAbilityRow[],
  rosterIds: Set<string>,
): PhaseAbilityRow[] {
  const nonCommand = rows.filter(
    (row) => !isCommandAbility(row.ability.kind),
  );
  if (phaseId === "movement") {
    return nonCommand.filter((row) => !rosterIds.has(row.selectionId));
  }
  return nonCommand;
}

export function playPhasePanelCommands(
  rows: PhaseAbilityRow[],
): PhaseAbilityRow[] {
  return rows.filter((row) => isCommandAbility(row.ability.kind));
}
