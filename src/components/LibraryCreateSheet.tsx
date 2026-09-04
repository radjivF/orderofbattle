"use client";

import {
  armyOfRenownName,
  loadFaction,
} from "@/engine/queries";
import type { FactionCatalogue } from "@/engine/types";
import { listFactionsByGrandAlliance } from "@/lib/factionAlliance";
import {
  encodeNewListArmyValue,
  newListArmySelectGroups,
  newListArmySelectHasExtras,
} from "@/lib/newListArmyOptions";
import { SHEET_HEADER_CLASS, SHEET_PANEL_CLASS } from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { PointsCapField } from "./PointsCapField";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { SheetFormActions } from "./SheetFormActions";

type Props = {
  open: boolean;
  creating: boolean;
  draftFaction: FactionCatalogue | null;
  draftParent: FactionCatalogue | null;
  draftName: string;
  draftPoints: number;
  draftMode: "points" | "spearhead";
  draftSpearheadId: string | null;
  createCounts: { heroes: number; units: number } | null;
  onClose: () => void;
  onCreate: () => void;
  onDraftNameChange: (name: string) => void;
  onDraftPointsChange: (points: number) => void;
  onSelectFaction: (faction: FactionCatalogue) => void;
  onArmyChange: (value: string) => void;
  onBackToFactions: () => void;
};

export function LibraryCreateSheet({
  open,
  creating,
  draftFaction,
  draftParent,
  draftName,
  draftPoints,
  draftMode,
  draftSpearheadId,
  createCounts,
  onClose,
  onCreate,
  onDraftNameChange,
  onDraftPointsChange,
  onSelectFaction,
  onArmyChange,
  onBackToFactions,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <ModalFrame
      label="New list"
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="font-serif text-2xl">
            {draftFaction ? "Create new list" : "Choose a faction"}
          </h2>
          {createCounts ? (
            <p className="shrink-0 text-xs leading-snug text-sheet-muted sm:text-sm">
              {createCounts.heroes} heroes · {createCounts.units} units
            </p>
          ) : null}
        </div>
        <SheetCloseButton label="Close picker" onClick={onClose} />
      </div>

      {draftFaction ? (
        <div className="modal-sheet-scroll flex flex-col gap-4 overflow-y-auto px-5 pb-6">
          <p className="text-base text-sheet-muted">
            {(draftParent ?? draftFaction).name}
          </p>
          {draftParent && newListArmySelectHasExtras(draftParent.id) ? (
            <label className="flex flex-col gap-2 text-base text-sheet-muted">
              Army
              <select
                value={
                  draftMode === "spearhead" && draftSpearheadId
                    ? encodeNewListArmyValue({
                        kind: "spearhead",
                        spearheadId: draftSpearheadId,
                      })
                    : draftFaction.id
                }
                onChange={(event) => onArmyChange(event.target.value)}
                className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink"
              >
                {newListArmySelectGroups(draftParent.id).map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-2 text-base text-sheet-muted">
            List name
            <input
              autoFocus
              value={draftName}
              onChange={(event) => onDraftNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void onCreate();
                }
              }}
              placeholder={`My ${armyOfRenownName(draftFaction)}`}
              className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
            />
          </label>
          {draftMode === "spearhead" ? null : (
            <PointsCapField
              value={draftPoints}
              onChange={onDraftPointsChange}
              variant="parchment"
            />
          )}
          <SheetFormActions
            primaryLabel={creating ? "Creating…" : "Create"}
            onPrimary={() => void onCreate()}
            secondaryLabel="Back"
            onSecondary={onBackToFactions}
            primaryDisabled={creating}
            secondaryDisabled={creating}
          />
        </div>
      ) : (
        <ul className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
          {listFactionsByGrandAlliance().map((group, groupIndex) => (
            <li key={group.alliance} className="list-none">
              <p
                className={`px-3 pb-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted ${
                  groupIndex === 0 ? "pt-1" : "pt-4"
                }`}
              >
                {group.label}
              </p>
              <ul className="flex flex-col">
                {group.factions.map((factionMeta) => (
                  <li key={factionMeta.id}>
                    <button
                      type="button"
                      onClick={async () => {
                        const loaded = await loadFaction(factionMeta.id);
                        if (loaded) {
                          onSelectFaction(loaded);
                        }
                      }}
                      className="flex min-h-12 w-full items-center rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
                    >
                      <span className="min-w-0 font-serif text-xl text-parchment-ink">
                        {factionMeta.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </ModalFrame>
  );
}
