import { Args, Command, Options } from "@effect/cli";
import { NodeWorker } from "@effect/platform-node";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as Worker from "@effect/platform/Worker";
import * as WorkerError from "@effect/platform/WorkerError";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import * as Schemas from "@wowlab/core/Schemas";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Hunter from "@wowlab/specs/Hunter";
import * as Shared from "@wowlab/specs/Shared";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as LogLevel from "effect/LogLevel";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorkerThread } from "node:worker_threads";

import type {
  SimulationBatch,
  SimulationResult,
  WorkerInit,
} from "../../workers/types.js";

import { loadAuras, loadSpells } from "../../data/spell-loader.js";
import { supabaseClient } from "../../data/supabase.js";
import { createTargetDummy } from "../../framework/rotation-utils.js";
import {
  createRotationPlayer,
  type RotationDefinition,
} from "../../framework/types.js";
import { rotations } from "../../rotations/index.js";
import { SimulationRpcs } from "../../rpc/requests.js";
import {
  createRotationRuntime,
  type RotationRuntimeConfig,
} from "../../runtime/RotationRuntime.js";
import {
  printAggregatedResults,
  printResults,
  type AggregatedStats,
  type SimResult,
} from "../../utils/results.js";
import {
  EVENT_STREAM_FILTER,
  formatTimelineEvent,
} from "../../utils/timeline.js";

const rotationArg = Args.text({ name: "rotation" }).pipe(
  Args.withDescription("The name of the rotation to run"),
  Args.withDefault("beast-mastery"),
);

const durationOpt = Options.integer("duration").pipe(
  Options.withAlias("d"),
  Options.withDescription("Simulation duration in seconds"),
  Options.withDefault(60),
);

const iterationsOpt = Options.integer("iterations").pipe(
  Options.withAlias("n"),
  Options.withDescription("Number of parallel simulations to run"),
  Options.withDefault(1),
);

const workersOpt = Options.integer("workers").pipe(
  Options.withAlias("w"),
  Options.withDescription(
    "Number of worker threads (0 = single-threaded, -1 = auto)",
  ),
  Options.withDefault(-1),
);

const batchSizeOpt = Options.integer("batch-size").pipe(
  Options.withAlias("b"),
  Options.withDescription("Simulations per worker batch"),
  Options.withDefault(100),
);

const serverOpt = Options.text("server").pipe(
  Options.withAlias("s"),
  Options.withDescription(
    "Remote server URL (e.g., http://192.168.1.100:3847)",
  ),
  Options.optional,
);

const runSimulation = (
  simId: number,
  config: RotationRuntimeConfig,
  rotation: RotationDefinition,
  duration: number,
  silent: boolean,
): Effect.Effect<SimResult> =>
  Effect.acquireUseRelease(
    Effect.sync(() =>
      createRotationRuntime({
        ...config,
        logLevel: silent ? LogLevel.None : config.logLevel,
      }),
    ),
    (runtime) =>
      Effect.promise(() =>
        runtime.runPromise(
          Effect.gen(function* () {
            yield* Shared.registerSpec(Hunter.BeastMastery);

            const playerId = Schemas.Branded.UnitID(`player-${simId}`);
            const targetId = Schemas.Branded.UnitID(`target-${simId}`);

            const player = createRotationPlayer(
              rotation,
              playerId,
              config.spells,
            );
            const target = createTargetDummy(targetId);

            const unitService = yield* Unit.UnitService;
            yield* unitService.add(player);
            yield* unitService.add(target);

            const stateService = yield* State.StateService;
            const simDriver = yield* CombatLogService.SimDriver;

            const simulationLoop = Effect.gen(function* () {
              let casts = 0;

              while (true) {
                const state = yield* stateService.getState();
                if (state.currentTime >= duration) {
                  break;
                }

                yield* rotation.run(playerId, targetId);
                casts++;
                yield* simDriver.run(state.currentTime + 0.1);
              }

              return { casts, duration, simId };
            });

            if (silent) {
              return yield* simulationLoop;
            }

            return yield* Effect.acquireUseRelease(
              simDriver.subscribe({
                filter: EVENT_STREAM_FILTER,
                onEvent: (event) => Effect.log(formatTimelineEvent(event)),
              }),
              () => simulationLoop,
              (subscription) => subscription.unsubscribe,
            );
          }),
        ),
      ),
    (runtime) => Effect.promise(() => runtime.dispose()),
  );

