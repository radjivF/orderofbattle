"use client";

import { useState } from "react";
import type {
  ArmyList,
  FactionCatalogue,
  ManifestationModel,
  UnitAbility,
} from "@/engine/types";
import {
  factionManifestationPicks,
  factionSpellPicks,
  learnedManifestationsForList,
  learnedSpellsForList,
  patchPathToGloryState,
  pathToGloryManifestationIds,
  pathToGlorySpellIds,
  toggleLearnedId,
} from "@/engine/pathToGlory";
import { armyHasKeyword, manifestationStatLine } from "@/engine/queries";
import { castValueLabel } from "@/lib/abilityUi";
import { CollapseChevron } from "./ExpandableRuleCard";
import { RuleText } from "./RuleText";
import { PlaySlotRow, SheetLinkButton } from "./ios/SheetIconButton";

type SpellProps = {
  list: ArmyList;
  faction: FactionCatalogue;
  playMode: boolean;
  onChange: (next: ArmyList) => void;
};

export function PathToGlorySpellCard({
  list,
  faction,
  playMode,
  onChange,
}: SpellProps) {
  const picks = factionSpellPicks(faction);
  const learned = learnedSpellsForList(list, faction);
  const hasWizard = armyHasKeyword(list, faction, "WIZARD");
  if (picks.length === 0) {
    return null;
  }
  if (playMode && learned.length === 0) {
    return null;
  }
  if (!playMode && !hasWizard && learned.length === 0) {
    return null;
  }

  const selected = pathToGlorySpellIds(list);

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4">
        <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Spells
        </p>
        <h2 className="font-serif text-2xl leading-tight">
          {playMode ? "Learned spells" : "Learn spells"}
        </h2>
        {!playMode ? (
          <p className="mt-1 text-sm text-sheet-muted">
            The first time you add a Wizard, you can pick 1 spell from a lore —
            not the whole lore. Skip this if you have no Wizard. Later spells
            come from quests.
          </p>
        ) : null}
      </header>
      {playMode ? (
        <ul className="flex flex-col gap-3">
          {learned.map((item) => (
            <li key={item.key}>
              <SpellRules power={item.power} loreName={item.loreName} />
            </li>
          ))}
        </ul>
      ) : (
        <LearnedGroups
          groups={groupByLore(
            picks.map((item) => ({
              id: item.key,
              loreName: item.loreName,
              name: item.power.name,
              subtitle: item.power.castingValue
                ? castValueLabel(item.power.castingValue)
                : "",
              power: item.power,
            })),
          )}
          selectedIds={selected}
          onToggle={(id) =>
            onChange(
              patchPathToGloryState(list, {
                spellIds: toggleLearnedId(selected, id),
              }),
            )
          }
        />
      )}
    </article>
  );
}

type ManifestationProps = {
  list: ArmyList;
  faction: FactionCatalogue;
  playMode: boolean;
  onChange: (next: ArmyList) => void;
  onOpenSheet: (model: ManifestationModel) => void;
};

