"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LIST_FLOW_HEADER_OFFSET_CLASS,
  LIST_FLOW_SLIDE_MS,
  LIST_BACKDROP_RETURN_MS,
  LIST_BACKDROP_TRANSITION_CLASS,
  LIST_DETAIL_BACKDROP_TRANSITION_CLASS,
  LIST_LANDING_CONTENT_HIDDEN_CLASS,
  LIST_LANDING_CONTENT_VISIBLE_CLASS,
  SITE_HEADER_BAR_CLASS,
} from "@/lib/builderUi";
import {
  listFlowBackHref,
  listFlowIsDetail,
  listFlowIsHome,
  listFlowTrackClass,
  listFlowWindowScrollY,
} from "@/lib/listFlowNav";
import {
  clearListNavigationDirection,
  clearListOpenSplash,
  clearListCreateSplash,
  peekListNavigationDirection,
  rememberListNavigation,
} from "@/lib/listTransition";
import { IndexBackdropLayer } from "./IndexBackdrop";

const ListNavContext = createContext<{ goBack: () => void } | null>(null);

export function useListNav() {
  const ctx = useContext(ListNavContext);
  if (!ctx) {
    throw new Error("useListNav must be used within ListNavProvider");
  }
  return ctx;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToPane(
  showingDetail: boolean,
  libraryScrollYRef: { current: number | null },
) {
  if (!showingDetail && libraryScrollYRef.current == null) {
    return;
  }
  window.scrollTo(
    0,
    listFlowWindowScrollY({
      showingDetail,
      libraryScrollY: libraryScrollYRef.current ?? 0,
    }),
  );
}

type ListNavProviderProps = {
  children: ReactNode;
  libraryLayer: ReactNode;
  header?: ReactNode;
  backdrop?: ReactNode;
  overlay?: ReactNode;
  onShowDetailChange?: (state: {
    showDetail: boolean;
    animatingBack: boolean;
    settled: boolean;
  }) => void;
};

export function ListNavProvider({
  children,
  libraryLayer,
  header,
  backdrop,
  overlay,
  onShowDetailChange,
}: ListNavProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = listFlowIsHome(pathname);
  const isBuilder = pathname.startsWith("/lists/");
  const isDetail = listFlowIsDetail(pathname);
  const [showDetail, setShowDetailState] = useState(false);
  const [settled, setSettled] = useState(true);
  const [animatingBack, setAnimatingBack] = useState(false);
  const [backdropExiting, setBackdropExiting] = useState(false);
  const [factionBackdropRevealed, setFactionBackdropRevealed] = useState(false);
  const [cachedBackdrop, setCachedBackdrop] = useState<ReactNode>(null);
  const timers = useRef<number[]>([]);
  const animatingBackRef = useRef(false);
  const libraryScrollYRef = useRef<number | null>(null);

  useEffect(() => {
    if (backdrop) {
      setCachedBackdrop(backdrop);
    }
  }, [backdrop]);

  const publishNavState = useCallback(
    (next: {
      showDetail: boolean;
      animatingBack: boolean;
      settled: boolean;
    }) => {
      setShowDetailState(next.showDetail);
      setAnimatingBack(next.animatingBack);
      setSettled(next.settled);
      onShowDetailChange?.(next);
    },
    [onShowDetailChange],
  );

  function clearTimers() {
    for (const id of timers.current) {
      window.clearTimeout(id);
    }
    timers.current = [];
  }

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  useEffect(() => {
    if (!isDetail) {
      return;
    }
    router.prefetch(listFlowBackHref(pathname));
  }, [isDetail, pathname, router]);

  useLayoutEffect(() => {
    if (isHome) {
      animatingBackRef.current = false;
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      return;
    }
    if (!isDetail) {
      animatingBackRef.current = false;
      clearListNavigationDirection();
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      scrollToPane(false, libraryScrollYRef);
      return;
    }

    const direction = peekListNavigationDirection();
    if (direction === "instant") {
      clearListNavigationDirection();
      publishNavState({ showDetail: true, animatingBack: false, settled: true });
      scrollToPane(true, libraryScrollYRef);
      return;
    }
    if (direction === "forward") {
      libraryScrollYRef.current = window.scrollY;
      if (prefersReducedMotion()) {
        clearListNavigationDirection();
        publishNavState({ showDetail: true, animatingBack: false, settled: true });
        scrollToPane(true, libraryScrollYRef);
        return;
      }
      publishNavState({ showDetail: false, animatingBack: false, settled: false });
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => {
          clearListNavigationDirection();
          scrollToPane(true, libraryScrollYRef);
          publishNavState({
            showDetail: true,
            animatingBack: false,
            settled: false,
          });
        });
      });
      const settleTimer = window.setTimeout(() => {
        publishNavState({ showDetail: true, animatingBack: false, settled: true });
      }, LIST_FLOW_SLIDE_MS);
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
        window.clearTimeout(settleTimer);
      };
    }

    publishNavState({ showDetail: true, animatingBack: false, settled: true });
    scrollToPane(true, libraryScrollYRef);
  }, [isDetail, isHome, pathname, publishNavState]);

  function goBack() {
    if (animatingBackRef.current || !isDetail) {
      return;
    }
    const backHref = listFlowBackHref(pathname);
    rememberListNavigation("back");
    clearListOpenSplash();
    clearListCreateSplash();
    clearTimers();
    if (prefersReducedMotion()) {
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      scrollToPane(false, libraryScrollYRef);
      router.push(backHref, { scroll: false });
      return;
    }
    animatingBackRef.current = true;
    setBackdropExiting(true);
    publishNavState({ showDetail: false, animatingBack: true, settled: false });
    scrollToPane(false, libraryScrollYRef);
    schedule(() => {
      clearListNavigationDirection();
      router.push(backHref, { scroll: false });
      animatingBackRef.current = false;
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      schedule(() => setBackdropExiting(false), LIST_BACKDROP_RETURN_MS);
    }, LIST_FLOW_SLIDE_MS);
  }

  const showFactionBackdrop = isBuilder && Boolean(backdrop);
  const indexBackdropRevealed =
    !showFactionBackdrop || animatingBack || backdropExiting;
  const factionBackdropLayer = showFactionBackdrop
    ? backdrop
    : backdropExiting
      ? cachedBackdrop
      : null;
  const factionBackdropFadingOut = animatingBack || backdropExiting;
  const indexBackdropTransitionClass =
    showFactionBackdrop && !factionBackdropFadingOut
      ? LIST_DETAIL_BACKDROP_TRANSITION_CLASS
      : LIST_BACKDROP_TRANSITION_CLASS;
  const factionBackdropTransitionClass = factionBackdropFadingOut
    ? LIST_BACKDROP_TRANSITION_CLASS
    : LIST_DETAIL_BACKDROP_TRANSITION_CLASS;

  useLayoutEffect(() => {
    if (!factionBackdropLayer || factionBackdropFadingOut) {
      setFactionBackdropRevealed(false);
      return;
    }
    setFactionBackdropRevealed(false);
    const raf = window.requestAnimationFrame(() => {
      setFactionBackdropRevealed(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [factionBackdropFadingOut, factionBackdropLayer]);

  return (
    <ListNavContext.Provider value={{ goBack }}>
      <div className="relative min-h-dvh w-full overflow-x-hidden overflow-y-visible">
        <IndexBackdropLayer
          revealed={indexBackdropRevealed}
          transitionClass={indexBackdropTransitionClass}
        />
        {header ? (
          <header
            className={`${SITE_HEADER_BAR_CLASS} pointer-events-auto fixed inset-x-0 top-0 z-[60] pt-[env(safe-area-inset-top)]`}
          >
            {header}
          </header>
        ) : null}
        {factionBackdropLayer ? (
          <div
            className={`pointer-events-none fixed inset-0 z-[1] ${factionBackdropTransitionClass} ${
              factionBackdropFadingOut || !factionBackdropRevealed
                ? LIST_LANDING_CONTENT_HIDDEN_CLASS
                : LIST_LANDING_CONTENT_VISIBLE_CLASS
            }`}
          >
            {factionBackdropLayer}
          </div>
        ) : null}
        {isBuilder && overlay ? (
          <div className="pointer-events-none fixed inset-0 z-[30]">{overlay}</div>
        ) : null}
        <div className="relative z-10 overflow-x-hidden overflow-y-visible">
          <div className={listFlowTrackClass(showDetail, settled)}>
            <div className="list-flow-pane">
              <div className={LIST_FLOW_HEADER_OFFSET_CLASS}>{libraryLayer}</div>
            </div>
            <div
              className="list-flow-pane relative min-h-dvh"
              aria-hidden={!showDetail && !isDetail}
            >
              <div className={`relative z-10 ${LIST_FLOW_HEADER_OFFSET_CLASS}`}>
                {isDetail ? children : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ListNavContext.Provider>
  );
}

/** Library shell — same stacking root as the builder so the index art stays put. */
export function LibraryNavSlide({ children }: { children: ReactNode }) {
  return <div className="ios-push-root">{children}</div>;
}
