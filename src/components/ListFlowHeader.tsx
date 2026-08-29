"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatPoints } from "@/engine/pointsCap";
import {
  BUILDER_LIST_NAME_INPUT_CLASS,
  HEADER_DROPS_LINE_CLASS,
  HEADER_STATS_STACK_CLASS,
  IOS_NAV_PLAY_BUTTON_CLASS,
  builderHeaderShowsListStats,
  builderHeaderShowsPlayButton,
  dropCountLabel,
} from "@/lib/builderUi";
import {
  getListOpenDisplayNameServerSnapshot,
  getListOpenDisplayNameSnapshot,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import type { BuilderChromeValue } from "./BuilderChrome";
import type { LibraryChromeValue } from "./LibraryChrome";
import { useListNav } from "./IosNavSlide";
import { IosNavAddButton, IosNavBackButton } from "./ios/IosNavIconButton";
import { BrandMark } from "./BrandMark";

export const LIST_FLOW_HEADER_ROW =
  "mx-auto flex min-h-[3.5rem] w-full max-w-3xl items-center gap-2 px-3 py-1.5 sm:min-h-[3.75rem] sm:px-4";

export const LIST_FLOW_HEADER_ROW_LIBRARY =
  "mx-auto flex min-h-[3.5rem] w-full max-w-3xl items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:min-h-[3.75rem] sm:px-4";

type Props = {
  mode: "library" | "builder";
  listId: string | null;
};

function FlowBackButton({
  label,
  onClick,
  href,
}: {
  label: string;
  onClick: () => void;
  href?: string;
}) {
  return <IosNavBackButton label={label} onClick={onClick} href={href} />;
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
      <IosNavAddButton
        label="New list"
        onClick={() => libraryChrome?.openNewList()}
      />
    </div>
  );
}

function PlayCtaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={IOS_NAV_PLAY_BUTTON_CLASS}
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
        href={playMode ? undefined : "/dashboard"}
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
          className={BUILDER_LIST_NAME_INPUT_CLASS}
        />
      )}
      {builderHeaderShowsListStats(Boolean(chrome)) && chrome ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <div className={HEADER_STATS_STACK_CLASS}>
            <p className="flex items-center justify-end gap-1.5 text-[13px] text-sigmarite sm:text-sm">
              {chrome.issue.tone !== "ok" ? (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-illegal"
                />
              ) : null}
              {chrome.spearhead ? (
                <span>Spearhead</span>
              ) : (
                <>
                  <span>{formatPoints(chrome.points)}</span>
                  <span className="text-ink-muted">/</span>
                  <span className="text-ink-muted">
                    {formatPoints(chrome.pointsCap)}
                  </span>
                </>
              )}
            </p>
            {chrome.spearhead ? null : (
              <p className={HEADER_DROPS_LINE_CLASS}>
                {dropCountLabel(chrome.drops)}
              </p>
            )}
          </div>
          {builderHeaderShowsPlayButton(playMode) ? (
            <PlayCtaButton onClick={() => chrome.enterPlay()} />
          ) : null}
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