export function PathToGloryManifestationCard({
  list,
  faction,
  playMode,
  onChange,
  onOpenSheet,
}: ManifestationProps) {
  const picks = factionManifestationPicks(faction);
  const learned = learnedManifestationsForList(list, faction);
  const hasCaster =
    armyHasKeyword(list, faction, "WIZARD") ||
    armyHasKeyword(list, faction, "PRIEST");
  if (picks.length === 0) {
    return null;
  }
  if (playMode && learned.length === 0) {
    return null;
  }
  if (!playMode && !hasCaster && learned.length === 0) {
    return null;
  }

  const selected = pathToGloryManifestationIds(list);

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4">
        <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Manifestation
        </p>
        <h2 className="font-serif text-2xl leading-tight">
          {playMode ? "Learned manifestations" : "Learn manifestations"}
        </h2>
        {!playMode ? (
          <p className="mt-1 text-sm text-sheet-muted">
            The first Wizard or Priest can pick 1 manifestation — not the whole
            lore. Skip this until you have one.
          </p>
        ) : null}
      </header>
      {playMode ? (
        <ul className="flex flex-col gap-2">
          {learned.map((model) => {
            const stats = manifestationStatLine(model);
            const cast = model.summon?.castingValue
              ? castValueLabel(model.summon.castingValue)
              : "";
            return (
              <li key={model.id}>
                <PlaySlotRow
                  name={model.name}
                  subtitle={[stats, cast].filter(Boolean).join(" · ") || undefined}
                  sheetLabel={`${model.name} datasheet`}
                  onOpenSheet={() => onOpenSheet(model)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <LearnedGroups
          groups={groupByLore(
            picks.map((item) => ({
              id: item.model.id,
              loreName: item.loreName,
              name: item.model.name,
              subtitle: [
                manifestationStatLine(item.model),
                item.model.summon?.castingValue
                  ? castValueLabel(item.model.summon.castingValue)
                  : "",
                item.model.points ? `${item.model.points} pts` : "",
              ]
                .filter(Boolean)
                .join(" · "),
              onOpenSheet: () => onOpenSheet(item.model),
            })),
          )}
          selectedIds={selected}
          onToggle={(id) =>
            onChange(
              patchPathToGloryState(list, {
                manifestationIds: toggleLearnedId(selected, id),
              }),
            )
          }
        />
      )}
    </article>
  );
}

type PickRow = {
  id: string;
  loreName: string;
  name: string;
  subtitle: string;
  power?: UnitAbility;
  onOpenSheet?: () => void;
};

function groupByLore(rows: PickRow[]): { loreName: string; items: PickRow[] }[] {
  const groups: { loreName: string; items: PickRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.loreName === row.loreName) {
      last.items.push(row);
    } else {
      groups.push({ loreName: row.loreName, items: [row] });
    }
  }
  return groups;
}

function LearnedGroups({
  groups,
  selectedIds,
  onToggle,
}: {
  groups: { loreName: string; items: PickRow[] }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {groups.map((group) => (
        <li key={group.loreName}>
          <LoreGroup
            group={group}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />
        </li>
      ))}
    </ul>
  );
}

function LoreGroup({
  group,
  selectedIds,
  onToggle,
}: {
  group: { loreName: string; items: PickRow[] };
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const learned = group.items.filter((item) =>
    selectedIds.includes(item.id),
  ).length;

  return (
    <div className="rounded-xl bg-parchment-ink/5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase text-sheet-muted"
      >
        <span className="min-w-0 truncate">{group.loreName}</span>
        <span className="flex shrink-0 items-center gap-2 font-sans font-normal normal-case tracking-normal">
          {learned > 0 ? (
            <span className="text-sm text-parchment-ink">{learned} learned</span>
          ) : null}
          <span
            aria-hidden="true"
            className="inline-flex size-11 shrink-0 items-center justify-center"
          >
            <CollapseChevron turned={open} />
          </span>
        </span>
      </button>
      {open ? (
        <ul className="flex flex-col gap-2 border-t border-parchment-ink/10 px-2 pb-2 pt-2">
          {group.items.map((item) => (
            <li key={item.id}>
              <LearnedPick
                item={item}
                checked={selectedIds.includes(item.id)}
                onToggle={() => onToggle(item.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LearnedPick({
  item,
  checked,
  onToggle,
}: {
  item: PickRow;
  checked: boolean;
  onToggle: () => void;
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const expandable = Boolean(
    item.power?.timing || item.power?.declare || item.power?.effect,
  );

  return (
    <div
      className={`rounded-xl ring-1 ${
        checked
          ? "bg-aether/15 ring-aether/40"
          : "bg-parchment-ink/5 ring-parchment-ink/10"
      }`}
    >
      <div className="flex items-start gap-2 px-2 py-1">
        <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-2 py-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            aria-label={item.name}
            className="mt-1 size-5 shrink-0 accent-aether"
          />
          <span className="min-w-0">
            <span className="block font-serif text-lg leading-tight text-parchment-ink">
              {item.name}
            </span>
            {item.subtitle ? (
              <span className="mt-0.5 block text-sm text-sheet-muted">
                {item.subtitle}
              </span>
            ) : null}
          </span>
        </label>
        {item.onOpenSheet ? (
          <SheetLinkButton
            label={`${item.name} datasheet`}
            onClick={(event) => {
              event.stopPropagation();
              item.onOpenSheet?.();
            }}
          />
        ) : null}
      </div>
      {expandable && item.power ? (
        <div className="border-t border-parchment-ink/10">
          <button
            type="button"
            aria-expanded={rulesOpen}
            onClick={() => setRulesOpen((value) => !value)}
            className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase text-sheet-muted"
          >
            What it does
            <span
              aria-hidden="true"
              className="inline-flex size-11 shrink-0 items-center justify-center"
            >
              <CollapseChevron turned={rulesOpen} />
            </span>
          </button>
          {rulesOpen ? (
            <div className="px-3 pb-3">
              <SpellRules power={item.power} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SpellRules({
  power,
  loreName,
}: {
  power: UnitAbility;
  loreName?: string;
}) {
  return (
    <div>
      <p className="font-serif text-lg leading-tight">{power.name}</p>
      {loreName ? (
        <p className="mt-0.5 text-xs tracking-wide uppercase text-aether">
          {loreName}
        </p>
      ) : null}
      {power.timing ? (
        <p className="mt-1 font-serif text-base leading-snug text-parchment-ink/80">
          {power.timing}
        </p>
      ) : null}
      {power.declare ? (
        <RuleText text={power.declare} label="Declare · " className="mt-2 text-sm" />
      ) : null}
      {power.effect ? (
        <RuleText
          text={power.effect}
          label="Effect · "
          className={power.declare ? "mt-1 text-sm" : "mt-2 text-sm"}
        />
      ) : null}
    </div>
  );
}
