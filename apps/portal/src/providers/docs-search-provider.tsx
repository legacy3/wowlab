"use client";

import type { ReactNode } from "react";

import { useBoolean, useKeyPress } from "ahooks";
import { createContext, useContext } from "react";

import { SearchCommand } from "@/components/common/search-command";

type DocsSearchContextValue = {
  openSearch: () => void;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [open, { set: setOpen, setTrue: openSearch, toggle }] =
    useBoolean(false);

  useKeyPress(["meta.k", "ctrl.k"], (e) => {
    e.preventDefault();
    toggle();
  });

  return (
    <DocsSearchContext.Provider value={{ openSearch }}>
      {children}
      <SearchCommand open={open} onOpenChange={setOpen} />
    </DocsSearchContext.Provider>
  );
}

export function useDocsSearch() {
  const context = useContext(DocsSearchContext);
  if (!context) {
    throw new Error("useDocsSearch must be used within DocsSearchProvider");
  }

  return context;
}
