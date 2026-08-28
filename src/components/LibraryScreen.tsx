"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { getFaction, listArmiesOfRenown, listFactions, armyOfRenownName } from "@/engine/queries";
import { formatPoints } from "@/engine/pointsCap";
import { summarize } from "@/engine/validate";
import type { ArmyList, FactionCatalogue } from "@/engine/types";
import { catalogueArtClass, catalogueArtSrc, factionArtSrc } from "@/lib/factionArt";
import {
  blankArmy,
  deleteArmy,
  duplicateArmy,
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  saveArmy,
  subscribeArmies,
} from "@/lib/storage";
import {
  rememberListNavigation,
  rememberListOpen,
} from "@/lib/listTransition";
import { newListDraftFromSearch } from "@/lib/newListLink";
import {
  EMPTY_LIBRARY_CTA_CLASS,
  EMPTY_LIBRARY_PANEL_CLASS,
  IOS_LIQUID_CTA_CLASS,
  LIBRARY_CARD_ACTION_BUTTON_CLASS,
  LIBRARY_CARD_ACTIONS_CLASS,
  LIBRARY_CARD_CLASS,
  LIBRARY_CARD_DELETE_BUTTON_CLASS,
  SHEET_HEADER_CLASS,
  SHEET_PANEL_CLASS,
  SHEET_PANEL_COMPACT_CLASS,
} from "@/lib/builderUi";
import { useListFlowChrome } from "./ListFlowShell";
import { FactionArtLayers } from "./FactionArtBackground";
import { BrandMark } from "./BrandMark";
import { SheetCloseButton, IosTrashIcon } from "./ios/SheetIconButton";
import { ListLoadingSplash } from "./ListLoadingSplash";
import { ModalFrame } from "./ModalFrame";
import { PointsCapField } from "./PointsCapField";
import { SiteFooter } from "./SiteFooter";

function isInteractiveEventTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("button, input, textarea, select, a"))
  );
}

