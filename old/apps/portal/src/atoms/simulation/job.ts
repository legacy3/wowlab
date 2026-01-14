"use client";

import { atom } from "jotai";

import {
  jobsAtom,
  type SimulationJob,
  type SimulationPhase,
} from "@/atoms/computing/state";
import { formatInt } from "@/lib/format";

export interface CreateSimJobParams {
  name: string;
  rotationId: string;
  totalIterations: number;
  code: string;
}

export const createSimJobAtom = atom(
  null,
  (get, set, params: CreateSimJobParams): string => {
    const id = crypto.randomUUID();
    const job: SimulationJob = {
      id,
      name: params.name,
      status: "running",
      progress: 0,
      current: `0 / ${formatInt(params.totalIterations)}`,
      eta: "Calculating ...",
      phase: "preparing-spells",
      phaseDetail: "Loading spell data",
      rotationId: params.rotationId,
      resultId: null,
      error: null,
      codeBase64: btoa(params.code),
      result: null,
    };

    const jobs = get(jobsAtom);
    set(jobsAtom, [job, ...jobs]);

    return id;
  },
);

export const updateSimPhaseAtom = atom(
  null,
  (
    get,
    set,
    params: { jobId: string; phase: SimulationPhase; detail: string },
  ) => {
    const jobs = get(jobsAtom);
    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? { ...job, phase: params.phase, phaseDetail: params.detail }
          : job,
      ),
    );
  },
);

export const updateSimProgressAtom = atom(
  null,
  (
    get,
    set,
    params: {
      jobId: string;
      current: number;
      total: number;
      eta?: string;
    },
  ) => {
    const jobs = get(jobsAtom);
    const progress = Math.min(
      100,
      Math.max(0, Math.round((params.current / params.total) * 100)),
    );

    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              progress,
              current: `${formatInt(params.current)} / ${formatInt(params.total)}`,
              eta: params.eta ?? job.eta,
            }
          : job,
      ),
    );
  },
);

export const completeSimJobAtom = atom(
  null,
  (
    get,
    set,
    params: {
      jobId: string;
      resultId: string | null;
      result: SimulationJob["result"];
    },
  ) => {
    const jobs = get(jobsAtom);
    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              status: "completed" as const,
              progress: 100,
              phase: "completed" as const,
              phaseDetail: "Simulation complete",
              eta: "Completed",
              resultId: params.resultId,
              result: params.result,
            }
          : job,
      ),
    );
  },
);

export const failSimJobAtom = atom(
  null,
  (get, set, params: { jobId: string; error: string }) => {
    const jobs = get(jobsAtom);
    set(
      jobsAtom,
      jobs.map((job) =>
        job.id === params.jobId
          ? {
              ...job,
              status: "failed" as const,
              phase: "failed" as const,
              phaseDetail: params.error,
              eta: "Failed",
              error: params.error,
            }
          : job,
      ),
    );
  },
);
