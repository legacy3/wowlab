import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface ComputingJob {
  id: string;
  name: string;
  status: "running" | "queued" | "completed" | "paused";
  progress: number;
  current: string;
  eta: string;
}

const DEFAULT_JOBS: ComputingJob[] = [
  {
    id: "1",
    name: "Top Gear Optimization",
    status: "running",
    progress: 67,
    current: "1,672 / 2,496",
    eta: "8 minutes",
  },
  {
    id: "2",
    name: "Gear Comparison Batch",
    status: "queued",
    progress: 0,
    current: "0 / 450",
    eta: "Pending",
  },
  {
    id: "3",
    name: "Stat Weight Analysis",
    status: "completed",
    progress: 100,
    current: "1,000 / 1,000",
    eta: "Completed",
  },
];

export const jobsAtom = atomWithStorage<ComputingJob[]>(
  "computing-jobs",
  DEFAULT_JOBS,
);

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
    jobs.map((job) =>
      job.id === jobId
        ? {
            ...job,
            status:
              job.status === "running"
                ? ("paused" as const)
                : job.status === "paused"
                  ? ("running" as const)
                  : job.status,
          }
        : job,
    ),
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
