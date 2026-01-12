"use client";

import { useBoolean } from "ahooks";
import { createContext, type ReactNode, useContext } from "react";

interface SidebarContextValue {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, { setFalse: close, setTrue: open, toggle }] =
    useBoolean(false);

  const value: SidebarContextValue = {
    close,
    isOpen,
    open,
    toggle,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
