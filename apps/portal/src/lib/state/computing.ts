"use client";

import { create } from "zustand";

interface DrawerStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useComputingDrawer = create<DrawerStore>()((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}));
