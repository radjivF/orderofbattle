"use client";

import type { ArmyList, FactionCatalogue, ManifestationModel } from "@/engine/types";
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
import { manifestationStatLine } from "@/engine/queries";
import { castValueLabel } from "@/lib/abilityUi";
import { RuleText } from "./RuleText";
import { PlaySlotRow } from "./ios/SheetIconButton";

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
  if (picks.length === 0) {
    return null;
  }
  if (playMode && learned.length === 0) {
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
            Pick each spell you have learned. You do not take a whole lore.
          </p>
        ) : null}
      </header>
      {playMode ? (
        <ul className="flex flex-col gap-3">
          {learned.map((item) => (
            <li key={item.key}>
              <p className="font-serif text-lg leading-tight">
                {item.power.name}
              </p>
              <p className="mt-0.5 text-xs tracking-wide uppercase text-aether">
                {item.loreName}
              </p>
              {item.power.effect ? (
                <RuleText
                  text={item.power.effect}
                  label="Effect · "
                  className="mt-2 text-sm"
                />
              ) : null}
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
  if (picks.length === 0) {
    return null;
  }
  if (playMode && learned.length === 0) {
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
            Pick each manifestation you can summon. You do not take a whole lore.
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
    <ul className="flex flex-col gap-4">
      {groups.map((group) => (
        <li key={group.loreName}>
          <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            {group.loreName}
          </p>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <li key={item.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 ring-1 transition ${
                      checked
                        ? "bg-aether/15 ring-aether/40"
                        : "bg-parchment-ink/5 ring-parchment-ink/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(item.id)}
                      aria-label={item.name}
                      className="mt-0.5 size-5 shrink-0 accent-aether"
                    />
                    <span className="min-w-0 flex-1">
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
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
