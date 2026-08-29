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
import { listFlowIsHome, listFlowTrackClass } from "@/lib/listFlowNav";
import {
  lockPageScroll,
  pageScrollLockDepth,
  unlockPageScroll,
} from "@/lib/scrollLock";
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

function restoreScrollY(restoreY: number) {
  if (pageScrollLockDepth() > 0) {
    unlockPageScroll(restoreY);
    return;
  }
  window.scrollTo(0, restoreY);
}

function freezeScroll() {
  if (pageScrollLockDepth() === 0) {
    lockPageScroll();
  }
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
  const [showDetail, setShowDetailState] = useState(false);
  const [settled, setSettled] = useState(true);
  const [animatingBack, setAnimatingBack] = useState(false);
  const [backdropExiting, setBackdropExiting] = useState(false);
  const [factionBackdropRevealed, setFactionBackdropRevealed] = useState(false);
  const timers = useRef<number[]>([]);
  const libraryScrollYRef = useRef<number | null>(null);
  const lastBackdrop = useRef<ReactNode>(null);
  if (backdrop) {
    lastBackdrop.current = backdrop;
  }

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
    if (!isBuilder) {
      return;
    }
    router.prefetch("/dashboard");
  }, [isBuilder, router]);

  useLayoutEffect(() => {
    if (isHome) {
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      return;
    }
    if (!isBuilder) {
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      restoreScrollY(libraryScrollYRef.current ?? 0);
      return;
    }

    const direction = peekListNavigationDirection();
    if (direction === "instant") {
      clearListNavigationDirection();
      publishNavState({ showDetail: true, animatingBack: false, settled: true });
      restoreScrollY(0);
      return;
    }
    if (direction === "forward") {
      libraryScrollYRef.current = window.scrollY;
      if (prefersReducedMotion()) {
        clearListNavigationDirection();
        publishNavState({ showDetail: true, animatingBack: false, settled: true });
        restoreScrollY(0);
        return;
      }
      freezeScroll();
      publishNavState({ showDetail: true, animatingBack: false, settled: false });
      const settleTimer = window.setTimeout(() => {
        clearListNavigationDirection();
        publishNavState({ showDetail: true, animatingBack: false, settled: true });
        restoreScrollY(0);
      }, LIST_FLOW_SLIDE_MS);
      return () => {
        window.clearTimeout(settleTimer);
      };
    }

    publishNavState({ showDetail: true, animatingBack: false, settled: true });
    restoreScrollY(0);
  }, [isBuilder, isHome, pathname, publishNavState]);

  function goBack() {
    if (animatingBack || !isBuilder) {
      return;
    }
    rememberListNavigation("back");
    clearListOpenSplash();
    clearListCreateSplash();
    clearTimers();
    if (prefersReducedMotion()) {
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      restoreScrollY(libraryScrollYRef.current ?? 0);
      router.push("/dashboard", { scroll: false });
      return;
    }
    freezeScroll();
    setBackdropExiting(true);
    publishNavState({ showDetail: false, animatingBack: true, settled: false });
    schedule(() => {
      router.push("/dashboard", { scroll: false });
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      restoreScrollY(libraryScrollYRef.current ?? 0);
      schedule(() => setBackdropExiting(false), LIST_BACKDROP_RETURN_MS);
    }, LIST_FLOW_SLIDE_MS);
  }

  const showFactionBackdrop = isBuilder && Boolean(backdrop);
  const indexBackdropRevealed =
    !showFactionBackdrop || animatingBack || backdropExiting;
  const factionBackdropLayer = showFactionBackdrop
    ? backdrop
    : backdropExiting
      ? lastBackdrop.current
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
      <div className="relative min-h-dvh w-full overflow-x-hidden">
        <IndexBackdropLayer
          revealed={indexBackdropRevealed}
          transitionClass={indexBackdropTransitionClass}
        />
        {header ? (
          <header className={`${SITE_HEADER_BAR_CLASS} pointer-events-auto fixed inset-x-0 top-0 z-[60] pt-[env(safe-area-inset-top)]`}>
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
        <div className="relative z-10 overflow-x-hidden">
          <div className={listFlowTrackClass(showDetail, settled)}>
            <div className="list-flow-pane">
              <div className={LIST_FLOW_HEADER_OFFSET_CLASS}>
                {libraryLayer}
              </div>
            </div>
            <div
              className="list-flow-pane relative min-h-dvh"
              aria-hidden={!showDetail && !isBuilder}
            >
              <div className={`relative z-10 ${LIST_FLOW_HEADER_OFFSET_CLASS}`}>
                {isBuilder ? children : null}
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
