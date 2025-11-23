import type * as ManagedRuntime from "effect/ManagedRuntime";

import * as Entities from "@wowlab/core/Entities";
import * as Events from "@wowlab/core/Events";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as PubSub from "effect/PubSub";
import * as Queue from "effect/Queue";

import { logEventTimeline } from "../utils/logging.js";
import { RotationDefinition } from "./types.js";

export const runRotationWithRuntime = (
  runtime: ManagedRuntime.ManagedRuntime<
    Simulation.SimulationService | Unit.UnitService | Context.RotationContext,
    never
  >,
  rotation: RotationDefinition,
  spells: Schemas.Spell.SpellDataFlat[],
) => {
  const program = Effect.gen(function* () {
    const sim = yield* Simulation.SimulationService;
    const unitService = yield* Unit.UnitService;

    // Setup Player
    const playerId = Schemas.Branded.UnitID("player");
    const player = rotation.setupPlayer(playerId, spells);
    yield* unitService.add(player);
    yield* Effect.log(`Added player: ${player.name}`);

    // Setup Enemy (Standard Target Dummy)
    const enemyId = Schemas.Branded.UnitID("enemy");
    const enemy = Entities.Unit.Unit.create({
      health: Entities.Power.Power.create({ current: 1000000, max: 1000000 }),
      id: enemyId,
      name: "Training Dummy",
    });
    yield* unitService.add(enemy);
    yield* Effect.log(`Added enemy: ${enemy.name}`);

    // Run Simulation with rotation
    yield* Effect.log(`Running rotation: ${rotation.name}`);

    // Collect events while running
    const eventsCollected: Events.SimulationEvent[] = [];
    const eventCollectorFiber = yield* Effect.fork(
      Effect.gen(function* () {
        yield* Effect.scoped(
          Effect.gen(function* () {
            const eventStream = yield* PubSub.subscribe(sim.events);

            while (true) {
              const event = yield* Queue.take(eventStream);
              eventsCollected.push(event);
            }
          }),
        );
      }).pipe(Effect.catchAll(() => Effect.void)),
    );

    const result = yield* sim.run(rotation.run(playerId), 10000); // 10s fixed for now

    // Stop collecting events
    yield* Fiber.interrupt(eventCollectorFiber);

    yield* Effect.log(
      `\nSimulation complete. Final time: ${result.finalTime}ms`,
    );
    yield* Effect.log(`Events processed: ${result.eventsProcessed}`);

    // Print event time table
    logEventTimeline(eventsCollected);

    return result;
  });

  return runtime.runPromise(program);
};
