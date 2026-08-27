"use client";

import { useMemo, useState } from "react";
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
  const active =
    boards.find((board) => board.phase.id === phaseId) ?? boards[0] ?? null;
  const showCombatMods =
    active?.phase.id === "combat" || active?.phase.id === "shooting";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {boards.map((board) => {
          const selected = active?.phase.id === board.phase.id;
          return (
            <button
              key={board.phase.id}
              type="button"
              onClick={() => setPhaseId(board.phase.id)}
              className={`min-h-11 shrink-0 rounded-xl px-4 text-sm ${
                selected
                  ? "gold-plate text-ink"
                  : "bg-ink-raised text-parchment/80 ring-1 ring-parchment/15"
              }`}
            >
              {board.phase.name}
            </button>
          );
        })}
      </div>

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

          {active.weapons.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                Weapons
              </h3>
              <ul className="mt-3 flex flex-col gap-3">
                {groupWeapons(active.weapons).map((group) => {
                  const unit = getListUnit(
                    list,
                    faction,
                    findUnitId(list, group.selectionId) ?? "",
                  );
                  const damage = selectionDamage(list, group.selectionId, faction);
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
                        <p className="font-serif text-lg">{group.unitName}</p>
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
                              <span className="font-medium">{weapon.name}</span>
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
            </div>
          ) : null}

          {active.abilities.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                Abilities
              </h3>
              <ul className="mt-3 flex flex-col gap-3">
                {active.abilities.map((row) => (
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

          {active.abilities.length === 0 && active.weapons.length === 0 ? (
            <p className="mt-5 text-sm text-sheet-muted">
              Nothing for this phase on the current list.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
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
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl bg-parchment-ink/5 px-3 py-3 text-left"
    >
      <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {row.unitName}
      </p>
      <p className="mt-1 font-serif text-lg leading-tight">{ability.name}</p>
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
