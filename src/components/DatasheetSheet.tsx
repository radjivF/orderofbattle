"use client";

import { commandAbilityCost } from "@/engine/commands";
import { unitWard } from "@/engine/queries";
import type {
  CatalogueUnit,
  DatasheetSubject,
  ManifestationModel,
  UnitAbility,
  UnitWeapon,
} from "@/engine/types";
import { SHEET_PANEL_CLASS } from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";

type Props = {
  sheet: DatasheetSubject;
  onClose: () => void;
};

function isManifestation(sheet: DatasheetSubject): sheet is ManifestationModel {
  return "banishment" in sheet;
}

function isUnit(sheet: DatasheetSubject): sheet is CatalogueUnit {
  return "hero" in sheet;
}

export function DatasheetSheet({ sheet, onClose }: Props) {
  const stats = sheet.stats;
  const ward = isUnit(sheet) ? unitWard(sheet) : "";
  const banishment = isManifestation(sheet) ? sheet.banishment : "";
  const points = isUnit(sheet) ? sheet.points : null;
  const subtitle = isManifestation(sheet)
    ? "Manifestation"
    : isUnit(sheet)
      ? `${points} points`
      : "Faction terrain";
  const ranged = sheet.weapons.filter((weapon) => weapon.kind === "ranged");
  const melee = sheet.weapons.filter((weapon) => weapon.kind === "melee");
  const statCount =
    3 +
    (stats.control ? 1 : 0) +
    (ward ? 1 : 0) +
    (banishment ? 1 : 0);

  return (
    <ModalFrame
      label={`${sheet.name} datasheet`}
      onClose={onClose}
      zClass="z-[60]"
      panelClassName={`${SHEET_PANEL_CLASS} bg-parchment shadow-2xl`}
    >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="font-serif text-2xl leading-tight">{sheet.name}</h2>
            <p className="mt-1 text-sm text-sigmarite">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 px-3 text-sm text-parchment-ink/70"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-8">
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
              <p className="mt-2 text-sm leading-relaxed text-parchment-ink/80">
                {sheet.categories.join(", ")}
              </p>
            </section>
          ) : null}

          {ranged.length > 0 ? (
            <WeaponBlock title="Ranged weapons" weapons={ranged} ranged />
          ) : null}
          {melee.length > 0 ? (
            <WeaponBlock title="Melee weapons" weapons={melee} />
          ) : null}

          {sheet.abilities.length > 0 ? (
            <AbilityBlock abilities={sheet.abilities} />
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
            <p className="font-serif text-lg leading-tight">{ability.name}</p>
            {ability.keywords ||
            ability.castingValue ||
            ability.chantingValue ||
            commandAbilityCost(ability) != null ? (
              <p className="mt-0.5 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                {[
                  ability.keywords,
                  commandAbilityCost(ability) != null
                    ? `${commandAbilityCost(ability)} CP`
                    : "",
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
              <p className="mt-1 text-sm leading-relaxed text-parchment-ink/80">
                <span className="text-sheet-muted">Declare · </span>
                {ability.declare}
              </p>
            ) : null}
            {ability.effect ? (
              <p className="mt-1 text-sm leading-relaxed text-parchment-ink/80">
                <span className="text-sheet-muted">Effect · </span>
                {ability.effect}
              </p>
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
