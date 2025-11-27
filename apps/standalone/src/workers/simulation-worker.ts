import { WorkerRunner } from "@effect/platform";
import { NodeWorkerRunner } from "@effect/platform-node";
import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as ManagedRuntime from "effect/ManagedRuntime";

import { BeastMasteryRotation } from "../rotations/beast-mastery.js";
import type {
  SimulationBatch,
  SimulationRequest,
  SimulationResult,
  SingleSimResult,
  WorkerInit,
} from "./types.js";

const rotations = {
  "beast-mastery": BeastMasteryRotation,
} as const;

// Worker-level state - initialized once, reused for all batches
let workerState: {
  runtime: ManagedRuntime.ManagedRuntime<
    Context.RotationContext | State.StateService | Unit.UnitService,
    never
  >;
  rotation: (typeof rotations)[keyof typeof rotations];
  spells: Schemas.Spell.SpellDataFlat[];
} | null = null;

const initWorker = (init: WorkerInit): Effect.Effect<SimulationResult> =>
  Effect.gen(function* () {
    const rotation = rotations[init.rotationName as keyof typeof rotations];
    if (!rotation) {
      return {
        batchId: -1,
        results: [
          {
            casts: 0,
            duration: 0,
            error: `Unknown rotation: ${init.rotationName}`,
            simId: 0,
          },
        ],
      };
    }

    // Create metadata layer with spell data
    const metadataLayer = Metadata.InMemoryMetadata({
      items: [],
      spells: init.spells,
    });

    // Create base app layer with all core services
    const baseAppLayer = createAppLayer({ metadata: metadataLayer });

    // Build full layer with rotation context (no logging for workers)
    const loggerLayer = Layer.merge(
      Logger.replace(Logger.defaultLogger, Logger.none),
      Logger.minimumLogLevel(LogLevel.None),
    );

    const fullLayer = Context.RotationContext.Default.pipe(
      Layer.provide(baseAppLayer),
      Layer.merge(baseAppLayer),
      Layer.provide(loggerLayer),
    );

    const runtime = ManagedRuntime.make(fullLayer);

    workerState = {
      rotation,
      runtime,
      spells: init.spells,
    };

    // Return success indicator
    return {
      batchId: -1,
      results: [{ casts: 0, duration: 0, simId: 0 }],
    };
  });

const runBatch = (batch: SimulationBatch): Effect.Effect<SimulationResult> =>
  Effect.gen(function* () {
    if (!workerState) {
      return {
        batchId: batch.batchId,
        results: batch.simIds.map((simId) => ({
          casts: 0,
          duration: batch.duration,
          error: "Worker not initialized",
          simId,
        })),
      };
    }

    const { rotation, runtime, spells } = workerState;
    const results: SingleSimResult[] = [];

    // Run each simulation in the batch - REUSING the same runtime
    for (const simId of batch.simIds) {
      try {
        const result = yield* Effect.promise(() =>
          runtime.runPromise(
            Effect.gen(function* () {
              // Reset state to fresh GameState before each simulation
              const stateService = yield* State.StateService;
              yield* stateService.setState(
                Entities.GameState.createGameState(),
              );

              const playerId = Schemas.Branded.UnitID(`player-${simId}`);
              const player = rotation.setupPlayer(playerId, spells);

              const unitService = yield* Unit.UnitService;
              yield* unitService.add(player);

              let casts = 0;
              while (true) {
                const state = yield* stateService.getState();
                if (state.currentTime >= batch.duration) break;
                yield* rotation.run(playerId);
                casts++;
              }

              return { casts, duration: batch.duration, simId };
            }),
          ),
        );
        results.push(result);
      } catch (err) {
        results.push({
          casts: 0,
          duration: batch.duration,
          error: String(err),
          simId,
        });
      }
    }

    return { batchId: batch.batchId, results };
  });

const handleRequest = (
  request: SimulationRequest,
): Effect.Effect<SimulationResult> => {
  if (request.type === "init") {
    return initWorker(request);
  }
  return runBatch(request);
};

const WorkerLive = WorkerRunner.layer(handleRequest).pipe(
  Layer.provide(NodeWorkerRunner.layer),
);

Effect.runFork(Layer.launch(WorkerLive));
