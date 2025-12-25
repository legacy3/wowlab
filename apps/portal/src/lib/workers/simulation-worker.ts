import { BrowserWorkerRunner } from "@effect/platform-browser";
import * as WorkerRunner from "@effect/platform/WorkerRunner";
import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
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

import {
  createPlayerWithSpells,
  createTargetDummy,
  tryCast,
  type CastResult,
} from "../simulation/rotation-utils";
import type {
  SimulationBatch,
  SimulationRequest,
  SimulationResult,
  SingleSimResult,
  WorkerInit,
} from "./types";

export const WORKER_VERSION = "0.0.2";

interface WorkerState {
  runtime: ManagedRuntime.ManagedRuntime<
    Context.RotationContext | State.StateService | Unit.UnitService,
    never
  >;
  rotation: CompiledRotation;
  spells: Schemas.Spell.SpellDataFlat[];
}

interface CompiledRotation {
  name: string;
  run: (
    playerId: Schemas.Branded.UnitID,
    targetId: Schemas.Branded.UnitID,
  ) => Effect.Effect<void, Errors.RotationError, Context.RotationContext>;
  spellIds: readonly number[];
}

let workerState: WorkerState | null = null;

interface SandboxAPI {
  Effect: typeof Effect;
  rotation: Context.RotationContext;
  playerId: Schemas.Branded.UnitID;
  targetId: Schemas.Branded.UnitID;
  tryCast: (
    spellId: number,
    targetId?: Schemas.Branded.UnitID,
  ) => Effect.Effect<CastResult, Errors.SpellNotFound | Errors.UnitNotFound>;
}

function compileRotation(
  code: string,
  spellIds: readonly number[],
): CompiledRotation {
  const createRotationFn = new Function(
    "api",
    `
    "use strict";
    const globalThis = undefined;
    const self = undefined;
    const window = undefined;
    const document = undefined;
    const eval = undefined;
    const Function = undefined;
    const importScripts = undefined;
    const fetch = undefined;
    const XMLHttpRequest = undefined;
    const WebSocket = undefined;
    const { Effect, rotation, playerId, targetId, tryCast } = api;
    return Effect.gen(function* () {
      ${code}
    });
    `,
  ) as (api: SandboxAPI) => Effect.Effect<void, Errors.RotationError>;

  return {
    name: "UserRotation",
    run: (playerId, targetId) =>
      Effect.gen(function* () {
        const rotation = yield* Context.RotationContext;
        const api: SandboxAPI = {
          Effect,
          rotation,
          playerId,
          targetId,
          tryCast: (spellId: number, target?: Schemas.Branded.UnitID) =>
            tryCast(rotation, playerId, spellId, target ?? targetId),
        };
        return yield* createRotationFn(api);
      }),
    spellIds,
  };
}

const initWorker = (init: WorkerInit): Effect.Effect<SimulationResult> =>
  Effect.sync(() => {
    try {
      const rotation = compileRotation(init.code, init.spellIds);

      const metadataLayer = Metadata.InMemoryMetadata({
        items: [],
        spells: init.spells,
      });

      const baseAppLayer = createAppLayer({ metadata: metadataLayer });

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

      workerState = { rotation, runtime, spells: init.spells };

      return {
        batchId: -1,
        results: [{ simId: 0, casts: 0, duration: 0, totalDamage: 0, dps: 0 }],
        workerVersion: WORKER_VERSION,
      };
    } catch (error) {
      return {
        batchId: -1,
        results: [
          {
            simId: 0,
            casts: 0,
            duration: 0,
            totalDamage: 0,
            dps: 0,
            error: `Code compilation failed: ${String(error)}`,
          },
        ],
        workerVersion: WORKER_VERSION,
      };
    }
  });

const runBatch = (batch: SimulationBatch): Effect.Effect<SimulationResult> =>
  Effect.gen(function* () {
    if (!workerState) {
      return {
        batchId: batch.batchId,
        results: batch.simIds.map((simId) => ({
          simId,
          casts: 0,
          duration: batch.duration,
          totalDamage: 0,
          dps: 0,
          error: "Worker not initialized",
        })),
      };
    }

    const { rotation, runtime, spells } = workerState;
    const results: SingleSimResult[] = [];

    for (const simId of batch.simIds) {
      try {
        const result = yield* Effect.promise(() =>
          runtime.runPromise(
            Effect.gen(function* () {
              const stateService = yield* State.StateService;
              yield* stateService.setState(
                Entities.GameState.createGameState(),
              );

              const playerId = Schemas.Branded.UnitID(`player-${simId}`);
              const targetId = Schemas.Branded.UnitID(`target-${simId}`);

              const player = createPlayerWithSpells(
                playerId,
                rotation.name,
                rotation.spellIds,
                spells,
              );
              const target = createTargetDummy(targetId);

              const unitService = yield* Unit.UnitService;
              yield* unitService.add(player);
              yield* unitService.add(target);

              let casts = 0;
              const totalDamage = 0;

              while (true) {
                const state = yield* stateService.getState();
                if (state.currentTime >= batch.duration) {
                  break;
                }

                yield* Effect.catchAll(
                  rotation.run(playerId, targetId),
                  () => Effect.void,
                );

                casts++;
              }

              const dps = batch.duration > 0 ? totalDamage / batch.duration : 0;

              return {
                simId,
                casts,
                duration: batch.duration,
                totalDamage,
                dps,
              };
            }),
          ),
        );
        results.push(result);
      } catch (err) {
        results.push({
          simId,
          casts: 0,
          duration: batch.duration,
          totalDamage: 0,
          dps: 0,
          error: String(err),
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
  Layer.provide(BrowserWorkerRunner.layer),
);

Effect.runFork(Layer.launch(WorkerLive));
