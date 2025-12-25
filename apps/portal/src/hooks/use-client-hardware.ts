"use client";

import { useSyncExternalStore } from "react";

interface HardwareInfo {
  cores: number | null;
  memory: number | null;
  workers: number | null;
}

// Cache the hardware info since it never changes
let cachedInfo: HardwareInfo | null = null;

function getHardwareInfo(): HardwareInfo {
  if (cachedInfo === null) {
    const cores = navigator.hardwareConcurrency || 4;
    const memory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
    const workers = Math.max(2, Math.floor(cores / 2));
    cachedInfo = { cores, memory, workers };
  }
  return cachedInfo;
}

const serverSnapshot: HardwareInfo = { cores: null, memory: null, workers: null };
const emptySubscribe = () => () => {};

/**
 * Hook to get client hardware information.
 * Uses useSyncExternalStore for proper SSR/hydration handling without cascading renders.
 */
export function useClientHardware(): HardwareInfo {
  return useSyncExternalStore(
    emptySubscribe,
    getHardwareInfo,
    () => serverSnapshot,
  );
}
