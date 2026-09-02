"use client";

import { useState } from "react";
import { formatPoints } from "@/engine/pointsCap";
import { getTowMagicItems } from "@/engine/tow/queries";
import {
  SHEET_HEADER_CLASS,
  SHEET_PANEL_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { SheetFormActions } from "./SheetFormActions";

type Props = {
  selectedIds: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
};

export function TowMagicItemsSheet({ selectedIds, onClose, onSave }: Props) {
  const catalogue = getTowMagicItems();
  const [draft, setDraft] = useState(() => [...selectedIds]);
  const [categoryId, setCategoryId] = useState(
    catalogue.categories[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");

  const category =
    catalogue.categories.find((item) => item.id === categoryId) ??
    catalogue.categories[0];

  const options = category?.options ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((option) => option.name.toLowerCase().includes(needle))
    : options;

  const total = draft.reduce((sum, id) => {
    for (const group of catalogue.categories) {
      const item = group.options.find((option) => option.id === id);
      if (item) {
        return sum + item.points;
      }
    }
    return sum;
  }, 0);

  function toggle(id: string) {
    setDraft((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <ModalFrame
      label="Magic Items"
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl">Magic Items</h2>
          <p className="text-sm text-sheet-muted">
            {draft.length} selected · {formatPoints(total)} pts
          </p>
        </div>
        <SheetCloseButton label="Close Magic Items" onClick={onClose} />
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-2">
        {catalogue.categories.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === category?.id}
            onClick={() => setCategoryId(item.id)}
            className={`min-h-10 shrink-0 rounded-full px-3 text-sm ${
              item.id === category?.id
                ? "bg-parchment-ink text-parchment"
                : "bg-parchment-ink/5 text-sheet-muted"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="px-5 pb-2">
        <label className="sr-only" htmlFor="tow-magic-search">
          Search magic items
        </label>
        <input
          id="tow-magic-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 text-parchment-ink outline-none"
        />
      </div>

      <ul className="modal-sheet-scroll overflow-y-auto px-3 pb-4">
        {filtered.map((option) => {
          const checked = draft.includes(option.id);
          return (
            <li key={option.id}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-parchment-ink/5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.id)}
                  className="size-5 accent-aether"
                />
                <span className="min-w-0 flex-1 font-serif text-lg">
                  {option.name}
                </span>
                <span className="tabular-nums text-sheet-muted">
                  +{option.points}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 border-t border-parchment-ink/10 px-5 py-3">
        <SheetFormActions
          primaryLabel="Done"
          onPrimary={() => onSave(draft)}
          secondaryLabel="Cancel"
          onSecondary={onClose}
        />
      </div>
    </ModalFrame>
  );
}
