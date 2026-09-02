"use client";

import { useState } from "react";
import { formatPoints } from "@/engine/pointsCap";
import {
  findTowMagicItem,
  getTowUnit,
  towCharacterCanJoinUnits,
  towProfileLine,
} from "@/engine/tow/queries";
import type {
  TowCatalogueUnit,
  TowFactionCatalogue,
  TowList,
  TowOptionGroup,
  TowSelection,
} from "@/engine/tow/types";
import { selectionPoints, towPlayTrack } from "@/engine/tow/validate";
import { BUILDER_ADD_ACTION_EMPHASIS_CLASS } from "@/lib/builderUi";
import { PlayHealthTrack } from "./PlayHealthTrack";
import {
  EDIT_LINK_BUTTON_COMPACT_CLASS,
  EditLinkButton,
  IosDatasheetIcon,
  IosPlusIcon,
  SHEET_LINK_BUTTON_CLASS,
} from "./ios/SheetIconButton";

const SHEET_LINK_ICON_WRAP_CLASS =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center text-aether";

type Mutators = {
  onModels: (selectionId: string, models: number) => void;
  onCommand: (selectionId: string, commandId: string) => void;
  onOption: (
    selectionId: string,
    optionId: string,
    groupOptionIds: string[],
  ) => void;
  onGeneral: (selectionId: string) => void;
  onJoin: (selectionId: string) => void;
  onMagicItems: (selectionId: string) => void;
  onForge: (selectionId: string) => void;
  onAddDetachment: (selectionId: string) => void;
  onRemove: (selectionId: string) => void;
  onPlayDamage: (selectionId: string, damage: number) => void;
  onOpenDatasheet: (unit: TowCatalogueUnit) => void;
};

type Props = {
  list: TowList;
  faction: TowFactionCatalogue;
  selection: TowSelection;
  playMode: boolean;
  nested?: boolean;
} & Mutators;

