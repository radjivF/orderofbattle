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
  getListUnit,
  selectionDamage,
  weaponAttacksForDamage,
} from "@/engine/queries";
import {
  buildPhaseBoards,
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
import { IosUnderlineTabs } from "./ios/IosUnderlineTabs";

type PhaseSubTab = "abilities" | "weapons" | "command";

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

  const phaseAbilities =
    active?.abilities.filter((row) => !isCommandAbility(row.ability.kind)) ??
    [];
  const armyCommands =
    active?.abilities.filter((row) => isCommandAbility(row.ability.kind)) ?? [];
  const coreCommands = active
    ? coreCommandsForPhase(active.phase.id)
    : [];
  const hasAbilities = phaseAbilities.length > 0;
  const hasWeapons = (active?.weapons.length ?? 0) > 0;
  const hasCommands = coreCommands.length > 0 || armyCommands.length > 0;
  const hasArmyCommands = armyCommands.length > 0;
  const defaultSubTab = defaultPhaseSubTab(
    hasAbilities,
    hasWeapons,
    hasCommands,
    hasArmyCommands,
  );
  const availableSubTabs = phaseSubTabs(
    hasAbilities,
    hasWeapons,
    hasCommands,
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
                {subTab === "abilities" ? (
                  <ul className="flex flex-col gap-3">
                    {phaseAbilities.map((row) => (
                      <AbilityCard
                        key={`${row.selectionId}-${row.ability.name}`}
                        row={row}
                        onOpen={() => {
                          const sheet = findSheet(
                            list,
                            faction,
                            row.selectionId,
                          );
                          if (sheet) {
                            onOpenSheet(sheet);
                          }
                        }}
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
                      return (
                        <li key={group.selectionId}>
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
                            className="w-full rounded-xl bg-parchment-ink/5 px-3 py-3 text-left"
                          >
                            <p className="font-serif text-lg">
                              {group.unitName}
                            </p>
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
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {subTab === "command" ? (
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
                              onOpen={() => {
                                const sheet = findSheet(
                                  list,
                                  faction,
                                  row.selectionId,
                                );
                                if (sheet) {
                                  onOpenSheet(sheet);
                                }
                              }}
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
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sheet-muted"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                              className="size-5"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="8.25"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                              />
                              <path
                                d="M10 9v5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                              />
                              <circle
                                cx="10"
                                cy="6.25"
                                r="1.1"
                                fill="currentColor"
                              />
                            </svg>
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
          panelClassName="parchment-card w-full max-w-sm rounded-2xl p-5 text-parchment-ink"
          zClass="z-[60]"
        >
          <h2 className="font-serif text-2xl">Universal commands</h2>
          <p className="mt-3 text-base leading-relaxed text-sheet-muted">
            {UNIVERSAL_COMMAND_RULES}
          </p>
          <button
            type="button"
            onClick={() => setCommandRulesOpen(false)}
            className="gold-plate mt-5 min-h-11 w-full rounded-xl text-base font-semibold text-ink"
          >
            Got it
          </button>
        </ModalFrame>
      ) : null}
    </div>
  );
}

function phaseSubTabs(
  hasAbilities: boolean,
  hasWeapons: boolean,
  hasCommands: boolean,
): PhaseSubTab[] {
  const tabs: PhaseSubTab[] = [];
  if (hasAbilities) tabs.push("abilities");
  if (hasWeapons) tabs.push("weapons");
  if (hasCommands) tabs.push("command");
  return tabs;
}

function defaultPhaseSubTab(
  hasAbilities: boolean,
  hasWeapons: boolean,
  hasCommands: boolean,
  hasArmyCommands: boolean,
): PhaseSubTab {
  // Prefer Command when the list has faction/unit commands for this phase
  // (e.g. Sylvaneth Fury of the Forest in Combat).
  if (hasArmyCommands) return "command";
  if (hasAbilities) return "abilities";
  if (hasWeapons) return "weapons";
  if (hasCommands) return "command";
  return "abilities";
}

function subTabLabel(tab: PhaseSubTab) {
  if (tab === "abilities") return "Abilities";
  if (tab === "weapons") return "Weapons";
  return "Command";
}

function CoreCommandCard({ command }: { command: CoreCommand }) {
  return (
    <article className="w-full rounded-xl bg-parchment-ink/5 px-3 py-3 text-left">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-lg leading-tight">{command.name}</p>
        <span className="shrink-0 rounded-md bg-parchment-ink/10 px-2 py-0.5 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
          {command.cost} CP
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {command.timing}
      </p>
      {command.declare ? (
        <p className="mt-2 text-sm leading-relaxed text-parchment-ink/75">
          <span className="text-sheet-muted">Declare · </span>
          {command.declare}
        </p>
      ) : null}
      <p className="mt-1 text-sm leading-relaxed text-parchment-ink/75">
        <span className="text-sheet-muted">Effect · </span>
        {command.effect}
      </p>
      {command.keywords ? (
        <p className="mt-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
          Keywords · {command.keywords}
        </p>
      ) : null}
    </article>
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
  onOpen,
}: {
  row: PhaseAbilityRow;
  onOpen: () => void;
}) {
  const { ability } = row;
  const cpCost = commandAbilityCost(ability);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl bg-parchment-ink/5 px-3 py-3 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            {row.unitName}
          </p>
          <p className="mt-1 font-serif text-lg leading-tight">{ability.name}</p>
        </div>
        {cpCost != null ? (
          <span className="shrink-0 rounded-md bg-parchment-ink/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-sheet-muted">
            {cpCost} CP
          </span>
        ) : null}
      </div>
      {ability.castingValue || ability.chantingValue ? (
        <p className="mt-1 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          {[
            ability.castingValue ? `Cast ${ability.castingValue}` : "",
            ability.chantingValue ? `Chant ${ability.chantingValue}` : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
      {ability.timing ? (
        <p className="mt-2 font-serif text-base leading-snug text-parchment-ink">
          {ability.timing}
        </p>
      ) : null}
      {ability.declare ? (
        <p className="mt-2 text-sm leading-relaxed text-parchment-ink/75">
          <span className="text-sheet-muted">Declare · </span>
          {ability.declare}
        </p>
      ) : null}
      {ability.effect ? (
        <p className="mt-1 text-sm leading-relaxed text-parchment-ink/75">
          <span className="text-sheet-muted">Effect · </span>
          {ability.effect}
        </p>
      ) : null}
    </button>
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
