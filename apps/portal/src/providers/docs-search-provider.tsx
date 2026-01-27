"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useState } from "react";

import { SearchCommand } from "@/components/common/search-command";

type DocsSearchContextValue = {
  openSearch: () => void;
};

const DocsSearchContext = createContext<DocsSearchContextValue | null>(null);

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <DocsSearchContext.Provider value={{ openSearch: () => setOpen(true) }}>
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
