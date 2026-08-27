"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFaction, listFactions } from "@/engine/queries";
import { summarize } from "@/engine/validate";
import type { ArmyList, FactionCatalogue } from "@/engine/types";
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
  const [draftName, setDraftName] = useState("");

  async function onCreate() {
    if (!draftFaction) {
      return;
    }
    const list = blankArmy(draftFaction.id, draftName);
    await saveArmy(list);
    setPicking(false);
    setDraftFaction(null);
    setDraftName("");
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
    setDraftName("");
  }

  return (
    <IndexBackdrop veil="page">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-sigmarite/15 bg-ink/55 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 backdrop-blur-md sm:px-6 sm:py-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandMark size={44} className="h-10 w-auto shrink-0" />
          <div className="min-w-0">
            <p className="gold-text font-serif text-xl leading-none font-semibold sm:text-3xl">
              Order of Battle
            </p>
            <p className="mt-1 truncate text-xs font-medium text-parchment/85 sm:text-sm">
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
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6 sm:pt-2">
        {lists === undefined ? (
          <p className="rounded-2xl bg-ink-raised/90 px-4 py-3 text-parchment/80 ring-1 ring-parchment/10">
            Loading…
          </p>
        ) : lists.length === 0 ? (
          <p className="max-w-sm rounded-2xl bg-ink-raised/90 px-5 py-6 font-serif text-3xl leading-snug text-parchment ring-1 ring-parchment/10">
            No armies yet. Make your first list.
          </p>
        ) : (
          <ul className="flex flex-col gap-4 pt-4">
            {lists.map((list) => {
              const faction = getFaction(list.factionId);
              const totals = faction ? summarize(list, faction) : null;
              const formation = faction?.formations.find(
                (item) => item.id === list.formationId,
              );
              return (
                <li key={list.id}>
                  <article className="parchment-card rounded-2xl p-5 text-parchment-ink">
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
                      className="mt-1 w-full bg-transparent font-serif text-[1.65rem] leading-tight outline-none sm:text-3xl"
                    />
                    <button
                      type="button"
                      onClick={() => router.push(`/lists/${list.id}`)}
                      className="mt-3 flex w-full items-center gap-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold text-gold-deep">
                          {totals?.points ?? 0} / {list.pointsCap}
                        </span>
                        <span className="mt-1 block text-base text-sheet-muted">
                          {formation?.name ?? "No formation"}
                        </span>
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 12 20"
                        className="size-5 shrink-0 text-parchment-ink/30"
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
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="min-h-11 px-3 text-base text-sheet-muted"
                        onClick={() => void onDuplicate(list)}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="min-h-11 px-3 text-base text-illegal"
                        onClick={() => void onDelete(list.id)}
                      >
                        {confirmId === list.id ? "Confirm delete" : "Delete"}
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />

      {picking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-ink/70"
            onClick={closePicker}
          />
          <div
            role="dialog"
            aria-label="New list"
            className="parchment-card relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl text-parchment-ink"
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
                  {draftFaction.name}
                </p>
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
                    placeholder={`My ${draftFaction.name}`}
                    className="min-h-11 rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftFaction(null);
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
                        setDraftFaction(faction);
                        setDraftName(`My ${faction.name}`);
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
          </div>
        </div>
      ) : null}
    </IndexBackdrop>
  );
}