export function TowUnitCard({
  list,
  faction,
  selection,
  playMode,
  nested = false,
  ...mutators
}: Props) {
  const unit = getTowUnit(faction, selection.unitId);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  if (!unit) {
    return null;
  }
  const points = selectionPoints(selection, list.factionId);
  const track = towPlayTrack(selection, list.factionId);
  const isGeneral = list.generalSelectionId === selection.id;
  const joined = selection.joinSelectionId
    ? list.selections.find((item) => item.id === selection.joinSelectionId)
    : undefined;
  const joinedUnit = joined ? getTowUnit(faction, joined.unitId) : undefined;
  const profile = towProfileLine(unit.stats);
  const showModelStepper = !playMode && unit.maxModels > 1;
  const headerMeta = playMode
    ? profile
    : `${profile} · ${formatPoints(points)} pts`;
  const canJoin = towCharacterCanJoinUnits(unit);
  const magicLabels = (selection.magicItemIds ?? [])
    .map((id) => findTowMagicItem(id)?.name)
    .filter(Boolean);
  const forgeLabels = [
    ...selection.commandIds
      .map((id) => unit.command.find((item) => item.id === id)?.name)
      .filter(Boolean),
    ...selection.optionIds.flatMap((id) =>
      unit.optionGroups.flatMap((group) =>
        group.options
          .filter((option) => option.id === id)
          .map((option) => option.name),
      ),
    ),
    ...magicLabels,
  ];
  const showOptions = !playMode && optionsOpen;

  return (
    <article
      className={`rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm ${
        nested ? "ml-4" : ""
      }`}
    >
      <header
        className={`flex flex-col gap-1 ${
          showOptions || playMode ? "mb-3" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {unit.character ? (
              isGeneral ? (
                <p className="text-sm font-semibold tracking-wide uppercase text-aether">
                  General
                </p>
              ) : playMode ? (
                <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                  Character
                </p>
              ) : (
                <button
                  type="button"
                  className="min-h-11 text-sm font-semibold tracking-wide uppercase text-sheet-muted"
                  onClick={() => mutators.onGeneral(selection.id)}
                >
                  Make general
                </button>
              )
            ) : (
              <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                {unit.category === "core"
                  ? "Core"
                  : unit.category === "special"
                    ? "Special"
                    : "Rare"}
              </p>
            )}
          </div>
          {playMode ? (
            <PlayHealthTrack
              aside
              track={track}
              onChange={(damage) =>
                mutators.onPlayDamage(selection.id, damage)
              }
            />
          ) : null}
        </div>

        {playMode ? (
          <button
            type="button"
            aria-label={`${unit.name} datasheet`}
            className="flex max-w-full min-w-0 items-start gap-0 text-left active:opacity-60"
            onClick={() => mutators.onOpenDatasheet(unit)}
          >
            <span className={SHEET_LINK_ICON_WRAP_CLASS}>
              <IosDatasheetIcon />
            </span>
            <span className="min-w-0 py-2 pr-2">
              <h3 className="font-serif text-2xl leading-tight">{unit.name}</h3>
              <span className="mt-0.5 block text-sm text-sheet-muted">
                {headerMeta}
              </span>
            </span>
          </button>
        ) : (
          <div className="flex min-w-0 items-start gap-1">
            <button
              type="button"
              aria-label={`${unit.name} datasheet`}
              className={`${SHEET_LINK_BUTTON_CLASS} text-aether`}
              onClick={() => mutators.onOpenDatasheet(unit)}
            >
              <IosDatasheetIcon />
            </button>
            <button
              type="button"
              aria-expanded={optionsOpen}
              aria-label={
                optionsOpen
                  ? `Collapse ${unit.name}`
                  : `Expand ${unit.name}`
              }
              className="min-w-0 flex-1 py-1.5 text-left"
              onClick={() => {
                setOptionsOpen((open) => !open);
                setConfirmRemove(false);
              }}
            >
              <h3 className="font-serif text-2xl leading-tight">{unit.name}</h3>
              <span className="mt-0.5 block text-sm tabular-nums text-sheet-muted">
                {headerMeta}
              </span>
            </button>
            {showModelStepper ? (
              <div className="flex shrink-0 items-center gap-0.5 self-center rounded-full bg-parchment-ink/5 py-1 pl-1 pr-1">
                <button
                  type="button"
                  aria-label={`Fewer ${unit.name}`}
                  disabled={selection.models <= unit.minModels}
                  onClick={() =>
                    mutators.onModels(selection.id, selection.models - 1)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base leading-none text-parchment-ink disabled:opacity-30"
                >
                  −
                </button>
                <span
                  aria-label={`${unit.name} models`}
                  className="min-w-10 px-1 text-center text-base font-semibold tabular-nums text-parchment-ink"
                >
                  {selection.models}
                </span>
                <button
                  type="button"
                  aria-label={`More ${unit.name}`}
                  disabled={selection.models >= unit.maxModels}
                  onClick={() =>
                    mutators.onModels(selection.id, selection.models + 1)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base leading-none text-parchment-ink disabled:opacity-30"
                >
                  +
                </button>
              </div>
            ) : null}
          </div>
        )}
      </header>

      {showOptions ? (
        <div className="mt-3 flex flex-col gap-1.5">
          {unit.character ? (
            <>
              <OptionPickRow
                kind="Equip"
                label={
                  forgeLabels.length > 0
                    ? forgeLabels.join(", ")
                    : undefined
                }
                onPick={() => mutators.onForge(selection.id)}
              />
              {canJoin ? (
                <OptionPickRow
                  kind="Join"
                  label={joinedUnit?.name}
                  onPick={() => mutators.onJoin(selection.id)}
                />
              ) : null}
            </>
          ) : (
            <>
              {unit.command.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {unit.command.map((item) => (
                    <label
                      key={item.id}
                      className="flex min-h-11 items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selection.commandIds.includes(item.id)}
                        onChange={() =>
                          mutators.onCommand(selection.id, item.id)
                        }
                        className="size-5 accent-aether"
                      />
                      <span>{item.name}</span>
                      <span className="text-sheet-muted">+{item.points}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              {unit.optionGroups.map((group) => (
                <OptionGroupSelect
                  key={group.id}
                  group={group}
                  selectedId={
                    group.options.find((option) =>
                      selection.optionIds.includes(option.id),
                    )?.id ?? ""
                  }
                  onChange={(optionId) => {
                    const groupIds = group.options.map((item) => item.id);
                    const current = group.options.find((option) =>
                      selection.optionIds.includes(option.id),
                    );
                    if (!optionId) {
                      if (current) {
                        mutators.onOption(selection.id, current.id, groupIds);
                      }
                      return;
                    }
                    if (optionId !== current?.id) {
                      mutators.onOption(selection.id, optionId, groupIds);
                    }
                  }}
                />
              ))}
            </>
          )}

          {unit.canTakeDetachments && selection.detachments.length < 2 ? (
            <button
              type="button"
              onClick={() => mutators.onAddDetachment(selection.id)}
              className={BUILDER_ADD_ACTION_EMPHASIS_CLASS}
            >
              + Detachment
            </button>
          ) : null}

          {confirmRemove ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <button
                type="button"
                aria-label={`Confirm remove ${unit.name}`}
                onClick={() => mutators.onRemove(selection.id)}
                className="min-h-11 text-sm font-semibold text-illegal"
              >
                Confirm remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="min-h-11 text-sm text-sheet-muted"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={`Remove ${unit.name}`}
              onClick={() => setConfirmRemove(true)}
              className="mt-1 min-h-11 self-start text-sm text-illegal underline-offset-2 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ) : null}

      {selection.detachments.map((child) => (
        <div key={child.id} className="mt-3">
          <TowUnitCard
            list={list}
            faction={faction}
            selection={child}
            playMode={playMode}
            nested
            {...mutators}
          />
        </div>
      ))}
    </article>
  );
}

function OptionGroupSelect({
  group,
  selectedId,
  onChange,
}: {
  group: TowOptionGroup;
  selectedId: string;
  onChange: (optionId: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-sheet-muted">
      {group.name}
      <select
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 text-parchment-ink"
      >
        <option value="">None</option>
        {group.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} +{option.points}
          </option>
        ))}
      </select>
    </label>
  );
}

function OptionPickRow({
  kind,
  label,
  onPick,
}: {
  kind: string;
  label?: string;
  onPick: () => void;
}) {
  if (label) {
    return (
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left text-sm text-sheet-muted"
          onClick={onPick}
        >
          {kind} · {label}
        </button>
        <EditLinkButton
          label={`Change ${kind}`}
          className={EDIT_LINK_BUTTON_COMPACT_CLASS}
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="flex min-h-9 w-fit items-center gap-2.5 text-left text-sm text-sheet-muted"
      onClick={onPick}
    >
      <IosPlusIcon className="h-4 w-4 shrink-0 opacity-70" />
      <span>{kind}</span>
    </button>
  );
}
