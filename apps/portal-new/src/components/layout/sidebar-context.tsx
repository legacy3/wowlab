"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface SidebarContextValue {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value: SidebarContextValue = {
    close: () => setIsOpen(false),
    isOpen,
    open: () => setIsOpen(true),
    toggle: () => setIsOpen((prev) => !prev),
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
