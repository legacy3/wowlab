"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { SimulationResult } from "@/lib/simulation/types";

/**
 * The current simulation result - set when a simulation completes.
 * This is the source of truth for all simulation display components.
 */
export const simulationResultAtom = atom<SimulationResult | null>(null);

/**
 * Active job ID for the current simulation view
 */
export const activeJobIdAtom = atom<string | null>(null);

/**
 * Derived atom: DPS from the current simulation
 */
export const simDpsAtom = atom((get) => {
  const result = get(simulationResultAtom);
  return result?.dps ?? null;
});

/**
 * Derived atom: Total damage from the current simulation
 */
export const simTotalDamageAtom = atom((get) => {
  const result = get(simulationResultAtom);
  return result?.totalDamage ?? null;
});

/**
 * Derived atom: Duration in seconds from the current simulation
 */
export const simDurationAtom = atom((get) => {
  const result = get(simulationResultAtom);
  return result ? result.durationMs / 1000 : null;
});

/**
 * Derived atom: Total casts from the current simulation
 */
export const simCastsAtom = atom((get) => {
  const result = get(simulationResultAtom);
  return result?.casts ?? null;
});

/**
 * Derived atom: Events from the current simulation
 */
export const simEventsAtom = atom((get) => {
  const result = get(simulationResultAtom);
  return result?.events ?? [];
});

/**
 * Recent simulation results for history/comparison
 * Persisted to localStorage
 */
export interface SimulationHistoryEntry {
  id: string;
  timestamp: number;
  rotationName: string;
  dps: number;
  totalDamage: number;
  durationMs: number;
  casts: number;
}

export const simulationHistoryAtom = atomWithStorage<SimulationHistoryEntry[]>(
  "simulation-history",
  [],
);

/**
 * Add a simulation result to history
 */
export const addToHistoryAtom = atom(
  null,
  (
    get,
    set,
    entry: Omit<SimulationHistoryEntry, "id" | "timestamp">,
  ): string => {
    const id = crypto.randomUUID();
    const history = get(simulationHistoryAtom);
    const newEntry: SimulationHistoryEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
    };

    // Keep last 50 entries
    const updated = [newEntry, ...history].slice(0, 50);
    set(simulationHistoryAtom, updated);

    return id;
  },
);
