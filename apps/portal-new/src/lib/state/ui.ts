"use client";

import { createClientState } from "./helpers";

// Example hooks demonstrating the state pattern.
// Replace or extend these as needed.

type ThemeMode = "light" | "dark" | "system";

export const useTheme = createClientState<{ mode: ThemeMode }>({
  initial: { mode: "system" },
  persist: "theme",
});

export const useSidebar = createClientState<{ collapsed: boolean }>({
  initial: { collapsed: false },
  persist: "sidebar",
});

export const useCardExpanded = createClientState<boolean>({
  initial: false,
  persist: "cards-expanded",
});
