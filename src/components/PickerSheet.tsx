"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { unitSizeLabel } from "@/engine/queries";
import type { CatalogueUnit, UnitAbility } from "@/engine/types";
import { SHEET_HEADER_CLASS, SHEET_PANEL_CLASS } from "@/lib/builderUi";
import {
  filterPickerUnits,
  PICKER_SEARCH_MIN_UNITS,
  PICKER_SEARCH_TOGGLE_CLASS,
  PICKER_SHEET_HEADER_CLASS,
} from "@/lib/pickerUi";
import { ModalFrame } from "./ModalFrame";
import { RuleText } from "./RuleText";
import {
  IosSearchIcon,
  SheetCloseButton,
  SheetLinkButton,
} from "./ios/SheetIconButton";

const pickerPanel = `${SHEET_PANEL_CLASS} min-h-[55vh] bg-parchment shadow-2xl`;

type Props = {
  title: string;
  units: CatalogueUnit[];
  onPick: (unit: CatalogueUnit) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
  onClose: () => void;
};

export function PickerSheet({
  title,
  units,
  onPick,
  onOpenDatasheet,
  onClose,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const showSearch = units.length >= PICKER_SEARCH_MIN_UNITS;
  const visibleUnits = useMemo(
    () => filterPickerUnits(units, searchQuery),
    [units, searchQuery],
  );
  const troops = visibleUnits.filter((unit) => !unit.hero);
  const heroes = visibleUnits.filter((unit) => unit.hero);

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  function toggleSearch() {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery("");
      }
      return !open;
    });
  }

  return (
    <ModalFrame label={title} onClose={onClose} panelClassName={pickerPanel}>
        <div className={PICKER_SHEET_HEADER_CLASS}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {showSearch && !searchOpen ? (
              <button
                type="button"
                aria-label="Search units"
                onClick={toggleSearch}
                className={PICKER_SEARCH_TOGGLE_CLASS}
              >
                <IosSearchIcon className="h-5 w-5" />
              </button>
            ) : null}
            {searchOpen ? (
              <>
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Filter units…"
                  aria-label="Filter units"
                  className="h-9 min-w-0 flex-1 rounded-lg bg-parchment-ink/5 px-3 text-sm text-parchment-ink outline-none ring-1 ring-parchment-ink/10 placeholder:text-sheet-muted/70"
                />
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="pressable shrink-0 text-sm font-medium text-sheet-muted"
                >
                  Cancel
                </button>
              </>
            ) : (
              <h2 className="min-w-0 font-serif text-2xl leading-tight">{title}</h2>
            )}
          </div>
          <SheetCloseButton label="Close picker" onClick={onClose} />
        </div>
        <div className="modal-sheet-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6">
          {units.length === 0 ? (
            <p className="px-2 py-6 text-parchment-ink/70">
              Nothing legal for this slot.
            </p>
          ) : visibleUnits.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sheet-muted">
              No units match &ldquo;{searchQuery.trim()}&rdquo;.
            </p>
          ) : (
            <>
              {troops.length > 0 ? (
                <ul className="flex flex-col">
                  {troops.map((unit) => (
                    <PickerRow
                      key={unit.id}
                      unit={unit}
                      onPick={onPick}
                      onOpenDatasheet={onOpenDatasheet}
                    />
                  ))}
                </ul>
              ) : null}
              {heroes.length > 0 ? (
                <>
                  <p className="px-2 pt-4 pb-1 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                    Heroes
                  </p>
                  <ul className="flex flex-col">
                    {heroes.map((unit) => (
                      <PickerRow
                        key={unit.id}
                        unit={unit}
                        onPick={onPick}
                        onOpenDatasheet={onOpenDatasheet}
                      />
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </div>
    </ModalFrame>
  );
}

function PickerRow({
  unit,
  onPick,
  onOpenDatasheet,
}: {
  unit: CatalogueUnit;
  onPick: (unit: CatalogueUnit) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
}) {
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPick(unit)}
        className="flex min-h-11 flex-1 items-center justify-between gap-4 rounded-lg px-3 py-2 text-left hover:bg-parchment-ink/5"
      >
        <span>
          <span className="block font-serif text-lg leading-tight">
            {unit.name}
          </span>
          <span className="mt-0.5 block text-xs text-sheet-muted">
            {unitSizeLabel(unit)}
            {unit.unique ? " · Unique" : ""}
            {unit.reinforce ? " · can reinforce" : ""}
          </span>
        </span>
        <span className="font-medium text-sigmarite">{unit.points}</span>
      </button>
      <SheetLinkButton
        label={`${unit.name} datasheet`}
        onClick={() => onOpenDatasheet(unit)}
      />
    </li>
  );
}

export type NamedChoice = {
  id: string;
  name: string;
  detail?: string;
  abilities?: UnitAbility[];
};

export function ChoiceSheet({
  title,
  options,
  selectedId,
  onPick,
  onClose,
}: {
  title: string;
  options: NamedChoice[];
  selectedId?: string | null;
  onPick: (option: NamedChoice | null) => void;
  onClose: () => void;
}) {
  return (
    <ModalFrame label={title} onClose={onClose} panelClassName={pickerPanel}>
        <div className={SHEET_HEADER_CLASS}>
          <h2 className="font-serif text-2xl">{title}</h2>
          <SheetCloseButton onClick={onClose} />
        </div>
        <div className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
          <button
            type="button"
            onClick={() => onPick(null)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-parchment-ink/5 ${
              !selectedId
                ? "bg-aether/10 ring-1 ring-aether/40"
                : "text-sheet-muted"
            }`}
          >
            <ChoiceMark checked={!selectedId} />
            <span className={!selectedId ? "text-aether" : undefined}>
              None
            </span>
          </button>
          <ul className="mt-1 flex flex-col gap-2">
            {options.map((option) => {
              const selected = selectedId === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => onPick(option)}
                    aria-pressed={selected}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-parchment-ink/5 ${
                      selected
                        ? "bg-aether/10 ring-1 ring-aether/40"
                        : ""
                    }`}
                  >
                    <ChoiceMark checked={selected} className="mt-1" />
                    <span className="min-w-0 flex-1">
                      <p
                        className={`font-serif text-lg leading-tight ${
                          selected ? "text-aether" : ""
                        }`}
                      >
                        {option.name}
                      </p>
                      {option.detail ? (
                        <p className="mt-0.5 text-sm text-sigmarite">
                          {option.detail}
                        </p>
                      ) : null}
                      {(option.abilities ?? []).map((ability) => (
                        <AbilityBlurb key={ability.name} ability={ability} />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
    </ModalFrame>
  );
}

function ChoiceMark({
  checked,
  className = "",
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
        checked
          ? "border-aether bg-aether text-ink"
          : "border-parchment-ink/25 bg-transparent"
      } ${className}`}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-current">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

function AbilityBlurb({ ability }: { ability: UnitAbility }) {
  return (
    <div className="mt-2 text-parchment-ink/75">
      {ability.timing ? (
        <p className="font-serif text-base leading-snug text-parchment-ink">
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
  );
}
