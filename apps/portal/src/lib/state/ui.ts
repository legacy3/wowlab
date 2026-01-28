"use client";

import { createClientState } from "./helpers";

export const useSidebar = createClientState<{ collapsed: boolean }>({
  initial: { collapsed: false },
  persist: "sidebar",
});

export const useCardExpanded = createClientState<boolean>({
  initial: false,
  persist: "cards-expanded",
});
