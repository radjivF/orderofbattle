"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { getFaction, listArmiesOfRenown, listFactions, armyOfRenownName } from "@/engine/queries";
import { formatPoints } from "@/engine/pointsCap";
import { summarize } from "@/engine/validate";
import type { ArmyList, FactionCatalogue } from "@/engine/types";
import { catalogueArtClass, catalogueArtSrc } from "@/lib/factionArt";
import {
  blankArmy,
  deleteArmy,
  duplicateArmy,
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  saveArmy,
  subscribeArmies,
} from "@/lib/storage";
import { BrandMark } from "./BrandMark";
import { IndexBackdrop } from "./IndexBackdrop";
import { ModalFrame } from "./ModalFrame";
import { PointsCapField } from "./PointsCapField";
import { SiteFooter } from "./SiteFooter";

export function LibraryScreen() {
  const router = useRouter();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [draftFaction, setDraftFaction] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftParent, setDraftParent] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftName, setDraftName] = useState("");
  const [draftPoints, setDraftPoints] = useState(2000);

  async function onCreate() {
    if (!draftFaction) {
      return;
    }
    const list = blankArmy(draftFaction.id, draftName, draftPoints);
    await saveArmy(list);
    setPicking(false);
    setDraftFaction(null);
    setDraftParent(null);
    setDraftName("");
    setDraftPoints(2000);
    router.push(`/lists/${list.id}`);
  }

  async function onDuplicate(list: ArmyList) {
    await saveArmy(duplicateArmy(list));
  }

  async function onDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    await deleteArmy(id);
    setConfirmId(null);
  }

  async function onRename(list: ArmyList, name: string) {
    const next = name.trim();
    if (!next || next === list.name) {
      return;
    }
    await saveArmy({ ...list, name: next });
  }

  function closePicker() {
    setPicking(false);
    setDraftFaction(null);
    setDraftParent(null);
    setDraftName("");
    setDraftPoints(2000);
  }

  return (
    <IndexBackdrop veil="page">
      <header className="sticky top-0 z-20 border-b border-sigmarite/15 bg-ink/45 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:py-5 lg:max-w-5xl">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <BrandMark size={44} className="h-10 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="gold-text font-serif text-xl leading-none font-semibold sm:text-3xl">
                Order of Battle
              </p>
              <p className="mt-1 truncate text-xs font-medium text-parchment/90 sm:text-sm">
                Army lists for Age of Sigmar
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="gold-plate min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold text-ink sm:px-5"
          >
            New list
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6 sm:pt-3 lg:max-w-5xl">
        {lists === undefined ? (
          <p className="rounded-2xl bg-ink-raised/90 px-4 py-3 text-parchment/80 ring-1 ring-parchment/10">
            Loading…
          </p>
        ) : lists.length === 0 ? (
          <p className="max-w-sm rounded-2xl bg-ink-raised/90 px-5 py-6 font-serif text-3xl leading-snug text-parchment ring-1 ring-parchment/10">
            No armies yet. Make your first list.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2 lg:gap-5">
            {lists.map((list) => {
              const faction = getFaction(list.factionId);
              const totals = faction ? summarize(list, faction) : null;
              const formation = faction?.formations.find(
                (item) => item.id === list.formationId,
              );
              const artSrc = catalogueArtSrc(faction);
              return (
                <li key={list.id}>
                  <article className="parchment-card grid min-h-[8.5rem] grid-cols-[minmax(0,1fr)_7.5rem] overflow-hidden rounded-2xl text-parchment-ink sm:grid-cols-[minmax(0,1fr)_9.5rem]">
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
                        onClick={() => router.push(`/lists/${list.id}`)}
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
                      <div className="mt-3 flex gap-1">
                        <button
                          type="button"
                          className="min-h-10 px-2.5 text-sm text-sheet-muted sm:min-h-11 sm:px-3 sm:text-base"
                          onClick={() => void onDuplicate(list)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="min-h-10 px-2.5 text-sm text-illegal sm:min-h-11 sm:px-3 sm:text-base"
                          onClick={() => void onDelete(list.id)}
                        >
                          {confirmId === list.id
                            ? "Confirm delete"
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    {artSrc ? (
                      <button
                        type="button"
                        aria-label={`Open ${list.name}`}
                        onClick={() => router.push(`/lists/${list.id}`)}
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
                          className={catalogueArtClass(faction)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#efe6d2]/35" />
                      </button>
                    ) : (
                      <div
                        className="min-h-[8.5rem] border-l border-parchment-ink/10 bg-parchment-ink/5"
                        aria-hidden="true"
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

      {picking ? (
        <ModalFrame
          label="New list"
          onClose={closePicker}
          panelClassName="parchment-card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl text-parchment-ink"
        >
            <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-serif text-2xl">
                {draftFaction ? "Name your list" : "Choose a faction"}
              </h2>
              <button
                type="button"
                onClick={closePicker}
                className="min-h-11 px-3 text-sm text-parchment-ink/70"
              >
                Close
              </button>
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftFaction(null);
                      setDraftParent(null);
                      setDraftName("");
                    }}
                    className="min-h-11 flex-1 rounded-xl bg-parchment-ink/5 text-base"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void onCreate()}
                    className="gold-plate min-h-11 flex-1 rounded-xl text-base font-semibold text-ink"
                  >
                    Create
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
    </IndexBackdrop>
  );
}
