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
