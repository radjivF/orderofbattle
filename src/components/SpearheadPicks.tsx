"use client";

import { formationLabel } from "@/engine/queries";
import type {
  ArmyList,
  FactionCatalogue,
  Formation,
  UnitAbility,
} from "@/engine/types";
import { RuleText } from "./RuleText";

const SELECT_CLASS =
  "min-h-11 w-full max-w-full rounded-xl bg-parchment px-3 text-parchment-ink";

type Props = {
  list: ArmyList;
  faction: FactionCatalogue;
  onChange: (next: ArmyList) => void;
};

export function SpearheadPicks({ list, faction, onChange }: Props) {
  const abilityId = list.regimentAbilityId ?? list.formationId;
  const regimentAbility = faction.formations.find(
    (item) => item.id === abilityId,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {faction.battleTraits.map((trait) => (
        <FormationBlock key={trait.id} formation={trait} />
      ))}
      {faction.formations.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-2">
          <label className="flex min-w-0 flex-col gap-2 text-sm text-parchment/80">
            Regiment ability
            <select
              value={abilityId ?? ""}
              onChange={(event) => {
                const next = event.target.value || null;
                onChange({
                  ...list,
                  regimentAbilityId: next,
                  formationId: next,
                });
              }}
              className={SELECT_CLASS}
            >
              <option value="">Choose…</option>
              {faction.formations.map((item) => (
                <option key={item.id} value={item.id}>
                  {formationLabel(item)}
                </option>
              ))}
            </select>
          </label>
          {regimentAbility ? (
            <AbilityCard abilities={regimentAbility.abilities} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FormationBlock({ formation }: { formation: Formation }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="font-serif text-lg text-parchment">{formation.name}</p>
      <AbilityCard abilities={formation.abilities} />
    </div>
  );
}

function AbilityCard({ abilities }: { abilities: UnitAbility[] }) {
  if (abilities.length === 0) {
    return null;
  }
  return (
    <ul className="min-w-0 break-words rounded-2xl bg-parchment px-4 py-3 text-parchment-ink shadow-sm">
      {abilities.map((ability) => (
        <li key={ability.name} className="border-b border-parchment-ink/10 py-3 last:border-b-0 last:pb-0 first:pt-0">
          <p className="font-serif text-lg leading-tight">{ability.name}</p>
          {ability.timing ? (
            <p className="mt-1 font-serif text-base leading-snug text-parchment-ink/80">
              {ability.timing}
            </p>
          ) : null}
          {ability.declare ? (
            <RuleText
              text={ability.declare}
              label="Declare · "
              className="mt-2 text-sm"
            />
          ) : null}
          {ability.effect ? (
            <RuleText
              text={ability.effect}
              label="Effect · "
              className="mt-1 text-sm"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
