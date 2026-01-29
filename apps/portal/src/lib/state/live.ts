"use client";

import { create } from "zustand";

export type LiveState = "disconnected" | "connecting" | "connected";

interface LiveStore {
  setState: (state: LiveState) => void;
  state: LiveState;
}

export const useLiveStore = create<LiveStore>()((set) => ({
  setState: (state) => set({ state }),
  state: "disconnected",
}));

export function useLiveConnected() {
  return useLiveStore((s) => s.state === "connected");
}

export function useLiveState() {
  return useLiveStore((s) => s.state);
}
