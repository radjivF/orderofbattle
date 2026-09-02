"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getFaction } from "@/engine/queries";
import { catalogueForList, isSpearheadList } from "@/engine/spearhead";
import {
  isPathToGloryList,
  pathToGloryPackIds,
  pathToGloryPacksLabel,
} from "@/engine/pathToGlory";
import { formatPoints } from "@/engine/pointsCap";
import { isTowList, type StoredList } from "@/engine/storedList";
import { getTowFaction } from "@/engine/tow/queries";
import { towSummarize } from "@/engine/tow/validate";
import { summarize } from "@/engine/validate";
import { catalogueArtClass, catalogueArtSrc, factionArtSrc, preloadBackdropArt } from "@/lib/factionArt";
import {
  rememberListNavigation,
  rememberListOpen,
} from "@/lib/listTransition";
import { libraryCardPressHoldsOn, listOpenDisplayNameForHeader, listOpenUsesInAppSlide } from "@/lib/listFlowNav";
import {
  LIBRARY_CARD_ACTION_BUTTON_CLASS,
  LIBRARY_CARD_ACTIONS_CLASS,
  LIBRARY_CARD_CLASS,
  LIBRARY_CARD_DELETE_BUTTON_CLASS,
  LIBRARY_CARD_LIST_NAME_INPUT_CLASS,
} from "@/lib/builderUi";
import { useListNav } from "./IosNavSlide";

function rememberOpenList(list: StoredList) {
  if (isTowList(list)) {
    rememberListOpen(list.factionId, listOpenDisplayNameForHeader(list));
    rememberListNavigation("forward");
    return;
  }
  const faction = getFaction(list.factionId);
  const artId =
    faction?.parentFactionIds?.[0] ??
    (factionArtSrc(list.factionId) ? list.factionId : null) ??
    list.factionId;
  rememberListOpen(artId, listOpenDisplayNameForHeader(list), list.scourgeRealm);
  void preloadBackdropArt(artId, list.scourgeRealm);
  rememberListNavigation("forward");
}

function cardMeta(list: StoredList) {
  if (isTowList(list)) {
    const faction = getTowFaction(list.factionId);
    const totals = towSummarize(list);
    return {
      factionName: faction?.name ?? "Unknown faction",
      pointsLine: `${formatPoints(totals.points)} / ${formatPoints(list.pointsCap)}`,
      detail: "The Old World",
      artSrc: null as string | null,
      artClass: "",
    };
  }
  const faction = getFaction(list.factionId);
  const playCatalogue = catalogueForList(list);
  const totals = playCatalogue ? summarize(list, playCatalogue) : null;
  const formation = playCatalogue?.formations.find(
    (item) => item.id === (list.regimentAbilityId ?? list.formationId),
  );
  const spearhead = isSpearheadList(list);
  const pathToGlory = isPathToGloryList(list);
  const packIds = pathToGloryPackIds(list);
  return {
    factionName: faction?.name ?? "Unknown faction",
    pointsLine: spearhead
      ? "Spearhead"
      : pathToGlory
        ? "Path to Glory"
        : `${formatPoints(totals?.points ?? 0)} / ${formatPoints(list.pointsCap)}`,
    detail: spearhead
      ? (playCatalogue?.name ?? "Spearhead")
      : pathToGlory && packIds.length > 0
        ? `${pathToGloryPacksLabel(packIds)} · ${formatPoints(totals?.points ?? 0)} / ${formatPoints(list.pointsCap)}`
        : (formation?.name ?? "No formation"),
    artSrc: catalogueArtSrc(faction),
    artClass: catalogueArtClass(faction),
  };
}

export function LibraryListCard({
  list,
  index,
  onRename,
  onDuplicate,
  onDelete,
}: {
  list: StoredList;
  index: number;
  onRename: (list: StoredList, name: string) => void;
  onDuplicate: (list: StoredList) => void;
  onDelete: (list: StoredList) => void;
}) {
  const meta = cardMeta(list);
  const pathname = usePathname();
  const { goForward } = useListNav();
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!libraryCardPressHoldsOn(pathname)) {
      setOpening(false);
    }
  }, [pathname]);

  return (
    <article
      className={LIBRARY_CARD_CLASS}
      data-opening={opening ? "true" : undefined}
    >
      <Link
        href={`/lists/${list.id}`}
        scroll={false}
        aria-label={`Open ${list.name}`}
        onClick={(event) => {
          if (
            !listOpenUsesInAppSlide({
              metaKey: event.metaKey,
              ctrlKey: event.ctrlKey,
              shiftKey: event.shiftKey,
              altKey: event.altKey,
              button: event.button,
            })
          ) {
            return;
          }
          event.preventDefault();
          setOpening(true);
          rememberOpenList(list);
          goForward(`/lists/${list.id}`);
        }}
        className="library-card-open absolute inset-0 z-[1]"
      />
      <div className="pointer-events-none relative z-[2] flex min-w-0 flex-col p-4 sm:p-5">
        <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          {meta.factionName}
        </p>
        <input
          aria-label="List name"
          defaultValue={list.name}
          onBlur={(event) => void onRename(list, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className={LIBRARY_CARD_LIST_NAME_INPUT_CLASS}
        />
        <div className="mt-2 flex w-full flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gold-deep">
              {meta.pointsLine}
            </p>
            <p className="mt-0.5 text-sm text-sheet-muted sm:text-base">
              {meta.detail}
            </p>
          </div>
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
        </div>
        <div
          className={`pointer-events-auto relative ${LIBRARY_CARD_ACTIONS_CLASS}`}
        >
          <button
            type="button"
            className={LIBRARY_CARD_ACTION_BUTTON_CLASS}
            onClick={() => void onDuplicate(list)}
          >
            Duplicate
          </button>
          <span aria-hidden="true" className="text-parchment-ink/25">
            ·
          </span>
          <button
            type="button"
            className={LIBRARY_CARD_DELETE_BUTTON_CLASS}
            onClick={() => onDelete(list)}
          >
            Delete
          </button>
        </div>
      </div>

      {meta.artSrc ? (
        <div className="pointer-events-none relative min-h-[8.5rem] overflow-hidden border-l border-parchment-ink/10">
          <Image
            src={meta.artSrc}
            alt=""
            aria-hidden
            fill
            sizes="152px"
            quality={68}
            unoptimized
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : undefined}
            className={meta.artClass}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#efe6d2]/35" />
        </div>
      ) : (
        <div className="pointer-events-none min-h-[8.5rem] border-l border-parchment-ink/10 bg-parchment-ink/5" />
      )}
    </article>
  );
}
