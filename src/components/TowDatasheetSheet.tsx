"use client";

import { formatPoints } from "@/engine/pointsCap";
import { partitionTowSpecialRules } from "@/engine/tow/queries";
import type { TowCatalogueUnit, TowStats, TowWeapon } from "@/engine/tow/types";
import {
  SHEET_HEADER_START_CLASS,
  SHEET_PANEL_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { ExpandableRuleCard } from "./ExpandableRuleCard";
import { SheetCloseButton } from "./ios/SheetIconButton";

const PROFILE_KEYS: readonly (keyof TowStats)[] = [
  "M",
  "WS",
  "BS",
  "S",
  "T",
  "W",
  "I",
  "A",
  "Ld",
];

type Props = {
  unit: TowCatalogueUnit;
  onClose: () => void;
};

export function TowDatasheetSheet({ unit, onClose }: Props) {
  return (
    <ModalFrame
      label={`${unit.name} datasheet`}
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} bg-parchment shadow-2xl`}
    >
      <div className={SHEET_HEADER_START_CLASS}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="min-w-0 font-serif text-2xl leading-tight">
              {unit.name}
            </h2>
            <p className="shrink-0 text-sm text-sigmarite">
              {formatPoints(unit.pointsPerModel)} pts
              {unit.maxModels > 1 ? " / model" : ""}
            </p>
          </div>
          {unit.troopType ? (
            <p className="mt-1 text-sm text-sheet-muted">{unit.troopType}</p>
          ) : null}
        </div>
        <SheetCloseButton onClick={onClose} />
      </div>

      <div className="modal-sheet-scroll overflow-y-auto px-5 pb-8">
        <section className="overflow-x-auto rounded-xl bg-parchment-ink/5">
          <table className="w-full min-w-[28rem] border-collapse text-center text-sm">
            <caption className="sr-only">{unit.name} profile</caption>
            <thead>
              <tr className="border-b border-parchment-ink/10 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
                {PROFILE_KEYS.map((key) => (
                  <th key={key} scope="col" className="px-2 py-2.5 font-medium">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="tabular-nums text-parchment-ink">
                {PROFILE_KEYS.map((key) => (
                  <td key={key} className="px-2 py-2.5">
                    {unit.stats[key] || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>

        {unit.weapons.length > 0 ? (
          <section className="mt-4 flex flex-col gap-2">
            <h3 className="font-serif text-lg">Weapons</h3>
            <WeaponsTable weapons={unit.weapons} />
          </section>
        ) : null}

        <RuleSections unit={unit} />
      </div>
    </ModalFrame>
  );
}

function RuleSections({ unit }: { unit: TowCatalogueUnit }) {
  const { unit: unitRules, common } = partitionTowSpecialRules(
    unit.specialRules,
  );

  return (
    <>
      {unitRules.length > 0 ? (
        <section className="mt-4 flex flex-col gap-2">
          <h3 className="font-serif text-lg">Special rules</h3>
          <ul className="flex flex-col gap-2">
            {unitRules.map((rule) => (
              <li key={rule.name}>
                <ExpandableRuleCard
                  title={rule.name}
                  effect={
                    rule.text || "See the army book for the full rule."
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {common.length > 0 ? (
        <section className="mt-4 flex flex-col gap-2">
          <h3 className="font-serif text-lg">Common rules</h3>
          <ul className="flex flex-col gap-2">
            {common.map((rule) => (
              <li key={rule.name}>
                <ExpandableRuleCard
                  title={rule.name}
                  effect={
                    rule.text || "See the army book for the full rule."
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function WeaponsTable({ weapons }: { weapons: TowWeapon[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-parchment-ink/5">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-parchment-ink/10 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            <th scope="col" className="px-3 py-2.5 font-medium">
              Weapon
            </th>
            <th scope="col" className="px-2 py-2.5 text-center font-medium">
              R
            </th>
            <th scope="col" className="px-2 py-2.5 text-center font-medium">
              S
            </th>
            <th scope="col" className="px-2 py-2.5 text-center font-medium">
              AP
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Special rules
            </th>
          </tr>
        </thead>
        <tbody>
          {weapons.map((weapon) => (
            <tr
              key={weapon.name}
              className="border-b border-parchment-ink/5 last:border-0"
            >
              <th
                scope="row"
                className="px-3 py-2.5 font-serif text-base font-normal text-parchment-ink"
              >
                {weapon.name}
              </th>
              <td className="px-2 py-2.5 text-center tabular-nums text-parchment-ink">
                {displayStat(weapon.range)}
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums text-parchment-ink">
                {displayStat(weapon.strength)}
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums text-parchment-ink">
                {displayStat(weapon.ap)}
              </td>
              <td className="px-3 py-2.5 text-sheet-muted">
                {displaySpecial(weapon.specialRules)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function displayStat(value: string): string {
  const trimmed = value.trim();
  return trimmed && trimmed !== "-" ? trimmed : "—";
}

function displaySpecial(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return "—";
  }
  return trimmed;
}
