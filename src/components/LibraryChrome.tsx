"use client";

import { createContext, useContext, type ReactNode } from "react";

type LibraryChromeValue = {
  openNewList: () => void;
};

const LibraryChromeContext = createContext<LibraryChromeValue | null>(null);

export function LibraryChromeProvider({
  value,
  children,
}: {
  value: LibraryChromeValue;
  children: ReactNode;
}) {
  return (
    <LibraryChromeContext.Provider value={value}>
      {children}
    </LibraryChromeContext.Provider>
  );
}

export function useLibraryChromeOptional() {
  return useContext(LibraryChromeContext);
}
