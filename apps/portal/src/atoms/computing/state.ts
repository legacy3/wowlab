"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { createPersistedOrderAtom } from "../utils";

export type ComputingCardId =
  | "cpu-cores"
  | "memory"
  | "workers"
  | "simulations"
  | "iterations"
  | "status"
  | "job-history"
  | "performance-chart";

export const computingOrderAtom = createPersistedOrderAtom<ComputingCardId>(
  "computing-order-v5",
  [
    "cpu-cores",
    "memory",
    "workers",
    "simulations",
    "iterations",
    "status",
    "performance-chart",
    "job-history",
  ],
);

export interface WorkerSystemState {
  workerVersion: string | null;
  lastInitialized: number | null;
  totalSimulationsRun: number;
  totalIterationsRun: number;
}

export const workerSystemAtom = atomWithStorage<WorkerSystemState>(
  "worker-system-state",
  {
    workerVersion: null,
    lastInitialized: null,
    totalSimulationsRun: 0,
    totalIterationsRun: 0,
  },
);

export const workerVersionAtom = atom(
  (get) => get(workerSystemAtom).workerVersion,
);

export const updateWorkerSystemAtom = atom(
  null,
  (
    get,
    set,
    update: { workerVersion?: string | null; iterationsRun?: number },
  ) => {
    const current = get(workerSystemAtom);
    set(workerSystemAtom, {
      ...current,
      workerVersion: update.workerVersion ?? current.workerVersion,
      lastInitialized: update.workerVersion
        ? Date.now()
        : current.lastInitialized,
      totalSimulationsRun: current.totalSimulationsRun + 1,
      totalIterationsRun:
        current.totalIterationsRun + (update.iterationsRun ?? 0),
    });
  },
);

export type SimulationPhase =
  | "preparing-spells"
  | "booting-engine"
  | "running"
  | "uploading"
  | "completed"
  | "failed";

export const PHASE_LABELS: Record<SimulationPhase, string> = {
  "preparing-spells": "Preparing spells",
  "booting-engine": "Booting simulation engine",
  running: "Running simulation",
  uploading: "Uploading results",
  completed: "Completed",
  failed: "Failed",
};

export interface SimulationJob {
  id: string;
  name: string;
  status: "running" | "queued" | "completed" | "paused" | "failed";
  progress: number;
  current: string;
  eta: string;
  phase: SimulationPhase;
  phaseDetail: string;
  rotationId: string;
  resultId: string | null;
  error: string | null;
  result: {
    dps: number;
    totalDamage: number;
    durationMs: number;
    events: unknown[];
    casts: number;
  } | null;
}

export const jobsAtom = atomWithStorage<SimulationJob[]>("computing-jobs", []);

export const cancelJobAtom = atom(null, (get, set, jobId: string) => {
  set(
    jobsAtom,
    get(jobsAtom).filter((job) => job.id !== jobId),
  );
});

export const activeJobsCountAtom = atom(
  (get) => get(jobsAtom).filter((job) => job.status === "running").length,
);
