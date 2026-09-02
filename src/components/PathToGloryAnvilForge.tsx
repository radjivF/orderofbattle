"use client";

import { useState } from "react";
import type {
  AnvilForgeGroup,
  AnvilForgeOption,
  CatalogueUnit,
  PathToGlorySelectionState,
  Selection,
} from "@/engine/types";
import {
  anvilDestinyBudget,
  anvilDestinyRemaining,
  anvilForgeSummary,
  anvilPickIds,
  anvilRankForSelection,
  isAnvilOfApotheosis,
  pickAnvilOption,
  resolvePathToGloryUnit,
  visibleAnvilForgeGroups,
} from "@/engine/pathToGlory";
import {
  SHEET_HEADER_START_CLASS,
  SHEET_PANEL_CLASS,
} from "@/lib/builderUi";
import { CollapseChevron } from "./ExpandableRuleCard";
import { ModalFrame } from "./ModalFrame";
import { RuleText } from "./RuleText";
import { SheetCloseButton, SheetLinkButton } from "./ios/SheetIconButton";

const fieldClass =
  "min-h-10 w-full rounded-lg bg-parchment-ink/5 px-2.5 text-sm text-parchment-ink";

/** Returns "an" if word starts with vowel sound, otherwise "a" */
function article(word: string): string {
  const firstChar = word.charAt(0).toLowerCase();
  return "aeiou".includes(firstChar) ? "an" : "a";
}

type Props = {
  selection: Selection;
  unit: CatalogueUnit;
  onPatch: (patch: Partial<PathToGlorySelectionState>) => void;
  onOpenDatasheet?: (unit: CatalogueUnit) => void;
};

function destinyLabel(optionDestiny: number): string {
  if (optionDestiny < 0) {
    return ` · ${-optionDestiny} dest`;
  }
  if (optionDestiny > 0) {
    return ` · +${optionDestiny} dest`;
  }
  return "";
}

export function PathToGloryAnvilForge({
  selection,
  unit,
  onPatch,
  onOpenDatasheet,
}: Props) {
  const [open, setOpen] = useState(false);
  if (!isAnvilOfApotheosis(unit) || !unit.anvilForge?.length) {
    return null;
  }
  const pickIds = anvilPickIds(selection);
  const remaining = anvilDestinyRemaining(unit, selection);
  const budget = anvilDestinyBudget(unit, selection);

  return (
    <>
      <button
        type="button"
        aria-label="Go to forge"
        onClick={() => setOpen(true)}
        className="pressable flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left ring-1 ring-aether/35"
      >
        <span className="shrink-0 text-sm font-semibold text-aether underline decoration-aether/40 underline-offset-2">
          Go to forge
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-parchment-ink">
          {anvilForgeSummary(unit, selection)}
        </span>
        <ForgeOpenMark />
      </button>
      {open ? (
        <ModalFrame
          label="Anvil of Apotheosis"
          onClose={() => setOpen(false)}
          panelClassName={`${SHEET_PANEL_CLASS} bg-parchment shadow-2xl`}
        >
          <div className={SHEET_HEADER_START_CLASS}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                Anvil of Apotheosis
              </p>
              <h2 className="font-serif text-2xl leading-tight">Forge</h2>
            </div>
            {onOpenDatasheet ? (
              <SheetLinkButton
                label={`${unit.name} datasheet`}
                onClick={() =>
                  onOpenDatasheet(resolvePathToGloryUnit(unit, selection))
                }
              />
            ) : null}
            <SheetCloseButton onClick={() => setOpen(false)} />
          </div>
          <div className="modal-sheet-scroll overflow-y-auto px-5 pb-8">
            <p
              className={`sticky top-0 z-10 -mx-5 mb-3 border-b border-parchment-ink/10 bg-parchment px-5 py-2 text-sm font-semibold ${
                remaining < 0 ? "text-red-800" : "text-parchment-ink"
              }`}
            >
              {anvilRankForSelection(unit, selection)?.points ?? unit.points} pts
              {" · "}
              Destiny {remaining} / {budget}
            </p>
            <ForgeFields
              selection={selection}
              unit={unit}
              pickIds={pickIds}
              onPatch={onPatch}
            />
          </div>
        </ModalFrame>
      ) : null}
    </>
  );
}

