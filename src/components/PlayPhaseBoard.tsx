"use client";

import { useMemo, useState } from "react";
import {
  commandAbilityCost,
  coreCommandsForPhase,
  isCommandAbility,
  type CoreCommand,
  UNIVERSAL_COMMAND_RULES,
} from "@/engine/commands";
import { combatModifierNotes } from "@/engine/magic";
import {
  defenceStatLine,
  getListUnit,
  moveStatLine,
  selectionDamage,
  weaponAttacksForDamage,
} from "@/engine/queries";
import { IOS_LIQUID_CTA_CLASS, RULE_INFO_BUTTON_CLASS, SHEET_PANEL_COMPACT_CLASS, playPhaseShowsCommandTab, playPhaseShowsCoreRulesTab } from "@/lib/builderUi";
import { castValueLabel, chantValueLabel } from "@/lib/abilityUi";
import { isSpearheadList } from "@/engine/spearhead";
import { coreRulesForPhase } from "@/engine/coreRules";
import {
  buildPhaseBoards,
  regimentPlayGroups,
  rosterSelectionIds,
  type PhaseAbilityRow,
  type PhaseWeaponRow,
  type PlayPhaseId,
} from "@/engine/phases";
import type {
  ArmyList,
  DatasheetSubject,
  FactionCatalogue,
  UnitWeapon,
} from "@/engine/types";
import { ModalFrame } from "./ModalFrame";
import { ExpandableRuleCard } from "./ExpandableRuleCard";
import { IosUnderlineTabs } from "./ios/IosUnderlineTabs";
import { IosInfoIcon } from "./ios/SheetIconButton";

type PhaseSubTab = "abilities" | "weapons" | "command" | "units" | "rules";

type Props = {
  list: ArmyList;
  faction: FactionCatalogue;
  onOpenSheet: (sheet: DatasheetSubject) => void;
};

