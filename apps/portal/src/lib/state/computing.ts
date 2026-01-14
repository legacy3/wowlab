"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export type SimulationPhase =
  | "preparing-spells"
  | "booting-engine"
  | "running"
  | "uploading"
  | "completed"
  | "failed";

export const PHASE_LABELS: Record<SimulationPhase, string> = {
  "booting-engine": "Booting simulation engine",
  completed: "Completed",
  failed: "Failed",
  "preparing-spells": "Preparing spells",
  running: "Running simulation",
  uploading: "Uploading results",
};

export type ComputingCardId =
  | "cpu-cores"
  | "memory"
  | "workers"
  | "simulations"
  | "iterations"
  | "status"
  | "job-history";

export type JobStatus =
  | "running"
  | "queued"
  | "completed"
  | "paused"
  | "failed"
  | "cancelled";

export interface PerformanceDataPoint {
  itersPerSec: number;
  memoryMB: number;
  time: number;
}

export interface SimulationJob {
  codeBase64: string | null;
  current: string;
  error: string | null;
  eta: string;
  id: string;
  name: string;
  phase: SimulationPhase;
  phaseDetail: string;
  progress: number;
  result: {
    dps: number;
    totalDamage: number;
    durationMs: number;
    events: unknown[];
    casts: number;
  } | null;
  resultId: string | null;
  rotationId: string;
  status: JobStatus;
}

export interface WorkerSystemState {
  lastInitialized: number | null;
  totalIterationsRun: number;
  totalSimulationsRun: number;
  workerVersion: string | null;
}

const DEFAULT_CARD_ORDER: ComputingCardId[] = [
  "cpu-cores",
  "memory",
  "workers",
  "simulations",
  "iterations",
  "status",
  "job-history",
];

// Worker system store
interface WorkerSystemStore extends WorkerSystemState {
  update: (
    patch: { iterationsRun?: number } & Partial<
      Pick<WorkerSystemState, "workerVersion">
    >,
  ) => void;
}

export const useWorkerSystem = create<WorkerSystemStore>()(
  persist(
    (set, get) => ({
      lastInitialized: null,
      totalIterationsRun: 0,
      totalSimulationsRun: 0,
      update: (patch) => {
        const current = get();
        set({
          lastInitialized: patch.workerVersion
            ? Date.now()
            : current.lastInitialized,
          totalIterationsRun:
            current.totalIterationsRun + (patch.iterationsRun ?? 0),
          totalSimulationsRun: current.totalSimulationsRun + 1,
          workerVersion: patch.workerVersion ?? current.workerVersion,
        });
      },
      workerVersion: null,
    }),
    { name: "wowlab-worker-system" },
  ),
);

// Jobs store
interface JobsStore {
  addJob: (job: SimulationJob) => void;
  cancelJob: (id: string) => void;
  clearJobs: () => void;
  jobs: SimulationJob[];
  updateJob: (id: string, patch: Partial<SimulationJob>) => void;
}

export const useJobs = create<JobsStore>()(
  persist(
    (set, get) => ({
      addJob: (job) => set({ jobs: [job, ...get().jobs] }),
      cancelJob: (id) =>
        set({
          jobs: get().jobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  eta: "Cancelled",
                  phase: "failed" as const,
                  phaseDetail: "Cancelled by user",
                  status: "cancelled" as const,
                }
              : j,
          ),
        }),
      clearJobs: () => set({ jobs: [] }),
      jobs: [],
      updateJob: (id, patch) =>
        set({
          jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        }),
    }),
    { name: "wowlab-computing-jobs" },
  ),
);

// Performance data store (not persisted)
interface PerformanceStore {
  clear: () => void;
  data: PerformanceDataPoint[];
  push: (point: PerformanceDataPoint) => void;
}

export const usePerformance = create<PerformanceStore>()((set, get) => ({
  clear: () => set({ data: [] }),
  data: [],
  push: (point) => {
    const current = get().data;
    set({ data: [...current, point].slice(-60) });
  },
}));

// Card order store
interface CardOrderStore {
  order: ComputingCardId[];
  setOrder: (order: ComputingCardId[]) => void;
}

export const useComputingCardOrder = create<CardOrderStore>()(
  persist(
    (set) => ({
      order: DEFAULT_CARD_ORDER,
      setOrder: (order) => set({ order }),
    }),
    { name: "wowlab-computing-order" },
  ),
);

// Drawer state
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

// Selector functions for use with useMemo in components
// These return stable references when composed with useMemo
export const selectActiveJobs = (jobs: SimulationJob[]) =>
  jobs.filter((j) => j.status === "running" || j.status === "queued");

export const selectCompletedJobs = (jobs: SimulationJob[]) =>
  jobs.filter(
    (j) =>
      j.status === "completed" ||
      j.status === "failed" ||
      j.status === "cancelled",
  );

export const selectRunningJobsCount = (jobs: SimulationJob[]) =>
  jobs.filter((j) => j.status === "running").length;
