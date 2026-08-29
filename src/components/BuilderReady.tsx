"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useDeferredValue,
} from "react";
import {
  armyHasKeyword,
  battleDamagedWarning,
  battleStatLine,
  canBeGeneral,
  enhancementChoiceDetail,
  enhancementLabel,
  formationLabel,
  getUnit,
  listRegimentsOfRenown,
  resolveGeneralRegimentId,
  selectionPlayState,
  selectionPoints,
  unitSizeLabel,
} from "@/engine/queries";
import { battleTacticsForRealm } from "@/engine/data/load";
import { dropEnhancements, pickerUnitsFor, type ListPicker as Picker } from "@/engine/listPicker";
import { combatModifierNotes } from "@/engine/magic";
import { isSpearheadList } from "@/engine/spearhead";
import { summarize } from "@/engine/validate";
import type {
  ArmyList,
  CatalogueUnit,
  DatasheetSubject,
  EnhancementOption,
  FactionCatalogue,
  NamedOption,
} from "@/engine/types";
import { castValueLabel } from "@/lib/abilityUi";
import {
  BUILDER_ADD_ACTION_CLASS,
  BUILDER_ADD_ACTION_EMPHASIS_CLASS,
  CONFIRM_SHEET_PANEL_CLASS,
  LIST_ISSUE_BANNER_CLASS,
  builderPlayTabs,
} from "@/lib/builderUi";
import { createId } from "@/lib/id";
import { appendRegimentWithHero, saveArmy } from "@/lib/storage";
import { BattleTacticCardPicker } from "./BattleTacticCardPicker";
import { BattleTacticTracker } from "./BattleTacticTracker";
import { ConfirmSheetActions } from "./ConfirmSheetActions";
import { DatasheetSheet } from "./DatasheetSheet";
import { ManifestationCard } from "./ManifestationCard";
import { ModalFrame } from "./ModalFrame";
import { ChoiceSheet, PickerSheet } from "./PickerSheet";
import { PlayMagicBoard } from "./PlayMagicBoard";
import { PlayPhaseBoard } from "./PlayPhaseBoard";
import { PlaySummary } from "./PlaySummary";
import {
  buildRoRSelections,
  clearRoREnhancements,
  RegimentOfRenownCard,
} from "./RegimentOfRenownCard";
import {
  PlayBindNotes,
  PlayHealthTrack,
  RegimentCard,
  SlotEnhancements,
  SlotMoreMenu,
} from "./RegimentCard";
import { RuleText } from "./RuleText";
import { SpearheadPicks } from "./SpearheadPicks";
import { TerrainCard } from "./TerrainCard";
import { BuildSlotRow } from "./ios/SheetIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { PointsCapField } from "./PointsCapField";
import { useListFlowChrome } from "./ListFlowShell";

function enhancementChoices(options: EnhancementOption[]) {
  return options.map((item) => ({
    ...item,
    detail: enhancementChoiceDetail(item),
  }));
}
export function BuilderReady({
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
  const [optionsOpen, setOptionsOpen] = useState(false);
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
    setOptionsOpen(false);
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
          <section
            className={`min-w-0 rounded-2xl bg-ink-raised ring-1 ring-parchment/12 ${
              optionsOpen ? "pb-4" : ""
            }`}
          >
            <button
              type="button"
              aria-expanded={optionsOpen}
              onClick={() => setOptionsOpen((open) => !open)}
              className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-sm text-parchment/85"
            >
              <span className="font-medium tracking-wide">Options</span>
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                {!optionsOpen ? (
                  <span>Points · Lores · Tactics</span>
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
            ) : null}
          </section>
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
