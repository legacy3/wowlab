"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import { useSetAtom } from "jotai";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Exit from "effect/Exit";

import {
  createSimJobAtom,
  updateSimPhaseAtom,
  updateSimProgressAtom,
  completeSimJobAtom,
  failSimJobAtom,
} from "@/atoms/simulation/job";
import {
  updateWorkerSystemAtom,
  pushPerformanceDataAtom,
  clearPerformanceDataAtom,
} from "@/atoms/computing";
import { computingDrawerOpenAtom } from "@/components/layout/computing-drawer";
import { combatDataAtom, createEmptyCombatData } from "@/atoms/timeline";
import { loadSpellsById, loadAurasById } from "@/lib/simulation";
import { formatDurationMs } from "@/lib/format";
import {
  runSimulations,
  type SimulationStats,
  type WorkerPoolConfig,
} from "@/lib/workers";

// --- Fiber Management ---

const activeFibers = new Map<
  string,
  Fiber.RuntimeFiber<SimulationStats, unknown>
>();

export function cancelSimulation(jobId: string): void {
  const fiber = activeFibers.get(jobId);
  if (fiber) {
    Effect.runFork(Fiber.interrupt(fiber));
    activeFibers.delete(jobId);
  }
}

// --- Spell ID Extraction ---

// TODO This whole code gets refactored/removed
const SPELL_ID_PATTERNS = [
  // SpellIds = { KEY: 12345 }
  { regex: /SpellIds\s*=\s*\{([\s\S]+?)\}/, extractor: extractObjectValues },
  // const SPELL_NAME = 12345
  { regex: /const\s+[A-Z_]+\s*=\s*(\d{4,})/g, extractor: extractMatch },
  // tryCast(12345, ...)
  { regex: /tryCast\s*\(\s*(\d+)/g, extractor: extractMatch },
] as const;

function extractObjectValues(match: RegExpMatchArray): number[] {
  const content = match[1];
  const values = content.matchAll(/:\s*(\d+)/g);

  return Array.from(values, (m) => parseInt(m[1], 10));
}

function extractMatch(match: RegExpMatchArray): number[] {
  const num = parseInt(match[1], 10);

  return num >= 10000 ? [num] : [];
}

export function extractSpellIds(code: string): number[] {
  const ids = new Set<number>();

  for (const { regex, extractor } of SPELL_ID_PATTERNS) {
    if (regex.global) {
      for (const match of code.matchAll(regex)) {
        extractor(match).forEach((id) => ids.add(id));
      }
    } else {
      const match = code.match(regex);
      if (match) {
        extractor(match).forEach((id) => ids.add(id));
      }
    }
  }

  return Array.from(ids);
}

// --- Memory Tracking ---

// TODO This is always 0
function getMemoryUsageMB(): number {
  if (typeof performance === "undefined" || !("memory" in performance)) {
    return 0;
  }

  const memory = (performance as { memory?: { usedJSHeapSize?: number } })
    .memory;

  return memory?.usedJSHeapSize
    ? Math.round((memory.usedJSHeapSize / 1024 / 1024) * 10) / 10
    : 0;
}

// --- Types ---

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

// --- Hook ---

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
  const updateWorkerSystem = useSetAtom(updateWorkerSystemAtom);
  const setCombatData = useSetAtom(combatDataAtom);
  const pushPerformanceData = useSetAtom(pushPerformanceDataAtom);
  const clearPerformanceData = useSetAtom(clearPerformanceDataAtom);

  const run = useCallback(
    async (params: WorkerSimulationParams) => {
      const {
        code,
        name,
        iterations = 5000,
        duration = 60,
        workerConfig = { workerCount: 4 },
      } = params;

      setState({ isRunning: true, stats: null, error: null, jobId: null });
      clearPerformanceData();

      const jobId = createJob({
        name: `${name} (Worker Sim)`,
        rotationId: name.toLowerCase().replace(/\s+/g, "-"),
        totalIterations: iterations,
        code,
      });

      setDrawerOpen(true);
      setState((prev) => ({ ...prev, jobId }));

      try {
        // Load spell data
        updatePhase({
          jobId,
          phase: "preparing-spells",
          detail: "Analyzing rotation code",
        });

        const spellIds = extractSpellIds(code);
        if (spellIds.length === 0) {
          throw new Error("No spell IDs found in rotation code.");
        }

        updatePhase({
          jobId,
          phase: "preparing-spells",
          detail: `Loading ${spellIds.length} spells`,
        });

        const spells = await loadSpellsById(
          spellIds,
          queryClient,
          dataProvider,
          (p) => {
            updatePhase({
              jobId,
              phase: "preparing-spells",
              detail: `Loading spell ${p.loaded}/${p.total}`,
            });
          },
        );

        const auras = await loadAurasById(spellIds, queryClient, dataProvider);

        // Run simulation
        updatePhase({
          jobId,
          phase: "running",
          detail: `Running ${iterations} iterations`,
        });

        let lastCompleted = 0;
        let lastTime = Date.now();

        const effect = runSimulations(
          { code, spellIds, spells, auras, iterations, duration },
          workerConfig,
          (progress) => {
            updateProgress({
              jobId,
              current: progress.completed,
              total: progress.total,
              eta: progress.etaMs
                ? `${formatDurationMs(progress.etaMs)} remaining`
                : "Calculating ...",
            });

            // Track performance metrics (throttled)
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000;
            if (deltaTime > 0.5) {
              const deltaIters = progress.completed - lastCompleted;
              pushPerformanceData({
                time: Math.round(progress.elapsedMs / 1000),
                itersPerSec: Math.round(deltaIters / deltaTime),
                memoryMB: getMemoryUsageMB(),
              });
              lastCompleted = progress.completed;
              lastTime = now;
            }
          },
        );

        // Run as fiber for cancellation support
        const fiber = Effect.runFork(effect);
        activeFibers.set(jobId, fiber);

        const exit = await Effect.runPromise(Fiber.await(fiber));
        activeFibers.delete(jobId);

        if (Exit.isFailure(exit)) {
          if (Exit.isInterrupted(exit)) {
            setState({ isRunning: false, stats: null, error: null, jobId });
            return null;
          }
          const cause = Exit.causeOption(exit);
          throw new Error(
            cause._tag === "Some" ? String(cause.value) : "Simulation failed",
          );
        }

        const stats = exit.value;

        updateWorkerSystem({
          workerVersion: stats.workerVersion,
          iterationsRun: iterations,
        });

        if (stats.errors.length > 0) {
          const msg =
            stats.errors.length === 1
              ? stats.errors[0]
              : `${stats.errors.length} errors occurred`;
          throw new Error(msg);
        }

        completeJob({
          jobId,
          resultId: null,
          result: {
            dps: stats.avgDps,
            totalDamage: stats.totalDamage,
            durationMs: duration * 1000,
            events: stats.bestResult?.events ?? [],
            casts: stats.totalCasts,
          },
        });

        setCombatData(createEmptyCombatData());
        setState({ isRunning: false, stats, error: null, jobId });
        options?.onComplete?.(stats);

        return stats;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        failJob({ jobId, error: err.message });
        setState({ isRunning: false, stats: null, error: err, jobId });
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
      updateWorkerSystem,
      setCombatData,
      pushPerformanceData,
      clearPerformanceData,
      options,
    ],
  );

  return { run, ...state };
}
