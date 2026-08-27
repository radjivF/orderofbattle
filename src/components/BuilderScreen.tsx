"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getFaction, getUnit, heroesOf, legalCompanions, armyHasKeyword, namedOption, battleDamagedWarning, battleStatLine, selectionPlayState, selectionPoints, factionHasScourge, resolveUnitIdForRealm, unitBaseName, unitsForRealm, canBeGeneral, resolveGeneralRegimentId, listRegimentsOfRenown, getRegimentOfRenown, enhancementChoiceDetail, enhancementLabel, type ScourgeRealm } from "@/engine/queries";
import { combatModifierNotes } from "@/engine/magic";
import { summarize } from "@/engine/validate";
import { formatPoints } from "@/engine/pointsCap";
import type { ArmyList, CatalogueUnit, DatasheetSubject, EnhancementOption, FactionCatalogue, NamedOption } from "@/engine/types";
import { createId } from "@/lib/id";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  saveArmy,
  subscribeArmies,
} from "@/lib/storage";
import { DatasheetSheet } from "./DatasheetSheet";
import { FactionBackdrop } from "./FactionBackdrop";
import { ChoiceSheet, PickerSheet } from "./PickerSheet";
import { PointsCapField } from "./PointsCapField";
import { ManifestationCard } from "./ManifestationCard";
import { PlayMagicBoard } from "./PlayMagicBoard";
import { PlayPhaseBoard } from "./PlayPhaseBoard";
import { PlayBindNotes, PlayHealthTrack, RegimentCard, SlotEnhancements, SlotMoreMenu } from "./RegimentCard";
import {
  buildRoRSelections,
  clearRoREnhancements,
  RegimentOfRenownCard,
} from "./RegimentOfRenownCard";
import { TerrainCard } from "./TerrainCard";

type Picker =
  | { kind: "hero"; regimentId: string }
  | { kind: "unit"; regimentId: string }
  | { kind: "aux" }
  | { kind: "ror" }
  | { kind: "artefact"; heroSelectionId: string }
  | { kind: "trait"; heroSelectionId: string }
  | { kind: "monstrous"; heroSelectionId: string }
  | { kind: "vision"; heroSelectionId: string }
  | null;

type Props = {
  listId: string;
};

