"use client";

import { commandAbilityCost } from "@/engine/commands";
import { warscrollAbilities } from "@/engine/coreRules";
import { unitWard } from "@/engine/queries";
import type {
  CatalogueUnit,
  DatasheetSubject,
  ManifestationModel,
  UnitAbility,
  UnitWeapon,
} from "@/engine/types";
import {
  datasheetUnitPointsLabel,
  SHEET_PANEL_CLASS,
  SHEET_HEADER_START_CLASS,
} from "@/lib/builderUi";
import { AbilityMeta } from "./AbilityMeta";
import { KeywordChip } from "./KeywordChip";
import { ModalFrame } from "./ModalFrame";
import { RuleText } from "./RuleText";
import { SheetCloseButton } from "./ios/SheetIconButton";

type Props = {
  sheet: DatasheetSubject;
  hidePoints?: boolean;
  onClose: () => void;
};

function isManifestation(sheet: DatasheetSubject): sheet is ManifestationModel {
  return "banishment" in sheet;
}

function isUnit(sheet: DatasheetSubject): sheet is CatalogueUnit {
  return "hero" in sheet;
}

export function DatasheetSheet({ sheet, hidePoints, onClose }: Props) {
  const stats = sheet.stats;
  const ward = isUnit(sheet) ? unitWard(sheet) : "";
  const banishment = isManifestation(sheet) ? sheet.banishment : "";
  const subtitle = isManifestation(sheet)
    ? "Manifestation"
    : isUnit(sheet)
      ? datasheetUnitPointsLabel(sheet.points, Boolean(hidePoints))
      : "Faction terrain";
  const ranged = sheet.weapons.filter((weapon) => weapon.kind === "ranged");
  const melee = sheet.weapons.filter((weapon) => weapon.kind === "melee");
  const abilities = isUnit(sheet)
    ? hidePoints
      ? warscrollAbilities(sheet)
      : sheet.abilities
    : sheet.abilities;
  const statCount =
    3 +
    (stats.control ? 1 : 0) +
    (ward ? 1 : 0) +
    (banishment ? 1 : 0);

  return (
    <ModalFrame
      label={`${sheet.name} datasheet`}
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} bg-parchment shadow-2xl`}
    >
        <div className={SHEET_HEADER_START_CLASS}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="min-w-0 font-serif text-2xl leading-tight">{sheet.name}</h2>
              {subtitle ? (
                <p className="shrink-0 text-sm text-sigmarite">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <SheetCloseButton onClick={onClose} />
        </div>

        <div className="modal-sheet-scroll overflow-y-auto px-5 pb-8">
          <dl
            className={`grid gap-2 rounded-xl bg-parchment-ink/5 px-3 py-3 text-center ${
              statCount >= 5 ? "grid-cols-5" : "grid-cols-4"
            }`}
          >
            <Stat label="Move" value={stats.move} />
            <Stat label="Health" value={stats.health} />
            <Stat label="Save" value={stats.save} />
            {stats.control ? <Stat label="Control" value={stats.control} /> : null}
            {banishment ? <Stat label="Banish" value={banishment} /> : null}
            {ward ? <Stat label="Ward" value={ward} /> : null}
          </dl>

          {sheet.categories.length > 0 ? (
            <section className="mt-5">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                Keywords
              </h3>
              <ul
                aria-label="Keywords"
                className="mt-2 flex flex-wrap gap-1.5"
              >
                {sheet.categories.map((keyword) => (
                  <li key={keyword}>
                    <KeywordChip keyword={keyword} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {ranged.length > 0 ? (
            <WeaponBlock title="Ranged weapons" weapons={ranged} ranged />
          ) : null}
          {melee.length > 0 ? (
            <WeaponBlock title="Melee weapons" weapons={melee} />
          ) : null}

          {abilities.length > 0 ? (
            <AbilityBlock abilities={abilities} />
          ) : null}
        </div>
    </ModalFrame>
  );
}

function AbilityBlock({ abilities }: { abilities: UnitAbility[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        Abilities
      </h3>
      <ul className="mt-3 flex flex-col gap-4">
        {abilities.map((ability) => (
          <li key={ability.name}>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 font-serif text-lg leading-tight">
                {ability.name}
              </p>
              <AbilityMeta
                keywords={ability.keywords}
                cpCost={commandAbilityCost(ability)}
                castingValue={ability.castingValue}
                chantingValue={ability.chantingValue}
              />
            </div>
            {ability.timing ? (
              <p className="mt-2 font-serif text-base leading-snug text-parchment-ink">
                {ability.timing}
              </p>
            ) : null}
            {ability.declare ? (
              <RuleText
                text={ability.declare}
                label="Declare · "
                className="mt-1 text-sm"
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
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-xl">{value || "—"}</dd>
    </div>
  );
}

function WeaponBlock({
  title,
  weapons,
  ranged,
}: {
  title: string;
  weapons: UnitWeapon[];
  ranged?: boolean;
}) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-3">
        {weapons.map((weapon) => (
          <li
            key={weapon.name}
            className="rounded-xl bg-parchment-ink/5 px-3 py-3"
          >
            <p className="font-serif text-lg leading-tight">{weapon.name}</p>
            <p className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-sm sm:grid-cols-6">
              {ranged ? <WeaponStat label="Rng" value={weapon.range} /> : null}
              <WeaponStat label="Atk" value={weapon.attacks} />
              <WeaponStat label="Hit" value={weapon.hit} />
              <WeaponStat label="Wnd" value={weapon.wound} />
              <WeaponStat label="Rnd" value={weapon.rend} />
              <WeaponStat label="Dmg" value={weapon.damage} />
            </p>
            {weapon.ability && weapon.ability !== "-" ? (
              <p className="mt-2 text-xs text-sheet-muted">
                {weapon.ability}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeaponStat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-sheet-muted">{label} </span>
      {value || "—"}
    </span>
  );
}
