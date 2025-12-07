"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import { useSetAtom } from "jotai";

import {
  createSimJobAtom,
  updateSimPhaseAtom,
  updateSimProgressAtom,
  completeSimJobAtom,
  failSimJobAtom,
} from "@/atoms/simulation/job";
import { computingDrawerOpenAtom } from "@/components/layout/computing-drawer";
import {
  loadSpellsForRotation,
  createBrowserRuntime,
  runSimulationLoop,
  uploadSimulationResult,
  type RotationDefinition,
  type SimulationResult,
} from "@/lib/simulation";

export interface SimulationState {
  isRunning: boolean;
  result: SimulationResult | null;
  error: Error | null;
  jobId: string | null;
  resultId: string | null; // Supabase record ID for viewing/sharing
}

export interface UseSimulationOptions {
  onComplete?: (result: SimulationResult) => void;
  onError?: (error: Error) => void;
}

export function useSimulation(options?: UseSimulationOptions) {
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    result: null,
    error: null,
    jobId: null,
    resultId: null,
  });

  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  const createJob = useSetAtom(createSimJobAtom);
  const updatePhase = useSetAtom(updateSimPhaseAtom);
  const updateProgress = useSetAtom(updateSimProgressAtom);
  const completeJob = useSetAtom(completeSimJobAtom);
  const failJob = useSetAtom(failSimJobAtom);
  const setDrawerOpen = useSetAtom(computingDrawerOpenAtom);

  const run = useCallback(
    async (rotation: RotationDefinition, durationSeconds: number) => {
      setState({
        isRunning: true,
        result: null,
        error: null,
        jobId: null,
        resultId: null,
      });

      // Create job in computing drawer
      const jobId = createJob({
        name: `${rotation.name} Simulation`,
        rotationId: rotation.name.toLowerCase().replace(/\s+/g, "-"),
        totalIterations: Math.ceil((durationSeconds * 1000) / 100), // Approx ticks
      });

      // Open the computing drawer to show progress
      setDrawerOpen(true);

      setState((prev) => ({ ...prev, jobId }));

      let runtime: Awaited<ReturnType<typeof createBrowserRuntime>> | null =
        null;

      try {
        // Phase 1: Load spells
        updatePhase({
          jobId,
          phase: "preparing-spells",
          detail: "Loading spell data",
        });

        const spells = await loadSpellsForRotation(
          rotation,
          queryClient,
          dataProvider,
          (progress) => {
            updatePhase({
              jobId,
              phase: "preparing-spells",
              detail: `Loading spell ${progress.loaded}/${progress.total}`,
            });
          },
        );

        // Phase 2: Create runtime
        updatePhase({
          jobId,
          phase: "booting-engine",
          detail: "Initializing Effect runtime",
        });

        runtime = createBrowserRuntime({ spells });

        // Phase 3: Run simulation
        updatePhase({
          jobId,
          phase: "running",
          detail: "Executing rotation",
        });

        const result = await runSimulationLoop(
          runtime,
          rotation,
          durationSeconds, // Pass seconds, not ms
          spells,
          (progress) => {
            // currentTime and totalTime are both in seconds now
            const remaining = Math.ceil(
              progress.totalTime - progress.currentTime,
            );

            updateProgress({
              jobId,
              current: progress.currentTime,
              total: progress.totalTime,
              eta: `${remaining}s remaining`,
            });
          },
        );

        // Phase 4: Upload results (optional - skipped if no rotationDbId)
        updatePhase({
          jobId,
          phase: "uploading",
          detail: "Saving results to database",
        });

        const resultId = await uploadSimulationResult({ result, rotation });

        // Mark complete (resultId may be null if upload was skipped)
        completeJob({ jobId, resultId: resultId ?? null });

        setState({
          isRunning: false,
          result,
          error: null,
          jobId,
          resultId, // May be null if upload was skipped
        });

        options?.onComplete?.(result);

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        failJob({
          jobId,
          error: err.message,
        });

        setState({
          isRunning: false,
          result: null,
          error: err,
          jobId,
          resultId: null,
        });

        options?.onError?.(err);

        throw err;
      } finally {
        // Always dispose runtime to prevent leaks
        if (runtime) {
          await runtime.dispose();
        }
      }
    },
    [
      queryClient,
      dataProvider,
      createJob,
      updatePhase,
      updateProgress,
      completeJob,
      failJob,
      setDrawerOpen,
      options,
    ],
  );

  return {
    run,
    ...state,
  };
}
