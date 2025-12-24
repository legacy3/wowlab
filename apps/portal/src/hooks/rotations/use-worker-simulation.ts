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
import { loadSpellsById, loadAurasById } from "@/lib/simulation";
import {
  runSimulationsPromise,
  type SimulationStats,
  type WorkerPoolConfig,
} from "@/lib/workers";

/**
 * Extract spell IDs from rotation code.
 *
 * Looks for patterns like:
 * - `SpellIds = { COBRA_SHOT: 193455, ... }`
 * - `const SPELL_ID = 12345`
 * - Direct numbers in tryCast calls: `tryCast(..., 12345, ...)`
 */
export function extractSpellIds(code: string): number[] {
  const ids = new Set<number>();

  // Pattern 1: SpellIds object - { NAME: 12345 }
  // Using [\s\S] instead of . with s flag for cross-line matching
  const spellIdsObjectMatch = code.match(/SpellIds\s*=\s*\{([\s\S]+?)\}/);
  if (spellIdsObjectMatch) {
    const objectContent = spellIdsObjectMatch[1];
    const valueMatches = objectContent.matchAll(/:\s*(\d+)/g);
    for (const match of valueMatches) {
      ids.add(parseInt(match[1], 10));
    }
  }

  // Pattern 2: const NAME = 12345 (for spell ID constants)
  const constMatches = code.matchAll(/const\s+[A-Z_]+\s*=\s*(\d{4,})/g);
  for (const match of constMatches) {
    const num = parseInt(match[1], 10);
    // Only consider 5+ digit numbers as spell IDs
    if (num >= 10000) {
      ids.add(num);
    }
  }

  // Pattern 3: Direct numbers in tryCast - tryCast(rotation, playerId, 12345, ...)
  const tryCastMatches = code.matchAll(/tryCast\s*\([^,]+,\s*[^,]+,\s*(\d+)/g);
  for (const match of tryCastMatches) {
    ids.add(parseInt(match[1], 10));
  }

  return Array.from(ids);
}

export interface WorkerSimulationState {
  isRunning: boolean;
  stats: SimulationStats | null;
  error: Error | null;
  jobId: string | null;
}

export interface WorkerSimulationParams {
  code: string;
  name: string;
  iterations?: number;
  duration?: number;
  workerConfig?: WorkerPoolConfig;
}

export interface UseWorkerSimulationOptions {
  onComplete?: (stats: SimulationStats) => void;
  onError?: (error: Error) => void;
}

export function useWorkerSimulation(options?: UseWorkerSimulationOptions) {
  const [state, setState] = useState<WorkerSimulationState>({
    isRunning: false,
    stats: null,
    error: null,
    jobId: null,
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
    async (params: WorkerSimulationParams) => {
      const {
        code,
        name,
        iterations = 100,
        duration = 60,
        workerConfig,
      } = params;

      setState({
        isRunning: true,
        stats: null,
        error: null,
        jobId: null,
      });

      // Create job in computing drawer
      const jobId = createJob({
        name: `${name} (Worker Sim)`,
        rotationId: name.toLowerCase().replace(/\s+/g, "-"),
        totalIterations: iterations,
      });

      setDrawerOpen(true);
      setState((prev) => ({ ...prev, jobId }));

      try {
        // Phase 1: Extract spell IDs from code
        updatePhase({
          jobId,
          phase: "preparing-spells",
          detail: "Analyzing rotation code",
        });

        const spellIds = extractSpellIds(code);

        if (spellIds.length === 0) {
          throw new Error(
            "No spell IDs found in rotation code. Define a SpellIds object or use numeric spell IDs.",
          );
        }

        // Phase 2: Load spell and aura data
        updatePhase({
          jobId,
          phase: "preparing-spells",
          detail: `Loading ${spellIds.length} spells`,
        });

        const spells = await loadSpellsById(
          spellIds,
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

        const auras = await loadAurasById(spellIds, queryClient, dataProvider);

        // Phase 3: Initialize workers
        updatePhase({
          jobId,
          phase: "booting-engine",
          detail: "Starting worker pool",
        });

        // Phase 4: Run simulations
        updatePhase({
          jobId,
          phase: "running",
          detail: `Running ${iterations} iterations`,
        });

        const stats = await runSimulationsPromise(
          {
            code,
            spellIds,
            spells,
            auras,
            iterations,
            duration,
          },
          workerConfig,
        );

        // Check for errors
        if (stats.errors.length > 0) {
          const errorSummary =
            stats.errors.length === 1
              ? stats.errors[0]
              : `${stats.errors.length} errors occurred`;
          throw new Error(errorSummary);
        }

        completeJob({
          jobId,
          resultId: null,
          result: {
            dps: stats.avgDps,
            totalDamage: stats.totalDamage,
            durationMs: duration * 1000,
            events: [],
            casts: stats.totalCasts,
          },
        });

        setState({
          isRunning: false,
          stats,
          error: null,
          jobId,
        });

        options?.onComplete?.(stats);

        return stats;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        failJob({
          jobId,
          error: err.message,
        });

        setState({
          isRunning: false,
          stats: null,
          error: err,
          jobId,
        });

        options?.onError?.(err);

        throw err;
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
