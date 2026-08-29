"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearListNavigationDirection,
  peekListNavigationDirection,
  rememberListNavigation,
} from "@/lib/listTransition";
import { iosPushSlideClass, type SlidePhase } from "@/lib/iosNavSlide";
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
  header?: ReactNode;
  headerMode?: "builder" | "library" | null;
  backdrop?: ReactNode;
  overlay?: ReactNode;
};

function listFlowHeaderOffsetClass(
  headerMode: ListNavProviderProps["headerMode"],
) {
  if (headerMode === "library" || headerMode === "builder") {
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
  const timers = useRef<number[]>([]);

  function clearTimers() {
    for (const id of timers.current) {
      window.clearTimeout(id);
    }
    timers.current = [];
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (!isBuilder) {
      return;
    }
    router.prefetch("/dashboard");
  }, [isBuilder, router]);

  useLayoutEffect(() => {
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
      const id = window.setTimeout(() => setPhase("settled"), SLIDE_MS);
      timers.current.push(id);
    });
  }, [isBuilder, pathname]);

  function goBack() {
    rememberListNavigation("back");
  }

  return (
    <ListNavContext.Provider value={{ goBack }}>
      <div className="relative min-h-dvh w-full">
        <IndexBackdropLayer />
        {backdrop}
        {header ? (
          <header className="ios-nav-bar pointer-events-auto fixed inset-x-0 top-0 z-[60] pt-[env(safe-area-inset-top)]">
            {header}
          </header>
        ) : null}
        {overlay}
        <div
          className={`ios-push-root relative z-10 ${listFlowHeaderOffsetClass(headerMode)} ${iosPushSlideClass(phase)}`}
        >
          {children}
        </div>
      </div>
    </ListNavContext.Provider>
  );
}

/** Library shell — same stacking root as the builder so the index art stays put. */
export function LibraryNavSlide({ children }: { children: ReactNode }) {
  return <div className="ios-push-root">{children}</div>;
}
