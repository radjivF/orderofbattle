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
  listFlowIsHome,
  listFlowSkipsPostRouteSlide,
  listFlowTrackClass,
  listFlowWindowScrollY,
} from "@/lib/listFlowNav";
import {
  clearListNavigationDirection,
  clearListOpenSplash,
  clearListCreateSplash,
  peekListNavigationDirection,
  peekListOpenDisplayName,
  peekListOpenFactionId,
  rememberListNavigation,
} from "@/lib/listTransition";
import { getFaction } from "@/engine/queries";
import { IndexBackdropLayer } from "./IndexBackdrop";
import { ListLoadingSplash } from "./ListLoadingSplash";

const ListNavContext = createContext<{
  goBack: () => void;
  goForward: (href: string) => void;
} | null>(null);

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
  const [showDetail, setShowDetailState] = useState(false);
  const [settled, setSettled] = useState(true);
  const [animatingBack, setAnimatingBack] = useState(false);
  const [backdropExiting, setBackdropExiting] = useState(false);
  const [factionBackdropRevealed, setFactionBackdropRevealed] = useState(false);
  const [cachedBackdrop, setCachedBackdrop] = useState<ReactNode>(null);
  const timers = useRef<number[]>([]);
  const animatingBackRef = useRef(false);
  const pendingForwardRef = useRef(false);
  const forwardGenRef = useRef(0);
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

  function startForwardSlide() {
    const gen = ++forwardGenRef.current;
    libraryScrollYRef.current = window.scrollY;
    if (prefersReducedMotion()) {
      publishNavState({ showDetail: true, animatingBack: false, settled: true });
      scrollToPane(true, libraryScrollYRef);
      return;
    }
    publishNavState({ showDetail: false, animatingBack: false, settled: false });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (gen !== forwardGenRef.current) {
          return;
        }
        scrollToPane(true, libraryScrollYRef);
        publishNavState({
          showDetail: true,
          animatingBack: false,
          settled: false,
        });
      });
    });
    schedule(() => {
      if (gen !== forwardGenRef.current) {
        return;
      }
      publishNavState({ showDetail: true, animatingBack: false, settled: true });
    }, LIST_FLOW_SLIDE_MS);
  }

  useEffect(() => {
    if (!isBuilder) {
      return;
    }
    router.prefetch("/dashboard");
  }, [isBuilder, router]);

  useLayoutEffect(() => {
    if (isHome) {
      pendingForwardRef.current = false;
      animatingBackRef.current = false;
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      return;
    }
    if (!isBuilder) {
      if (listFlowSkipsPostRouteSlide(pendingForwardRef.current)) {
        return;
      }
      animatingBackRef.current = false;
      clearListNavigationDirection();
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      scrollToPane(false, libraryScrollYRef);
      return;
    }

    if (listFlowSkipsPostRouteSlide(pendingForwardRef.current)) {
      clearListNavigationDirection();
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
  }, [isBuilder, isHome, pathname, publishNavState]);

  function goForward(href: string) {
    if (animatingBackRef.current || isBuilder || pendingForwardRef.current) {
      return;
    }
    pendingForwardRef.current = true;
    rememberListNavigation("forward");
    startForwardSlide();
    router.push(href, { scroll: false });
  }

  function goBack() {
    if (animatingBackRef.current || !isBuilder) {
      return;
    }
    pendingForwardRef.current = false;
    forwardGenRef.current += 1;
    rememberListNavigation("back");
    clearListOpenSplash();
    clearListCreateSplash();
    clearTimers();
    if (prefersReducedMotion()) {
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      scrollToPane(false, libraryScrollYRef);
      router.push("/dashboard", { scroll: false });
      return;
    }
    animatingBackRef.current = true;
    setBackdropExiting(true);
    publishNavState({ showDetail: false, animatingBack: true, settled: false });
    scrollToPane(false, libraryScrollYRef);
    schedule(() => {
      clearListNavigationDirection();
      router.push("/dashboard", { scroll: false });
      animatingBackRef.current = false;
      publishNavState({ showDetail: false, animatingBack: false, settled: true });
      schedule(() => setBackdropExiting(false), LIST_BACKDROP_RETURN_MS);
    }, LIST_FLOW_SLIDE_MS);
  }

  const openFactionId = peekListOpenFactionId();
  const pendingSplashName = openFactionId
    ? getFaction(openFactionId)?.name
    : peekListOpenDisplayName();
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
    <ListNavContext.Provider value={{ goBack, goForward }}>
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
              aria-hidden={!showDetail && !isBuilder}
            >
              <div className={`relative z-10 ${LIST_FLOW_HEADER_OFFSET_CLASS}`}>
                {isBuilder ? (
                  children
                ) : showDetail ? (
                  <ListLoadingSplash factionName={pendingSplashName} />
                ) : null}
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
