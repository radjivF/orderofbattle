"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getFaction } from "@/engine/queries";
import { formatPoints } from "@/engine/pointsCap";
import { isTowList } from "@/engine/storedList";
import { towSummarize } from "@/engine/tow/validate";
import { summarize } from "@/engine/validate";
import {
  brandSubtitleForMenu,
  getActiveMenuServerSnapshot,
  getActiveMenuSnapshot,
  setActiveMenu,
  subscribeActiveMenu,
} from "@/lib/activeMenu";
import {
  BUILDER_LIST_NAME_INPUT_CLASS,
  HEADER_DROPS_LINE_CLASS,
  HEADER_STATS_STACK_CLASS,
  IOS_NAV_PLAY_BUTTON_CLASS,
  LIBRARY_BRAND_HEADER_ROW_CLASS,
  SITE_HEADER_ROW_CLASS,
  builderHeaderShowsPlayButton,
  builderHeaderShowsIssueDot,
  dropCountLabel,
} from "@/lib/builderUi";
import { resolveBuilderHeaderDisplay } from "@/lib/listFlowNav";
import {
  getListOpenDisplayNameServerSnapshot,
  getListOpenDisplayNameSnapshot,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import type { BuilderChromeValue } from "./BuilderChrome";
import type { LibraryChromeValue } from "./LibraryChrome";
import { isBattleRecordPath } from "./BattleRecordHost";
import { useListNav } from "./IosNavSlide";
import { IosNavBackButton, IosNavMenuButton } from "./ios/IosNavIconButton";
import { SiteBrandLockup } from "./BrandMark";
import { AppMenuSheet } from "./AppMenuSheet";

function LibraryHeaderRow() {
  const pathname = usePathname();
  const storedMenu = useSyncExternalStore(
    subscribeActiveMenu,
    getActiveMenuSnapshot,
    getActiveMenuServerSnapshot,
  );
  const menu = isBattleRecordPath(pathname) ? "tactics" : storedMenu;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={SITE_HEADER_ROW_CLASS}>
      <div className={LIBRARY_BRAND_HEADER_ROW_CLASS}>
        <IosNavMenuButton
          label="Open menu"
          onClick={() => setMenuOpen(true)}
        />
        <SiteBrandLockup subtitle={brandSubtitleForMenu(menu)} />
      </div>
      {menuOpen ? (
        <AppMenuSheet
          active={menu}
          onSelect={setActiveMenu}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
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
  listId,
}: {
  chrome: BuilderChromeValue | null;
  listId: string | null;
}) {
  const { goBack } = useListNav();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const rememberedDisplayName = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenDisplayNameSnapshot,
    getListOpenDisplayNameServerSnapshot,
  );
  const storedList = listId ? lists?.find((item) => item.id === listId) : undefined;
  const towStored = storedList && isTowList(storedList) ? storedList : undefined;
  const storedCatalogue =
    storedList && !towStored ? getFaction(storedList.factionId) : undefined;
  const storedTotals = towStored
    ? {
        points: towSummarize(towStored).points,
        pointsCap: towStored.pointsCap,
        drops: 0,
      }
    : storedList && storedCatalogue
      ? summarize(storedList, storedCatalogue)
      : null;

  const headerDisplay = resolveBuilderHeaderDisplay({
    rememberedDisplayName,
    chrome: chrome
      ? {
          listName: chrome.list.name,
          points: chrome.points,
          pointsCap: chrome.pointsCap,
          drops: chrome.drops,
          playMode: chrome.playMode,
        }
      : null,
    stored: storedTotals
      ? {
          points: storedTotals.points,
          pointsCap: storedList?.pointsCap ?? 2000,
          drops: storedTotals.drops,
        }
      : null,
  });

  const playMode = chrome?.playMode ?? false;
  const listName = headerDisplay.listName;
  const points = headerDisplay.points;
  const pointsCap = headerDisplay.pointsCap;
  const drops = headerDisplay.drops;
  const spearhead = chrome?.spearhead ?? false;
  const hideDrops = chrome?.hideDrops ?? Boolean(towStored);
  const showIssueDot = chrome
    ? builderHeaderShowsIssueDot(spearhead, chrome.issue.tone)
    : false;

  return (
    <div className={SITE_HEADER_ROW_CLASS}>
      <IosNavBackButton
        label={playMode ? "Build" : "Lists"}
        onClick={playMode ? () => chrome?.exitPlay() : goBack}
      />
      {playMode ? (
        <p className="min-w-0 flex-1 truncate font-serif text-[15px] font-semibold leading-none sm:text-lg">
          {listName}
        </p>
      ) : (
        <input
          value={headerDisplay.inputValue}
          onChange={(event) => chrome?.onListNameChange(event.target.value)}
          aria-label="List name"
          placeholder="Name your list"
          className={BUILDER_LIST_NAME_INPUT_CLASS}
        />
      )}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className={HEADER_STATS_STACK_CLASS}>
          <p className="flex items-center justify-end gap-1.5 text-[13px] text-sigmarite sm:text-sm">
            {showIssueDot ? (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-illegal"
              />
            ) : null}
            {spearhead ? (
              <span>Spearhead</span>
            ) : (
              <>
                <span>{formatPoints(points)}</span>
                <span className="text-ink-muted">/</span>
                <span className="text-ink-muted">{formatPoints(pointsCap)}</span>
              </>
            )}
          </p>
          {spearhead || hideDrops ? null : (
            <p className={HEADER_DROPS_LINE_CLASS}>{dropCountLabel(drops)}</p>
          )}
        </div>
        {builderHeaderShowsPlayButton(playMode) ? (
          <PlayCtaButton onClick={() => chrome?.enterPlay()} />
        ) : null}
      </div>
    </div>
  );
}

export function ListFlowHeader({
  mode,
  listId,
  builderChrome,
}: {
  mode: "library" | "builder";
  listId: string | null;
  builderChrome: BuilderChromeValue | null;
  libraryChrome: LibraryChromeValue | null;
}) {
  if (mode === "library") {
    return <LibraryHeaderRow />;
  }
  return <BuilderHeaderRow chrome={builderChrome} listId={listId} />;
}
