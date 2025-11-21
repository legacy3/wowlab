import * as Entities from "@wowlab/core/Entities";
import * as Events from "@wowlab/core/Events";
import * as Schemas from "@wowlab/core/Schemas";
import * as Metadata from "@wowlab/services/Metadata";
import * as Scheduler from "@wowlab/services/Scheduler";
import * as Simulation from "@wowlab/services/Simulation";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import { Map, Record } from "immutable";

import { Logger } from "./logger.js";
import { createEnemyUnit, createPlayerUnit } from "./units.js";

export interface SimulationResult {
  events: Events.SimulationEvent[];
  snapshots: number;
  success: boolean;
}

export const runSimulation = Effect.gen(function* () {
  console.log("Starting simulation...");

  const simulation = yield* Simulation.SimulationService;
  const scheduler = yield* Scheduler.EventSchedulerService;
  const units = yield* Unit.UnitService;
  const metadata = yield* Metadata.MetadataService;
  const stateService = yield* State.StateService;

  const playerUnit = createPlayerUnit();
  const enemyUnit = createEnemyUnit();

  // Load spells for the player unit
  const currentState = yield* stateService.getState;
  const spellIds = [108853, 2948]; // Fire Blast, Scorch

  console.log(`Loading spells: ${spellIds.join(", ")}`);

  const spellInfos = yield* Effect.all(
    spellIds.map((spellId) =>
      metadata.loadSpell(spellId as Schemas.Branded.SpellID),
    ),
    { concurrency: "unbounded" },
  );

  console.log(`Loaded ${spellInfos.length} spells successfully`);

  // Create Spell instances with loaded SpellInfo
  const playerSpellsMap = Map<
    Schemas.Branded.SpellID,
    Entities.Spell.Spell
  >().withMutations((map) => {
    spellInfos.forEach((spellInfo) => {
      const spell = Entities.Spell.Spell.create(
        {
          charges: spellInfo.maxCharges,
          cooldownExpiry: 0,
          info: spellInfo,
        },
        currentState.currentTime,
      );
      map.set(spellInfo.id, spell);
    });
  });

  // Update player unit with loaded spells
  const playerWithSpells = playerUnit.set("spells", {
    all: playerSpellsMap,
    meta: Record({ cooldownCategories: Map<number, number>() })({
      cooldownCategories: Map(),
    }),
  });

  // Add units to state
  console.log("Adding units to state");
  yield* units.add(playerWithSpells);
  yield* units.add(enemyUnit);

  // Schedule a test event
  yield* scheduler.schedule({
    execute: Effect.sync(() => console.log("Test event executed!")),
    id: "test-event",
    payload: {
      amount: 100,
      casterId: Schemas.Branded.UnitID("player"),
      isCrit: false,
      spellId: 1,
      targetId: Schemas.Branded.UnitID("enemy"),
    },
    priority: 0,
    time: 500,
    type: Events.EventType.SPELL_DAMAGE,
  } as unknown as Events.SimulationEvent);

  // Subscribe to snapshots
  const snapshots: unknown[] = [];
  yield* simulation.subscribeSnapshots((snapshot) => {
    snapshots.push(snapshot);
  });

  // Run simulation for 10 seconds
  console.log("Starting simulation run (10s)");
  const result = yield* simulation.run(10000);

  Logger.header("SIMULATION REPORT");
  Logger.kv("Final Time", `${result.finalTime}ms`);
  Logger.kv("Snapshots Collected", snapshots.length);
  Logger.kv("Events Processed", result.eventsProcessed);

  Logger.subHeader("Final State Summary");

  const finalState = yield* stateService.getState;
  const unitSummary = finalState.units
    .valueSeq()
    .toArray()
    .map((unit) => ({
      Auras: unit.auras.all.size,
      Health: `${unit.health.current}/${unit.health.max}`,
      ID: unit.id,
      Name: unit.name,
      Position: `(${unit.position.x}, ${unit.position.y})`,
      Spells: unit.spells.all.size,
    }));

  Logger.table(unitSummary);

  return {
    events: [], // TODO: Capture events
    snapshots: snapshots.length,
    success: true,
  };
});
