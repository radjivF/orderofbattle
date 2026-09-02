"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { isTowList } from "@/engine/storedList";
import {
  addTowDetachment,
  addTowUnit,
  removeTowSelection,
  setTowCharacterLoadout,
  setTowGeneral,
  setTowJoin,
  setTowMagicItems,
  setTowModels,
  setTowPlayDamage,
  toggleTowCommand,
  toggleTowOption,
} from "@/engine/tow/listFactories";
import { getTowFaction, getTowUnit } from "@/engine/tow/queries";
import {
  TOW_CATEGORIES,
  type TowCatalogueUnit,
  type TowCategory,
  type TowList,
} from "@/engine/tow/types";
import { towSummarize } from "@/engine/tow/validate";
import {
  BUILDER_ADD_ACTION_EMPHASIS_CLASS,
  LIST_ISSUE_BANNER_CLASS,
  LIST_PANE_ART_CLASS,
  TOW_CATEGORY_HEADING_CLASS,
  TOW_CATEGORY_ROW_CLASS,
} from "@/lib/builderUi";
import { towBackdropFactionId } from "@/lib/factionArt";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  saveArmy,
  subscribeArmies,
} from "@/lib/storage";
import { FactionArtLayers } from "./FactionArtBackground";
import { FactionBackdrop } from "./FactionBackdrop";
import { useListFlowChrome, useListFlowDecor } from "./ListFlowShell";
import { PointsCapField } from "./PointsCapField";
import { TowAddUnitSheet, TowJoinSheet } from "./TowAddUnitSheet";
import { TowCharacterForgeSheet } from "./TowCharacterForgeSheet";
import { TowDatasheetSheet } from "./TowDatasheetSheet";
import { TowMagicItemsSheet } from "./TowMagicItemsSheet";
import { TowUnitCard } from "./TowUnitCard";

const CATEGORY_LABEL: Record<TowCategory, string> = {
  characters: "Characters",
  core: "Core",
  special: "Special",
  rare: "Rare",
};

type Props = {
  listId: string;
};

