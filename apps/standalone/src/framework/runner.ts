import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import type * as ManagedRuntime from "effect/ManagedRuntime";

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

    // Fork Rotation
    const rotationFiber = yield* Effect.fork(rotation.run(playerId));

    // Run Simulation
    yield* Effect.log(`Running rotation: ${rotation.name}`);
    const result = yield* sim.run(10000); // 10s fixed for now

    // Join Rotation
    yield* Fiber.join(rotationFiber);

    yield* Effect.log(`Simulation complete. Final time: ${result.finalTime}ms`);

    return result;
  });

  return runtime.runPromise(program);
};
