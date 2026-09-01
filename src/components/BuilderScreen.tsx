"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getFaction } from "@/engine/queries";
import { catalogueForList } from "@/engine/spearhead";
import type { ArmyList } from "@/engine/types";
import { isTowList } from "@/engine/storedList";
import {
  LIST_LANDING_CONTENT_CLASS,
  LIST_LANDING_CONTENT_HIDDEN_CLASS,
  LIST_LANDING_CONTENT_VISIBLE_CLASS,
  LIST_OPEN_LANDING_MS,
  LIST_OPEN_SPLASH_MS,
  LIST_PANE_ART_CLASS,
} from "@/lib/builderUi";
import {
  isBackdropArtReady,
  listBackdropArtSrc,
  preloadBackdropArt,
} from "@/lib/factionArt";
import {
  listOpenShowsSplash,
  listOpenSplashFactionName,
} from "@/lib/listFlowNav";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  recordArmyOpened,
  subscribeArmies,
} from "@/lib/storage";
import {
  clearListCreateSplash,
  clearListOpenSplash,
  consumeSkipListSplash,
  getListOpenDisplayNameServerSnapshot,
  getListOpenDisplayNameSnapshot,
  getListOpenFactionServerSnapshot,
  getListOpenFactionSnapshot,
  getListOpenScourgeServerSnapshot,
  getListOpenScourgeSnapshot,
  peekListNavigationDirection,
  peekListOpenSplash,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import { BuilderReady } from "./BuilderReady";
import { FactionArtLayers } from "./FactionArtBackground";
import { FactionBackdrop } from "./FactionBackdrop";
import { useListFlowDecor } from "./ListFlowShell";
import { ListLoadingSplash } from "./ListLoadingSplash";

type Props = {
  listId: string;
  openPlay?: boolean;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BuilderScreen({ listId, openPlay = false }: Props) {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const rememberedId = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenFactionSnapshot,
    getListOpenFactionServerSnapshot,
  );
  const stored = lists?.find((item) => item.id === listId);
  const list = stored && !isTowList(stored) ? stored : undefined;
  const faction = list ? catalogueForList(list) : undefined;
  const artFactionId =
    (faction ? faction.parentFactionIds?.[0] ?? faction.id : null) ??
    rememberedId;
  const rememberedDisplayName = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenDisplayNameSnapshot,
    getListOpenDisplayNameServerSnapshot,
  );
  const rememberedScourge = useSyncExternalStore(
    subscribeListOpenFaction,
    getListOpenScourgeSnapshot,
    getListOpenScourgeServerSnapshot,
  );
  const [openingSplash, setOpeningSplash] = useState(false);
  const [artReady, setArtReady] = useState(true);
  const openedRecorded = useRef<string | null>(null);
  const splashStarted = useRef(0);
  const [skipSplash] = useState(consumeSkipListSplash);
  const [backdropLock, setBackdropLock] = useState<{
    listId: string;
    factionId: string;
    scourgeRealm: ArmyList["scourgeRealm"];
  } | null>(null);
  const [splashExiting, setSplashExiting] = useState(false);
  const hadSplash = useRef(false);

  useLayoutEffect(() => {
    setSplashExiting(false);
    if (skipSplash) {
      setOpeningSplash(false);
      splashStarted.current = 0;
      hadSplash.current = false;
      return;
    }
    const shouldShow = listOpenShowsSplash({
      splashRequested: peekListOpenSplash(),
      animatingBack: peekListNavigationDirection() === "back",
    });
    if (shouldShow) {
      setOpeningSplash(true);
      splashStarted.current = Date.now();
      hadSplash.current = true;
    } else {
      setOpeningSplash(false);
      splashStarted.current = 0;
    }
  }, [listId, skipSplash]);

  useEffect(() => {
    if (!openingSplash) {
      return;
    }
    if (lists === undefined) {
      return;
    }
    const wait = Math.max(
      0,
      LIST_OPEN_SPLASH_MS - (Date.now() - splashStarted.current),
    );
    const timer = window.setTimeout(() => {
      setOpeningSplash(false);
      clearListOpenSplash();
    }, wait);
    return () => window.clearTimeout(timer);
  }, [openingSplash, lists]);

  const splashName = listOpenSplashFactionName({
    list,
    catalogueName: faction?.name,
    parentFactionName: list ? getFaction(list.factionId)?.name : undefined,
    rememberedFactionName: rememberedId
      ? getFaction(rememberedId)?.name
      : undefined,
    listNameFallback: rememberedDisplayName,
  });

  useLayoutEffect(() => {
    setBackdropLock(
      artFactionId
        ? {
            listId,
            factionId: artFactionId,
            scourgeRealm: list?.scourgeRealm ?? rememberedScourge ?? null,
          }
        : null,
    );
    // Snapshot once per list open — scourge is stored on card click before navigate.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [listId]);

  const backdropFactionId = backdropLock?.factionId ?? artFactionId;
  const backdropScourgeRealm =
    backdropLock?.scourgeRealm ??
    list?.scourgeRealm ??
    rememberedScourge ??
    null;
  const backdropSrc = listBackdropArtSrc(
    backdropFactionId,
    backdropScourgeRealm,
  );

  useLayoutEffect(() => {
    if (!backdropSrc) {
      setArtReady(true);
      return;
    }
    if (isBackdropArtReady(backdropFactionId, backdropScourgeRealm)) {
      setArtReady(true);
      return;
    }
    let cancelled = false;
    setArtReady(false);
    void preloadBackdropArt(backdropFactionId, backdropScourgeRealm).then(() => {
      if (!cancelled) {
        setArtReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [backdropFactionId, backdropScourgeRealm, backdropSrc]);

  const showSplash =
    lists === undefined || openingSplash || !artReady;

  useEffect(() => {
    if (showSplash) {
      hadSplash.current = true;
    }
  }, [showSplash]);

  useEffect(() => {
    if (showSplash || skipSplash || !hadSplash.current) {
      return;
    }
    if (prefersReducedMotion()) {
      hadSplash.current = false;
      return;
    }
    setSplashExiting(true);
    const done = window.setTimeout(() => {
      setSplashExiting(false);
      hadSplash.current = false;
    }, LIST_OPEN_LANDING_MS);
    return () => window.clearTimeout(done);
  }, [showSplash, skipSplash]);

  useEffect(() => {
    if (showSplash) {
      return;
    }
    clearListCreateSplash();
  }, [showSplash]);

  useEffect(() => {
    if (lists === undefined || openedRecorded.current === listId) {
      return;
    }
    if (!lists.some((item) => item.id === listId)) {
      return;
    }
    openedRecorded.current = listId;
    const timer = window.setTimeout(() => {
      void recordArmyOpened(listId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [listId, lists]);

  const { setDecor } = useListFlowDecor();

  const overlayUp = showSplash || splashExiting;
  const overlayFading = splashExiting && !showSplash;
  const scrimOn = !showSplash;
  const contentRevealed = !showSplash;

  useLayoutEffect(() => {
    setDecor({
      backdrop: backdropFactionId ? (
        <div className={LIST_PANE_ART_CLASS} aria-hidden="true">
          <FactionArtLayers
            factionId={backdropFactionId}
            scourgeRealm={backdropScourgeRealm}
            scrim={scrimOn}
          />
        </div>
      ) : undefined,
      overlay: overlayUp ? (
        <ListLoadingSplash
          factionName={splashName}
          fading={overlayFading}
        />
      ) : undefined,
    });
    return () => setDecor({});
  }, [
    backdropFactionId,
    backdropScourgeRealm,
    overlayFading,
    overlayUp,
    scrimOn,
    splashName,
    setDecor,
  ]);

  if (!list || !faction) {
    if (lists !== undefined) {
      return (
        <div className="relative z-10 flex min-h-full flex-col items-start bg-ink px-6 py-10 text-parchment">
          <p className="font-serif text-3xl">This list is gone.</p>
          <Link href="/dashboard" className="mt-6 min-h-11 text-sigmarite">
            Back to library
          </Link>
        </div>
      );
    }
    return null;
  }

  return (
    <FactionBackdrop>
      <div
        className={`${LIST_LANDING_CONTENT_CLASS} ${
          contentRevealed
            ? LIST_LANDING_CONTENT_VISIBLE_CLASS
            : LIST_LANDING_CONTENT_HIDDEN_CLASS
        }`}
      >
        <BuilderReady list={list} faction={faction} openPlay={openPlay} />
      </div>
    </FactionBackdrop>
  );
}
