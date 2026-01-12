"use client";

import { createClientState } from "./helpers";

// Example hooks demonstrating the state pattern.
// Replace or extend these as needed.

export const useSidebar = createClientState<{ collapsed: boolean }>({
  initial: { collapsed: false },
  persist: "sidebar",
});

export const useCardExpanded = createClientState<boolean>({
  initial: false,
  persist: "cards-expanded",
});
