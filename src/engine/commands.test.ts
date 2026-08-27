import { describe, expect, it } from "vitest";
import {
  coreCommandsForPhase,
  isCommandAbility,
} from "@/engine/commands";
import {
  buildPhaseBoards,
  phasesForAbility,
  type PlayPhaseId,
} from "@/engine/phases";
import { getFaction, listFactions } from "@/engine/queries";
import type { UnitAbility } from "@/engine/types";
import { blankArmy } from "@/lib/storage";

function commandAbilitiesIn(
  factionId: string,
): { source: string; ability: UnitAbility }[] {
  const faction = getFaction(factionId);
  if (!faction) return [];
  const rows: { source: string; ability: UnitAbility }[] = [];
  for (const trait of faction.battleTraits ?? []) {
    for (const ability of trait.abilities ?? []) {
      if (isCommandAbility(ability.kind)) {
        rows.push({ source: `trait:${trait.name}`, ability });
      }
    }
  }
  for (const formation of faction.formations ?? []) {
    for (const ability of formation.abilities ?? []) {
      if (isCommandAbility(ability.kind)) {
        rows.push({ source: `formation:${formation.name}`, ability });
      }
    }
  }
  for (const unit of faction.units ?? []) {
    for (const ability of unit.abilities ?? []) {
      if (isCommandAbility(ability.kind)) {
        rows.push({ source: `unit:${unit.name}`, ability });
      }
    }
  }
  return rows;
}

describe("faction Command abilities", () => {
  it("maps every Command timing to a play phase (no silent dump to Army)", () => {
    const ambiguous: string[] = [];
    for (const faction of listFactions()) {
      for (const { source, ability } of commandAbilitiesIn(faction.id)) {
        const phases = phasesForAbility(ability);
        const onlyPassive =
          phases.length === 1 &&
          phases[0] === "passive" &&
          !/deploy|start of|battle round/i.test(ability.timing);
        if (onlyPassive) {
          ambiguous.push(
            `${faction.id} · ${source} · ${ability.name} · ${ability.timing}`,
          );
        }
      }
    }
    expect(ambiguous).toEqual([]);
  });

  it("places Sylvaneth battle-trait Commands on Combat and End", () => {
    const faction = getFaction("sylvaneth")!;
    const boards = buildPhaseBoards(blankArmy("sylvaneth"), faction);
    const byPhase = new Map(
      boards.map((board) => [
        board.phase.id,
        board.abilities
          .filter((row) => isCommandAbility(row.ability.kind))
          .map((row) => row.ability.name),
      ]),
    );
    expect(byPhase.get("combat")).toContain("Fury of The Forest");
    expect(byPhase.get("end")).toContain("The Land Awakens");
    expect(coreCommandsForPhase("combat").map((c) => c.name)).toEqual(
      expect.arrayContaining(["All-out Attack", "All-out Defence"]),
    );
  });

  it("surfaces battle-trait and formation Commands on the matching phase board", () => {
    const missing: string[] = [];
    for (const faction of listFactions()) {
      for (const trait of faction.battleTraits ?? []) {
        for (const ability of trait.abilities ?? []) {
          if (!isCommandAbility(ability.kind)) continue;
          const boards = buildPhaseBoards(blankArmy(faction.id), faction);
          const want = phasesForAbility(ability);
          const found = boards
            .filter((board) =>
              board.abilities.some(
                (row) =>
                  row.ability.name === ability.name &&
                  isCommandAbility(row.ability.kind),
              ),
            )
            .map((board) => board.phase.id);
          for (const phase of want) {
            if (!found.includes(phase)) {
              missing.push(
                `${faction.id} trait ${ability.name} missing on ${phase}`,
              );
            }
          }
        }
      }
      for (const formation of faction.formations ?? []) {
        for (const ability of formation.abilities ?? []) {
          if (!isCommandAbility(ability.kind)) continue;
          const list = blankArmy(faction.id);
          list.formationId = formation.id;
          const boards = buildPhaseBoards(list, faction);
          const want = phasesForAbility(ability);
          const found = boards
            .filter((board) =>
              board.abilities.some(
                (row) =>
                  row.ability.name === ability.name &&
                  isCommandAbility(row.ability.kind),
              ),
            )
            .map((board) => board.phase.id as PlayPhaseId);
          for (const phase of want) {
            if (!found.includes(phase)) {
              missing.push(
                `${faction.id} formation ${formation.name} / ${ability.name} missing on ${phase}`,
              );
            }
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