export function BuilderScreen({ listId }: Props) {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const list = lists?.find((item) => item.id === listId);
  const faction = list ? getFaction(list.factionId) : undefined;

  if (lists === undefined) {
    return (
      <div className="min-h-full bg-ink px-6 py-10 text-ink-muted">
        Opening list…
      </div>
    );
  }

  if (!list || !faction) {
    return (
      <div className="flex min-h-full flex-col items-start bg-ink px-6 py-10 text-parchment">
        <p className="font-serif text-3xl">This list is gone.</p>
        <Link href="/dashboard" className="mt-6 min-h-11 text-sigmarite">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <FactionBackdrop
      factionId={faction.parentFactionIds?.[0] ?? faction.id}
      factionName={faction.name}
    >
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
  const [playMode, setPlayMode] = useState(false);
  const [playTab, setPlayTab] = useState<"units" | "magic" | "phases">("units");
  const totals = useMemo(() => summarize(list, faction), [list, faction]);
  const bindNotes = useMemo(
    () => (playMode ? combatModifierNotes(list, faction) : []),
    [playMode, list, faction],
  );
  const issue = totals.issues[0] ?? {
    tone: "warn" as const,
    text: "Add a regiment to begin.",
  };
  const pickerUnits = pickerUnitsFor(list, faction, picker);
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
    if (
      nextPrayer === list.prayerLoreId &&
      nextSpell === list.spellLoreId &&
      nextGeneral === list.generalRegimentId
    ) {
      return;
    }
    void commit({
      ...list,
      prayerLoreId: nextPrayer,
      spellLoreId: nextSpell,
      generalRegimentId: nextGeneral,
    });
  }, [list, faction]);

  async function addRegiment() {
    if (list.regiments.length >= 5) {
      return;
    }
    const id = createId();
    await commit({
      ...list,
      regiments: [...list.regiments, { id, hero: null, units: [] }],
      generalRegimentId: list.generalRegimentId ?? id,
    });
    setSelectedRegimentId(id);
    setPicker({ kind: "hero", regimentId: id });
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

  async function onPick(unit: CatalogueUnit) {
    if (!picker) {
      return;
    }
    if (picker.kind === "hero") {
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
        picker.kind !== "vision")
    ) {
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
            title: "Heroic trait",
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
            : null;

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

  return (
    <div className="min-h-full w-full max-w-[100vw] overflow-x-hidden text-parchment">
      <header className="sticky top-0 z-20 border-b border-sigmarite/15 bg-ink/92 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap">
          <Link
            href="/dashboard"
            className="gold-plate inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-ink active:translate-y-px sm:px-4"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
            >
              <path
                d="M12.5 4.5 7 10l5.5 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-semibold tracking-wide">Lists</span>
          </Link>
          {playMode ? (
            <p className="min-h-11 min-w-0 flex-1 content-center truncate font-serif text-xl">
              {list.name}
            </p>
          ) : (
            <input
              value={list.name}
              onChange={(event) => void commit({ ...list, name: event.target.value })}
              aria-label="List name"
              placeholder="Name your list"
              className="min-h-11 min-w-0 flex-1 border-b border-parchment/20 bg-transparent font-serif text-xl outline-none placeholder:text-parchment/35"
            />
          )}
          <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 sm:ml-auto sm:w-auto">
            {!playMode ? (
              <div className="text-left sm:text-right">
                <p className="text-lg text-sigmarite">
                  {formatPoints(totals.points)}
                  <span className="text-ink-muted">
                    {" "}
                    / {formatPoints(list.pointsCap)}
                  </span>
                </p>
                <p className="text-xs text-ink-muted">{totals.drops} drops</p>
              </div>
            ) : (
              <span className="sm:hidden" />
            )}
            <div
              role="group"
              aria-label="Mode"
              className="flex rounded-xl bg-ink-raised p-1 text-xs ring-1 ring-sigmarite/25"
            >
              <button
                type="button"
                onClick={() => setPlayMode(false)}
                className={`min-h-9 rounded-lg px-3 ${
                  playMode ? "text-ink-muted" : "gold-plate text-ink"
                }`}
              >
                Build
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlayMode(true);
                  setPlayTab("units");
                  setPicker(null);
                }}
                className={`min-h-9 rounded-lg px-3 ${
                  playMode ? "gold-plate text-ink" : "text-ink-muted"
                }`}
              >
                Play
              </button>
            </div>
          </div>
        </div>
        {!playMode ? (
          <p
            className={`mx-auto flex max-w-3xl items-center gap-2 px-4 pb-3 text-sm ${
              issue.tone === "ok"
                ? "text-parchment/80"
                : "font-medium text-illegal"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${
                issue.tone === "bad" || issue.tone === "warn"
                  ? "bg-illegal"
                  : "bg-legal"
              }`}
            />
            <span>{issue.text}</span>
          </p>
        ) : (
          <div className="mx-auto flex max-w-3xl gap-2 px-4 pb-3">
            <button
              type="button"
              onClick={() => setPlayTab("units")}
              className={`min-h-11 flex-1 rounded-xl text-sm ${
                playTab === "units"
                  ? "bg-parchment text-parchment-ink"
                  : "bg-ink-raised text-parchment/80 ring-1 ring-parchment/15"
              }`}
            >
              Units
            </button>
            <button
              type="button"
              onClick={() => setPlayTab("magic")}
              className={`min-h-11 flex-1 rounded-xl text-sm ${
                playTab === "magic"
                  ? "bg-parchment text-parchment-ink"
                  : "bg-ink-raised text-parchment/80 ring-1 ring-parchment/15"
              }`}
            >
              Magic / Prayer
            </button>
            <button
              type="button"
              onClick={() => setPlayTab("phases")}
              className={`min-h-11 flex-1 rounded-xl text-sm ${
                playTab === "phases"
                  ? "bg-parchment text-parchment-ink"
                  : "bg-ink-raised text-parchment/80 ring-1 ring-parchment/15"
              }`}
            >
              Phases
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-5 px-4 py-6 pb-28">
        {!playMode ? (
        <div className="flex min-w-0 flex-col gap-4">
          <PointsCapField
            value={list.pointsCap}
            onChange={(pointsCap) => void commit({ ...list, pointsCap })}
            variant="ink"
          />
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
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
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
                      <p className="mt-2 text-sm leading-relaxed text-parchment-ink/75">
                        <span className="text-sheet-muted">Declare · </span>
                        {ability.declare}
                      </p>
                    ) : null}
                    {ability.effect ? (
                      <p className="mt-1 text-sm leading-relaxed text-parchment-ink/75">
                        <span className="text-sheet-muted">Effect · </span>
                        {ability.effect}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          ) : null}

          {factionHasScourge(faction) ? (
            <label className="flex flex-col gap-2 text-sm text-parchment/80">
              Datasheet season
              <select
                value={list.scourgeRealm ?? ""}
                onChange={(event) => {
                  const realm = (event.target.value || null) as ScourgeRealm | null;
                  void commit(applyScourgeRealm(list, faction, realm));
                }}
                className="min-h-11 w-full max-w-full rounded-xl bg-parchment px-3 text-parchment-ink"
              >
                <option value="">Core datasheets</option>
                <option value="aqshy">Scourge of Aqshy</option>
                <option value="ghyran">Scourge of Ghyran</option>
              </select>
              <span className="text-xs text-ink-muted">
                Replaces matching warscrolls; other units keep their core sheet.
              </span>
            </label>
          ) : null}

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
                            ? `Cast ${power.castingValue}`
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
                        <p className="mt-2 text-sm leading-relaxed text-parchment-ink/75">
                          <span className="text-sheet-muted">Declare · </span>
                          {power.declare}
                        </p>
                      ) : null}
                      {power.effect ? (
                        <p className="mt-1 text-sm leading-relaxed text-parchment-ink/75">
                          <span className="text-sheet-muted">Effect · </span>
                          {power.effect}
                        </p>
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
        </div>
        ) : playTab === "units" ? (
          <PlaySummary list={list} faction={faction} />
        ) : null}

        {playMode && playTab === "phases" ? (
          <PlayPhaseBoard
            list={list}
            faction={faction}
            onOpenSheet={setDatasheet}
          />
        ) : playMode && playTab === "magic" ? (
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
        {list.regiments.map((regiment) => (
          <RegimentCard
            key={regiment.id}
            regiment={regiment}
            faction={faction}
            isGeneral={list.generalRegimentId === regiment.id}
            canBeGeneral={canBeGeneral(list, faction, regiment.id)}
            slotCap={totals.slotCap(regiment.id)}
            selected={selectedId === regiment.id}
            playMode={playMode}
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
            onRemoveRegiment={() => {
              const selectionIds = [
                regiment.hero?.id,
                ...regiment.units.map((slot) => slot.id),
              ];
              let next: ArmyList = {
                ...list,
                regiments: list.regiments.filter(
                  (item) => item.id !== regiment.id,
                ),
                generalRegimentId:
                  list.generalRegimentId === regiment.id
                    ? (list.regiments.find((item) => item.id !== regiment.id)
                        ?.id ?? null)
                    : list.generalRegimentId,
              };
              for (const selectionId of selectionIds) {
                next = dropEnhancements(next, selectionId);
              }
              void commit(next);
            }}
            bindNotes={bindNotes}
            onPlayHealth={(selectionId, damage) =>
              void setPlayDamage(selectionId, damage)
            }
          />
        ))}

        {list.regimentOfRenown ? (
          <RegimentOfRenownCard
            list={list}
            playMode={playMode}
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
            onOpenDatasheet={setDatasheet}
            onRemove={() => void commit(clearRoREnhancements(list))}
            bindNotes={bindNotes}
            onPlayHealth={(selectionId, damage) =>
              void setPlayDamage(selectionId, damage)
            }
          />
        ) : null}

        {list.auxiliaries.length > 0 ? (
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
                if (playMode) {
                  const track = selectionPlayState(slot, unit);
                  const warning = battleDamagedWarning(unit, track.damage);
                  return (
                    <li key={slot.id}>
                      <div className="rounded-xl bg-parchment-ink/5 px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setDatasheet(unit)}
                            className="min-w-0 flex-1 text-left"
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
                          playMode
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
                        />
                      </div>
                    </li>
                  );
                }
                return (
                  <li
                    key={slot.id}
                    className="rounded-xl bg-parchment-ink/5 pl-3"
                  >
                    <div className="flex min-h-11 items-center gap-1">
                    <div className="min-w-0 flex-1 py-2 pr-2">
                      <p className="truncate font-serif text-lg text-parchment-ink">
                        {unit.name}
                        {slot.reinforced ? (
                          <span className="ml-2 font-sans text-xs text-sheet-muted">
                            reinforced
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-sm text-gold-deep">
                        {selectionPoints(unit, slot.reinforced)} pts
                      </p>
                    </div>
                    <div className="flex shrink-0 items-stretch">
                      <button
                        type="button"
                        className="min-h-11 px-2.5 text-sm text-aether"
                        onClick={() => setDatasheet(unit)}
                      >
                        Sheet
                      </button>
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
                    </div>
                    </div>
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
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {!playMode ? (
          <div className="flex flex-wrap items-center gap-x-1 px-1">
            {list.regiments.length < 5 ? (
              <button
                type="button"
                onClick={() => void addRegiment()}
                className={`min-h-11 px-2 text-sm ${
                  list.regiments.length === 0
                    ? "text-sigmarite"
                    : "text-ink-muted"
                }`}
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
              className="min-h-11 px-2 text-sm text-ink-muted"
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
                  className="min-h-11 px-2 text-sm text-ink-muted"
                >
                  {list.regimentOfRenown
                    ? "Change Regiment of Renown"
                    : "+ Regiment of Renown"}
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        {faction.manifestationLores.length > 0 ? (
          <ManifestationCard
            lore={manifestation ?? null}
            lores={faction.manifestationLores}
            playMode={playMode}
            onChangeLore={(loreId) =>
              void commit({ ...list, manifestationLoreId: loreId })
            }
            onOpenSheet={setDatasheet}
          />
        ) : null}

        {faction.terrain.length > 0 ? (
          <TerrainCard
            terrain={faction.terrain}
            playMode={playMode}
            onOpenSheet={setDatasheet}
          />
        ) : null}
          </>
        )}
      </main>

      {picker && pickerUnits && !playMode ? (
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
          onClose={() => setDatasheet(null)}
        />
      ) : null}

      {enhancementPicker ? (
        <ChoiceSheet
          title={enhancementPicker.title}
          options={enhancementPicker.options}
          selectedId={enhancementPicker.selectedId}
          onPick={(option) => void onChooseEnhancement(option)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {rorPicker && !playMode ? (
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
  const realm = list.scourgeRealm ?? null;
  if (picker.kind === "hero") {
    const current = list.regiments.find((item) => item.id === picker.regimentId)
      ?.hero?.unitId;
    return available(list, faction, heroesOf(faction, realm), current);
  }
  if (picker.kind === "aux") {
    // GHB: heroes may be auxiliaries unless they have compulsory regiment
    // options. Our catalogues only model optional slots, so include heroes
    // (e.g. Harbinger of Decay as a priest aux).
    return available(list, faction, unitsForRealm(faction, realm));
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
  return available(list, faction, legalCompanions(faction, hero, realm));
}

function applyScourgeRealm(
  list: ArmyList,
  faction: FactionCatalogue,
  realm: ScourgeRealm | null,
): ArmyList {
  const remap = (unitId: string) =>
    resolveUnitIdForRealm(faction, unitId, realm);
  return {
    ...list,
    scourgeRealm: realm,
    regiments: list.regiments.map((regiment) => ({
      ...regiment,
      hero: regiment.hero
        ? { ...regiment.hero, unitId: remap(regiment.hero.unitId) }
        : null,
      units: regiment.units.map((slot) => ({
        ...slot,
        unitId: remap(slot.unitId),
      })),
    })),
    auxiliaries: list.auxiliaries.map((slot) => ({
      ...slot,
      unitId: remap(slot.unitId),
    })),
  };
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
  };
}

function enhancementChoices(options: EnhancementOption[]) {
  return options.map((item) => ({
    ...item,
    detail: enhancementChoiceDetail(item),
  }));
}

function PlaySummary({
  list,
  faction,
}: {
  list: ArmyList;
  faction: FactionCatalogue;
}) {
  const formation = faction.formations.find(
    (item) => item.id === list.formationId,
  );
  const spell = namedOption(faction.spellLores, list.spellLoreId);
  const prayer = namedOption(faction.prayerLores, list.prayerLoreId);
  const lines = [
    formation?.name,
    list.scourgeRealm === "aqshy"
      ? "Scourge of Aqshy"
      : list.scourgeRealm === "ghyran"
        ? "Scourge of Ghyran"
        : null,
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
