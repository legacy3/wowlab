"use client";

import { atom } from "jotai";

import type { SimulationResult } from "@/lib/simulation/types";

/**
 * The current simulation result - set when a simulation completes.
 * This is the source of truth for all simulation display components.
 */
export const simulationResultAtom = atom<SimulationResult | null>(null);

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
