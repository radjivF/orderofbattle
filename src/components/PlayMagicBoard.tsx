"use client";

import { useMemo } from "react";
import {
  parseEffectChoices,
  powerBindCandidates,
  powerBindKey,
  powerBindRule,
  powerChoiceKey,
} from "@/engine/magic";
import { armyRoster } from "@/engine/phases";
import {
  armyHasKeyword,
  manifestationStatLine,
  namedOption,
} from "@/engine/queries";
import type {
  ArmyList,
  DatasheetSubject,
  FactionCatalogue,
  UnitAbility,
} from "@/engine/types";

type Props = {
  list: ArmyList;
  faction: FactionCatalogue;
  onOpenSheet: (sheet: DatasheetSubject) => void;
  onBindPower: (key: string, value: string | null) => void;
};

export function PlayMagicBoard({
  list,
  faction,
  onOpenSheet,
  onBindPower,
}: Props) {
  const content = useMemo(() => buildMagicBoard(list, faction), [list, faction]);
  const hasPriest = armyHasKeyword(list, faction, "PRIEST");
  const showSpells = faction.spellLores.length > 0 || content.spells.length > 0;
  const showPrayers =
    hasPriest &&
    (faction.prayerLores.length > 0 || content.prayers.length > 0);
  const showManifestations =
    faction.manifestationLores.length > 0 || content.manifestations.length > 0;

  if (!showSpells && !showPrayers && !showManifestations) {
    return (
      <p className="rounded-2xl bg-ink-raised px-4 py-3 text-parchment/80 ring-1 ring-parchment/12">
        This faction has no spell, prayer, or manifestation lores.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {showSpells ? (
        <section className="rounded-2xl bg-parchment p-5 text-parchment-ink">
          <h2 className="font-serif text-2xl">Spells</h2>
          <p className="mt-1 text-sm text-sheet-muted">
            {content.spellLoreName ?? "None"}
          </p>
          {content.spells.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {content.spells.map((row) => {
                const key = powerBindKey("spell", row.power.name);
                return (
                  <li key={`${row.source}-${row.power.name}`}>
                    <PowerCard
                      row={row}
                      bindKey={key}
                      list={list}
                      faction={faction}
                      boundId={list.powerBinds?.[key] ?? null}
                      onBind={onBindPower}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-sheet-muted">
              Pick a spell lore in Build.
            </p>
          )}
        </section>
      ) : null}

      {showPrayers ? (
        <section className="rounded-2xl bg-parchment p-5 text-parchment-ink">
          <h2 className="font-serif text-2xl">Prayers</h2>
          <p className="mt-1 text-sm text-sheet-muted">
            {content.prayerLoreName ?? "None"}
          </p>
          {content.prayers.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {content.prayers.map((row) => {
                const key = powerBindKey("prayer", row.power.name);
                return (
                  <li key={`${row.source}-${row.power.name}`}>
                    <PowerCard
                      row={row}
                      bindKey={key}
                      list={list}
                      faction={faction}
                      boundId={list.powerBinds?.[key] ?? null}
                      onBind={onBindPower}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-sheet-muted">
              Pick a prayer lore in Build, or leave as None.
            </p>
          )}
        </section>
      ) : null}

      {showManifestations ? (
        <section className="rounded-2xl bg-parchment p-5 text-parchment-ink">
          <h2 className="font-serif text-2xl">Manifestations</h2>
          <p className="mt-1 text-sm text-sheet-muted">
            {content.manifestationLoreName ?? "None"}
          </p>
          {content.manifestations.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {content.manifestations.map((model) => (
                <li key={model.id}>
                  <button
                    type="button"
                    onClick={() => onOpenSheet(model)}
                    className="w-full rounded-xl bg-parchment-ink/5 px-3 py-3 text-left"
                  >
                    <p className="font-serif text-lg">{model.name}</p>
                    <p className="mt-1 text-sm text-sheet-muted">
                      {manifestationStatLine(model)}
                    </p>
                    {model.summon ? (
                      <div className="mt-3 border-t border-parchment-ink/10 pt-3">
                        <p className="text-xs tracking-wide uppercase text-aether">
                          Launch · Cast {model.summon.castingValue || "—"}
                        </p>
                        {model.summon.timing ? (
                          <p className="mt-2 font-serif text-base leading-snug text-parchment-ink">
                            {model.summon.timing}
                          </p>
                        ) : null}
                        {model.summon.declare ? (
                          <p className="mt-2 text-sm leading-relaxed text-parchment-ink/80">
                            <span className="text-sheet-muted">
                              Declare ·{" "}
                            </span>
                            {model.summon.declare}
                          </p>
                        ) : null}
                        {model.summon.effect ? (
                          <p className="mt-1 text-sm leading-relaxed text-parchment-ink/80">
                            <span className="text-sheet-muted">
                              Effect ·{" "}
                            </span>
                            {model.summon.effect}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-sheet-muted">
                        Tap for datasheet
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-sheet-muted">
              Pick a manifestation lore in Build.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}

type PowerRow = {
  source: string;
  power: UnitAbility;
};

function PowerCard({
  row,
  bindKey,
  list,
  faction,
  boundId,
  onBind,
}: {
  row: PowerRow;
  bindKey: string;
  list: ArmyList;
  faction: FactionCatalogue;
  boundId: string | null;
  onBind: (key: string, value: string | null) => void;
}) {
  const { power } = row;
  const rule = powerBindRule(power);
  const candidates = powerBindCandidates(list, faction, power);
  const choiceKey = powerChoiceKey(bindKey);
  const chosenEffectId = list.powerBinds?.[choiceKey] ?? null;
  const effectChoices = power.effect ? parseEffectChoices(power.effect) : null;
  const launch =
    power.kind.toLowerCase() === "prayer"
      ? power.chantingValue
        ? `Chant ${power.chantingValue}`
        : "Prayer"
      : power.castingValue
        ? `Cast ${power.castingValue}`
        : "Spell";

  return (
    <article className="rounded-xl bg-parchment-ink/5 px-3 py-3">
      <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {row.source}
      </p>
      <p className="mt-1 font-serif text-lg leading-tight">{power.name}</p>
      <p className="mt-1 text-xs tracking-wide uppercase text-aether">
        Launch · {launch}
      </p>
      {power.timing ? (
        <p className="mt-2 font-serif text-base leading-snug text-parchment-ink">
          {power.timing}
        </p>
      ) : null}

      {rule.role === "target" ? (
        <>
          <label className="mt-3 flex flex-col gap-1.5 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            {rule.heroesOnly ? "On hero" : "On unit"}
            <select
              value={boundId ?? ""}
              onChange={(event) =>
                onBind(bindKey, event.target.value || null)
              }
              className="min-h-10 rounded-lg bg-parchment px-3 font-sans text-sm normal-case tracking-normal text-parchment-ink"
            >
              <option value="">Choose…</option>
              {candidates.map((candidate) => (
                <option
                  key={candidate.selectionId}
                  value={candidate.selectionId}
                >
                  {candidate.unit.name}
                </option>
              ))}
            </select>
          </label>
          {candidates.length === 0 ? (
            <p className="mt-1 text-sm text-sheet-muted">
              No eligible {rule.heroesOnly ? "heroes" : "units"} on this list.
            </p>
          ) : null}
        </>
      ) : null}

      {rule.role === "enemy" ? (
        <label className="mt-3 flex flex-col gap-1.5 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Enemy unit
          <input
            type="text"
            value={boundId ?? ""}
            onChange={(event) =>
              onBind(bindKey, event.target.value || null)
            }
            placeholder="Name…"
            className="min-h-10 rounded-lg bg-parchment px-3 font-sans text-sm normal-case tracking-normal text-parchment-ink placeholder:text-parchment-ink/35"
          />
        </label>
      ) : null}

      {power.declare ? (
        <p className="mt-2 text-sm leading-relaxed text-parchment-ink/80">
          <span className="text-sheet-muted">Declare · </span>
          {power.declare}
        </p>
      ) : null}
      {effectChoices ? (
        <div className="mt-2">
          <p className="text-sm leading-relaxed text-parchment-ink/80">
            <span className="text-sheet-muted">Effect · </span>
            {effectChoices.preface}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {effectChoices.options.map((option) => {
              const checked = chosenEffectId === option.id;
              return (
                <li key={option.id}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-parchment-ink/5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onBind(choiceKey, checked ? null : option.id)
                      }
                      className="mt-1 size-4 shrink-0 accent-aether"
                    />
                    <span className="text-sm leading-relaxed text-parchment-ink/85">
                      {option.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : power.effect ? (
        <p className="mt-1 text-sm leading-relaxed text-parchment-ink/80">
          <span className="text-sheet-muted">Effect · </span>
          {power.effect}
        </p>
      ) : null}
    </article>
  );
}

function buildMagicBoard(list: ArmyList, faction: FactionCatalogue) {
  const spellLore = faction.spellLores.find(
    (lore) => lore.id === list.spellLoreId,
  );
  const prayerLore = faction.prayerLores.find(
    (lore) => lore.id === list.prayerLoreId,
  );
  const manifestationLore = faction.manifestationLores.find(
    (lore) => lore.id === list.manifestationLoreId,
  );

  const spells: PowerRow[] = (spellLore?.powers ?? []).map((power) => ({
    source: spellLore?.name ?? "Spell lore",
    power,
  }));
  const prayers: PowerRow[] = (prayerLore?.powers ?? []).map((power) => ({
    source: prayerLore?.name ?? "Prayer lore",
    power,
  }));

  for (const entry of armyRoster(list, faction)) {
    for (const ability of entry.unit.abilities) {
      const kind = ability.kind.toLowerCase();
      if (kind === "spell") {
        spells.push({ source: entry.unit.name, power: ability });
      }
      if (kind === "prayer") {
        prayers.push({ source: entry.unit.name, power: ability });
      }
    }
  }

  return {
    spellLoreName:
      spellLore?.name ??
      namedOption(faction.spellLores, list.spellLoreId)?.name,
    prayerLoreName:
      prayerLore?.name ??
      namedOption(faction.prayerLores, list.prayerLoreId)?.name,
    manifestationLoreName: manifestationLore?.name,
    spells,
    prayers,
    manifestations: manifestationLore?.manifestations ?? [],
  };
}