export function LibraryScreen() {
  const router = useRouter();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [deleteTarget, setDeleteTarget] = useState<ArmyList | null>(null);
  const [picking, setPicking] = useState(false);
  const [draftFaction, setDraftFaction] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftParent, setDraftParent] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftName, setDraftName] = useState("");
  const [draftPoints, setDraftPoints] = useState(2000);
  const [creating, setCreating] = useState(false);

  function openList(listId: string, factionId: string | null | undefined) {
    const faction = getFaction(factionId ?? "");
    const artId =
      faction?.parentFactionIds?.[0] ??
      (factionArtSrc(factionId) ? factionId : null) ??
      factionId;
    rememberListOpen(artId, faction?.name);
    rememberListNavigation("forward");
    router.push(`/lists/${listId}`);
  }

  async function onCreate() {
    if (!draftFaction || creating) {
      return;
    }
    setCreating(true);
    const artFactionId =
      draftParent?.id ??
      draftFaction.parentFactionIds?.[0] ??
      draftFaction.id;
    rememberListOpen(artFactionId, (draftParent ?? draftFaction).name);
    rememberListNavigation("forward");
    try {
      const list = blankArmy(draftFaction.id, draftName, draftPoints);
      await saveArmy(list);
      setPicking(false);
      router.push(`/lists/${list.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function onDuplicate(list: ArmyList) {
    await saveArmy(duplicateArmy(list));
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await deleteArmy(id);
  }

  async function onRename(list: ArmyList, name: string) {
    const next = name.trim();
    if (!next || next === list.name) {
      return;
    }
    await saveArmy({ ...list, name: next });
  }

  function closePicker() {
    if (creating) {
      return;
    }
    setPicking(false);
    setDraftFaction(null);
    setDraftParent(null);
    setDraftName("");
    setDraftPoints(2000);
  }

  const { setLibraryChrome } = useListFlowChrome();

  useLayoutEffect(() => {
    setLibraryChrome({ openNewList: () => setPicking(true) });
    return () => setLibraryChrome(null);
  }, [setLibraryChrome]);

  useLayoutEffect(() => {
    const draft = newListDraftFromSearch(
      new URLSearchParams(window.location.search),
    );
    if (!draft) {
      return;
    }
    setPicking(true);
    setDraftFaction(draft.faction);
    setDraftParent(draft.parent);
    setDraftName(draft.name);
    setDraftPoints(draft.points);
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  return (
    <div className="relative z-10 min-h-full text-parchment">
      <h1 className="mx-auto w-full max-w-3xl px-5 pt-2 pb-3 font-serif text-3xl text-parchment sm:px-6 lg:max-w-5xl">
        My lists
      </h1>
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6 lg:max-w-5xl">
        {lists === undefined ? (
          <p className="rounded-2xl bg-ink-raised/90 px-4 py-3 text-parchment/80 ring-1 ring-parchment/10">
            Loading…
          </p>
        ) : lists.length === 0 ? (
          <div className={EMPTY_LIBRARY_PANEL_CLASS}>
            <BrandMark
              size={40}
              className="mx-auto mb-4 h-10 w-auto opacity-40"
            />
            <p className="font-serif text-3xl leading-snug text-parchment">
              No armies yet
            </p>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className={EMPTY_LIBRARY_CTA_CLASS}
            >
              Make your first list
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2 lg:gap-5">
            {lists.map((list, index) => {
              const faction = getFaction(list.factionId);
              const totals = faction ? summarize(list, faction) : null;
              const formation = faction?.formations.find(
                (item) => item.id === list.formationId,
              );
              const artSrc = catalogueArtSrc(faction);
              return (
                <li key={list.id}>
                  <article
                    className={LIBRARY_CARD_CLASS}
                    onClick={(event) => {
                      if (isInteractiveEventTarget(event.target)) {
                        return;
                      }
                      openList(list.id, list.factionId);
                    }}
                  >
                    <div className="flex min-w-0 flex-col p-4 sm:p-5">
                      <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                        {faction?.name ?? "Unknown faction"}
                      </p>
                      <input
                        aria-label="List name"
                        defaultValue={list.name}
                        onBlur={(event) =>
                          void onRename(list, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        className="mt-1 w-full bg-transparent font-serif text-[1.45rem] leading-tight outline-none sm:text-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => openList(list.id, list.factionId)}
                        className="mt-2 flex w-full flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-gold-deep">
                            {formatPoints(totals?.points ?? 0)} /{" "}
                            {formatPoints(list.pointsCap)}
                          </span>
                          <span className="mt-0.5 block text-sm text-sheet-muted sm:text-base">
                            {formation?.name ?? "No formation"}
                          </span>
                        </span>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 12 20"
                          className="size-5 shrink-0 self-center text-parchment-ink/35"
                        >
                          <path
                            d="M2.5 2.5 9.5 10l-7 7.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="sr-only">Open list</span>
                      </button>
                      <div className={LIBRARY_CARD_ACTIONS_CLASS}>
                        <button
                          type="button"
                          className={LIBRARY_CARD_ACTION_BUTTON_CLASS}
                          onClick={() => void onDuplicate(list)}
                        >
                          Duplicate
                        </button>
                        <span
                          aria-hidden="true"
                          className="text-parchment-ink/25"
                        >
                          ·
                        </span>
                        <button
                          type="button"
                          className={LIBRARY_CARD_DELETE_BUTTON_CLASS}
                          onClick={() => setDeleteTarget(list)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {artSrc ? (
                      <button
                        type="button"
                        aria-label={`Open ${list.name}`}
                        onClick={() => openList(list.id, list.factionId)}
                        className="relative min-h-[8.5rem] overflow-hidden border-l border-parchment-ink/10"
                      >
                        <Image
                          src={artSrc}
                          alt=""
                          aria-hidden
                          fill
                          sizes="152px"
                          quality={68}
                          unoptimized
                          priority={index === 0}
                          loading={index === 0 ? "eager" : "lazy"}
                          className={catalogueArtClass(faction)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#efe6d2]/35" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Open ${list.name}`}
                        onClick={() => openList(list.id, list.factionId)}
                        className="min-h-[8.5rem] border-l border-parchment-ink/10 bg-parchment-ink/5"
                      />
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />

      {deleteTarget ? (
        <ModalFrame
          label="Delete list"
          onClose={() => setDeleteTarget(null)}
          panelClassName={`${SHEET_PANEL_COMPACT_CLASS} px-5 pt-2 pb-0`}
        >
          <p className="px-2 pb-4 text-center text-sm text-sheet-muted">
            <span className="font-serif text-base text-parchment-ink">
              {deleteTarget.name}
            </span>{" "}
            will be removed from this device. This cannot be undone.
          </p>
          <div className="ios-sheet-actions !gap-3 !pb-5">
            <div className="ios-action-sheet">
              <button
                type="button"
                onClick={() => void confirmDelete()}
                aria-label="Delete"
                className="ios-action-sheet-row ios-action-sheet-row--destructive"
              >
                <IosTrashIcon />
              </button>
              <div className="ios-action-sheet-separator" />
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="ios-action-sheet-row ios-action-sheet-row--cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalFrame>
      ) : null}

      {picking && !creating ? (
        <ModalFrame
          label="New list"
          onClose={closePicker}
          panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
        >
            <div className={SHEET_HEADER_CLASS}>
              <h2 className="font-serif text-2xl">
                {draftFaction ? "Name your list" : "Choose a faction"}
              </h2>
              <SheetCloseButton label="Close picker" onClick={closePicker} />
            </div>

            {draftFaction ? (
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-6">
                <p className="text-base text-sheet-muted">
                  {(draftParent ?? draftFaction).name}
                </p>
                {draftParent && listArmiesOfRenown(draftParent.id).length > 0 ? (
                  <label className="flex flex-col gap-2 text-base text-sheet-muted">
                    Army
                    <select
                      value={draftFaction.id}
                      onChange={(event) => {
                        const next =
                          getFaction(event.target.value) ?? draftParent;
                        setDraftName((current) => {
                          const previous = armyOfRenownName(draftFaction);
                          if (
                            current === `My ${previous}` ||
                            current === `My ${draftFaction.name}`
                          ) {
                            return `My ${armyOfRenownName(next)}`;
                          }
                          return current;
                        });
                        setDraftFaction(next);
                      }}
                      className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink"
                    >
                      <option value={draftParent.id}>
                        Standard {draftParent.name}
                      </option>
                      {listArmiesOfRenown(draftParent.id).map((army) => (
                        <option key={army.id} value={army.id}>
                          {armyOfRenownName(army)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="flex flex-col gap-2 text-base text-sheet-muted">
                  List name
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void onCreate();
                      }
                    }}
                    placeholder={`My ${armyOfRenownName(draftFaction)}`}
                    className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
                  />
                </label>
                <PointsCapField
                  value={draftPoints}
                  onChange={setDraftPoints}
                  variant="parchment"
                />
                <div className="ios-sheet-actions">
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => void onCreate()}
                    className={`${IOS_LIQUID_CTA_CLASS} disabled:opacity-60`}
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => {
                      setDraftFaction(null);
                      setDraftParent(null);
                      setDraftName("");
                    }}
                    className="min-h-11 w-full text-base text-sheet-muted disabled:opacity-60"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <ul className="overflow-y-auto px-3 pb-6">
                {listFactions().map((faction) => (
                  <li key={faction.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftParent(faction);
                        setDraftFaction(faction);
                        setDraftName(`My ${faction.name}`);
                        setDraftPoints(faction.pointsCapDefault);
                      }}
                      className="flex min-h-12 w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
                    >
                      <span className="font-serif text-xl text-parchment-ink">
                        {faction.name}
                      </span>
                      <span className="text-sm font-medium text-sheet-muted">
                        {faction.units.length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </ModalFrame>
      ) : null}

      {creating && draftFaction ? (
        <div className="fixed inset-0 z-[60] bg-ink text-parchment">
          <div className="absolute inset-0" aria-hidden="true">
            <FactionArtLayers
              factionId={
                draftParent?.id ??
                draftFaction.parentFactionIds?.[0] ??
                draftFaction.id
              }
              splash
            />
          </div>
          <ListLoadingSplash
            factionName={(draftParent ?? draftFaction).name}
            label="Creating your list"
          />
        </div>
      ) : null}
    </div>
  );
}
