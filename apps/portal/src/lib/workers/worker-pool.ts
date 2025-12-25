/**
 * Worker pool for running simulations in parallel.
 *
 * This module provides an Effect-based worker pool that uses
 * @effect/platform-browser for browser Web Workers.
 */

import * as EffectWorker from "@effect/platform/Worker";
import { BrowserWorker } from "@effect/platform-browser";
import type * as Schemas from "@wowlab/core/Schemas";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

import type { SimulationBatch, SimulationResult, WorkerInit } from "./types";

// =============================================================================
// Errors
// =============================================================================

export class WorkerPoolError extends Data.TaggedError("WorkerPoolError")<{
  readonly reason:
    | "WorkerCreationFailed"
    | "InitializationFailed"
    | "ExecutionFailed"
    | "Timeout";
  readonly message: string;
  readonly cause?: unknown;
}> {}

// =============================================================================
// Configuration
// =============================================================================

export interface WorkerPoolConfig {
  /** Number of workers in the pool. Defaults to navigator.hardwareConcurrency / 2 */
  readonly workerCount?: number;
  /** Batch size for simulation batches. Defaults to 100 */
  readonly batchSize?: number;
  /** Timeout per batch in milliseconds. Defaults to 60000 (1 minute) */
  readonly batchTimeoutMs?: number;
}

const getDefaultWorkerCount = () =>
  typeof navigator !== "undefined"
    ? Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2))
    : 4;

const defaultConfig: Required<WorkerPoolConfig> = {
  workerCount: getDefaultWorkerCount(),
  batchSize: 100,
  batchTimeoutMs: 60_000,
};

// =============================================================================
// Simulation Parameters
// =============================================================================

export interface SimulationParams {
  /** Rotation code as JavaScript source string */
  readonly code: string;
  /** Spell IDs used by the rotation */
  readonly spellIds: readonly number[];
  /** Pre-loaded spell data */
  readonly spells: Schemas.Spell.SpellDataFlat[];
  /** Pre-loaded aura data */
  readonly auras: Schemas.Aura.AuraDataFlat[];
  /** Number of simulation iterations */
  readonly iterations: number;
  /** Duration of each simulation in seconds */
  readonly duration: number;
}

export interface SimulationStats {
  completedSims: number;
  totalCasts: number;
  totalDamage: number;
  avgDps: number;
  errors: string[];
  workerVersion: string | null;
}

export interface SimulationProgress {
  completed: number;
  total: number;
  elapsedMs: number;
  etaMs: number | null;
}

export type SimulationProgressCallback = (progress: SimulationProgress) => void;

// =============================================================================
// Worker Layer
// =============================================================================

/**
 * Layer that provides the worker spawner for the simulation worker.
 * BrowserWorker.layer provides both WorkerManager and Spawner.
 */
const SimulationWorkerLayer = BrowserWorker.layer(
  () =>
    new Worker(new URL("./simulation-worker.ts", import.meta.url), {
      type: "module",
    }),
);

// =============================================================================
// Worker Pool Implementation
// =============================================================================

/**
 * Internal implementation that requires the worker layer.
 */
