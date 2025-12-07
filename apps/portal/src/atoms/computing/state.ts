import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// -----------------------------------------------------------------------------
// Simulation Phase
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Simulation Job
// -----------------------------------------------------------------------------

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
}

export const jobsAtom = atomWithStorage<SimulationJob[]>("computing-jobs", []);

export type ComputingCardId =
  | "active-jobs"
  | "queued-jobs"
  | "completed-jobs"
  | "queue"
  | "resources";

export const computingCardOrderAtom = atomWithStorage<
  readonly ComputingCardId[]
>("computing-card-order", [
  "active-jobs",
  "queued-jobs",
  "completed-jobs",
  "queue",
  "resources",
]);

export const toggleJobAtom = atom(null, (get, set, jobId: string) => {
  const jobs = get(jobsAtom);
  set(
    jobsAtom,
    jobs.map((job) => {
      if (job.id !== jobId) return job;
      const newStatus =
        job.status === "running"
          ? ("paused" as const)
          : job.status === "paused"
            ? ("running" as const)
            : job.status;
      return { ...job, status: newStatus };
    }),
  );
});

export const cancelJobAtom = atom(null, (get, set, jobId: string) => {
  const jobs = get(jobsAtom);
  set(
    jobsAtom,
    jobs.filter((job) => job.id !== jobId),
  );
});

export const activeJobsCountAtom = atom((get) => {
  const jobs = get(jobsAtom);
  return jobs.filter((job) => job.status === "running").length;
});

export const queuedJobsCountAtom = atom((get) => {
  const jobs = get(jobsAtom);
  return jobs.filter((job) => job.status === "queued").length;
});

export const completedJobsCountAtom = atom((get) => {
  const jobs = get(jobsAtom);
  return jobs.filter((job) => job.status === "completed").length;
});
