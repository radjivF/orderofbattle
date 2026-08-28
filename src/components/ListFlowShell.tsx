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
import { ListNavProvider } from "./IosNavSlide";
import { ListFlowHeader } from "./ListFlowHeader";

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
  const isBuilder = pathname.startsWith("/lists/");
  const listId = isBuilder ? (pathname.split("/")[2] ?? null) : null;
  const [decor, setDecorState] = useState<ListFlowDecor>({});
  const [builderChrome, setBuilderChrome] = useState<BuilderChromeValue | null>(
    null,
  );
  const [libraryChrome, setLibraryChrome] = useState<LibraryChromeValue | null>(
    null,
  );
  const setDecor = useCallback((next: ListFlowDecor) => {
    setDecorState(next);
  }, []);
  const decorContext = useMemo(() => ({ setDecor }), [setDecor]);

  useEffect(() => {
    if (isBuilder) {
      setLibraryChrome(null);
      return;
    }
    setBuilderChrome(null);
    setDecorState({});
  }, [isBuilder]);

  return (
    <ListFlowDecorContext.Provider value={decorContext}>
      <ListFlowChromeContext.Provider
        value={{ setBuilderChrome, setLibraryChrome }}
      >
        <ListNavProvider
          headerMode={isBuilder ? "builder" : "library"}
          header={
            <ListFlowHeader
              mode={isBuilder ? "builder" : "library"}
              listId={listId}
              builderChrome={builderChrome}
              libraryChrome={libraryChrome}
            />
          }
          backdrop={decor.backdrop}
          overlay={decor.overlay}
        >
          {children}
        </ListNavProvider>
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