const runSimulationsInternal = (
  params: SimulationParams,
  cfg: Required<WorkerPoolConfig>,
  onProgress?: SimulationProgressCallback,
) =>
  Effect.gen(function* () {
    // Create worker pool using Effect's platform abstraction
    const pool = yield* EffectWorker.makePool<
      WorkerInit | SimulationBatch,
      SimulationResult,
      never
    >({
      size: cfg.workerCount,
    });

    // Initialize all workers with rotation code
    const initMessage: WorkerInit = {
      type: "init",
      code: params.code,
      spellIds: params.spellIds,
      spells: params.spells,
      auras: params.auras,
    };

    const initResults = yield* Effect.all(
      Array.from({ length: cfg.workerCount }, () =>
        pool.executeEffect(initMessage),
      ),
      { concurrency: "unbounded" },
    );

    // Check for initialization errors and capture worker version
    let workerVersion: string | null = null;
    for (const result of initResults) {
      if (result.results[0]?.error) {
        return yield* Effect.fail(
          new WorkerPoolError({
            reason: "InitializationFailed",
            message: result.results[0].error,
          }),
        );
      }
      if (result.workerVersion && !workerVersion) {
        workerVersion = result.workerVersion;
      }
    }

    // Run simulation batches
    const stats: SimulationStats = {
      completedSims: 0,
      totalCasts: 0,
      totalDamage: 0,
      avgDps: 0,
      errors: [],
      workerVersion,
    };

    const startTime = Date.now();
    let processedSims = 0;
    const waveSize = cfg.workerCount * 10;
    let batchId = 0;

    // Wave processing for memory efficiency
    for (
      let waveStart = 0;
      waveStart < params.iterations;
      waveStart += waveSize * cfg.batchSize
    ) {
      const waveBatches: SimulationBatch[] = [];

      for (
        let i = 0;
        i < waveSize && batchId * cfg.batchSize < params.iterations;
        i++
      ) {
        const startSim = batchId * cfg.batchSize;
        const simsInBatch = Math.min(
          cfg.batchSize,
          params.iterations - startSim,
        );
        waveBatches.push({
          type: "batch",
          batchId: batchId++,
          duration: params.duration,
          simIds: Array.from(
            { length: simsInBatch },
            (_, j) => startSim + j + 1,
          ),
        });
      }

      // Execute wave in parallel
      const waveResults = yield* Effect.all(
        waveBatches.map((batch) =>
          pool
            .executeEffect(batch)
            .pipe(Effect.map((result) => result.results)),
        ),
        { concurrency: "unbounded" },
      );

      // Aggregate results
      for (const batchResults of waveResults) {
        for (const result of batchResults) {
          processedSims += 1;
          if (result.error) {
            stats.errors.push(result.error);
          } else {
            stats.completedSims++;
            stats.totalCasts += result.casts;
            stats.totalDamage += result.totalDamage;
          }
        }

        if (onProgress) {
          const elapsedMs = Date.now() - startTime;
          const ratePerSec =
            elapsedMs > 0 ? processedSims / (elapsedMs / 1000) : 0;
          const remaining = params.iterations - processedSims;
          const etaMs =
            ratePerSec > 0 ? Math.max(0, remaining / ratePerSec) * 1000 : null;
          onProgress({
            completed: processedSims,
            total: params.iterations,
            elapsedMs,
            etaMs,
          });
        }
      }
    }

    // Calculate average DPS
    if (stats.completedSims > 0) {
      stats.avgDps = stats.totalDamage / stats.completedSims / params.duration;
    }

    return stats;
  });

/**
 * Run simulations using a worker pool.
 *
 * This creates a pool of workers, initializes them with rotation code,
 * and runs the specified number of simulation iterations in parallel batches.
 */
export const runSimulations = (
  params: SimulationParams,
  config: WorkerPoolConfig = {},
  onProgress?: SimulationProgressCallback,
): Effect.Effect<SimulationStats, WorkerPoolError> => {
  const cfg = { ...defaultConfig, ...config };

  return runSimulationsInternal(params, cfg, onProgress).pipe(
    Effect.scoped,
    Effect.provide(SimulationWorkerLayer),
    Effect.mapError(
      (error) =>
        new WorkerPoolError({
          reason: "ExecutionFailed",
          message:
            error instanceof WorkerPoolError
              ? error.message
              : "Simulation failed",
          cause: error,
        }),
    ),
  );
};

// =============================================================================
// React Hook Helper
// =============================================================================

/**
 * Run simulations and return a Promise (for use in React components).
 */
export const runSimulationsPromise = (
  params: SimulationParams,
  config?: WorkerPoolConfig,
  onProgress?: SimulationProgressCallback,
): Promise<SimulationStats> =>
  Effect.runPromise(runSimulations(params, config, onProgress));
