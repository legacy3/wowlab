import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import { Branded } from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import { Map, Record } from "immutable";

// ============================================================
// Mock Data
// ============================================================

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  {
    baseDamage: 800,
    canCrit: true,
    castTime: 0,
    chargeCooldown: 0,
    charges: 0,
    coefficient: 0.429,
    cooldown: 12000,
    gcd: 1200,
    id: 108853,
    isInstant: true,
    name: "Fire Blast",
    resourceCost: {
      amount: 500,
      type: Schemas.Enums.Resource.Mana,
    },
    school: Schemas.Enums.SpellSchool.Fire,
    schoolMask: 0,
    travelTime: 0,
  },
  {
    baseDamage: 500,
    canCrit: true,
    castTime: 1500,
    chargeCooldown: 0,
    charges: 0,
    coefficient: 0.428,
    cooldown: 0,
    gcd: 1500,
    id: 2948,
    isInstant: false,
    name: "Scorch",
    resourceCost: {
      amount: 300,
      type: Schemas.Enums.Resource.Mana,
    },
    school: Schemas.Enums.SpellSchool.Fire,
    schoolMask: 0,
    travelTime: 0,
  },
];

// Helper to create a spell entity from mock data
const createSpellEntity = (
  data: Schemas.Spell.SpellDataFlat,
): Entities.Spell.Spell => {
  const info = Record({
    ...data,
    id: Branded.SpellID(data.id),
    maxCharges: 1, // Default for now
  } as any)();

  return Entities.Spell.Spell.create(
    {
      charges: 1,
      cooldownExpiry: 0,
      info,
    },
    0,
  );
};

// ============================================================
// Setup
// ============================================================

const setupSimulation = Effect.gen(function* () {
  const unitService = yield* Unit.UnitService;
  // const scheduler = yield* Scheduler.EventSchedulerService;

  // Create player unit
  const playerId = Branded.UnitID("player");
  const fireBlast = createSpellEntity(mockSpells[0]);
  const scorch = createSpellEntity(mockSpells[1]);

  const playerSpells = {
    all: Map([
      [fireBlast.info.id, fireBlast],
      [scorch.info.id, scorch],
    ]),
    meta: Record({ cooldownCategories: Map() })(),
  };

  const player = Entities.Unit.Unit.create({
    id: playerId,
    name: "Fire Mage",
    spells: playerSpells,
  });

  yield* unitService.add(player);
  yield* Effect.log(`Added player: ${player.name}`);

  // Create enemy unit
  const enemyId = Branded.UnitID("enemy");
  const enemy = Entities.Unit.Unit.create({
    health: Entities.Power.Power.create({ current: 1000000, max: 1000000 }),
    id: enemyId,
    name: "Training Dummy",
  });

  yield* unitService.add(enemy);
  yield* Effect.log(`Added enemy: ${enemy.name}`);

  return { enemyId, playerId };
});

// ============================================================
// Rotation
// ============================================================

const executeRotation = (playerId: Branded.UnitID) =>
  Effect.gen(function* () {
    const rotation = yield* Context.RotationContext;

    yield* Effect.log("Starting rotation");

    // Simple rotation: Fire Blast -> Scorch
    for (let i = 0; i < 5; i++) {
      // Cast Fire Blast if available
      const canFireBlast = yield* rotation.spell.canCast(playerId, 108853);
      if (canFireBlast) {
        yield* rotation.spell.cast(playerId, 108853);
        // yield* Effect.log("Cast Fire Blast"); // Logged by action now
      }

      // Wait for GCD
      yield* rotation.control.wait(1500);

      // Cast Scorch
      const canScorch = yield* rotation.spell.canCast(playerId, 2948);
      if (canScorch) {
        yield* rotation.spell.cast(playerId, 2948);
        // yield* Effect.log("Cast Scorch"); // Logged by action now
      }

      // Wait for cast
      yield* rotation.control.wait(1500);
    }

    yield* Effect.log("Rotation complete");
  });

// ============================================================
// Main Program
// ============================================================

const runSimulation = Effect.gen(function* () {
  const sim = yield* Simulation.SimulationService;

  // Setup units
  const { playerId } = yield* setupSimulation;

  // Subscribe to snapshots (optional, just to verify it works)
  // const snapshots: unknown[] = [];
  // yield* sim.subscribeSnapshots((snapshot) => {
  //   snapshots.push(snapshot);
  // });

  // Execute rotation in parallel with simulation
  // Note: In a real system, the rotation would be driven by the scheduler or a separate fiber
  // that synchronizes with the simulation clock. For this test, we just fork it.
  const rotationFiber = yield* Effect.fork(executeRotation(playerId));

  // Run simulation for 10 seconds
  yield* Effect.log("Running simulation (10s)");
  const result = yield* sim.run(10000);

  // Wait for rotation to complete
  yield* Fiber.join(rotationFiber);

  yield* Effect.log(`Simulation complete. Final time: ${result.finalTime}ms`);
  // yield* Effect.log(`Snapshots collected: ${snapshots.length}`);

  return {
    finalTime: result.finalTime,
    success: true,
    // snapshots: snapshots.length,
  };
});

// ============================================================
// Layer Composition
// ============================================================

const metadataLayer = Metadata.InMemoryMetadata({
  items: [],
  spells: mockSpells,
});

const baseAppLayer = createAppLayer({ metadata: metadataLayer });

const appLayer = Context.RotationContext.Default.pipe(
  Layer.provide(baseAppLayer),
  Layer.merge(baseAppLayer),
);

// ============================================================
// Entry Point
// ============================================================

const main = async () => {
  console.log("=".repeat(60));
  console.log("WowLab Complete Simulation Test");
  console.log("=".repeat(60));

  const program = runSimulation.pipe(
    Effect.provide(appLayer),
    Effect.provide(Logger.pretty),
    Effect.provide(Logger.minimumLogLevel(LogLevel.Debug)),
  );

  const exit = await Effect.runPromiseExit(program);

  console.log("=".repeat(60));

  if (Exit.isSuccess(exit)) {
    console.log("✅ SUCCESS");
    console.log(exit.value);
    process.exit(0);
  } else {
    console.log("❌ FAILURE");
    console.error(Cause.pretty(exit.cause, { renderErrorCause: true }));
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