const runWithWorkers = (
  iterations: number,
  duration: number,
  rotationName: string,
  spells: Schemas.Spell.SpellDataFlat[],
  workerCount: number,
  batchSize: number,
): Effect.Effect<
  { stats: AggregatedStats; sampleResults: SimResult[] },
  WorkerError.WorkerError,
  Scope.Scope | Worker.WorkerManager | Worker.Spawner
> =>
  Effect.gen(function* () {
    const pool = yield* Worker.makePool<
      WorkerInit | SimulationBatch,
      SimulationResult,
      never
    >({
      size: workerCount,
    });

    const initMessage: WorkerInit = { rotationName, spells, type: "init" };

    yield* Effect.all(
      Array.from({ length: workerCount }, () =>
        pool.executeEffect(initMessage),
      ),
      { concurrency: "unbounded" },
    );

    const totalBatches = Math.ceil(iterations / batchSize);
    yield* Effect.log(
      `Initialized ${workerCount} workers, processing ${totalBatches} batches...`,
    );

    const stats: AggregatedStats = { completedSims: 0, totalCasts: 0 };
    const sampleResults: SimResult[] = [];
    const waveSize = workerCount * 10;
    let batchId = 0;

    for (
      let waveStart = 0;
      waveStart < iterations;
      waveStart += waveSize * batchSize
    ) {
      const waveBatches: SimulationBatch[] = [];

      for (let i = 0; i < waveSize && batchId * batchSize < iterations; i++) {
        const startSim = batchId * batchSize;
        const simsInBatch = Math.min(batchSize, iterations - startSim);
        waveBatches.push({
          batchId: batchId++,
          duration,
          simIds: Array.from(
            { length: simsInBatch },
            (_, j) => startSim + j + 1,
          ),
          type: "batch",
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
          stats.completedSims++;
          stats.totalCasts += result.casts;
          if (sampleResults.length < 10) {
            sampleResults.push({
              casts: result.casts,
              duration: result.duration,
              simId: result.simId,
            });
          }
        }
      }

      if (iterations > 100000 && stats.completedSims % 500000 === 0) {
        yield* Effect.log(
          `Progress: ${stats.completedSims.toLocaleString()} / ${iterations.toLocaleString()} (${((stats.completedSims / iterations) * 100).toFixed(1)}%)`,
        );
      }
    }

    return { sampleResults, stats };
  });

const runRemoteSimulation = (
  serverUrl: string,
  rotation: string,
  duration: number,
  iterations: number,
  batchSize: number,
): Effect.Effect<
  { stats: AggregatedStats; elapsedMs: number },
  string,
  never
> =>
  Effect.gen(function* () {
    yield* Effect.log(`Connecting to remote server: ${serverUrl}`);

    const ProtocolLive = RpcClient.layerProtocolHttp({
      url: `${serverUrl}/rpc`,
    }).pipe(
      Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
    );

    const result = yield* Effect.scoped(
      Effect.gen(function* () {
        const client = yield* RpcClient.make(SimulationRpcs);
        const response = yield* client.RunSimulation({
          batchSize,
          duration,
          iterations,
          rotation,
        });
        return {
          elapsedMs: response.stats.elapsedMs,
          stats: {
            completedSims: response.stats.completedSims,
            totalCasts: response.stats.totalCasts,
          },
        };
      }),
    ).pipe(
      Effect.provide(ProtocolLive),
      Effect.mapError((e) => String(e)),
    );

    return result;
  });

export const runCommand = Command.make(
  "run",
  {
    batchSize: batchSizeOpt,
    duration: durationOpt,
    iterations: iterationsOpt,
    rotation: rotationArg,
    server: serverOpt,
    workers: workersOpt,
  },
  ({ batchSize, duration, iterations, rotation, server, workers }) =>
    Effect.gen(function* () {
      if (Option.isSome(server)) {
        const serverUrl = server.value;

        yield* Effect.log(`Running simulation remotely on: ${serverUrl}`);
        yield* Effect.log(`Rotation: ${rotation}`);
        yield* Effect.log(`Duration: ${duration}s`);
        yield* Effect.log(`Iterations: ${iterations}`);
        yield* Effect.log("---");

        const startTime = performance.now();
        const result = yield* runRemoteSimulation(
          serverUrl,
          rotation,
          duration,
          iterations,
          batchSize,
        ).pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`Remote simulation failed: ${error}`);
              return yield* Effect.fail(error);
            }),
          ),
        );

        const totalElapsed = performance.now() - startTime;
        yield* printAggregatedResults(
          result.stats,
          duration,
          result.elapsedMs,
          0,
          serverUrl,
        );
        yield* Effect.log(
          `Total time (including network): ${(totalElapsed / 1000).toFixed(2)}s`,
        );
        return;
      }

      const selectedRotation = rotations[rotation as keyof typeof rotations];

      if (!selectedRotation) {
        yield* Effect.logError(
          `Rotation '${rotation}' not found. Available: ${Object.keys(rotations).join(", ")}`,
        );
        return;
      }

      yield* Effect.log(`Loading spells for: ${selectedRotation.name}`);
      const [spells, auras] = yield* Effect.all([
        loadSpells(supabaseClient, selectedRotation.spellIds),
        loadAuras(supabaseClient, selectedRotation.spellIds),
      ]);
      yield* Effect.log(
        `Loaded ${spells.length} spells, ${auras.length} auras`,
      );

      const config: RotationRuntimeConfig = { auras, spells };

      yield* Effect.log(`Running rotation: ${selectedRotation.name}`);
      yield* Effect.log(`Simulation duration: ${duration}s`);
      yield* Effect.log("---");

      yield* runSimulation(1, config, selectedRotation, duration, false);
      yield* Effect.log("---");

      if (iterations > 1) {
        const useWorkers = workers !== 0;
        const workerCount =
          workers > 0 ? workers : Math.max(4, os.cpus().length - 1);

        if (useWorkers) {
          yield* Effect.log(
            `Running ${iterations.toLocaleString()} simulations using ${workerCount} worker threads...`,
          );

          const startTime = performance.now();
          const workerPath = fileURLToPath(
            new URL("../../workers/worker-bootstrap.mjs", import.meta.url),
          );

          const { stats } = yield* runWithWorkers(
            iterations,
            duration,
            rotation,
            spells,
            workerCount,
            batchSize,
          ).pipe(
            Effect.scoped,
            Effect.provide(
              Layer.merge(
                NodeWorker.layerManager,
                NodeWorker.layer(() => new NodeWorkerThread(workerPath)),
              ),
            ),
          );

          const elapsed = performance.now() - startTime;
          yield* printAggregatedResults(stats, duration, elapsed, workerCount);
        } else {
          yield* Effect.log(
            `Running ${iterations} parallel simulations (single-threaded)...`,
          );

          const startTime = performance.now();
          const simEffects = Array.from({ length: iterations }, (_, i) =>
            runSimulation(i + 1, config, selectedRotation, duration, true),
          );
          const results = yield* Effect.all(simEffects, {
            concurrency: "unbounded",
          });

          const elapsed = performance.now() - startTime;
          yield* printResults(results, elapsed);
        }
      } else {
        yield* Effect.log("Simulation complete");
      }
    }),
);