function ForgeFields({
  selection,
  unit,
  pickIds,
  onPatch,
}: {
  selection: Selection;
  unit: CatalogueUnit;
  pickIds: string[];
  onPatch: (patch: Partial<PathToGlorySelectionState>) => void;
}) {
  const ranks = unit.anvilRanks ?? [];
  const rankId = selection.pathToGlory?.anvilRankId ?? ranks[0]?.id ?? "";
  const groups = visibleAnvilForgeGroups(unit, pickIds);
  const picked = new Set(pickIds);

  return (
    <div className="flex flex-col gap-2">
      {ranks.length ? (
        <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
          Hero rank
          <select
            value={rankId}
            onChange={(event) =>
              onPatch({ anvilRankId: event.target.value || null })
            }
            className={fieldClass}
          >
            {ranks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.points} pts
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {groups.map((group) => (
        <ForgeGroup
          key={group.id}
          group={group}
          picked={picked}
          pickIds={pickIds}
          unit={unit}
          onPicks={(anvilPickIds) => onPatch({ anvilPickIds })}
        />
      ))}
    </div>
  );
}

function ForgeGroup({
  group,
  picked,
  pickIds,
  unit,
  onPicks,
}: {
  group: AnvilForgeGroup;
  picked: Set<string>;
  pickIds: string[];
  unit: CatalogueUnit;
  onPicks: (ids: string[]) => void;
}) {
  const selected = group.options.filter((option) => picked.has(option.id));
  const selectedId = selected[0]?.id ?? "";
  const summary =
    group.max === 1
      ? selected[0]?.name ?? (group.min < 1 ? "None" : `Pick ${article(group.name)} ${group.name}`)
      : selected.length
        ? `${selected.length} picked`
        : "None";

  return (
    <details className="group rounded-xl bg-parchment-ink/5">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase text-sheet-muted [&::-webkit-details-marker]:hidden">
        <span>{group.name}</span>
        <span className="flex min-w-0 items-center gap-2 font-sans font-normal normal-case tracking-normal">
          <span className="truncate text-sm text-parchment-ink">{summary}</span>
          <span
            aria-hidden="true"
            className="inline-flex size-11 shrink-0 items-center justify-center"
          >
            <CollapseChevron />
          </span>
        </span>
      </summary>
      <div className="flex flex-col gap-2 border-t border-parchment-ink/10 px-2 pb-2 pt-2">
        {group.max === 1 ? (
          <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            {group.name}
            <select
              value={selectedId}
              onChange={(event) => {
                const nextId = event.target.value;
                if (!nextId) {
                  onPicks(
                    pickIds.filter(
                      (id) =>
                        !group.options.some((option) => option.id === id),
                    ),
                  );
                  return;
                }
                onPicks(pickAnvilOption(unit, pickIds, group.id, nextId));
              }}
              className={fieldClass}
            >
              {group.min < 1 ? <option value="">None</option> : (
                <option value="">Pick</option>
              )}
              {group.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                  {destinyLabel(option.destiny)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          group.options.map((option) => (
            <ForgeOption
              key={option.id}
              option={option}
              checked={picked.has(option.id)}
              onToggle={() =>
                onPicks(pickAnvilOption(unit, pickIds, group.id, option.id))
              }
            />
          ))
        )}
        {group.max === 1 && selected[0] ? (
          <OptionRules option={selected[0]} />
        ) : null}
      </div>
    </details>
  );
}

const SHORT_OPTION_RULES = 140;

function optionRulesPlainText(option: AnvilForgeOption): string {
  const adds = option.statAdds;
  const stats = option.stats;
  return [
    stats?.move ? `Move ${stats.move}` : "",
    stats?.health ? `Health ${stats.health}` : "",
    stats?.save ? `Save ${stats.save}` : "",
    adds?.move ? `+${adds.move} Move` : "",
    adds?.health ? `+${adds.health} Health` : "",
    adds?.control ? `+${adds.control} Control` : "",
    ...option.weapons.map((weapon) =>
      [
        weapon.kind === "ranged" ? "Shoot" : "Melee",
        weapon.name,
        weapon.range,
        weapon.ability,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    ...option.abilities.flatMap((ability) =>
      [ability.timing, ability.declare, ability.effect].filter(Boolean),
    ),
  ]
    .filter(Boolean)
    .join(" · ");
}

function optionRulesNeedCollapse(option: AnvilForgeOption): boolean {
  return optionRulesPlainText(option).length > SHORT_OPTION_RULES;
}

function optionRulesPreview(option: AnvilForgeOption): string {
  const text = optionRulesPlainText(option);
  if (text.length <= SHORT_OPTION_RULES) {
    return text;
  }
  const slice = text.slice(0, SHORT_OPTION_RULES);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

function RulesMoreButton({
  more,
  name,
  onToggle,
}: {
  more: boolean;
  name: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={more}
      aria-label={more ? `See less, ${name}` : `See more, ${name}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className="pressable relative z-10 inline text-sm font-semibold text-aether underline decoration-aether/40 underline-offset-2"
    >
      {more ? "See less" : "See more"}
    </button>
  );
}

function ForgeOption({
  option,
  checked,
  onToggle,
}: {
  option: AnvilForgeOption;
  checked: boolean;
  onToggle: () => void;
}) {
  const [more, setMore] = useState(false);
  const hasRules = optionHasRules(option);
  const long = hasRules && optionRulesNeedCollapse(option);
  const shortRules = hasRules && !long ? optionRulesPlainText(option) : "";

  return (
    <div className="rounded-lg bg-parchment-ink/5 px-2 py-1">
      <label className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 text-sm font-sans font-normal normal-case tracking-normal">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={option.name}
          className="size-4 shrink-0 accent-aether"
        />
        <span className="min-w-0 text-parchment-ink">
          {option.name}
          {destinyLabel(option.destiny)}
          {shortRules ? (
            <span className="text-sheet-muted"> · {shortRules}</span>
          ) : null}
        </span>
      </label>
      {long && !more ? (
        <p className="pl-6 text-sm text-sheet-muted">
          {optionRulesPreview(option)}{" "}
          <RulesMoreButton
            more={false}
            name={option.name}
            onToggle={() => setMore(true)}
          />
        </p>
      ) : null}
      {long && more ? (
        <div className="pl-6">
          <OptionRules option={option} />
          <p className="mt-1">
            <RulesMoreButton
              more
              name={option.name}
              onToggle={() => setMore(false)}
            />
          </p>
        </div>
      ) : null}
    </div>
  );
}

function optionHasRules(option: AnvilForgeOption): boolean {
  return Boolean(
    option.abilities.some(
      (ability) => ability.effect || ability.declare || ability.timing,
    ) ||
      option.weapons.length ||
      option.stats ||
      option.statAdds,
  );
}

function OptionRules({ option }: { option: AnvilForgeOption }) {
  const adds = option.statAdds;
  const stats = option.stats;
  const bits = [
    stats?.move ? `Move ${stats.move}` : "",
    stats?.health ? `Health ${stats.health}` : "",
    stats?.save ? `Save ${stats.save}` : "",
    adds?.move ? `+${adds.move} Move` : "",
    adds?.health ? `+${adds.health} Health` : "",
    adds?.control ? `+${adds.control} Control` : "",
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-2 text-sm">
      {bits.length ? (
        <p className="text-sheet-muted">{bits.join(" · ")}</p>
      ) : null}
      {option.weapons.map((weapon) => (
        <p key={weapon.name} className="text-sheet-muted">
          {weapon.kind === "ranged" ? "Shoot" : "Melee"} · {weapon.name}
          {weapon.range ? ` · ${weapon.range}` : ""}
          {weapon.ability ? ` · ${weapon.ability}` : ""}
        </p>
      ))}
      {option.abilities.map((ability) => (
        <div key={ability.name}>
          {ability.timing ? (
            <p className="font-serif text-base leading-snug text-parchment-ink/80">
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
        </div>
      ))}
    </div>
  );
}

function ForgeOpenMark() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-aether"
    >
      <path
        d="M8 5l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
