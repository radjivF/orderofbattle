"use client";

import { listTowFactions, listTowJournals } from "@/engine/tow/queries";
import type { TowFactionCatalogue } from "@/engine/tow/types";
import { SHEET_HEADER_CLASS, SHEET_PANEL_CLASS } from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { PointsCapField } from "./PointsCapField";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { SheetFormActions } from "./SheetFormActions";

type Props = {
  open: boolean;
  creating: boolean;
  draftFaction: TowFactionCatalogue | null;
  draftName: string;
  draftPoints: number;
  onClose: () => void;
  onCreate: () => void;
  onDraftNameChange: (name: string) => void;
  onDraftPointsChange: (points: number) => void;
  onSelectFaction: (faction: TowFactionCatalogue) => void;
  onBackToFactions: () => void;
};

export function TowCreateSheet({
  open,
  creating,
  draftFaction,
  draftName,
  draftPoints,
  onClose,
  onCreate,
  onDraftNameChange,
  onDraftPointsChange,
  onSelectFaction,
  onBackToFactions,
}: Props) {
  if (!open) {
    return null;
  }

  const journals = listTowJournals();

  return (
    <ModalFrame
      label="New list"
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <h2 className="font-serif text-2xl">
          {draftFaction ? "Create new list" : "Choose a faction"}
        </h2>
        <SheetCloseButton label="Close picker" onClick={onClose} />
      </div>

      {draftFaction ? (
        <div className="modal-sheet-scroll flex flex-col gap-4 overflow-y-auto px-5 pb-6">
          <p className="text-base text-sheet-muted">{draftFaction.name}</p>
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
              placeholder={`My ${draftFaction.name}`}
              className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
            />
          </label>
          <PointsCapField
            value={draftPoints}
            onChange={onDraftPointsChange}
            variant="parchment"
          />
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
        <div className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
          <ul>
            {listTowFactions().map((faction) => (
              <li key={faction.id}>
                <button
                  type="button"
                  onClick={() => onSelectFaction(faction)}
                  className="flex min-h-12 w-full items-center rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
                >
                  <span className="min-w-0 font-serif text-xl text-parchment-ink">
                    {faction.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {journals.length > 0 ? (
            <div className="mt-4">
              <h3 className="px-3 pb-2 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                Arcane Journals
              </h3>
              <ul>
                {journals.map((faction) => (
                  <li key={faction.id}>
                    <button
                      type="button"
                      onClick={() => onSelectFaction(faction)}
                      className="flex min-h-12 w-full items-center rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
                    >
                      <span className="min-w-0 font-serif text-xl text-parchment-ink">
                        {faction.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </ModalFrame>
  );
}
