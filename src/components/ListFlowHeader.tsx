"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatPoints } from "@/engine/pointsCap";
import {
  getListOpenDisplayNameServerSnapshot,
  getListOpenDisplayNameSnapshot,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import type { BuilderChromeValue } from "./BuilderChrome";
import { useLibraryChromeOptional } from "./LibraryChrome";
import { useListNav } from "./IosNavSlide";
import { BrandMark } from "./BrandMark";

type Props = {
  mode: "library" | "builder";
  listId: string | null;
};

function ListsBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 shrink-0 items-center gap-0.5 -ml-1 pl-0.5 pr-2 text-sigmarite active:opacity-60"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-5 w-5 shrink-0 -translate-x-px"
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
      <span className="text-[17px] leading-none">Lists</span>
    </button>
  );
}

function BuildPlayToggle({
  playMode,
  onChange,
  disabled = false,
}: {
  playMode: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Mode"
      className={`flex rounded-xl bg-ink-raised p-1 text-xs ring-1 ring-sigmarite/25 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`min-h-9 rounded-lg px-3 ${
          playMode ? "text-ink-muted" : "gold-plate text-ink"
        }`}
      >
        Build
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`min-h-9 rounded-lg px-3 ${
          playMode ? "gold-plate text-ink" : "text-ink-muted"
        }`}
      >
        Play
      </button>
    </div>
  );
}

function LibraryHeaderRow() {
  const library = useLibraryChromeOptional();

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:py-5 lg:max-w-5xl">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <BrandMark size={44} className="h-10 w-auto shrink-0" priority />
        <div className="min-w-0">
          <p className="gold-text-lit font-serif text-xl leading-none font-semibold sm:text-3xl">
            Order of Battle
          </p>
          <p className="mt-1 truncate text-xs font-medium text-parchment/90 sm:text-sm">
            Army lists for Age of Sigmar
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => library?.openNewList()}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 pl-2 pr-0.5 text-sigmarite active:opacity-60"
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
        >
          <path
            d="M10 4v12M4 10h12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[17px] leading-none">New list</span>
      </button>
    </div>
  );
}

function BuilderHeaderRow({
  chrome,
}: {
  chrome: BuilderChromeValue | null;
}) {
  const { goBack } = useListNav();
  const rememberedDisplayName = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenDisplayNameSnapshot,
    getListOpenDisplayNameServerSnapshot,
  );
  const placeholderName = rememberedDisplayName ?? "Army list";

  const playMode = chrome?.playMode ?? false;
  const listName = chrome?.list.name ?? placeholderName;

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap">
        <ListsBackButton onClick={goBack} />
        {playMode || !chrome ? (
          <p className="flex min-h-11 min-w-0 flex-1 items-center truncate font-serif text-xl">
            {listName}
          </p>
        ) : (
          <input
            value={chrome.list.name}
            onChange={(event) => chrome.onListNameChange(event.target.value)}
            aria-label="List name"
            placeholder="Name your list"
            className="min-h-11 min-w-0 flex-1 border-b border-parchment/20 bg-transparent font-serif text-xl outline-none placeholder:text-parchment/35"
          />
        )}
        <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 sm:ml-auto sm:w-auto">
          {!playMode && chrome ? (
            <div className="text-left sm:text-right">
              <p className="flex items-center justify-start gap-1.5 text-lg text-sigmarite sm:justify-end">
                {chrome.issue.tone !== "ok" ? (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full bg-illegal"
                  />
                ) : null}
                {formatPoints(chrome.points)}
                <span className="text-ink-muted">
                  {" "}
                  / {formatPoints(chrome.pointsCap)}
                </span>
              </p>
              <p className="text-xs text-ink-muted">{chrome.drops} drops</p>
            </div>
          ) : (
            <span className="sm:hidden" />
          )}
          <BuildPlayToggle
            playMode={playMode}
            disabled={!chrome}
            onChange={(next) => chrome?.setPlayMode(next)}
          />
        </div>
      </div>
    </>
  );
}

export function ListFlowHeader({
  mode,
  builderChrome,
}: Props & { builderChrome: BuilderChromeValue | null }) {
  if (mode === "library") {
    return <LibraryHeaderRow />;
  }
  return <BuilderHeaderRow chrome={builderChrome} />;
}
