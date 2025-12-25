import * as EffectWorker from "@effect/platform/Worker";
import { BrowserWorker } from "@effect/platform-browser";
import type * as Schemas from "@wowlab/core/Schemas";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

import type { SimulationBatch, SimulationResult, WorkerInit } from "./types";

export class WorkerPoolError extends Data.TaggedError("WorkerPoolError")<{
  readonly reason:
    | "WorkerCreationFailed"
    | "InitializationFailed"
    | "ExecutionFailed"
    | "Timeout";
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface WorkerPoolConfig {
  readonly workerCount?: number;
  readonly batchSize?: number;
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

export interface SimulationParams {
  readonly code: string;
  readonly spellIds: readonly number[];
  readonly spells: Schemas.Spell.SpellDataFlat[];
  readonly auras: Schemas.Aura.AuraDataFlat[];
  readonly iterations: number;
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

const SimulationWorkerLayer = BrowserWorker.layer(
  () =>
    new Worker(new URL("./simulation-worker.ts", import.meta.url), {
      type: "module",
    }),
);

const runSimulationsInternal = (
  params: SimulationParams,
  cfg: Required<WorkerPoolConfig>,
  onProgress?: SimulationProgressCallback,
) =>
  Effect.gen(function* () {
    const pool = yield* EffectWorker.makePool<
      WorkerInit | SimulationBatch,
      SimulationResult,
      never
    >({ size: cfg.workerCount });

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

      const waveResults = yield* Effect.all(
        waveBatches.map((batch) =>
          pool
            .executeEffect(batch)
            .pipe(Effect.map((result) => result.results)),
        ),
        { concurrency: "unbounded" },
      );

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

    if (stats.completedSims > 0) {
      stats.avgDps = stats.totalDamage / stats.completedSims / params.duration;
    }

    return stats;
  });

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

export const runSimulationsPromise = (
  params: SimulationParams,
  config?: WorkerPoolConfig,
  onProgress?: SimulationProgressCallback,
): Promise<SimulationStats> =>
  Effect.runPromise(runSimulations(params, config, onProgress));