export function TowBuilderScreen({ listId }: Props) {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const stored = lists?.find((item) => item.id === listId);
  const list = stored && isTowList(stored) ? stored : undefined;
  const faction = list ? getTowFaction(list.factionId) : undefined;
  const [playMode, setPlayMode] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [picker, setPicker] = useState<{
    category: TowCategory;
    parentId?: string;
  } | null>(null);
  const [joinFor, setJoinFor] = useState<string | null>(null);
  const [magicFor, setMagicFor] = useState<string | null>(null);
  const [forgeFor, setForgeFor] = useState<string | null>(null);
  const [datasheet, setDatasheet] = useState<TowCatalogueUnit | null>(null);
  const { setBuilderChrome } = useListFlowChrome();
  const { setDecor } = useListFlowDecor();

  const totals = list ? towSummarize(list) : null;
  const artFactionId = towBackdropFactionId(list?.factionId);

  const commit = useCallback(async (next: TowList) => {
    await saveArmy(next);
  }, []);

  const enterPlay = useCallback(() => setPlayMode(true), []);
  const exitPlay = useCallback(() => setPlayMode(false), []);

  useLayoutEffect(() => {
    if (!list) {
      setBuilderChrome(null);
      return;
    }
    const summary = towSummarize(list);
    const first = summary.issues[0];
    setBuilderChrome({
      list: { name: list.name },
      playMode,
      enterPlay,
      exitPlay,
      onListNameChange: (name) => void commit({ ...list, name }),
      points: summary.points,
      pointsCap: list.pointsCap,
      drops: 0,
      issue: {
        text: first?.text ?? "",
        tone: first?.tone ?? "ok",
      },
      hideDrops: true,
    });
    return () => setBuilderChrome(null);
  }, [commit, enterPlay, exitPlay, list, playMode, setBuilderChrome]);

  useLayoutEffect(() => {
    setDecor({
      backdrop: artFactionId ? (
        <div className={LIST_PANE_ART_CLASS} aria-hidden="true">
          <FactionArtLayers factionId={artFactionId} scrim />
        </div>
      ) : undefined,
    });
    return () => setDecor({});
  }, [artFactionId, setDecor]);

  const joinOptions =
    list && faction
      ? list.selections.filter((selection) => {
          const unit = getTowUnit(faction, selection.unitId);
          return unit && !unit.character;
        })
      : [];

  if (!list || !faction || !totals) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 text-parchment">
        <p className="text-sm text-ink-muted">Loading your list</p>
      </main>
    );
  }

  const magicSelection = magicFor
    ? list.selections
        .flatMap((selection) => [selection, ...selection.detachments])
        .find((selection) => selection.id === magicFor)
    : undefined;
  const forgeSelection = forgeFor
    ? list.selections
        .flatMap((selection) => [selection, ...selection.detachments])
        .find((selection) => selection.id === forgeFor)
    : undefined;
  const forgeUnit =
    forgeSelection && faction
      ? getTowUnit(faction, forgeSelection.unitId)
      : undefined;

  const mutators = {
    onModels: (selectionId: string, models: number) =>
      void commit(setTowModels(list, selectionId, models)),
    onCommand: (selectionId: string, commandId: string) =>
      void commit(toggleTowCommand(list, selectionId, commandId)),
    onOption: (
      selectionId: string,
      optionId: string,
      groupOptionIds: string[],
    ) => void commit(toggleTowOption(list, selectionId, optionId, groupOptionIds)),
    onGeneral: (selectionId: string) =>
      void commit(setTowGeneral(list, selectionId)),
    onJoin: (selectionId: string) => setJoinFor(selectionId),
    onMagicItems: (selectionId: string) => setMagicFor(selectionId),
    onForge: (selectionId: string) => setForgeFor(selectionId),
    onAddDetachment: (selectionId: string) =>
      setPicker({ category: "core", parentId: selectionId }),
    onRemove: (selectionId: string) =>
      void commit(removeTowSelection(list, selectionId)),
    onPlayDamage: (selectionId: string, damage: number) =>
      void commit(setTowPlayDamage(list, selectionId, damage)),
    onOpenDatasheet: (unit: TowCatalogueUnit) => setDatasheet(unit),
  };

  return (
    <FactionBackdrop>
      <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-5 px-4 py-4 pb-28 sm:py-6">
        {!playMode ? (
          <section
            className={`min-w-0 rounded-2xl bg-ink-raised ring-1 ring-parchment/12 ${
              optionsOpen ? "pb-4" : ""
            }`}
          >
            <button
              type="button"
              aria-label="Options"
              aria-expanded={optionsOpen}
              onClick={() => setOptionsOpen((open) => !open)}
              className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-sm text-parchment/85"
            >
              <span className="font-medium tracking-wide" aria-hidden="true">
                Options
              </span>
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                {!optionsOpen ? (
                  <span aria-hidden="true">Points</span>
                ) : null}
                <span
                  aria-hidden="true"
                  className={`transition ${optionsOpen ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </span>
            </button>
            {optionsOpen ? (
              <div className="flex min-w-0 flex-col gap-4 border-t border-parchment/10 px-4 pt-4">
                <PointsCapField
                  value={list.pointsCap}
                  onChange={(pointsCap) =>
                    void commit({ ...list, pointsCap })
                  }
                  variant="ink"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {!playMode && totals.issues.length > 0 ? (
          <div className="flex flex-col gap-2">
            {totals.issues.map((item) => (
              <p
                key={item.text}
                className={LIST_ISSUE_BANNER_CLASS}
                role="status"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full bg-illegal"
                />
                <span>{item.text}</span>
              </p>
            ))}
          </div>
        ) : null}

        {TOW_CATEGORIES.map((category) => {
          const units = list.selections.filter(
            (selection) => selection.category === category,
          );
          return (
            <section key={category} className="flex min-w-0 flex-col gap-3">
              <div className={TOW_CATEGORY_ROW_CLASS}>
                <h2 className={TOW_CATEGORY_HEADING_CLASS}>
                  {CATEGORY_LABEL[category]}
                </h2>
                {playMode ? null : (
                  <button
                    type="button"
                    onClick={() => setPicker({ category })}
                    className={BUILDER_ADD_ACTION_EMPHASIS_CLASS}
                  >
                    + {CATEGORY_LABEL[category]}
                  </button>
                )}
              </div>
              {units.map((selection) => (
                <TowUnitCard
                  key={selection.id}
                  list={list}
                  faction={faction}
                  selection={selection}
                  playMode={playMode}
                  {...mutators}
                />
              ))}
            </section>
          );
        })}

        {picker ? (
          <TowAddUnitSheet
            faction={faction}
            category={picker.parentId ? "core" : picker.category}
            title={
              picker.parentId
                ? "Add detachment"
                : `Add ${CATEGORY_LABEL[picker.category]}`
            }
            onClose={() => setPicker(null)}
            onPick={(unitId) => {
              const next = picker.parentId
                ? addTowDetachment(list, picker.parentId, unitId)
                : addTowUnit(list, unitId);
              setPicker(null);
              if (next) {
                void commit(next);
              }
            }}
          />
        ) : null}

        {joinFor ? (
          <TowJoinSheet
            faction={faction}
            options={joinOptions}
            onClose={() => setJoinFor(null)}
            onPick={(joinSelectionId) => {
              void commit(setTowJoin(list, joinFor, joinSelectionId));
              setJoinFor(null);
            }}
          />
        ) : null}

        {magicFor && magicSelection ? (
          <TowMagicItemsSheet
            selectedIds={magicSelection.magicItemIds ?? []}
            onClose={() => setMagicFor(null)}
            onSave={(ids) => {
              void commit(setTowMagicItems(list, magicFor, ids));
              setMagicFor(null);
            }}
          />
        ) : null}

        {forgeFor && forgeSelection && forgeUnit ? (
          <TowCharacterForgeSheet
            unit={forgeUnit}
            selection={forgeSelection}
            onClose={() => setForgeFor(null)}
            onSave={(loadout) => {
              void commit(setTowCharacterLoadout(list, forgeFor, loadout));
              setForgeFor(null);
            }}
          />
        ) : null}

        {datasheet ? (
          <TowDatasheetSheet
            unit={datasheet}
            onClose={() => setDatasheet(null)}
          />
        ) : null}
      </main>
    </FactionBackdrop>
  );
}
