"use client";

import { unitSizeLabel } from "@/engine/queries";
import type { CatalogueUnit, UnitAbility } from "@/engine/types";
import { SHEET_PANEL_CLASS, SHEET_HEADER_CLASS } from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton, SheetLinkButton } from "./ios/SheetIconButton";

const pickerPanel = `${SHEET_PANEL_CLASS} bg-parchment shadow-2xl`;

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
  const troops = units.filter((unit) => !unit.hero);
  const heroes = units.filter((unit) => unit.hero);

  return (
    <ModalFrame label={title} onClose={onClose} panelClassName={pickerPanel}>
        <div className={SHEET_HEADER_CLASS}>
          <h2 className="font-serif text-2xl">{title}</h2>
          <SheetCloseButton onClick={onClose} />
        </div>
        <div className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
          {units.length === 0 ? (
            <p className="px-2 py-6 text-parchment-ink/70">
              Nothing legal for this slot.
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
        <p className="mt-1 text-sm leading-relaxed">
          <span className="text-sheet-muted">Declare · </span>
          {ability.declare}
        </p>
      ) : null}
      {ability.effect ? (
        <p className="mt-1 text-sm leading-relaxed">
          <span className="text-sheet-muted">Effect · </span>
          {ability.effect}
        </p>
      ) : null}
    </div>
  );
}
