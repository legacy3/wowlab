import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { loadSpells } from "../data/spell-loader.js";
import { createSupabaseClient } from "../data/supabase.js";
import { RotationDefinition } from "./types.js";

export const runRotation = (rotation: RotationDefinition) =>
  Effect.gen(function* () {
    // 0. Load spell data from Supabase
    yield* Effect.log("Loading spell data from Supabase...");
    const supabase = yield* createSupabaseClient;
    const spells = yield* Effect.promise(() =>
      loadSpells(supabase, rotation.spellIds),
    );
    yield* Effect.log(`Loaded ${spells.length} spells from Supabase`);

    // 1. Setup Metadata Layer
    const metadataLayer = Metadata.InMemoryMetadata({
      items: [],
      spells,
    });

    // 2. Setup App Layer
    const baseAppLayer = createAppLayer({ metadata: metadataLayer });
    const appLayer = Context.RotationContext.Default.pipe(
      Layer.provide(baseAppLayer),
      Layer.merge(baseAppLayer),
    );

    // 3. Define the simulation program
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

      yield* Effect.log(
        `Simulation complete. Final time: ${result.finalTime}ms`,
      );

      return result;
    });

    // 4. Run everything
    return yield* program.pipe(
      Effect.provide(appLayer),
      Effect.provide(Logger.pretty),
      Effect.provide(Logger.minimumLogLevel(LogLevel.Debug)),
    );
  });
