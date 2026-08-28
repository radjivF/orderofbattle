"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearListNavigationDirection,
  peekListNavigationDirection,
  rememberListNavigation,
} from "@/lib/listTransition";
import {
  iosPushSlideClass,
  libraryReturnCoverCanDismiss,
  libraryReturnCoverRemainingMs,
  type SlidePhase,
} from "@/lib/iosNavSlide";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import { IndexBackdropLayer } from "./IndexBackdrop";
import { ListLoadingSplash } from "./ListLoadingSplash";

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
  header?: ReactNode;
  headerMode?: "builder" | "library" | null;
  backdrop?: ReactNode;
  overlay?: ReactNode;
};

function listFlowHeaderOffsetClass(
  headerMode: ListNavProviderProps["headerMode"],
) {
  if (headerMode === "library") {
    return "pt-[calc(env(safe-area-inset-top)+3.75rem)]";
  }
  if (headerMode === "builder") {
    return "pt-[calc(env(safe-area-inset-top)+3.75rem)]";
  }
  return "";
}

export function ListNavProvider({
  children,
  header,
  headerMode = null,
  backdrop,
  overlay,
}: ListNavProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isBuilder = pathname.startsWith("/lists/");
  const [phase, setPhase] = useState<SlidePhase>("settled");
  const [covering, setCovering] = useState(false);
  const [, startTransition] = useTransition();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const timers = useRef<number[]>([]);
  const coveringRef = useRef(false);
  const coverStartedAt = useRef(0);
  const hideScheduled = useRef(false);

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
    if (coveringRef.current) {
      setPhase("settled");
      return;
    }
    clearTimers();

    if (!isBuilder) {
      setPhase("settled");
      return;
    }

    const direction = peekListNavigationDirection();
    if (direction !== "forward") {
      setPhase("settled");
      return;
    }
    clearListNavigationDirection();
    if (prefersReducedMotion()) {
      setPhase("settled");
      return;
    }
    setPhase("start");
    requestAnimationFrame(() => {
      setPhase("in");
      schedule(() => setPhase("settled"), SLIDE_MS);
    });
  }, [isBuilder, pathname]);

  useLayoutEffect(() => {
    if (
      !coveringRef.current ||
      hideScheduled.current ||
      !libraryReturnCoverCanDismiss({
        isBuilder,
        listsReady: lists !== undefined,
      })
    ) {
      return;
    }
    hideScheduled.current = true;
    const wait = libraryReturnCoverRemainingMs(
      coverStartedAt.current,
      Date.now(),
    );
    schedule(() => {
      coveringRef.current = false;
      hideScheduled.current = false;
      setCovering(false);
    }, wait);
  }, [covering, isBuilder, lists]);

  useEffect(() => {
    if (!covering) {
      return;
    }
    const failSafe = window.setTimeout(() => {
      if (!coveringRef.current) {
        return;
      }
      clearTimers();
      coveringRef.current = false;
      hideScheduled.current = false;
      setCovering(false);
    }, 1200);
    return () => window.clearTimeout(failSafe);
  }, [covering]);

  function goBack() {
    if (coveringRef.current) {
      return;
    }
    rememberListNavigation("back");
    clearTimers();
    if (prefersReducedMotion()) {
      startTransition(() => {
        router.push("/dashboard", { scroll: false });
      });
      return;
    }
    coveringRef.current = true;
    hideScheduled.current = false;
    coverStartedAt.current = Date.now();
    setPhase("settled");
    setCovering(true);
    startTransition(() => {
      router.push("/dashboard", { scroll: false });
    });
  }

  return (
    <ListNavContext.Provider value={{ goBack }}>
      <div className="relative min-h-dvh w-full">
        <IndexBackdropLayer />
        {backdrop}
        {header ? (
          <header className="ios-nav-bar fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
            {header}
          </header>
        ) : null}
        {overlay}
        <div
          className={`ios-push-root relative z-10 ${listFlowHeaderOffsetClass(headerMode)} ${iosPushSlideClass(phase)}`}
        >
          {children}
        </div>
        {covering ? (
          <div
            className="fixed inset-0 z-50 overflow-hidden text-parchment"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <IndexBackdropLayer />
            <div className="relative z-10">
              <ListLoadingSplash label="Loading your lists" />
            </div>
          </div>
        ) : null}
      </div>
    </ListNavContext.Provider>
  );
}

/** Library shell — same stacking root as the builder so the index art stays put. */
export function LibraryNavSlide({ children }: { children: ReactNode }) {
  return <div className="ios-push-root">{children}</div>;
}
