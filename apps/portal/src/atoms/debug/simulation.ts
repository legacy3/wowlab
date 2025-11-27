import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// TODO This exists so build compiles at the moment
type SimulationEvent = Record<string, unknown>;

const simulationResultDataAtom = atom<{
  snapshots: number;
  events: SimulationEvent[];
  success: boolean;
  logs?: string[];
} | null>(null);

export const runSimulationAtom = atom(null, async (_get, set) => {
  // Stub implementation - button does nothing
  console.log("Simulation is temporarily disabled");
  const result = {
    snapshots: 0,
    events: [],
    success: false,
    logs: ["Simulation is temporarily disabled"],
  };
  set(simulationResultDataAtom, result);
  return result;
});

export const simulationResultAtom = atom((get) =>
  get(simulationResultDataAtom),
);

export const simulationEventsAtom = atom((get) => {
  const result = get(simulationResultDataAtom);
  return result?.events ?? [];
});

export const simulationSnapshotCountAtom = atom((get) => {
  const result = get(simulationResultDataAtom);
  return result?.snapshots ?? 0;
});

export const simulationLogsAtom = atom((get) => {
  const result = get(simulationResultDataAtom);
  return result?.logs ?? [];
});

// Simulation card order management
export type SimulationCardId =
  | "controls"
  | "result"
  | "error"
  | "logs"
  | "events";

const DEFAULT_SIMULATION_ORDER: SimulationCardId[] = [
  "controls",
  "result",
  "error",
  "logs",
  "events",
];

export const simulationOrderAtom = atomWithStorage<SimulationCardId[]>(
  "simulation-order",
  DEFAULT_SIMULATION_ORDER,
);
