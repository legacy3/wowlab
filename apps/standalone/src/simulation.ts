import * as Entities from "@packages/innocent-domain/Entities";
import * as Events from "@packages/innocent-domain/Events";
import * as DomainState from "@packages/innocent-domain/State";
import * as RotationContext from "@packages/innocent-rotation/Context";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Data from "@packages/innocent-services/Data";
import * as Simulation from "@packages/innocent-services/Simulation";
import * as State from "@packages/innocent-services/State";
import * as Unit from "@packages/innocent-services/Unit";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as PubSub from "effect/PubSub";
import * as Queue from "effect/Queue";
import { Map } from "immutable";

import { createEnemyUnit, createPlayerUnit } from "./units.js";

export interface SimulationResult {
  events: Events.SimulationEvent[];
  snapshots: number;
  success: boolean;
}

export const runSimulation = Effect.gen(function* () {
  console.log("Starting simulation...");

  const simulation = yield* Simulation.SimulationService;
  const units = yield* Unit.UnitService;
  const spellInfoService = yield* Data.SpellInfoService;
  const stateService = yield* State.StateService;

  const playerUnit = createPlayerUnit();
  const enemyUnit = createEnemyUnit();

  // Load spells for the player unit
  const currentState = yield* stateService.getState();
  const spellIds = [108853, 2948]; // Fire Blast, Scorch

  console.log(`Loading spells: ${spellIds.join(", ")}`);

  const spellInfos = yield* Effect.all(
    spellIds.map((spellId) =>
      spellInfoService
        .getSpell(spellId, {
          profileIds: playerUnit.profiles,
        })
        .pipe(
          Effect.withSpan(`load-spell-${spellId}`, {
            attributes: { profiles: playerUnit.profiles.join(","), spellId },
          }),
        ),
    ),
    { concurrency: "unbounded" },
  ).pipe(Effect.withSpan("load-all-spells"));

  console.log(`Loaded ${spellInfos.length} spells successfully`);

  // Create Spell instances with loaded SpellInfo
  const playerSpellsMap = Map<Branded.SpellID, Entities.Spell>().withMutations(
    (map) => {
      spellInfos.forEach((spellInfo) => {
        const spell = Entities.Spell.create(
          {
            charges: spellInfo.maxCharges,
            cooldownExpiry: 0,
            info: spellInfo,
          },
          currentState.currentTime,
        );
        map.set(spellInfo.id, spell);
      });
    },
  );

  // Update player unit with loaded spells
  const playerWithSpells = {
    ...playerUnit,
    spells: {
      all: playerSpellsMap,
      meta: { cooldownCategories: Map<number, number>() },
    },
  };

  // Add units to state
  console.log("Adding units to state");
  yield* units.add(playerWithSpells).pipe(Effect.withSpan("add-player-unit"));
  yield* units.add(enemyUnit).pipe(Effect.withSpan("add-enemy-unit"));

  // Get RotationContext AFTER units are added
  console.log("Getting rotation context");
  const ctx = yield* RotationContext.RotationContext;

  // Define rotation
  const simpleRotation = Effect.gen(function* () {
    console.log("Executing rotation");
    const fireBlast = yield* ctx.spells
      .get(108853)
      .pipe(Effect.withSpan("get-fire-blast"));
    const scorch = yield* ctx.spells
      .get(2948)
      .pipe(Effect.withSpan("get-scorch"));

    yield* ctx.spells.cast(fireBlast).pipe(Effect.withSpan("cast-fire-blast"));
    yield* ctx.spells.cast(scorch).pipe(Effect.withSpan("cast-scorch"));
  }).pipe(Effect.withSpan("rotation-execution"));

  // Subscribe to snapshots and events BEFORE running simulation
  const snapshots: DomainState.GameState[] = [];
  const events: Events.SimulationEvent[] = [];

  console.log("Subscribing to simulation events");
  const snapshotQueue = yield* PubSub.subscribe(simulation.snapshots);
  const eventQueue = yield* PubSub.subscribe(simulation.events);

  // Fork fibers to collect snapshots and events
  const snapshotCollectorFiber = yield* Effect.gen(function* () {
    while (true) {
      const snapshot = yield* Queue.take(snapshotQueue);
      snapshots.push(snapshot);
    }
  }).pipe(Effect.fork);

  const eventCollectorFiber = yield* Effect.gen(function* () {
    while (true) {
      const event = yield* Queue.take(eventQueue);
      events.push(event);
    }
  }).pipe(Effect.fork);

  // Run simulation for 10 seconds
  console.log("Starting simulation run (10s)");
  yield* simulation.run(simpleRotation, 10000).pipe(
    Effect.withSpan("simulation-run", {
      attributes: { durationMs: 10000 },
    }),
  );

  // Wait a bit for final snapshots to be collected
  yield* Effect.sleep(100);

  // Interrupt the collector fibers
  yield* Fiber.interrupt(snapshotCollectorFiber);
  yield* Fiber.interrupt(eventCollectorFiber);

  console.log(
    `Simulation complete. Snapshots: ${snapshots.length}, Events: ${events.length}`,
  );

  return {
    events,
    snapshots: snapshots.length,
    success: true,
  };
}).pipe(Effect.withSpan("simulation-standalone"));
