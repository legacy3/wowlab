"use client";

import { atom } from "jotai";

import type { SimulationResult } from "@/lib/simulation/types";

export const simulationResultAtom = atom<SimulationResult | null>(null);

export const simDpsAtom = atom((get) => get(simulationResultAtom)?.dps ?? null);

export const simTotalDamageAtom = atom(
  (get) => get(simulationResultAtom)?.totalDamage ?? null,
);

export const simDurationAtom = atom((get) => {
  const result = get(simulationResultAtom);
  return result ? result.durationMs / 1000 : null;
});

export const simCastsAtom = atom(
  (get) => get(simulationResultAtom)?.casts ?? null,
);

export const simEventsAtom = atom(
  (get) => get(simulationResultAtom)?.events ?? [],
);
