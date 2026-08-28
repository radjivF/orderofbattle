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
import type { LibraryChromeValue } from "./LibraryChrome";
import { useListNav } from "./IosNavSlide";
import { BrandMark } from "./BrandMark";

export const LIST_FLOW_HEADER_ROW =
  "mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-1.5 sm:px-4";

export const LIST_FLOW_HEADER_ROW_LIBRARY =
  "mx-auto flex min-h-[3.5rem] w-full max-w-3xl items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:min-h-[3.75rem] sm:px-4";

type Props = {
  mode: "library" | "builder";
  listId: string | null;
};

function FlowBackButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 shrink-0 items-center gap-0.5 -ml-0.5 pl-0.5 pr-1.5 text-sigmarite active:opacity-60"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-4 w-4 shrink-0 -translate-x-px"
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
      <span className="text-[15px] font-semibold leading-none">{label}</span>
    </button>
  );
}

function LibraryHeaderRow({
  libraryChrome,
}: {
  libraryChrome: LibraryChromeValue | null;
}) {
  return (
    <div className={LIST_FLOW_HEADER_ROW_LIBRARY}>
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
        <BrandMark size={32} className="h-8 w-auto shrink-0" priority />
        <div className="min-w-0 leading-tight">
          <p className="gold-text-lit truncate font-serif text-[17px] font-bold leading-none sm:text-lg">
            Order of Battle
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-parchment/85 sm:text-xs">
            Army lists for Age of Sigmar
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => libraryChrome?.openNewList()}
        className="inline-flex h-9 shrink-0 items-center gap-0.5 pl-1.5 pr-0.5 font-semibold text-sigmarite active:opacity-60"
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
        >
          <path
            d="M10 4v12M4 10h12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[15px] font-semibold leading-none">New list</span>
      </button>
    </div>
  );
}

function PlayCtaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="play-bar-cta inline-flex h-8 min-w-[3.75rem] shrink-0 items-center justify-center rounded-[8px] px-3.5 text-[15px] font-semibold leading-none active:opacity-80"
    >
      Play
    </button>
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
    <div className={LIST_FLOW_HEADER_ROW}>
      <FlowBackButton
        label={playMode ? "Build" : "Lists"}
        onClick={playMode ? () => chrome?.exitPlay() : goBack}
      />
      {playMode || !chrome ? (
        <p className="min-w-0 flex-1 truncate font-serif text-[15px] font-semibold leading-none sm:text-lg">
          {listName}
        </p>
      ) : (
        <input
          value={chrome.list.name}
          onChange={(event) => chrome.onListNameChange(event.target.value)}
          aria-label="List name"
          placeholder="Name your list"
          className="h-8 min-w-0 flex-1 border-b border-parchment/25 bg-transparent font-serif text-[15px] font-semibold leading-none outline-none placeholder:text-parchment/35 sm:text-lg"
        />
      )}
      {!playMode && chrome ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <p className="flex items-center gap-1.5 tabular-nums text-[13px] leading-none text-sigmarite sm:text-sm">
            {chrome.issue.tone !== "ok" ? (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-illegal"
              />
            ) : null}
            <span>{formatPoints(chrome.points)}</span>
            <span className="text-ink-muted">/</span>
            <span className="text-ink-muted">
              {formatPoints(chrome.pointsCap)}
            </span>
          </p>
          <PlayCtaButton onClick={() => chrome.enterPlay()} />
        </div>
      ) : null}
    </div>
  );
}

export function ListFlowHeader({
  mode,
  builderChrome,
  libraryChrome,
}: Props & {
  builderChrome: BuilderChromeValue | null;
  libraryChrome: LibraryChromeValue | null;
}) {
  if (mode === "library") {
    return <LibraryHeaderRow libraryChrome={libraryChrome} />;
  }
  return <BuilderHeaderRow chrome={builderChrome} />;
}
