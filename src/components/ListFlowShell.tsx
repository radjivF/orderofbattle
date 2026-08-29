"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { BuilderChromeValue } from "./BuilderChrome";
import type { LibraryChromeValue } from "./LibraryChrome";
import { listFlowHeaderMode, listFlowIsHome } from "@/lib/listFlowNav";
import { ListNavProvider } from "./IosNavSlide";
import { ListFlowHeader } from "./ListFlowHeader";
import { LibraryScreen } from "./LibraryScreen";

type ListFlowDecor = {
  backdrop?: ReactNode;
  overlay?: ReactNode;
};

const ListFlowDecorContext = createContext<{
  setDecor: (next: ListFlowDecor) => void;
} | null>(null);

const ListFlowChromeContext = createContext<{
  setBuilderChrome: (next: BuilderChromeValue | null) => void;
  setLibraryChrome: (next: LibraryChromeValue | null) => void;
} | null>(null);

export function ListFlowShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = listFlowIsHome(pathname);
  const isBuilder = pathname.startsWith("/lists/");
  const listId = isBuilder ? (pathname.split("/")[2] ?? null) : null;
  const [navState, setNavState] = useState({
    showDetail: false,
    animatingBack: false,
  });
  const [decor, setDecorState] = useState<ListFlowDecor>({});
  const [builderChrome, setBuilderChrome] = useState<BuilderChromeValue | null>(
    null,
  );
  const [libraryChrome, setLibraryChrome] = useState<LibraryChromeValue | null>(
    null,
  );
  const setDecor = useCallback((next: ListFlowDecor) => {
    setDecorState(next);
  }, [setDecorState]);
  const decorContext = useMemo(() => ({ setDecor }), [setDecor]);
  const showBuilderHeader =
    listFlowHeaderMode({
      isBuilder,
      showDetail: navState.showDetail,
      animatingBack: navState.animatingBack,
    }) === "builder";

  useEffect(() => {
    if (!isBuilder) {
      setBuilderChrome(null);
      setDecorState({});
    }
  }, [isBuilder]);

  return (
    <ListFlowDecorContext.Provider value={decorContext}>
      <ListFlowChromeContext.Provider
        value={{ setBuilderChrome, setLibraryChrome }}
      >
        {isHome ? children : null}
        <div hidden={isHome}>
          <ListNavProvider
            libraryLayer={<LibraryScreen />}
            onShowDetailChange={setNavState}
            header={
              <ListFlowHeader
                mode={showBuilderHeader ? "builder" : "library"}
                listId={listId}
                builderChrome={builderChrome}
                libraryChrome={libraryChrome}
              />
            }
            backdrop={decor.backdrop}
            overlay={decor.overlay}
          >
            {isHome ? null : children}
          </ListNavProvider>
        </div>
      </ListFlowChromeContext.Provider>
    </ListFlowDecorContext.Provider>
  );
}

export function useListFlowDecor() {
  const ctx = useContext(ListFlowDecorContext);
  if (!ctx) {
    throw new Error("useListFlowDecor must be used within ListFlowShell");
  }
  return ctx;
}

export function useListFlowChrome() {
  const ctx = useContext(ListFlowChromeContext);
  if (!ctx) {
    throw new Error("useListFlowChrome must be used within ListFlowShell");
  }
  return ctx;
}
