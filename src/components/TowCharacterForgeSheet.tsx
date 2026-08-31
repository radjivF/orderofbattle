"use client";

import { useState } from "react";
import { formatPoints } from "@/engine/pointsCap";
import {
  findTowMagicItem,
  towProfileLine,
} from "@/engine/tow/queries";
import type {
  TowCatalogueUnit,
  TowNamedOption,
  TowOptionGroup,
  TowSelection,
} from "@/engine/tow/types";
import {
  SHEET_HEADER_CLASS,
  SHEET_PANEL_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { SheetFormActions } from "./SheetFormActions";
import { TowMagicItemsSheet } from "./TowMagicItemsSheet";

type Loadout = {
  optionIds: string[];
  commandIds: string[];
  magicItemIds: string[];
};

type Props = {
  unit: TowCatalogueUnit;
  selection: TowSelection;
  onClose: () => void;
  onSave: (loadout: Loadout) => void;
};

export function TowCharacterForgeSheet({
  unit,
  selection,
  onClose,
  onSave,
}: Props) {
  const [optionIds, setOptionIds] = useState(() => [...selection.optionIds]);
  const [commandIds, setCommandIds] = useState(() => [
    ...selection.commandIds,
  ]);
  const [magicItemIds, setMagicItemIds] = useState(() => [
    ...(selection.magicItemIds ?? []),
  ]);
  const [magicOpen, setMagicOpen] = useState(false);

  const optionPoints = unit.optionGroups.reduce((sum, group) => {
    const pick = group.options.find((option) => optionIds.includes(option.id));
    return sum + (pick?.points ?? 0);
  }, 0);
  const commandPoints = unit.command.reduce((sum, item) => {
    return sum + (commandIds.includes(item.id) ? item.points : 0);
  }, 0);
  const magicPoints = magicItemIds.reduce(
    (sum, id) => sum + (findTowMagicItem(id)?.points ?? 0),
    0,
  );
  const total =
    unit.pointsPerModel * selection.models +
    optionPoints +
    commandPoints +
    magicPoints;

  function pickOption(group: TowOptionGroup, optionId: string) {
    const groupIds = group.options.map((item) => item.id);
    setOptionIds((current) => {
      const without = current.filter((id) => !groupIds.includes(id));
      return optionId ? [...without, optionId] : without;
    });
  }

  function toggleCommand(commandId: string) {
    setCommandIds((current) =>
      current.includes(commandId)
        ? current.filter((id) => id !== commandId)
        : [...current, commandId],
    );
  }

  const magicLabels = magicItemIds
    .map((id) => findTowMagicItem(id)?.name)
    .filter(Boolean);

  if (magicOpen) {
    return (
      <TowMagicItemsSheet
        selectedIds={magicItemIds}
        onClose={() => setMagicOpen(false)}
        onSave={(ids) => {
          setMagicItemIds(ids);
          setMagicOpen(false);
        }}
      />
    );
  }

  return (
    <ModalFrame
      label={`${unit.name} forge`}
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl">{unit.name}</h2>
          <p className="text-sm text-sheet-muted">
            Equip · {formatPoints(total)} pts
          </p>
        </div>
        <SheetCloseButton label="Close forge" onClick={onClose} />
      </div>

      <div className="modal-sheet-scroll flex flex-col gap-5 overflow-y-auto px-5 pb-4">
        <section className="rounded-xl bg-parchment-ink/5 px-3 py-3">
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            Rider
          </p>
          <p className="mt-1 font-serif text-lg">{unit.name}</p>
          <p className="mt-1 text-sm text-sheet-muted">
            {towProfileLine(unit.stats)}
          </p>
        </section>

        {unit.command.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="font-serif text-lg">Command</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {unit.command.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-11 items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={commandIds.includes(item.id)}
                    onChange={() => toggleCommand(item.id)}
                    className="size-5 accent-aether"
                  />
                  <span>{item.name}</span>
                  <span className="text-sheet-muted">+{item.points}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {unit.optionGroups.map((group) => (
          <ForgeOptionGroup
            key={group.id}
            group={group}
            selectedId={
              group.options.find((option) => optionIds.includes(option.id))
                ?.id ?? ""
            }
            onPick={(optionId) => pickOption(group, optionId)}
          />
        ))}

        {unit.magicItems ? (
          <section className="flex flex-col gap-2">
            <h3 className="font-serif text-lg">Magic Items</h3>
            <button
              type="button"
              onClick={() => setMagicOpen(true)}
              className="flex min-h-11 w-full items-center justify-between rounded-xl bg-parchment-ink/5 px-3 text-left text-sm"
            >
              <span className="min-w-0 truncate text-parchment-ink">
                {magicLabels.length > 0
                  ? magicLabels.join(", ")
                  : "Choose magic items"}
              </span>
              <span className="shrink-0 text-sheet-muted">
                {magicPoints > 0 ? `+${magicPoints}` : "Open"}
              </span>
            </button>
          </section>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-parchment-ink/10 px-5 py-3">
        <SheetFormActions
          primaryLabel="Done"
          onPrimary={() =>
            onSave({ optionIds, commandIds, magicItemIds })
          }
          secondaryLabel="Cancel"
          onSecondary={onClose}
        />
      </div>
    </ModalFrame>
  );
}

function ForgeOptionGroup({
  group,
  selectedId,
  onPick,
}: {
  group: TowOptionGroup;
  selectedId: string;
  onPick: (optionId: string) => void;
}) {
  const selected = group.options.find((option) => option.id === selectedId);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-serif text-lg">{group.name}</h3>
      <ul className="flex flex-col gap-2">
        <li>
          <ForgeOptionButton
            selected={selectedId === ""}
            title="None"
            onClick={() => onPick("")}
          />
        </li>
        {group.options.map((option) => (
          <li key={option.id}>
            <ForgeOptionButton
              selected={option.id === selectedId}
              title={option.name}
              points={option.points}
              option={option}
              onClick={() => onPick(option.id)}
            />
          </li>
        ))}
      </ul>
      {selected?.stats ? (
        <div className="rounded-xl bg-parchment-ink/5 px-3 py-3">
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            {selected.name} profile
          </p>
          <p className="mt-1 text-sm text-parchment-ink">
            {towProfileLine(selected.stats)}
          </p>
          {selected.specialRules && selected.specialRules.length > 0 ? (
            <p className="mt-2 text-sm text-sheet-muted">
              {selected.specialRules.map((rule) => rule.name).join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ForgeOptionButton({
  selected,
  title,
  points,
  option,
  onClick,
}: {
  selected: boolean;
  title: string;
  points?: number;
  option?: TowNamedOption;
  onClick: () => void;
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const rules = (option?.specialRules ?? []).filter((rule) => rule.text);
  const expandable = rules.length > 0;
  const shell = selected
    ? "bg-parchment-ink text-parchment ring-parchment-ink"
    : "bg-parchment-ink/5 text-parchment-ink ring-transparent";

  return (
    <div className={`overflow-hidden rounded-xl ring-1 ${shell}`}>
      <div className="flex min-h-12 items-stretch">
        <button
          type="button"
          aria-pressed={selected}
          onClick={onClick}
          className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left"
        >
          <span className="flex w-full items-baseline justify-between gap-2">
            <span className="font-serif text-lg leading-tight">{title}</span>
            {points != null ? (
              <span
                className={`shrink-0 tabular-nums text-sm ${
                  selected ? "text-parchment/70" : "text-sheet-muted"
                }`}
              >
                +{points}
              </span>
            ) : null}
          </span>
          {option?.stats ? (
            <span
              className={`text-xs leading-snug ${
                selected ? "text-parchment/75" : "text-sheet-muted"
              }`}
            >
              {towProfileLine(option.stats)}
            </span>
          ) : null}
        </button>
        {expandable ? (
          <button
            type="button"
            aria-expanded={rulesOpen}
            aria-label={`Rules for ${title}`}
            onClick={() => setRulesOpen((open) => !open)}
            className={`flex w-11 shrink-0 items-center justify-center ${
              selected ? "text-parchment/80" : "text-sheet-muted"
            }`}
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-200 ${
                rulesOpen ? "rotate-180" : ""
              }`}
            >
              <path
                d="M5 8l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
      {rulesOpen && expandable ? (
        <div
          className={`space-y-2 border-t px-3 py-2.5 text-sm ${
            selected
              ? "border-parchment/20 text-parchment/90"
              : "border-parchment-ink/10 text-parchment-ink"
          }`}
        >
          {rules.map((rule) => (
            <p key={rule.name}>
              {rule.name !== title ? (
                <span className="font-semibold">{rule.name} · </span>
              ) : null}
              {rule.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