export function PlayPhaseBoard({ list, faction, onOpenSheet }: Props) {
  const boards = useMemo(() => buildPhaseBoards(list, faction), [list, faction]);
  const modifiers = useMemo(
    () => combatModifierNotes(list, faction),
    [list, faction],
  );
  const [phaseId, setPhaseId] = useState<PlayPhaseId>("passive");
  const [subTabByPhase, setSubTabByPhase] = useState<
    Partial<Record<PlayPhaseId, PhaseSubTab>>
  >({});
  const [commandRulesOpen, setCommandRulesOpen] = useState(false);
  const active =
    boards.find((board) => board.phase.id === phaseId) ?? boards[0] ?? null;
  const showCombatMods =
    active?.phase.id === "combat" || active?.phase.id === "shooting";

  const rosterIds = useMemo(() => rosterSelectionIds(list), [list]);
  const regimentGroups = useMemo(
    () => regimentPlayGroups(list, faction),
    [list, faction],
  );
  const isMovementPhase = active?.phase.id === "movement";
  const rosterAbilityRows =
    active?.abilities.filter((row) => rosterIds.has(row.selectionId)) ?? [];
  const armyAbilityRows =
    active?.abilities.filter((row) => !rosterIds.has(row.selectionId)) ?? [];

  const armyPhaseAbilities =
    armyAbilityRows.filter((row) => !isCommandAbility(row.ability.kind)) ?? [];
  const rosterPhaseAbilities =
    rosterAbilityRows.filter((row) => !isCommandAbility(row.ability.kind)) ?? [];
  const phaseAbilities =
    active?.phase.id === "passive"
      ? [...armyPhaseAbilities, ...rosterPhaseAbilities]
      : armyPhaseAbilities;
  const armyCommands =
    armyAbilityRows.filter((row) => isCommandAbility(row.ability.kind)) ?? [];
  const coreCommands = active
    ? coreCommandsForPhase(active.phase.id)
    : [];
  const spearhead = isSpearheadList(list);
  const showCommandTab = playPhaseShowsCommandTab(spearhead);
  const showCoreRulesTab = playPhaseShowsCoreRulesTab(spearhead);
  const phaseCoreRules = active
    ? coreRulesForPhase(active.phase.id)
    : [];
  const hasAbilities = phaseAbilities.length > 0;
  const hasWeapons = (active?.weapons.length ?? 0) > 0;
  const hasCommands =
    showCommandTab && (coreCommands.length > 0 || armyCommands.length > 0);
  const hasArmyCommands = showCommandTab && armyCommands.length > 0;
  const hasCoreRules = showCoreRulesTab && phaseCoreRules.length > 0;
  const hasUnits = isMovementPhase && regimentGroups.length > 0;
  const defaultSubTab = defaultPhaseSubTab(
    active?.phase.id ?? "passive",
    hasAbilities,
    hasWeapons,
    hasCommands,
    hasArmyCommands,
    hasUnits,
    hasCoreRules,
  );
  const availableSubTabs = phaseSubTabs(
    active?.phase.id ?? "passive",
    hasAbilities,
    hasWeapons,
    hasCommands,
    hasUnits,
    hasCoreRules,
  );
  const remembered = active ? subTabByPhase[active.phase.id] : undefined;
  const subTab =
    remembered && availableSubTabs.includes(remembered)
      ? remembered
      : defaultSubTab;

  function selectSubTab(next: PhaseSubTab) {
    if (!active) return;
    setSubTabByPhase((prev) => ({ ...prev, [active.phase.id]: next }));
  }

  return (
    <div className="flex flex-col gap-4">
      <IosUnderlineTabs
        ariaLabel="Battle phases"
        scrollable
        value={phaseId}
        onChange={(next) => setPhaseId(next as PlayPhaseId)}
        tabs={boards.map((board) => ({
          value: board.phase.id,
          label: board.phase.name,
        }))}
      />

      {active ? (
        <section className="parchment-card rounded-2xl p-5 text-parchment-ink">
          <h2 className="font-serif text-2xl">{active.phase.name}</h2>
          <p className="mt-1 text-sm text-sheet-muted">
            {active.phase.blurb}
          </p>

          {showCombatMods &&
          modifiers.some((note) => note.selectionId === null) ? (
            <ul className="mt-4 flex flex-col gap-2">
              {modifiers
                .filter((note) => note.selectionId === null)
                .map((note) => (
                  <li
                    key={`${note.kind}:${note.powerName}:${note.enemyLabel}`}
                    className="rounded-lg bg-aether/10 px-3 py-2 text-sm text-aether"
                  >
                    <span className="font-medium">{note.powerName}</span>
                    {note.enemyLabel ? (
                      <span className="text-sheet-muted">
                        {" "}
                        · on {note.enemyLabel}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-parchment-ink/80">
                      {note.summary}
                    </span>
                  </li>
                ))}
            </ul>
          ) : null}

          {availableSubTabs.length > 0 ? (
            <>
              <IosUnderlineTabs
                ariaLabel={`${active.phase.name} sections`}
                variant="parchment"
                uppercase
                className="mt-5"
                value={subTab}
                onChange={(next) => selectSubTab(next as PhaseSubTab)}
                tabs={availableSubTabs.map((tab) => ({
                  value: tab,
                  label: subTabLabel(tab),
                }))}
              />

              <div role="tabpanel" className="mt-4">
                {subTab === "units" ? (
                  <ul className="flex flex-col gap-4">
                    {regimentGroups.map((group) => (
                      <li key={group.id}>
                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          {group.subtitle ? (
                            <p className="shrink-0 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                              {group.subtitle}
                            </p>
                          ) : null}
                          <p className="min-w-0 font-serif text-xl leading-tight">
                            {group.label}
                          </p>
                        </div>
                        <ul className="mt-3 flex flex-col gap-3">
                          {group.entries.map((entry) => {
                            const unitRows = rosterAbilityRows.filter(
                              (row) => row.selectionId === entry.selectionId,
                            );
                            const move = moveStatLine(entry.unit);
                            return (
                              <li
                                key={entry.selectionId}
                                className="rounded-xl bg-parchment-ink/5 px-3 py-3"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sheet = findSheet(
                                      list,
                                      faction,
                                      entry.selectionId,
                                    );
                                    if (sheet) {
                                      onOpenSheet(sheet);
                                    }
                                  }}
                                  className="w-fit max-w-full text-left"
                                >
                                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                    <p className="font-serif text-lg leading-tight">
                                      {entry.unit.name}
                                      {entry.reinforced ? (
                                        <span className="ml-2 font-sans text-xs text-sheet-muted">
                                          reinforced
                                        </span>
                                      ) : null}
                                    </p>
                                    {move ? (
                                      <p className="text-sm font-medium text-parchment-ink">
                                        {move}
                                      </p>
                                    ) : null}
                                  </div>
                                </button>
                                {unitRows.length > 0 ? (
                                  <ul className="mt-3 flex flex-col gap-2 border-t border-parchment-ink/10 pt-3">
                                    {unitRows.map((row) => (
                                      <li key={`${row.selectionId}-${row.ability.name}`}>
                                        <AbilityCard
                                          row={row}
                                          nested
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {subTab === "abilities" ? (
                  <ul className="flex flex-col gap-3">
                    {phaseAbilities.map((row) => (
                      <AbilityCard
                        key={`${row.selectionId}-${row.ability.name}`}
                        row={row}
                      />
                    ))}
                  </ul>
                ) : null}

                {subTab === "weapons" ? (
                  <ul className="flex flex-col gap-3">
                    {groupWeapons(active.weapons).map((group) => {
                      const unit = getListUnit(
                        list,
                        faction,
                        findUnitId(list, group.selectionId) ?? "",
                      );
                      const sheet = findSheet(
                        list,
                        faction,
                        group.selectionId,
                      );
                      const damage = selectionDamage(
                        list,
                        group.selectionId,
                        faction,
                      );
                      const unitMods = showCombatMods
                        ? modifiers.filter(
                            (note) => note.selectionId === group.selectionId,
                          )
                        : [];
                      const defence =
                        sheet && "stats" in sheet
                          ? defenceStatLine(sheet)
                          : unit
                            ? defenceStatLine(unit)
                            : "";
                      return (
                        <li key={group.selectionId}>
                          <div className="rounded-xl bg-parchment-ink/5 px-3 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                const sheet = findSheet(
                                  list,
                                  faction,
                                  group.selectionId,
                                );
                                if (sheet) {
                                  onOpenSheet(sheet);
                                }
                              }}
                              className="w-fit max-w-full text-left"
                            >
                              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <p className="font-serif text-lg leading-tight">
                                  {group.unitName}
                                </p>
                                {defence ? (
                                  <p className="text-sm font-medium text-parchment-ink">
                                    {defence}
                                  </p>
                                ) : null}
                              </div>
                            </button>
                            {unitMods.length > 0 ? (
                              <ul className="mt-2 flex flex-col gap-1">
                                {unitMods.map((note) => (
                                  <li
                                    key={`${note.kind}:${note.powerName}`}
                                    className="rounded-md bg-aether/10 px-2 py-1 text-xs text-aether"
                                  >
                                    <span className="font-medium">
                                      {note.powerName}
                                    </span>
                                    <span className="text-parchment-ink/70">
                                      {" "}
                                      · {note.summary}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <ul className="mt-2 flex flex-col gap-2">
                              {group.weapons.map((weapon) => (
                                <li key={weapon.name} className="text-sm">
                                  <span className="font-medium">
                                    {weapon.name}
                                  </span>
                                  <WeaponStatLine
                                    weapon={weapon}
                                    unit={unit}
                                    damage={damage}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {subTab === "command" && showCommandTab ? (
                  <div className="flex flex-col gap-4">
                    {armyCommands.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                          From your army
                        </h3>
                        <ul className="mt-3 flex flex-col gap-3">
                          {armyCommands.map((row) => (
                            <AbilityCard
                              key={`${row.selectionId}-${row.ability.name}`}
                              row={row}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {coreCommands.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                            Universal
                          </h3>
                          <button
                            type="button"
                            onClick={() => setCommandRulesOpen(true)}
                            aria-label="How universal commands work"
                            className={RULE_INFO_BUTTON_CLASS}
                          >
                            <IosInfoIcon />
                          </button>
                        </div>
                        <ul className="mt-3 flex flex-col gap-3">
                          {coreCommands.map((command) => (
                            <li key={command.id}>
                              <CoreCommandCard command={command} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {subTab === "rules" && showCoreRulesTab ? (
                  <ul className="flex flex-col gap-3">
                    {phaseCoreRules.map((rule) => (
                      <li key={rule.id}>
                        <ExpandableRuleCard
                          title={rule.name}
                          timing={rule.timing}
                          declare={rule.declare}
                          effect={rule.effect}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-sheet-muted">
              Nothing for this phase on the current list.
            </p>
          )}
        </section>
      ) : null}

      {commandRulesOpen ? (
        <ModalFrame
          label="How universal commands work"
          onClose={() => setCommandRulesOpen(false)}
          panelClassName={`${SHEET_PANEL_COMPACT_CLASS} p-5`}
        >
          <h2 className="font-serif text-2xl">Universal commands</h2>
          <p className="mt-3 text-base leading-relaxed text-sheet-muted">
            {UNIVERSAL_COMMAND_RULES}
          </p>
          <button
            type="button"
            onClick={() => setCommandRulesOpen(false)}
            className={`mt-5 ${IOS_LIQUID_CTA_CLASS}`}
          >
            Got it
          </button>
        </ModalFrame>
      ) : null}
    </div>
  );
}

function phaseSubTabs(
  _phaseId: PlayPhaseId,
  hasAbilities: boolean,
  hasWeapons: boolean,
  hasCommands: boolean,
  hasUnits: boolean,
  hasCoreRules: boolean,
): PhaseSubTab[] {
  const tabs: PhaseSubTab[] = [];
  if (hasUnits) tabs.push("units");
  if (hasAbilities) tabs.push("abilities");
  if (hasWeapons) tabs.push("weapons");
  if (hasCommands) tabs.push("command");
  if (hasCoreRules) tabs.push("rules");
  return tabs;
}

function defaultPhaseSubTab(
  phaseId: PlayPhaseId,
  hasAbilities: boolean,
  hasWeapons: boolean,
  hasCommands: boolean,
  hasArmyCommands: boolean,
  hasUnits: boolean,
  hasCoreRules: boolean,
): PhaseSubTab {
  if (phaseId === "movement" && hasUnits) {
    return "units";
  }
  // Prefer Command when the list has faction/unit commands for this phase
  // (e.g. Sylvaneth Fury of the Forest in Combat).
  if (hasArmyCommands) return "command";
  if (hasAbilities) return "abilities";
  if (hasWeapons) return "weapons";
  if (hasCommands) return "command";
  if (hasCoreRules) return "rules";
  return "abilities";
}

function subTabLabel(tab: PhaseSubTab) {
  if (tab === "units") return "Units";
  if (tab === "abilities") return "Abilities";
  if (tab === "weapons") return "Weapons";
  if (tab === "rules") return "Rules";
  return "Command";
}

function CoreCommandCard({ command }: { command: CoreCommand }) {
  return (
    <ExpandableRuleCard
      title={command.name}
      timing={command.timing}
      declare={command.declare}
      effect={command.effect}
      meta={command.keywords ? `Keywords · ${command.keywords}` : undefined}
      trailing={
        <span className="rounded-md bg-parchment-ink/10 px-2 py-0.5 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
          {command.cost} CP
        </span>
      }
    />
  );
}

function WeaponStatLine({
  weapon,
  unit,
  damage,
}: {
  weapon: UnitWeapon;
  unit: ReturnType<typeof getListUnit>;
  damage: number;
}) {
  const atk = unit
    ? weaponAttacksForDamage(unit, weapon.name, weapon.attacks, damage)
    : { attacks: weapon.attacks, modified: false };

  const parts: { text: string; hot?: boolean }[] = [];
  if (weapon.kind === "ranged" && weapon.range) {
    parts.push({ text: `Rng ${weapon.range}` });
  }
  if (atk.attacks) {
    parts.push({ text: `Atk ${atk.attacks}`, hot: atk.modified });
  }
  if (weapon.hit) {
    parts.push({ text: `Hit ${weapon.hit}` });
  }
  if (weapon.wound) {
    parts.push({ text: `Wnd ${weapon.wound}` });
  }
  if (weapon.rend) {
    parts.push({ text: `Rnd ${weapon.rend}` });
  }
  if (weapon.damage) {
    parts.push({ text: `Dmg ${weapon.damage}` });
  }
  if (weapon.ability && weapon.ability !== "-") {
    parts.push({ text: weapon.ability });
  }

  return (
    <span className="mt-1 block text-sheet-muted">
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 ? " · " : null}
          <span className={part.hot ? "font-semibold text-illegal" : undefined}>
            {part.text}
          </span>
        </span>
      ))}
    </span>
  );
}

function AbilityCard({
  row,
  nested = false,
}: {
  row: PhaseAbilityRow;
  nested?: boolean;
}) {
  const { ability } = row;
  const cpCost = commandAbilityCost(ability);
  const meta = [
    ability.castingValue ? castValueLabel(ability.castingValue) : "",
    ability.chantingValue ? chantValueLabel(ability.chantingValue) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ExpandableRuleCard
      title={ability.name}
      kicker={nested ? undefined : row.unitName}
      timing={ability.timing}
      declare={ability.declare}
      effect={ability.effect}
      meta={meta || undefined}
      nested={nested}
      trailing={
        cpCost != null ? (
          <span className="rounded-md bg-parchment-ink/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-sheet-muted">
            {cpCost} CP
          </span>
        ) : null
      }
    />
  );
}

function groupWeapons(rows: PhaseWeaponRow[]) {
  const groups: {
    selectionId: string;
    unitName: string;
    weapons: PhaseWeaponRow["weapon"][];
  }[] = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const existing = index.get(row.selectionId);
    if (existing === undefined) {
      index.set(row.selectionId, groups.length);
      groups.push({
        selectionId: row.selectionId,
        unitName: row.unitName,
        weapons: [row.weapon],
      });
    } else {
      groups[existing].weapons.push(row.weapon);
    }
  }
  return groups;
}

function findUnitId(
  list: ArmyList,
  selectionId: string,
): string | undefined {
  for (const regiment of list.regiments) {
    if (regiment.hero?.id === selectionId) {
      return regiment.hero.unitId;
    }
    for (const slot of regiment.units) {
      if (slot.id === selectionId) {
        return slot.unitId;
      }
    }
  }
  for (const slot of list.auxiliaries) {
    if (slot.id === selectionId) {
      return slot.unitId;
    }
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    if (slot.id === selectionId) {
      return slot.unitId;
    }
  }
  return undefined;
}

function findSheet(
  list: ArmyList,
  faction: FactionCatalogue,
  selectionId: string,
): DatasheetSubject | undefined {
  for (const lore of faction.manifestationLores) {
    const model = lore.manifestations.find((item) => item.id === selectionId);
    if (model) {
      return model;
    }
  }
  const unitId = findUnitId(list, selectionId);
  if (unitId) {
    return getListUnit(list, faction, unitId);
  }
  return undefined;
}
