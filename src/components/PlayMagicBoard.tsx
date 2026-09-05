"use client";

import { useMemo } from "react";
import {
  parseEffectChoices,
  parsePowerBindTargets,
  powerBindCandidates,
  powerBindKey,
  powerBindRule,
  powerChoiceKey,
  powerIsUnlimited,
  serializePowerBindTargets,
  type BindCandidate,
} from "@/engine/magic";
import { armyRoster } from "@/engine/phases";
import {
  getSelection,
  manifestationStatLine,
  namedOption,
  selectionPlayState,
} from "@/engine/queries";
import type {
  ArmyList,
  DatasheetSubject,
  FactionCatalogue,
  UnitAbility,
} from "@/engine/types";
import { RuleText } from "./RuleText";
import { LaunchMeta } from "./AbilityMeta";
import { SelectSlots } from "./SelectSlots";

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
  const showSpells = faction.spellLores.length > 0 || content.spells.length > 0;
  const showPrayers =
    faction.prayerLores.length > 0 || content.prayers.length > 0;
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
        <details className="rounded-2xl bg-parchment p-5 text-parchment-ink group">
          <summary className="pressable cursor-pointer flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-3 w-3 transition-transform group-open:rotate-90"
            >
              <path
                fill="currentColor"
                d="M7.5 5 12.5 10 7.5 15"
              />
            </svg>
            Spells
          </summary>
          
          <div className="mt-4">
            <p className="text-sm text-sheet-muted">
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
                        boundValue={list.powerBinds?.[key] ?? null}
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
          </div>
        </details>
      ) : null}

      {showPrayers ? (
        <details className="rounded-2xl bg-parchment p-5 text-parchment-ink group">
          <summary className="pressable cursor-pointer flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-3 w-3 transition-transform group-open:rotate-90"
            >
              <path
                fill="currentColor"
                d="M7.5 5 12.5 10 7.5 15"
              />
            </svg>
            Prayers
          </summary>
          
          <div className="mt-4">
            <p className="text-sm text-sheet-muted">
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
                        boundValue={list.powerBinds?.[key] ?? null}
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
          </div>
        </details>
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
                        <LaunchMeta
                          castingValue={model.summon.castingValue}
                          className="w-full"
                        />
                        {model.summon.timing ? (
                          <p className="mt-2 font-serif text-base leading-snug text-parchment-ink">
                            {model.summon.timing}
                          </p>
                        ) : null}
                        {model.summon.declare ? (
                          <RuleText
                            text={model.summon.declare}
                            label="Declare · "
                            className="mt-2 text-sm"
                            itemClassName="text-parchment-ink/80"
                          />
                        ) : null}
                        {model.summon.effect ? (
                          <RuleText
                            text={model.summon.effect}
                            label="Effect · "
                            className="mt-1 text-sm"
                            itemClassName="text-parchment-ink/80"
                          />
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
  boundValue,
  onBind,
}: {
  row: PowerRow;
  bindKey: string;
  list: ArmyList;
  faction: FactionCatalogue;
  boundValue: string | null;
  onBind: (key: string, value: string | null) => void;
}) {
  const { power } = row;
  const rule = powerBindRule(power);
  const candidates = powerBindCandidates(list, faction, power);
  const choiceKey = powerChoiceKey(bindKey);
  const chosenEffectId = list.powerBinds?.[choiceKey] ?? null;
  const effectChoices = power.effect ? parseEffectChoices(power.effect) : null;
  const isPrayer = power.kind.toLowerCase() === "prayer";
  const selectedTargets = parsePowerBindTargets(boundValue);

  return (
    <article className="rounded-xl bg-parchment-ink/5 px-3 py-3">
      <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {row.source}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 font-serif text-lg leading-tight">{power.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          {powerIsUnlimited(power) ? (
            <span className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
              Unlimited
            </span>
          ) : null}
          <LaunchMeta
            prayer={isPrayer}
            castingValue={power.castingValue}
            chantingValue={power.chantingValue}
          />
        </div>
      </div>
      {power.timing ? (
        <p className="mt-2 font-serif text-base leading-snug text-parchment-ink">
          {power.timing}
        </p>
      ) : null}

      {rule.role === "target" ? (
        <PowerTargetSelect
          bindKey={bindKey}
          candidates={candidates}
          heroesOnly={rule.heroesOnly}
          list={list}
          onBind={onBind}
          selectedTargets={selectedTargets}
        />
      ) : null}

      {rule.role === "enemy" ? (
        <label className="mt-3 flex flex-col gap-1.5 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Enemy unit
          <input
            type="text"
            value={boundValue ?? ""}
            onChange={(event) =>
              onBind(bindKey, event.target.value || null)
            }
            placeholder="Name…"
            className="min-h-10 rounded-lg bg-parchment px-3 font-sans text-sm normal-case tracking-normal text-parchment-ink placeholder:text-parchment-ink/35"
          />
        </label>
      ) : null}

      {effectChoices ? (
        <div className="mt-2">
          {power.declare ? (
            <RuleText
              text={power.declare}
              label="Declare · "
              className="text-sm"
              itemClassName="text-parchment-ink/80"
            />
          ) : null}
          <RuleText
            text={effectChoices.preface}
            label={power.declare ? undefined : "Effect · "}
            className={`text-sm ${power.declare ? "mt-2" : ""}`}
            itemClassName="text-parchment-ink/80"
          />
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
      ) : power.declare || power.effect ? (
        <div className="mt-2">
          {power.declare ? (
            <RuleText
              text={power.declare}
              label="Declare · "
              className="text-sm"
              itemClassName="text-parchment-ink/80"
            />
          ) : null}
          {power.effect ? (
            <RuleText
              text={power.effect}
              label="Effect · "
              className={power.declare ? "mt-1 text-sm" : "text-sm"}
              itemClassName="text-parchment-ink/80"
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PowerTargetSelect({
  bindKey,
  candidates,
  heroesOnly,
  list,
  onBind,
  selectedTargets,
}: {
  bindKey: string;
  candidates: BindCandidate[];
  heroesOnly: boolean;
  list: ArmyList;
  onBind: (key: string, value: string | null) => void;
  selectedTargets: string[];
}) {
  return (
    <SelectSlots
      label={heroesOnly ? "On hero" : "On unit"}
      options={candidates.map((candidate) => ({
        value: candidate.selectionId,
        label: bindCandidateLabel(list, candidate, candidates),
      }))}
      value={selectedTargets}
      onChange={(next) => onBind(bindKey, serializePowerBindTargets(next))}
      emptyText={`No eligible ${heroesOnly ? "heroes" : "units"} on this list.`}
    />
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

function bindCandidateLabel(
  list: ArmyList,
  candidate: BindCandidate,
  candidates: BindCandidate[],
): string {
  const selection = getSelection(list, candidate.selectionId);
  const track = selection
    ? selectionPlayState(selection, candidate.unit)
    : null;
  const twins = candidates.filter(
    (row) => row.unit.name === candidate.unit.name,
  );
  const name =
    twins.length > 1
      ? `${candidate.unit.name} (${twins.findIndex((row) => row.selectionId === candidate.selectionId) + 1})`
      : candidate.unit.name;
  if (!track) {
    return name;
  }
  if (track.modelsMax > 1 || twins.length > 1) {
    return `${name} · ${track.models}/${track.modelsMax}`;
  }
  return name;
}
