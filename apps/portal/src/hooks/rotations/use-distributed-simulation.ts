"use client";

import { useState, useCallback, useEffect } from "react";
import { useSetAtom } from "jotai";

import {
  createSimJobAtom,
  updateSimPhaseAtom,
  updateSimProgressAtom,
  completeSimJobAtom,
  failSimJobAtom,
} from "@/atoms/simulation/job";
import { computingDrawerOpenAtom } from "@/components/layout/computing-drawer";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { useRustSimConfig } from "./use-rust-sim-config";

export interface DistributedSimulationState {
  isRunning: boolean;
  jobId: string | null;
  error: Error | null;
  result: {
    meanDps: number;
    totalIterations: number;
    chunksCompleted: number;
  } | null;
}

export interface DistributedSimulationParams {
  rotationId: string; // UUID of the rotation in rotations table
  spellIds: readonly number[];
  duration: number;
  iterations: number;
  name: string;
}

export function useDistributedSimulation() {
  const [state, setState] = useState<DistributedSimulationState>({
    isRunning: false,
    jobId: null,
    error: null,
    result: null,
  });

  const supabase = createClient();
  const { build: buildConfig } = useRustSimConfig();

  const createJob = useSetAtom(createSimJobAtom);
  const updatePhase = useSetAtom(updateSimPhaseAtom);
  const updateProgress = useSetAtom(updateSimProgressAtom);
  const completeJob = useSetAtom(completeSimJobAtom);
  const failJob = useSetAtom(failSimJobAtom);
  const setDrawerOpen = useSetAtom(computingDrawerOpenAtom);

  // Poll for job updates (no realtime for browser - too expensive at scale)
  useEffect(() => {
    if (!state.jobId || !state.isRunning) return;

    const pollInterval = setInterval(async () => {
      const { data: job } = await supabase
        .from("sim_jobs")
        .select("status, completedIterations, totalIterations, result")
        .eq("id", state.jobId!)
        .single();

      if (!job) return;

      updateProgress({
        jobId: state.jobId!,
        current: job.completedIterations,
        total: job.totalIterations,
        eta: "Distributed...",
      });

      if (job.status === "completed" && job.result) {
        clearInterval(pollInterval);

        const result = job.result as {
          meanDps: number;
          totalIterations: number;
          chunksCompleted: number;
        };

        completeJob({
          jobId: state.jobId!,
          resultId: state.jobId,
          result: {
            dps: result.meanDps,
            totalDamage: result.meanDps * 300,
            durationMs: 300000,
            events: [],
            casts: 0,
          },
        });

        setState((prev) => ({
          ...prev,
          isRunning: false,
          result,
        }));
      } else if (job.status === "failed") {
        clearInterval(pollInterval);
        failJob({ jobId: state.jobId!, error: "Job failed" });
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: new Error("Distributed simulation failed"),
        }));
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [
    state.jobId,
    state.isRunning,
    supabase,
    updateProgress,
    completeJob,
    failJob,
  ]);

  const run = useCallback(
    async (params: DistributedSimulationParams) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Must be logged in to run distributed simulations");
      }

      setState({
        isRunning: true,
        jobId: null,
        error: null,
        result: null,
      });

      const localJobId = createJob({
        name: `${params.name} (Distributed)`,
        rotationId: params.rotationId,
        totalIterations: params.iterations,
        code: "", // Script is fetched by node via rotationId
      });

      setDrawerOpen(true);

      try {
        // Phase 1: Build SimConfig with spells/auras
        updatePhase({
          jobId: localJobId,
          phase: "preparing-spells",
          detail: "Loading spell data...",
        });

        const { config } = await buildConfig({
          spellIds: params.spellIds,
          duration: params.duration,
          rotationId: params.rotationId,
          onProgress: (phase, progress) => {
            updatePhase({
              jobId: localJobId,
              phase: "preparing-spells",
              detail: phase,
            });
          },
        });

        // Phase 2: Upload config to sim_configs table (server calculates hash)
        updatePhase({
          jobId: localJobId,
          phase: "preparing-spells",
          detail: "Uploading config...",
        });

        const upsertResponse = await fetch(
          `${env.SUPABASE_URL}/functions/v1/config-upsert`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ config }),
          },
        );

        if (!upsertResponse.ok) {
          const error = await upsertResponse.json();
          throw new Error(error.error || "Failed to upload config");
        }

        const { hash } = await upsertResponse.json();

        // Phase 3: Create job with configHash only
        updatePhase({
          jobId: localJobId,
          phase: "preparing-spells",
          detail: "Creating job...",
        });

        const response = await fetch(
          `${env.SUPABASE_URL}/functions/v1/job-create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              configHash: hash,
              iterations: params.iterations,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create job");
        }

        const { jobId, chunks, queued } = await response.json();

        setState((prev) => ({ ...prev, jobId }));

        updatePhase({
          jobId: localJobId,
          phase: "running",
          detail: queued
            ? `${chunks} chunks queued, waiting for nodes...`
            : `${chunks} chunks distributed`,
        });

        // Job created - polling will handle updates
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        failJob({ jobId: localJobId, error: err.message });
        setState({
          isRunning: false,
          jobId: null,
          error: err,
          result: null,
        });
        throw err;
      }
    },
    [supabase, createJob, updatePhase, failJob, setDrawerOpen, buildConfig],
  );

  return { run, ...state };
}
