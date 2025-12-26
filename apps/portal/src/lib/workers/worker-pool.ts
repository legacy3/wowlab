import * as EffectWorker from "@effect/platform/Worker";
import { BrowserWorker } from "@effect/platform-browser";
import type * as Schemas from "@wowlab/core/Schemas";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

import type {
  SimulationBatch,
  SimulationResult,
  SingleSimResult,
  WorkerInit,
} from "./types";

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
  bestResult: SingleSimResult | null;
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
    let initError: string | null = null;

    for (const result of initResults) {
      if (result.workerVersion && !workerVersion) {
        workerVersion = result.workerVersion;
      }

      if (result.results[0]?.error && !initError) {
        initError = result.results[0].error;
      }
    }

    if (initError) {
      return yield* Effect.fail(
        new WorkerPoolError({
          reason: "InitializationFailed",
          message: `[Worker ${workerVersion ?? "unknown"}] ${initError}`,
        }),
      );
    }

    const stats: SimulationStats = {
      completedSims: 0,
      totalCasts: 0,
      totalDamage: 0,
      avgDps: 0,
      errors: [],
      workerVersion,
      bestResult: null,
    };

    const startTime = Date.now();
    let processedSims = 0;

    // Create all batches upfront
    const allBatches: SimulationBatch[] = [];
    let batchId = 0;
    for (let start = 0; start < params.iterations; start += cfg.batchSize) {
      const simsInBatch = Math.min(cfg.batchSize, params.iterations - start);
      allBatches.push({
        type: "batch",
        batchId: batchId++,
        duration: params.duration,
        simIds: Array.from({ length: simsInBatch }, (_, j) => start + j + 1),
      });
    }

    // Process batches with controlled concurrency, updating progress as each completes
    yield* Effect.forEach(
      allBatches,
      (batch) =>
        Effect.gen(function* () {
          const result = yield* pool.executeEffect(batch);

          for (const simResult of result.results) {
            processedSims += 1;
            if (simResult.error) {
              stats.errors.push(simResult.error);
            } else {
              stats.completedSims++;
              stats.totalCasts += simResult.casts;
              stats.totalDamage += simResult.totalDamage;

              // Track best result (highest DPS, or first if all 0)
              if (
                !stats.bestResult ||
                simResult.dps > stats.bestResult.dps ||
                (simResult.dps === 0 && !stats.bestResult.events?.length)
              ) {
                stats.bestResult = simResult;
              }
            }
          }

          if (onProgress) {
            const elapsedMs = Date.now() - startTime;
            const ratePerSec =
              elapsedMs > 0 ? processedSims / (elapsedMs / 1000) : 0;
            const remaining = params.iterations - processedSims;
            const etaMs =
              ratePerSec > 0
                ? Math.max(0, remaining / ratePerSec) * 1000
                : null;
            onProgress({
              completed: processedSims,
              total: params.iterations,
              elapsedMs,
              etaMs,
            });
          }
        }),
      { concurrency: cfg.workerCount },
    );

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
