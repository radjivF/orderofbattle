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
  SITE_HEADER_BAR_CLASS,
} from "@/lib/builderUi";
import { listFlowIsHome, listFlowTrackClass, listFlowWindowScrollY } from "@/lib/listFlowNav";
import {
  clearListNavigationDirection,
  clearListOpenSplash,
  peekListNavigationDirection,
  rememberListNavigation,
} from "@/lib/listTransition";
import { IndexBackdropLayer } from "./IndexBackdrop";

const SLIDE_MS = 320;

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

type ListNavProviderProps = {
  children: ReactNode;
  libraryLayer: ReactNode;
  header?: ReactNode;
  backdrop?: ReactNode;
  overlay?: ReactNode;
  onShowDetailChange?: (state: {
    showDetail: boolean;
    animatingBack: boolean;
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
  const timers = useRef<number[]>([]);
  const animatingBackRef = useRef(false);
  const libraryScrollYRef = useRef<number | null>(null);

  function scrollToPane(showingDetail: boolean) {
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

  const publishNavState = useCallback(
    (next: { showDetail: boolean; animatingBack: boolean }) => {
      setShowDetailState(next.showDetail);
      onShowDetailChange?.(next);
    },
    [onShowDetailChange],
  );

  const setShowDetail = useCallback(
    (next: boolean) => {
      publishNavState({ showDetail: next, animatingBack: animatingBackRef.current });
    },
    [publishNavState],
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
      animatingBackRef.current = false;
      publishNavState({ showDetail: false, animatingBack: false });
      setSettled(true);
      return;
    }
    if (!isBuilder) {
      animatingBackRef.current = false;
      publishNavState({ showDetail: false, animatingBack: false });
      setSettled(true);
      scrollToPane(false);
      return;
    }

    const direction = peekListNavigationDirection();
    if (direction === "forward") {
      libraryScrollYRef.current = window.scrollY;
      if (prefersReducedMotion()) {
        clearListNavigationDirection();
        setSettled(true);
        scrollToPane(true);
        setShowDetail(true);
        return;
      }
      setSettled(false);
      scrollToPane(true);
      setShowDetail(true);
      const settleTimer = window.setTimeout(() => {
        clearListNavigationDirection();
        setSettled(true);
      }, SLIDE_MS);
      return () => {
        window.clearTimeout(settleTimer);
      };
    }

    setSettled(true);
    scrollToPane(true);
    setShowDetail(true);
  }, [isBuilder, isHome, pathname, publishNavState, setShowDetail]);

  function goBack() {
    if (animatingBackRef.current || !isBuilder) {
      return;
    }
    rememberListNavigation("back");
    clearListOpenSplash();
    clearTimers();
    if (prefersReducedMotion()) {
      setSettled(true);
      scrollToPane(false);
      router.push("/dashboard", { scroll: false });
      return;
    }
    animatingBackRef.current = true;
    setSettled(false);
    publishNavState({ showDetail: false, animatingBack: true });
    schedule(() => {
      router.push("/dashboard", { scroll: false });
      animatingBackRef.current = false;
      setSettled(true);
      publishNavState({ showDetail: false, animatingBack: false });
    }, SLIDE_MS);
  }

  return (
    <ListNavContext.Provider value={{ goBack }}>
      <div className="relative min-h-dvh w-full overflow-x-hidden">
        <IndexBackdropLayer />
        {header ? (
          <header className={`${SITE_HEADER_BAR_CLASS} pointer-events-auto fixed inset-x-0 top-0 z-[60] pt-[env(safe-area-inset-top)]`}>
            {header}
          </header>
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
              {backdrop}
              {overlay}
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
