"use client";

import { getTowUnit, towUnitsInCategory } from "@/engine/tow/queries";
import type {
  TowCategory,
  TowFactionCatalogue,
} from "@/engine/tow/types";
import { SHEET_HEADER_CLASS, SHEET_PANEL_CLASS } from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";

type Props = {
  faction: TowFactionCatalogue;
  category: TowCategory;
  title: string;
  onClose: () => void;
  onPick: (unitId: string) => void;
};

export function TowAddUnitSheet({
  faction,
  category,
  title,
  onClose,
  onPick,
}: Props) {
  const units = towUnitsInCategory(faction, category).filter((unit) =>
    category === "characters" ? unit.character : !unit.character,
  );

  return (
    <ModalFrame
      label={title}
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <h2 className="font-serif text-2xl">{title}</h2>
        <SheetCloseButton label="Close picker" onClick={onClose} />
      </div>
      <ul className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
        {units.map((unit) => (
          <li key={unit.id}>
            <button
              type="button"
              aria-label={unit.name}
              onClick={() => onPick(unit.id)}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
            >
              <span className="min-w-0 font-serif text-xl text-parchment-ink">
                {unit.name}
              </span>
              <span className="shrink-0 text-sm text-sheet-muted">
                {unit.pointsPerModel} pts
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ModalFrame>
  );
}

export function TowJoinSheet({
  faction,
  options,
  onClose,
  onPick,
}: {
  faction: TowFactionCatalogue;
  options: { id: string; unitId: string; models: number }[];
  onClose: () => void;
  onPick: (selectionId: string | null) => void;
}) {
  return (
    <ModalFrame
      label="Join unit"
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <h2 className="font-serif text-2xl">Join unit</h2>
        <SheetCloseButton label="Close picker" onClick={onClose} />
      </div>
      <ul className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
        <li>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="flex min-h-12 w-full items-center rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
          >
            <span className="font-serif text-xl text-parchment-ink">
              Leave unit
            </span>
          </button>
        </li>
        {options.map((option) => {
          const unit = getTowUnit(faction, option.unitId);
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onPick(option.id)}
                className="flex min-h-12 w-full items-center rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
              >
                <span className="font-serif text-xl text-parchment-ink">
                  {option.models} {unit?.name ?? option.unitId}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ModalFrame>
  );
}
