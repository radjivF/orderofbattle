"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
  useDeferredValue,
} from "react";
import { getFaction, getUnit, heroesOf, legalCompanions, armyHasKeyword, namedOption, battleDamagedWarning, battleStatLine, selectionPlayState, selectionPoints, unitBaseName, auxiliaryPickerUnits, unitSizeLabel, canBeGeneral, resolveGeneralRegimentId, listRegimentsOfRenown, getRegimentOfRenown, enhancementChoiceDetail, enhancementLabel, formationLabel } from "@/engine/queries";
import { catalogueForList, isSpearheadList } from "@/engine/spearhead";
import { combatModifierNotes } from "@/engine/magic";
import { battleTactics, battleTacticsForRealm } from "@/engine/data/load";
import { summarize } from "@/engine/validate";
import type { ArmyList, CatalogueUnit, DatasheetSubject, EnhancementOption, FactionCatalogue, NamedOption } from "@/engine/types";
import { createId } from "@/lib/id";
import { BUILDER_ADD_ACTION_CLASS, BUILDER_ADD_ACTION_EMPHASIS_CLASS, LIST_ISSUE_BANNER_CLASS, LIST_PANE_ART_CLASS, CONFIRM_SHEET_PANEL_CLASS, builderPlayTabs } from "@/lib/builderUi";
import { castValueLabel } from "@/lib/abilityUi";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  recordArmyOpened,
  saveArmy,
  subscribeArmies,
  appendRegimentWithHero,
} from "@/lib/storage";
import {
  getListOpenFactionServerSnapshot,
  getListOpenFactionSnapshot,
  clearListOpenSplash,
  clearListCreateSplash,
  consumeSkipListSplash,
  getListOpenDisplayNameServerSnapshot,
  getListOpenDisplayNameSnapshot,
  peekListOpenSplash,
  peekListNavigationDirection,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import { listOpenShowsSplash } from "@/lib/listFlowNav";
import { DatasheetSheet } from "./DatasheetSheet";
import { FactionArtLayers } from "./FactionArtBackground";
import { FactionBackdrop } from "./FactionBackdrop";
import { useListFlowChrome, useListFlowDecor } from "./ListFlowShell";
import { ListLoadingSplash } from "./ListLoadingSplash";
import { ModalFrame } from "./ModalFrame";
import { ConfirmSheetActions } from "./ConfirmSheetActions";
import { RuleText } from "./RuleText";
import { ChoiceSheet, PickerSheet } from "./PickerSheet";
import { BuildSlotRow } from "./ios/SheetIconButton";
import { PointsCapField } from "./PointsCapField";
import { ManifestationCard } from "./ManifestationCard";
import { PlayMagicBoard } from "./PlayMagicBoard";
import { PlayPhaseBoard } from "./PlayPhaseBoard";
import { BattleTacticTracker } from "./BattleTacticTracker";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { SpearheadPicks } from "./SpearheadPicks";
import { PlayBindNotes, PlayHealthTrack, RegimentCard, SlotEnhancements, SlotMoreMenu } from "./RegimentCard";
import {
  buildRoRSelections,
  clearRoREnhancements,
  RegimentOfRenownCard,
} from "./RegimentOfRenownCard";
import { TerrainCard } from "./TerrainCard";

type Picker =
  | { kind: "hero"; regimentId?: string }
  | { kind: "unit"; regimentId: string }
  | { kind: "aux" }
  | { kind: "ror" }
  | { kind: "artefact"; heroSelectionId: string }
  | { kind: "trait"; heroSelectionId: string }
  | { kind: "monstrous"; heroSelectionId: string }
  | { kind: "vision"; heroSelectionId: string }
  | { kind: "special"; tableId: string; heroSelectionId: string }
  | null;

type Props = {
  listId: string;
};

const MIN_OPEN_SPLASH_MS = 650;

export function BuilderScreen({ listId }: Props) {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const rememberedId = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenFactionSnapshot,
    getListOpenFactionServerSnapshot,
  );
  const list = lists?.find((item) => item.id === listId);
  const faction = list ? catalogueForList(list) : undefined;
  const artFactionId =
    (faction ? faction.parentFactionIds?.[0] ?? faction.id : null) ??
    rememberedId;
  const rememberedDisplayName = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenDisplayNameSnapshot,
    getListOpenDisplayNameServerSnapshot,
  );
  const [openingSplash, setOpeningSplash] = useState(false);
  const openedRecorded = useRef<string | null>(null);
  const splashStarted = useRef(0);
  const skipOpenSplash = useRef(consumeSkipListSplash());

  useLayoutEffect(() => {
    if (skipOpenSplash.current) {
      return;
    }
    if (
      !listOpenShowsSplash({
        splashRequested: peekListOpenSplash(),
        animatingBack: peekListNavigationDirection() === "back",
      })
    ) {
      return;
    }
    setOpeningSplash(true);
    if (splashStarted.current === 0) {
      splashStarted.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!openingSplash) {
      return;
    }
    if (lists === undefined) {
      return;
    }
    const wait = Math.max(
      0,
      MIN_OPEN_SPLASH_MS - (Date.now() - splashStarted.current),
    );
    const timer = window.setTimeout(() => {
      setOpeningSplash(false);
      clearListOpenSplash();
    }, wait);
    return () => window.clearTimeout(timer);
  }, [openingSplash, lists]);

  const splashName =
    rememberedDisplayName ??
    faction?.name ??
    (rememberedId ? getFaction(rememberedId)?.name : undefined);
  const showSplash = lists === undefined || openingSplash;
  const scourgeRealm = list?.scourgeRealm ?? null;

  useEffect(() => {
    if (showSplash) {
      return;
    }
    clearListCreateSplash();
  }, [showSplash]);

  useEffect(() => {
    if (lists === undefined || openedRecorded.current === listId) {
      return;
    }
    if (!lists.some((item) => item.id === listId)) {
      return;
    }
    openedRecorded.current = listId;
    const timer = window.setTimeout(() => {
      void recordArmyOpened(listId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [listId, lists]);

  const { setDecor } = useListFlowDecor();

  useLayoutEffect(() => {
    setDecor({
      backdrop: artFactionId ? (
        <div className={LIST_PANE_ART_CLASS} aria-hidden="true">
          <div className="relative h-full w-full">
            <FactionArtLayers
              factionId={artFactionId}
              scourgeRealm={scourgeRealm}
              splash={showSplash}
            />
          </div>
        </div>
      ) : undefined,
      overlay: showSplash ? (
        <div className="pointer-events-none absolute inset-0 z-30">
          <ListLoadingSplash factionName={splashName} />
        </div>
      ) : undefined,
    });
    return () => setDecor({});
  }, [artFactionId, scourgeRealm, showSplash, splashName, setDecor]);

  if (!showSplash && (!list || !faction)) {
    return (
      <div className="relative z-10 flex min-h-full flex-col items-start bg-ink px-6 py-10 text-parchment">
        <p className="font-serif text-3xl">This list is gone.</p>
        <Link href="/dashboard" className="mt-6 min-h-11 text-sigmarite">
          Back to library
        </Link>
      </div>
    );
  }

  if (!list || !faction) {
    return null;
  }

  if (showSplash) {
    return null;
  }

  return (
    <FactionBackdrop>
      <BuilderReady list={list} faction={faction} />
    </FactionBackdrop>
  );
}

function BuilderReady({
  list,
  faction,
}: {
  list: ArmyList;
  faction: FactionCatalogue;
}) {
  const [selectedRegimentId, setSelectedRegimentId] = useState<string | null>(
    null,
  );
  const [picker, setPicker] = useState<Picker>(null);
  const [datasheet, setDatasheet] = useState<DatasheetSubject | null>(null);
  const [pane, setPane] = useState<"build" | "play">("build");
  const [playTab, setPlayTab] = useState<"units" | "magic" | "phases">("units");
  const [regimentRemoveId, setRegimentRemoveId] = useState<string | null>(null);
  const totals = useMemo(() => summarize(list, faction), [list, faction]);
  const playMode = pane === "play";
  const spearhead = isSpearheadList(list);
  const bindNotes = useMemo(
    () => (playMode ? combatModifierNotes(list, faction) : []),
    [playMode, list, faction],
  );
  const issue = useMemo(() => {
    return (
      totals.issues.find((item) => item.tone === "bad") ??
      totals.issues.find((item) => item.tone === "warn") ??
      totals.issues[0] ?? {
        tone: "warn" as const,
        text: "Add a regiment to begin.",
      }
    );
  }, [totals.issues]);
  const deferredPicker = useDeferredValue(picker);
  const pickerUnits = pickerUnitsFor(list, faction, deferredPicker);
  const selectedId = selectedRegimentId ?? list.regiments[0]?.id ?? null;

  async function commit(next: ArmyList) {
    await saveArmy(next);
  }

  useEffect(() => {
    const nextPrayer =
      !list.prayerLoreId && faction.prayerLores.length === 1
        ? faction.prayerLores[0].id
        : list.prayerLoreId;
    const nextSpell =
      !list.spellLoreId && faction.spellLores.length === 1
        ? faction.spellLores[0].id
        : list.spellLoreId;
    const nextGeneral = resolveGeneralRegimentId(list, faction);
    const nextScourgeRealm = spearhead
      ? list.scourgeRealm
      : (list.scourgeRealm ?? "aqshy");
    if (
      nextPrayer === list.prayerLoreId &&
      nextSpell === list.spellLoreId &&
      nextGeneral === list.generalRegimentId &&
      nextScourgeRealm === list.scourgeRealm
    ) {
      return;
    }
    void commit({
      ...list,
      prayerLoreId: nextPrayer,
      spellLoreId: nextSpell,
      generalRegimentId: nextGeneral,
      scourgeRealm: nextScourgeRealm,
    });
  }, [list, faction, spearhead]);

  useEffect(() => {
    if (spearhead && playTab === "magic") {
      setPlayTab("units");
    }
  }, [spearhead, playTab]);

  function openNewRegimentHeroPicker() {
    if (list.regiments.length >= 5) {
      return;
    }
    setPicker({ kind: "hero" });
  }

  async function setPlayDamage(selectionId: string, damage: number) {
    await commit({
      ...list,
      regiments: list.regiments.map((regiment) => ({
        ...regiment,
        hero:
          regiment.hero?.id === selectionId
            ? { ...regiment.hero, play: { damage } }
            : regiment.hero,
        units: regiment.units.map((slot) =>
          slot.id === selectionId ? { ...slot, play: { damage } } : slot,
        ),
      })),
      auxiliaries: list.auxiliaries.map((slot) =>
        slot.id === selectionId ? { ...slot, play: { damage } } : slot,
      ),
      regimentOfRenown: list.regimentOfRenown
        ? {
            ...list.regimentOfRenown,
            units: list.regimentOfRenown.units.map((slot) =>
              slot.id === selectionId ? { ...slot, play: { damage } } : slot,
            ),
          }
        : null,
    });
  }

  async function removeRegiment(regimentId: string) {
    const regiment = list.regiments.find((item) => item.id === regimentId);
    if (!regiment) {
      return;
    }
    const selectionIds = [
      regiment.hero?.id,
      ...regiment.units.map((slot) => slot.id),
    ];
    let next: ArmyList = {
      ...list,
      regiments: list.regiments.filter((item) => item.id !== regimentId),
      generalRegimentId:
        list.generalRegimentId === regimentId
          ? (list.regiments.find((item) => item.id !== regimentId)?.id ?? null)
          : list.generalRegimentId,
    };
    for (const selectionId of selectionIds) {
      if (selectionId) {
        next = dropEnhancements(next, selectionId);
      }
    }
    await commit(next);
    if (selectedRegimentId === regimentId) {
      setSelectedRegimentId(next.regiments[0]?.id ?? null);
    }
    setRegimentRemoveId(null);
  }

  async function onPick(unit: CatalogueUnit) {
    if (!picker) {
      return;
    }
    if (picker.kind === "hero") {
      if (!picker.regimentId) {
        const next = appendRegimentWithHero(list, unit.id, {
          regimentId: createId(),
          heroSelectionId: createId(),
        });
        if (next) {
          await commit(next);
          setSelectedRegimentId(next.regiments.at(-1)?.id ?? null);
        }
        setPicker(null);
        return;
      }
      const previous = list.regiments.find(
        (regiment) => regiment.id === picker.regimentId,
      )?.hero;
      await commit(
        dropEnhancements(
          {
            ...list,
            regiments: list.regiments.map((regiment) =>
              regiment.id === picker.regimentId
                ? {
                    ...regiment,
                    hero: { id: createId(), unitId: unit.id, reinforced: false },
                    units: regiment.units.filter((slot) => slot.unitId !== unit.id),
                  }
                : regiment,
            ),
          },
          previous?.id,
        ),
      );
    } else if (picker.kind === "unit") {
      await commit({
        ...list,
        regiments: list.regiments.map((regiment) =>
          regiment.id === picker.regimentId
            ? {
                ...regiment,
                units: [
                  ...regiment.units,
                  { id: createId(), unitId: unit.id, reinforced: false },
                ],
              }
            : regiment,
        ),
      });
    } else if (picker.kind === "aux") {
      await commit({
        ...list,
        auxiliaries: [
          ...list.auxiliaries,
          { id: createId(), unitId: unit.id, reinforced: false },
        ],
      });
    }
    setPicker(null);
  }

  async function onChooseEnhancement(option: NamedOption | null) {
    if (
      !picker ||
      (picker.kind !== "artefact" &&
        picker.kind !== "trait" &&
        picker.kind !== "monstrous" &&
        picker.kind !== "vision" &&
        picker.kind !== "special")
    ) {
      return;
    }
    if (picker.kind === "special") {
      const next = (list.specialEnhancements ?? []).filter(
        (pick) => pick.tableId !== picker.tableId,
      );
      if (option) {
        next.push({
          tableId: picker.tableId,
          heroSelectionId: picker.heroSelectionId,
          optionId: option.id,
        });
      }
      await commit({ ...list, specialEnhancements: next });
      setPicker(null);
      return;
    }
    const field =
      picker.kind === "artefact"
        ? "artefact"
        : picker.kind === "trait"
          ? "heroicTrait"
          : picker.kind === "monstrous"
            ? "monstrousTrait"
            : "visionOfFate";
    const current = list[field];
    await commit({
      ...list,
      [field]: option
        ? { heroSelectionId: picker.heroSelectionId, optionId: option.id }
        : current?.heroSelectionId === picker.heroSelectionId
          ? null
          : current,
    });
    setPicker(null);
  }

  const hasWizard = armyHasKeyword(list, faction, "WIZARD");
  const hasPriest = armyHasKeyword(list, faction, "PRIEST");
  const formation = faction.formations.find(
    (item) => item.id === list.formationId,
  );
  const spellLore = faction.spellLores.find(
    (lore) => lore.id === list.spellLoreId,
  );
  const manifestation = faction.manifestationLores.find(
    (lore) => lore.id === list.manifestationLoreId,
  );
  const enhancementPicker =
    picker?.kind === "artefact"
      ? {
          title: "Artefact",
          options: enhancementChoices(faction.artefacts),
          selectedId: list.artefact?.optionId,
        }
      : picker?.kind === "trait"
        ? {
            title: spearhead ? "Enhancement" : "Heroic trait",
            options: enhancementChoices(faction.heroicTraits),
            selectedId: list.heroicTrait?.optionId,
          }
        : picker?.kind === "monstrous"
          ? {
              title: "Monstrous trait",
              options: enhancementChoices(faction.monstrousTraits ?? []),
              selectedId: list.monstrousTrait?.optionId,
            }
          : picker?.kind === "vision"
            ? {
                title: "Vision of Fate",
                options: enhancementChoices(faction.visionsOfFate ?? []),
                selectedId: list.visionOfFate?.optionId,
              }
            : picker?.kind === "special"
              ? {
                  title:
                    faction.specialEnhancementTables?.find(
                      (table) => table.id === picker.tableId,
                    )?.name ?? "Enhancement",
                  options: enhancementChoices(
                    faction.specialEnhancementTables?.find(
                      (table) => table.id === picker.tableId,
                    )?.options ?? [],
                  ),
                  selectedId: list.specialEnhancements?.find(
                    (pick) => pick.tableId === picker.tableId,
                  )?.optionId,
                }
              : null;

  const specialTables = faction.specialEnhancementTables ?? [];
  const specialEnhancementPicks = list.specialEnhancements ?? [];
  const onPickSpecial =
    specialTables.length > 0
      ? (tableId: string, heroSelectionId: string) =>
          setPicker({ kind: "special", tableId, heroSelectionId })
      : undefined;

  const rorOptions = listRegimentsOfRenown(list.factionId);
  const rorPicker =
    picker?.kind === "ror"
      ? {
          title: "Regiment of Renown",
          options: rorOptions.map((item) => ({
            id: item.id,
            name: item.name,
            detail: `${item.points} pts · ${item.units.map((u) => (u.count > 1 ? `${u.count}× ${u.name}` : u.name)).join(", ")}`,
            abilities: item.abilities,
          })),
          selectedId: list.regimentOfRenown?.renownId,
        }
      : null;

  const regimentPendingRemoval = list.regiments.find(
    (item) => item.id === regimentRemoveId,
  );
  const regimentRemoveMessage = regimentPendingRemoval?.hero
    ? `${getUnit(faction, regimentPendingRemoval.hero.unitId)?.name ?? "This regiment"} and ${regimentPendingRemoval.units.length} companion${
        regimentPendingRemoval.units.length === 1 ? "" : "s"
      } will be removed from the list.`
    : "This regiment and its units will be removed from the list.";

  const enterPlay = useCallback(() => {
    setPane("play");
    setPlayTab("units");
    setPicker(null);
  }, []);

  const exitPlay = useCallback(() => {
    setPane("build");
    setPlayTab("units");
    setPicker(null);
  }, []);

  const { setBuilderChrome } = useListFlowChrome();

  useLayoutEffect(() => {
    setBuilderChrome({
      list,
      faction,
      playMode,
      enterPlay,
      exitPlay,
      onListNameChange: (name) => void commit({ ...list, name }),
      points: totals.points,
      pointsCap: list.pointsCap,
      drops: totals.drops,
      issue,
      spearhead: isSpearheadList(list),
    });
    return () => setBuilderChrome(null);
  }, [
    list,
    faction,
    playMode,
    totals.points,
    totals.drops,
    issue,
    setBuilderChrome,
    enterPlay,
    exitPlay,
    spearhead,
  ]);

  function renderListMain(forPlayMode: boolean) {
    return (
      <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-5 px-4 py-4 pb-28 sm:py-6">
        {forPlayMode ? (
          <IosSegmentedControl
            ariaLabel="Play sections"
            value={playTab}
            onChange={(next) =>
              setPlayTab(next as "units" | "magic" | "phases")
            }
            options={builderPlayTabs(spearhead)}
          />
        ) : null}
        {!forPlayMode && issue.tone !== "ok" ? (
          <p
            className={LIST_ISSUE_BANNER_CLASS}
            role="status"
          >
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-illegal" />
            <span>{issue.text}</span>
          </p>
        ) : null}
        {!forPlayMode && spearhead ? (
          <SpearheadPicks
            list={list}
            faction={faction}
            onChange={(next) => void commit(next)}
          />
        ) : !forPlayMode ? (
        <div className="flex min-w-0 flex-col gap-4">
          <details className="group min-w-0 rounded-2xl bg-ink-raised ring-1 ring-parchment/12 open:pb-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-parchment/85 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="font-medium tracking-wide">Options</span>
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="group-open:hidden">
                  Points · Lores · Tactics
                </span>
                <span aria-hidden="true" className="transition group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="flex min-w-0 flex-col gap-4 border-t border-parchment/10 px-4 pt-4">
              <PointsCapField
                value={list.pointsCap}
                onChange={(pointsCap) => void commit({ ...list, pointsCap })}
                variant="ink"
              />

              {faction.spellLores.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-2 text-sm text-parchment/80">
                    Spell lore
                    <select
                      value={list.spellLoreId ?? ""}
                      onChange={(event) =>
                        void commit({
                          ...list,
                          spellLoreId: event.target.value || null,
                        })
                      }
                      className="min-h-11 w-full max-w-full rounded-xl bg-parchment px-3 text-parchment-ink"
                    >
                      <option value="">None</option>
                      {faction.spellLores.map((lore) => (
                        <option key={lore.id} value={lore.id}>
                          {lore.name}
                        </option>
                      ))}
                    </select>
                    {!hasWizard ? (
                      <span className="text-xs text-ink-muted">
                        Needs a Wizard in the list to use.
                      </span>
                    ) : null}
                  </label>
                  {faction.spellLores.length > 1 &&
                  spellLore &&
                  spellLore.powers.length > 0 ? (
                    <ul className="min-w-0 break-words rounded-2xl bg-parchment px-4 py-3 text-parchment-ink shadow-sm">
                      {spellLore.powers.map((power) => (
                        <li
                          key={power.name}
                          className="border-b border-parchment-ink/10 py-3 last:border-b-0 last:pb-0 first:pt-0"
                        >
                          <p className="font-serif text-lg leading-tight">
                            {power.name}
                          </p>
                          <p className="mt-1 text-xs tracking-wide uppercase text-aether">
                            {[
                              power.castingValue
                                ? castValueLabel(power.castingValue)
                                : "",
                              power.kind,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {power.timing ? (
                            <p className="mt-1 font-serif text-base leading-snug text-parchment-ink/80">
                              {power.timing}
                            </p>
                          ) : null}
                          {power.declare ? (
                            <RuleText
                              text={power.declare}
                              label="Declare · "
                              className="mt-2 text-sm"
                            />
                          ) : null}
                          {power.effect ? (
                            <RuleText
                              text={power.effect}
                              label="Effect · "
                              className="mt-1 text-sm"
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {faction.prayerLores.length > 0 ? (
                <label className="flex flex-col gap-2 text-sm text-parchment/80">
                  Prayer lore
                  <select
                    value={list.prayerLoreId ?? ""}
                    onChange={(event) =>
                      void commit({
                        ...list,
                        prayerLoreId: event.target.value || null,
                      })
                    }
                    className="min-h-11 w-full max-w-full rounded-xl bg-parchment px-3 text-parchment-ink"
                  >
                    <option value="">None</option>
                    {faction.prayerLores.map((lore) => (
                      <option key={lore.id} value={lore.id}>
                        {lore.name}
                      </option>
                    ))}
                  </select>
                  {!hasPriest ? (
                    <span className="text-xs text-ink-muted">
                      Needs a Priest in the list to use.
                    </span>
                  ) : null}
                </label>
              ) : null}

              <label className="flex flex-col gap-2 text-sm text-parchment/80">
                Scourge season
                <select
                  value={list.scourgeRealm ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    const scourgeRealm =
                      value === "aqshy" || value === "ghyran" ? value : null;
                    void commit({
                      ...list,
                      scourgeRealm,
                      battleTacticCardIds: [],
                      battleTacticStage: {},
                    });
                  }}
                  className="min-h-11 w-full max-w-full rounded-xl bg-parchment px-3 text-parchment-ink"
                >
                  <option value="">Choose season…</option>
                  <option value="aqshy">Scourge of Aqshy</option>
                  <option value="ghyran">Scourge of Ghyran</option>
                </select>
              </label>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-parchment/80">
                  Battle tactic cards (pick up to 2)
                </p>
                <BattleTacticCardPicker
                  list={list}
                  cards={battleTacticsForRealm(list.scourgeRealm)}
                  onCommit={(next) => void commit(next)}
                />
              </div>
            </div>
          </details>
          {faction.formations.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-2">
            <label className="flex min-w-0 flex-col gap-2 text-sm text-parchment/80">
              Battle formation
              <select
                value={list.formationId ?? ""}
                onChange={(event) =>
                  void commit({
                    ...list,
                    formationId: event.target.value || null,
                  })
                }
                className="min-h-11 w-full max-w-full rounded-xl bg-parchment px-3 text-parchment-ink"
              >
                {faction.formations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formationLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            {formation?.points ? (
              <p className="text-sm font-medium text-sigmarite">
                {formation.points} pts
              </p>
            ) : null}
            {formation && formation.abilities.length > 0 ? (
              <ul className="min-w-0 break-words rounded-2xl bg-parchment px-4 py-3 text-parchment-ink shadow-sm">
                {formation.abilities.map((ability) => (
                  <li key={ability.name}>
                    <p className="font-serif text-lg leading-tight">
                      {ability.name}
                    </p>
                    {ability.timing ? (
                      <p className="mt-1 font-serif text-base leading-snug text-parchment-ink/80">
                        {ability.timing}
                      </p>
                    ) : null}
                    {ability.declare ? (
                      <RuleText
                        text={ability.declare}
                        label="Declare · "
                        className="mt-2 text-sm"
                      />
                    ) : null}
                    {ability.effect ? (
                      <RuleText
                        text={ability.effect}
                        label="Effect · "
                        className="mt-1 text-sm"
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          ) : null}
        </div>
        ) : playTab === "units" ? (
          <PlaySummary list={list} faction={faction} />
        ) : null}

        {forPlayMode && playTab === "phases" && !spearhead ? (
          <BattleTacticTracker
            list={list}
            onStageChange={(cardId, stage) =>
              void commit({
                ...list,
                battleTacticStage: {
                  ...(list.battleTacticStage ?? {}),
                  [cardId]: stage,
                },
              })
            }
          />
        ) : null}

        {forPlayMode && playTab === "phases" ? (
          <PlayPhaseBoard
            list={list}
            faction={faction}
            onOpenSheet={setDatasheet}
          />
        ) : forPlayMode && playTab === "magic" && !spearhead ? (
          <PlayMagicBoard
            list={list}
            faction={faction}
            onOpenSheet={setDatasheet}
            onBindPower={(key, value) => {
              const binds = { ...(list.powerBinds ?? {}) };
              if (value) {
                binds[key] = value;
              } else {
                delete binds[key];
              }
              void commit({ ...list, powerBinds: binds });
            }}
          />
        ) : (
          <>
        {list.regiments.map((regiment) => {
          const regimentIsGeneral = list.generalRegimentId === regiment.id;
          return (
          <RegimentCard
            key={regiment.id}
            regiment={regiment}
            faction={faction}
            isGeneral={regimentIsGeneral}
            canBeGeneral={canBeGeneral(list, faction, regiment.id)}
            slotCap={totals.slotCap(regiment.id)}
            selected={selectedId === regiment.id}
            playMode={forPlayMode}
            locked={spearhead}
            allowUniqueHeroTrait={spearhead && regimentIsGeneral}
            traitKind={spearhead ? "Enhancement" : undefined}
            onSelect={() => setSelectedRegimentId(regiment.id)}
            onMakeGeneral={() => {
              if (!canBeGeneral(list, faction, regiment.id)) {
                return;
              }
              void commit({ ...list, generalRegimentId: regiment.id });
            }}
            onPickHero={() =>
              setPicker({ kind: "hero", regimentId: regiment.id })
            }
            onPickUnit={() =>
              setPicker({ kind: "unit", regimentId: regiment.id })
            }
            artefactBearerId={list.artefact?.heroSelectionId}
            artefactLabel={enhancementLabel(
              faction.artefacts,
              list.artefact?.optionId,
            )}
            artefactAbilities={
              list.artefact
                ? faction.artefacts.find(
                    (item) => item.id === list.artefact?.optionId,
                  )?.abilities
                : undefined
            }
            heroicTraitBearerId={list.heroicTrait?.heroSelectionId}
            heroicTraitLabel={enhancementLabel(
              faction.heroicTraits,
              list.heroicTrait?.optionId,
            )}
            heroicTraitAbilities={
              list.heroicTrait
                ? faction.heroicTraits.find(
                    (item) => item.id === list.heroicTrait?.optionId,
                  )?.abilities
                : undefined
            }
            monstrousTraitBearerId={list.monstrousTrait?.heroSelectionId}
            monstrousTraitLabel={enhancementLabel(
              faction.monstrousTraits ?? [],
              list.monstrousTrait?.optionId,
            )}
            monstrousTraitAbilities={
              list.monstrousTrait
                ? faction.monstrousTraits?.find(
                    (item) => item.id === list.monstrousTrait?.optionId,
                  )?.abilities
                : undefined
            }
            visionBearerId={list.visionOfFate?.heroSelectionId}
            visionLabel={enhancementLabel(
              faction.visionsOfFate ?? [],
              list.visionOfFate?.optionId,
            )}
            visionAbilities={
              list.visionOfFate
                ? faction.visionsOfFate?.find(
                    (item) => item.id === list.visionOfFate?.optionId,
                  )?.abilities
                : undefined
            }
            onPickArtefact={
              spearhead || faction.artefacts.length === 0
                ? undefined
                : (heroSelectionId) =>
                    setPicker({
                      kind: "artefact",
                      heroSelectionId,
                    })
            }
            onPickTrait={
              faction.heroicTraits.length === 0 ||
              (spearhead && !regimentIsGeneral)
                ? undefined
                : (heroSelectionId) =>
                    setPicker({
                      kind: "trait",
                      heroSelectionId,
                    })
            }
            onPickMonstrousTrait={
              spearhead || (faction.monstrousTraits?.length ?? 0) === 0
                ? undefined
                : (heroSelectionId) =>
                    setPicker({
                      kind: "monstrous",
                      heroSelectionId,
                    })
            }
            onPickVision={
              spearhead || (faction.visionsOfFate?.length ?? 0) === 0
                ? undefined
                : (heroSelectionId) =>
                    setPicker({
                      kind: "vision",
                      heroSelectionId,
                    })
            }
            specialTables={spearhead ? undefined : specialTables}
            specialEnhancementPicks={
              spearhead ? undefined : specialEnhancementPicks
            }
            onPickSpecial={spearhead ? undefined : onPickSpecial}
            onOpenDatasheet={setDatasheet}
            onToggleReinforce={(selectionId) =>
              void commit({
                ...list,
                regiments: list.regiments.map((item) =>
                  item.id === regiment.id
                    ? {
                        ...item,
                        units: item.units.map((slot) =>
                          slot.id === selectionId
                            ? { ...slot, reinforced: !slot.reinforced }
                            : slot,
                        ),
                      }
                    : item,
                ),
              })
            }
            onDuplicateUnit={(selectionId) => {
              const slot = regiment.units.find((item) => item.id === selectionId);
              if (!slot) {
                return;
              }
              const unit = getUnit(faction, slot.unitId);
              if (!unit || unit.unique) {
                return;
              }
              const cap = totals.slotCap(regiment.id);
              if (regiment.units.length >= cap) {
                return;
              }
              void commit({
                ...list,
                regiments: list.regiments.map((item) =>
                  item.id === regiment.id
                    ? {
                        ...item,
                        units: [
                          ...item.units,
                          {
                            id: createId(),
                            unitId: slot.unitId,
                            reinforced: slot.reinforced,
                          },
                        ],
                      }
                    : item,
                ),
              });
            }}
            onRemoveUnit={(selectionId) =>
              void commit(
                dropEnhancements(
                  {
                    ...list,
                    regiments: list.regiments.map((item) =>
                      item.id === regiment.id
                        ? {
                            ...item,
                            units: item.units.filter(
                              (slot) => slot.id !== selectionId,
                            ),
                          }
                        : item,
                    ),
                  },
                  selectionId,
                ),
              )
            }
            onRemoveRegiment={() => setRegimentRemoveId(regiment.id)}
            bindNotes={bindNotes}
            onPlayHealth={(selectionId, damage) =>
              void setPlayDamage(selectionId, damage)
            }
          />
          );
        })}

        {list.regimentOfRenown && !spearhead ? (
          <RegimentOfRenownCard
            list={list}
            playMode={forPlayMode}
            artefactBearerId={list.artefact?.heroSelectionId}
            artefactLabel={enhancementLabel(
              faction.artefacts,
              list.artefact?.optionId,
            )}
            artefactAbilities={
              list.artefact
                ? faction.artefacts.find(
                    (item) => item.id === list.artefact?.optionId,
                  )?.abilities
                : undefined
            }
            heroicTraitBearerId={list.heroicTrait?.heroSelectionId}
            heroicTraitLabel={enhancementLabel(
              faction.heroicTraits,
              list.heroicTrait?.optionId,
            )}
            heroicTraitAbilities={
              list.heroicTrait
                ? faction.heroicTraits.find(
                    (item) => item.id === list.heroicTrait?.optionId,
                  )?.abilities
                : undefined
            }
            monstrousTraitBearerId={list.monstrousTrait?.heroSelectionId}
            monstrousTraitLabel={enhancementLabel(
              faction.monstrousTraits ?? [],
              list.monstrousTrait?.optionId,
            )}
            monstrousTraitAbilities={
              list.monstrousTrait
                ? faction.monstrousTraits?.find(
                    (item) => item.id === list.monstrousTrait?.optionId,
                  )?.abilities
                : undefined
            }
            visionBearerId={list.visionOfFate?.heroSelectionId}
            visionLabel={enhancementLabel(
              faction.visionsOfFate ?? [],
              list.visionOfFate?.optionId,
            )}
            visionAbilities={
              list.visionOfFate
                ? faction.visionsOfFate?.find(
                    (item) => item.id === list.visionOfFate?.optionId,
                  )?.abilities
                : undefined
            }
            onPickArtefact={
              faction.artefacts.length > 0
                ? (heroSelectionId) =>
                    setPicker({
                      kind: "artefact",
                      heroSelectionId,
                    })
                : undefined
            }
            onPickTrait={
              faction.heroicTraits.length > 0
                ? (heroSelectionId) =>
                    setPicker({
                      kind: "trait",
                      heroSelectionId,
                    })
                : undefined
            }
            onPickMonstrousTrait={
              (faction.monstrousTraits?.length ?? 0) > 0
                ? (heroSelectionId) =>
                    setPicker({
                      kind: "monstrous",
                      heroSelectionId,
                    })
                : undefined
            }
            onPickVision={
              (faction.visionsOfFate?.length ?? 0) > 0
                ? (heroSelectionId) =>
                    setPicker({
                      kind: "vision",
                      heroSelectionId,
                    })
                : undefined
            }
            specialTables={specialTables}
            specialEnhancementPicks={specialEnhancementPicks}
            onPickSpecial={onPickSpecial}
            onOpenDatasheet={setDatasheet}
            onRemove={() => void commit(clearRoREnhancements(list))}
            bindNotes={bindNotes}
            onPlayHealth={(selectionId, damage) =>
              void setPlayDamage(selectionId, damage)
            }
          />
        ) : null}

        {list.auxiliaries.length > 0 && !spearhead ? (
          <section className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
              Auxiliaries
            </h2>
            <ul className="flex flex-col gap-2">
              {list.auxiliaries.map((slot) => {
                const unit = getUnit(faction, slot.unitId);
                if (!unit) {
                  return null;
                }
                if (forPlayMode) {
                  const track = selectionPlayState(slot, unit);
                  const warning = battleDamagedWarning(unit, track.damage);
                  return (
                    <li key={slot.id}>
                      <div className="rounded-xl bg-parchment-ink/5 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setDatasheet(unit)}
                            className="min-w-0 w-fit max-w-full text-left"
                          >
                            <span className="font-serif text-lg leading-tight">
                              {unit.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-parchment-ink/60">
                              {battleStatLine(unit)}
                            </span>
                          </button>
                          <PlayHealthTrack
                            aside
                            track={track}
                            onChange={(damage) =>
                              void setPlayDamage(slot.id, damage)
                            }
                          />
                        </div>
                        {warning ? (
                          <p className="mt-2 rounded-lg bg-illegal/10 px-2.5 py-2 text-sm leading-snug text-illegal">
                            Battle damaged ({warning.threshold}+) ·{" "}
                            {warning.summary}
                          </p>
                        ) : null}
                        <PlayBindNotes
                          selectionId={slot.id}
                          notes={bindNotes}
                        />
                        <SlotEnhancements
                          selectionId={slot.id}
                          unit={unit}
                          playMode={forPlayMode}
                          artefactBearerId={list.artefact?.heroSelectionId}
                          artefactLabel={enhancementLabel(
                            faction.artefacts,
                            list.artefact?.optionId,
                          )}
                          artefactAbilities={
                            list.artefact
                              ? faction.artefacts.find(
                                  (item) =>
                                    item.id === list.artefact?.optionId,
                                )?.abilities
                              : undefined
                          }
                          heroicTraitBearerId={
                            list.heroicTrait?.heroSelectionId
                          }
                          heroicTraitLabel={enhancementLabel(
                            faction.heroicTraits,
                            list.heroicTrait?.optionId,
                          )}
                          heroicTraitAbilities={
                            list.heroicTrait
                              ? faction.heroicTraits.find(
                                  (item) =>
                                    item.id === list.heroicTrait?.optionId,
                                )?.abilities
                              : undefined
                          }
                          monstrousTraitBearerId={
                            list.monstrousTrait?.heroSelectionId
                          }
                          monstrousTraitLabel={enhancementLabel(
                            faction.monstrousTraits ?? [],
                            list.monstrousTrait?.optionId,
                          )}
                          monstrousTraitAbilities={
                            list.monstrousTrait
                              ? faction.monstrousTraits?.find(
                                  (item) =>
                                    item.id === list.monstrousTrait?.optionId,
                                )?.abilities
                              : undefined
                          }
                          visionBearerId={list.visionOfFate?.heroSelectionId}
                          visionLabel={enhancementLabel(
                            faction.visionsOfFate ?? [],
                            list.visionOfFate?.optionId,
                          )}
                          visionAbilities={
                            list.visionOfFate
                              ? faction.visionsOfFate?.find(
                                  (item) =>
                                    item.id === list.visionOfFate?.optionId,
                                )?.abilities
                              : undefined
                          }
                          specialTables={specialTables}
                          specialEnhancementPicks={specialEnhancementPicks}
                          onPickSpecial={
                            onPickSpecial
                              ? (tableId) =>
                                  onPickSpecial(tableId, slot.id)
                              : undefined
                          }
                        />
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={slot.id}>
                    <BuildSlotRow
                      name={unit.name}
                      subtitle={`${unitSizeLabel(unit, slot.reinforced)} · ${selectionPoints(unit, slot.reinforced)} pts`}
                      reinforced={slot.reinforced}
                      sheetLabel={`${unit.name} datasheet`}
                      onOpenSheet={() => setDatasheet(unit)}
                      trailing={
                        <SlotMoreMenu
                          reinforced={slot.reinforced}
                          canReinforce={unit.reinforce}
                          onToggleReinforce={
                            unit.reinforce
                              ? () =>
                                  void commit({
                                    ...list,
                                    auxiliaries: list.auxiliaries.map((item) =>
                                      item.id === slot.id
                                        ? {
                                            ...item,
                                            reinforced: !item.reinforced,
                                          }
                                        : item,
                                    ),
                                  })
                              : undefined
                          }
                          onDuplicate={
                            !unit.unique
                              ? () =>
                                  void commit({
                                    ...list,
                                    auxiliaries: [
                                    ...list.auxiliaries,
                                    {
                                      id: createId(),
                                      unitId: slot.unitId,
                                      reinforced: slot.reinforced,
                                    },
                                  ],
                                })
                            : undefined
                        }
                        onRemove={() =>
                          void commit(
                            dropEnhancements(
                              {
                                ...list,
                                auxiliaries: list.auxiliaries.filter(
                                  (item) => item.id !== slot.id,
                                ),
                              },
                              slot.id,
                            ),
                          )
                        }
                      />
                      }
                    />
                    <SlotEnhancements
                      selectionId={slot.id}
                      unit={unit}
                      playMode={false}
                      artefactBearerId={list.artefact?.heroSelectionId}
                      artefactLabel={enhancementLabel(
                        faction.artefacts,
                        list.artefact?.optionId,
                      )}
                      artefactAbilities={
                        list.artefact
                          ? faction.artefacts.find(
                              (item) => item.id === list.artefact?.optionId,
                            )?.abilities
                          : undefined
                      }
                      heroicTraitBearerId={list.heroicTrait?.heroSelectionId}
                      heroicTraitLabel={enhancementLabel(
                        faction.heroicTraits,
                        list.heroicTrait?.optionId,
                      )}
                      heroicTraitAbilities={
                        list.heroicTrait
                          ? faction.heroicTraits.find(
                              (item) =>
                                item.id === list.heroicTrait?.optionId,
                            )?.abilities
                          : undefined
                      }
                      monstrousTraitBearerId={
                        list.monstrousTrait?.heroSelectionId
                      }
                      monstrousTraitLabel={enhancementLabel(
                        faction.monstrousTraits ?? [],
                        list.monstrousTrait?.optionId,
                      )}
                      monstrousTraitAbilities={
                        list.monstrousTrait
                          ? faction.monstrousTraits?.find(
                              (item) =>
                                item.id === list.monstrousTrait?.optionId,
                            )?.abilities
                          : undefined
                      }
                      visionBearerId={list.visionOfFate?.heroSelectionId}
                      visionLabel={enhancementLabel(
                        faction.visionsOfFate ?? [],
                        list.visionOfFate?.optionId,
                      )}
                      visionAbilities={
                        list.visionOfFate
                          ? faction.visionsOfFate?.find(
                              (item) =>
                                item.id === list.visionOfFate?.optionId,
                            )?.abilities
                          : undefined
                      }
                      onPickArtefact={
                        faction.artefacts.length > 0
                          ? (heroSelectionId) =>
                              setPicker({
                                kind: "artefact",
                                heroSelectionId,
                              })
                          : undefined
                      }
                      onPickTrait={
                        faction.heroicTraits.length > 0
                          ? (heroSelectionId) =>
                              setPicker({
                                kind: "trait",
                                heroSelectionId,
                              })
                          : undefined
                      }
                      onPickMonstrousTrait={
                        (faction.monstrousTraits?.length ?? 0) > 0
                          ? (heroSelectionId) =>
                              setPicker({
                                kind: "monstrous",
                                heroSelectionId,
                              })
                          : undefined
                      }
                      onPickVision={
                        (faction.visionsOfFate?.length ?? 0) > 0
                          ? (heroSelectionId) =>
                              setPicker({
                                kind: "vision",
                                heroSelectionId,
                              })
                          : undefined
                      }
                      specialTables={specialTables}
                      specialEnhancementPicks={specialEnhancementPicks}
                      onPickSpecial={
                        onPickSpecial
                          ? (tableId) => onPickSpecial(tableId, slot.id)
                          : undefined
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {!forPlayMode && !spearhead ? (
          <div className="flex cursor-default flex-wrap items-center gap-x-1 px-1">
            {list.regiments.length < 5 ? (
              <button
                type="button"
                onClick={() => openNewRegimentHeroPicker()}
                className={
                  list.regiments.length === 0
                    ? BUILDER_ADD_ACTION_EMPHASIS_CLASS
                    : BUILDER_ADD_ACTION_CLASS
                }
              >
                + Regiment
              </button>
            ) : null}
            {list.regiments.length < 5 ? (
              <span className="text-parchment/25" aria-hidden="true">
                ·
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setPicker({ kind: "aux" })}
              className={BUILDER_ADD_ACTION_CLASS}
            >
              + Auxiliary
            </button>
            {rorOptions.length > 0 ? (
              <>
                <span className="text-parchment/25" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => setPicker({ kind: "ror" })}
                  className={BUILDER_ADD_ACTION_CLASS}
                >
                  {list.regimentOfRenown
                    ? "Change Regiment of Renown"
                    : "+ Regiment of Renown"}
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        {faction.manifestationLores.length > 0 && !spearhead ? (
          <ManifestationCard
            lore={manifestation ?? null}
            lores={faction.manifestationLores}
            playMode={forPlayMode}
            onChangeLore={(loreId) =>
              void commit({ ...list, manifestationLoreId: loreId })
            }
            onOpenSheet={setDatasheet}
          />
        ) : null}

        {faction.terrain.length > 0 && !spearhead ? (
          <TerrainCard terrain={faction.terrain} onOpenSheet={setDatasheet} />
        ) : null}
          </>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-full w-full max-w-[100vw] overflow-x-hidden text-parchment">
      <div className="overflow-x-hidden">
        <div
          className={`builder-view-track ${pane === "play" ? "builder-view-track--play" : ""}`}
        >
          <div className="builder-view-pane" aria-hidden={pane === "play"}>
            {renderListMain(false)}
          </div>
          <div className="builder-view-pane" aria-hidden={pane === "build"}>
            {renderListMain(true)}
          </div>
        </div>
      </div>

      {picker && pickerUnits && !playMode && !spearhead ? (
        <PickerSheet
          title={
            picker.kind === "hero"
              ? "Choose a hero"
              : picker.kind === "aux"
                ? "Auxiliary"
                : "Add a unit"
          }
          units={pickerUnits}
          onPick={(unit) => void onPick(unit)}
          onOpenDatasheet={setDatasheet}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {datasheet ? (
        <DatasheetSheet
          sheet={datasheet}
          hidePoints={spearhead}
          onClose={() => setDatasheet(null)}
        />
      ) : null}

      {enhancementPicker && (!spearhead || picker?.kind === "trait") ? (
        <ChoiceSheet
          title={enhancementPicker.title}
          options={enhancementPicker.options}
          selectedId={enhancementPicker.selectedId}
          onPick={(option) => void onChooseEnhancement(option)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {rorPicker && !playMode && !spearhead ? (
        <ChoiceSheet
          title={rorPicker.title}
          options={rorPicker.options}
          selectedId={rorPicker.selectedId}
          onPick={(option) => {
            if (!option) {
              void commit(clearRoREnhancements(list));
              setPicker(null);
              return;
            }
            const next = buildRoRSelections(option.id, createId);
            if (!next) {
              setPicker(null);
              return;
            }
            void commit({
              ...clearRoREnhancements(list),
              regimentOfRenown: next,
            });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {regimentRemoveId ? (
        <ModalFrame
          label="Remove regiment"
          onClose={() => setRegimentRemoveId(null)}
          panelClassName={CONFIRM_SHEET_PANEL_CLASS}
        >
          <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
            {regimentRemoveMessage}
          </p>
          <ConfirmSheetActions
            onConfirm={() => void removeRegiment(regimentRemoveId)}
            onCancel={() => setRegimentRemoveId(null)}
          />
        </ModalFrame>
      ) : null}
    </div>
  );
}

function takenUniqueBases(
  list: ArmyList,
  faction: FactionCatalogue,
  exceptUnitId?: string,
): Set<string> {
  const bases = new Set<string>();
  const add = (unitId: string) => {
    const unit = getUnit(faction, unitId);
    if (unit?.unique) {
      bases.add(unitBaseName(unit.name));
    }
  };
  for (const regiment of list.regiments) {
    if (regiment.hero) {
      add(regiment.hero.unitId);
    }
    for (const slot of regiment.units) {
      add(slot.unitId);
    }
  }
  for (const slot of list.auxiliaries) {
    add(slot.unitId);
  }
  const ror = list.regimentOfRenown
    ? getRegimentOfRenown(list.regimentOfRenown.renownId)
    : undefined;
  for (const unit of ror?.units ?? []) {
    if (unit.unique) {
      bases.add(unitBaseName(unit.name));
    }
  }
  if (exceptUnitId) {
    const except = getUnit(faction, exceptUnitId);
    if (except?.unique) {
      bases.delete(unitBaseName(except.name));
    }
  }
  return bases;
}

function available(
  list: ArmyList,
  faction: FactionCatalogue,
  units: CatalogueUnit[],
  exceptUnitId?: string,
): CatalogueUnit[] {
  const taken = takenUniqueBases(list, faction, exceptUnitId);
  return units.filter(
    (unit) => !unit.unique || !taken.has(unitBaseName(unit.name)),
  );
}

function pickerUnitsFor(
  list: ArmyList,
  faction: FactionCatalogue,
  picker: Picker,
): CatalogueUnit[] | null {
  if (!picker) {
    return null;
  }
  if (picker.kind === "hero") {
    const current = picker.regimentId
      ? list.regiments.find((item) => item.id === picker.regimentId)?.hero
          ?.unitId
      : undefined;
    return available(list, faction, heroesOf(faction), current);
  }
  if (picker.kind === "aux") {
    return available(list, faction, auxiliaryPickerUnits(faction));
  }
  if (picker.kind !== "unit") {
    return null;
  }
  const regiment = list.regiments.find((item) => item.id === picker.regimentId);
  const hero = regiment?.hero
    ? getUnit(faction, regiment.hero.unitId)
    : undefined;
  if (!hero) {
    return [];
  }
  return available(list, faction, legalCompanions(faction, hero));
}

function dropEnhancements(list: ArmyList, heroSelectionId?: string): ArmyList {
  if (!heroSelectionId) {
    return list;
  }
  return {
    ...list,
    artefact:
      list.artefact?.heroSelectionId === heroSelectionId ? null : list.artefact,
    heroicTrait:
      list.heroicTrait?.heroSelectionId === heroSelectionId
        ? null
        : list.heroicTrait,
    monstrousTrait:
      list.monstrousTrait?.heroSelectionId === heroSelectionId
        ? null
        : list.monstrousTrait,
    visionOfFate:
      list.visionOfFate?.heroSelectionId === heroSelectionId
        ? null
        : list.visionOfFate,
    specialEnhancements: (list.specialEnhancements ?? []).filter(
      (pick) => pick.heroSelectionId !== heroSelectionId,
    ),
  };
}

function enhancementChoices(options: EnhancementOption[]) {
  return options.map((item) => ({
    ...item,
    detail: enhancementChoiceDetail(item),
  }));
}

function BattleTacticCardPicker({
  list,
  cards,
  onCommit,
}: {
  list: ArmyList;
  cards: typeof battleTactics;
  onCommit: (next: ArmyList) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const cardKey = cards.map((card) => card.id).join("\0");

  useEffect(() => {
    setExpandedIds(new Set());
  }, [cardKey]);

  if (!list.scourgeRealm) {
    return (
      <p className="text-xs text-ink-muted">
        Choose Scourge of Aqshy or Scourge of Ghyran above first.
      </p>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  const selectedIds = list.battleTacticCardIds ?? [];

  function commitIds(ids: string[]) {
    const stage = { ...(list.battleTacticStage ?? {}) };
    for (const key of Object.keys(stage)) {
      if (!ids.includes(key)) {
        delete stage[key];
      }
    }
    onCommit({
      ...list,
      battleTacticCardIds: ids,
      battleTacticStage: stage,
    });
  }

  function toggleCard(cardId: string) {
    if (selectedIds.includes(cardId)) {
      commitIds(selectedIds.filter((id) => id !== cardId));
      return;
    }
    if (selectedIds.length >= 2) {
      return;
    }
    commitIds([...selectedIds, cardId]);
  }

  const atCap = selectedIds.length >= 2;

  function toggleExpanded(cardId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs text-ink-muted">
        {selectedIds.length === 0
          ? "Check up to 2 cards. Use the arrow to read details."
          : `${selectedIds.length} of 2 selected.`}
      </p>
      <ul className="flex flex-col gap-3">
        {cards.map((card) => {
          const pickIndex = selectedIds.indexOf(card.id);
          const picked = pickIndex >= 0;
          const disabled = !picked && atCap;
          const expanded = expandedIds.has(card.id);
          const shellClass = picked
            ? "bg-aether/15 ring-aether/40"
            : disabled
              ? "bg-parchment/5 ring-parchment/10 opacity-70"
              : "bg-parchment/5 ring-parchment/10";
          return (
            <li key={card.id}>
              <article
                className={`w-full rounded-xl ring-1 transition ${shellClass}`}
              >
                <div className="flex items-start gap-2 px-3 py-3">
                  <label
                    className={`flex min-w-0 flex-1 items-start gap-3 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={picked}
                      disabled={disabled}
                      onChange={() => toggleCard(card.id)}
                      aria-label={`Select ${card.name}`}
                      className="mt-0.5 size-5 shrink-0 accent-aether disabled:cursor-not-allowed"
                    />
                    <span
                      className={`min-w-0 flex-1 text-left text-xs leading-relaxed ${
                        picked
                          ? "text-parchment"
                          : disabled
                            ? "text-parchment/45"
                            : "text-parchment/80"
                      }`}
                    >
                      <span className="font-medium text-sm text-parchment">
                        {card.name}
                      </span>
                      {picked ? (
                        <span className="ml-2 text-aether">
                          Card {pickIndex + 1}
                        </span>
                      ) : null}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? `Hide ${card.name} details`
                        : `Show ${card.name} details`
                    }
                    onClick={() => toggleExpanded(card.id)}
                    className="pressable -mr-1 shrink-0 rounded-lg p-1.5 text-parchment/45 hover:bg-parchment/10 hover:text-parchment/70"
                  >
                    <BattleTacticCollapseChevron open={expanded} />
                  </button>
                </div>
                {expanded ? (
                  <div className="border-t border-parchment/10 px-3 pb-3 pt-2 text-xs leading-relaxed text-parchment/80">
                    {card.setup ? (
                      <p className="text-parchment/70">{card.setup}</p>
                    ) : null}
                    {card.affray ? (
                      <p className={card.setup ? "mt-2" : undefined}>
                        <span className="font-semibold uppercase text-parchment/55">
                          Affray ·{" "}
                        </span>
                        {card.affray}
                      </p>
                    ) : null}
                    {card.strike ? (
                      <p className="mt-2">
                        <span className="font-semibold uppercase text-parchment/55">
                          Strike ·{" "}
                        </span>
                        {card.strike}
                      </p>
                    ) : null}
                    {card.domination ? (
                      <p className="mt-2">
                        <span className="font-semibold uppercase text-parchment/55">
                          Domination ·{" "}
                        </span>
                        {card.domination}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BattleTacticCollapseChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-200 ${
        open ? "rotate-180" : ""
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
  );
}

function PlaySummary({
  list,
  faction,
}: {
  list: ArmyList;
  faction: FactionCatalogue;
}) {
  const formation = faction.formations.find(
    (item) => item.id === (list.regimentAbilityId ?? list.formationId),
  );
  const spell = isSpearheadList(list)
    ? undefined
    : namedOption(faction.spellLores, list.spellLoreId);
  const prayer = isSpearheadList(list)
    ? undefined
    : namedOption(faction.prayerLores, list.prayerLoreId);
  const lines = [
    formation?.name,
    spell?.name,
    prayer?.name,
  ].filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-ink-raised px-4 py-3 text-sm text-parchment/85 ring-1 ring-parchment/12">
      <p>{lines.join(" · ")}</p>
    </div>
  );
}
