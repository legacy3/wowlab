# Phase 9: Full Standalone Integration

**Goal:** Create complete standalone test that runs a full simulation using only the new packages.

## What to Build

This phase creates a complete test that mirrors the current `apps/standalone` functionality but uses only `@wowlab/*` packages.

### Files to Create

**1. Complete simulation test**

**Create:** `apps/standalone/src/new/complete-simulation.ts`

```typescript
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Scheduler from "@wowlab/services/Scheduler";
import * as Context from "@wowlab/rotation/Context";
import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";

// ============================================================
// Mock Data (In real app, loaded from Supabase)
// ============================================================

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  {
    id: 108853,
    name: "Fire Blast",
    school: Schemas.Enums.SpellSchool.Fire,
    castTime: 0,
    cooldown: 12000,
    // ... other required fields
  } as any,
  {
    id: 2948,
    name: "Scorch",
    school: Schemas.Enums.SpellSchool.Fire,
    castTime: 1500,
    cooldown: 0,
    // ... other required fields
  } as any,
];

// ============================================================
// Setup
// ============================================================

const setupSimulation = Effect.gen(function* () {
  const unitService = yield* Unit.UnitService;
  const scheduler = yield* Scheduler.EventSchedulerService;

  // Create player unit
  const playerId = Branded.UnitID.make("player");
  const player = Entities.Unit.create({
    id: playerId,
    name: "Fire Mage",
    level: 80,
  });

  yield* unitService.add(player);
  yield* Effect.log(`Added player: ${player.name}`);

  // Create enemy unit
  const enemyId = Branded.UnitID.make("enemy");
  const enemy = Entities.Unit.create({
    id: enemyId,
    name: "Training Dummy",
    health: { value: 1000000, max: 1000000 },
  });

  yield* unitService.add(enemy);
  yield* Effect.log(`Added enemy: ${enemy.name}`);

  return { playerId, enemyId };
});

// ============================================================
// Rotation
// ============================================================

const executeRotation = (
  playerId: Branded.UnitID,
  enemyId: Branded.UnitID
) =>
  Effect.gen(function* () {
    const rotation = yield* Context.RotationContext;

    yield* Effect.log("Starting rotation");

    // Simple rotation: Fire Blast → Scorch
    for (let i = 0; i < 5; i++) {
      // Cast Fire Blast if available
      const canFireBlast = yield* rotation.spell.canCast(playerId, 108853);
      if (canFireBlast) {
        yield* rotation.spell.cast(playerId, 108853);
        yield* Effect.log("Cast Fire Blast");
      }

      // Wait for GCD
      yield* rotation.control.wait(1500);

      // Cast Scorch
      const canScorch = yield* rotation.spell.canCast(playerId, 2948);
      if (canScorch) {
        yield* rotation.spell.cast(playerId, 2948);
        yield* Effect.log("Cast Scorch");
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
  const { playerId, enemyId } = yield* setupSimulation;

  // Subscribe to snapshots
  const snapshots: unknown[] = [];
  yield* sim.subscribeSnapshots((snapshot) => {
    snapshots.push(snapshot);
  });

  // Execute rotation in parallel with simulation
  const rotationFiber = yield* Effect.fork(
    executeRotation(playerId, enemyId)
  );

  // Run simulation for 10 seconds
  yield* Effect.log("Running simulation (10s)");
  const result = yield* sim.run(10000);

  // Wait for rotation to complete
  yield* Effect.join(rotationFiber);

  yield* Effect.log(`Simulation complete. Final time: ${result.finalTime}ms`);
  yield* Effect.log(`Snapshots collected: ${snapshots.length}`);

  return {
    success: true,
    finalTime: result.finalTime,
    snapshots: snapshots.length,
  };
});

// ============================================================
// Layer Composition
// ============================================================

const metadataLayer = Metadata.InMemoryMetadata({
  spells: mockSpells,
  items: [],
});

const appLayer = Layer.mergeAll(
  createAppLayer({ metadata: metadataLayer }),
  Context.RotationContext.Default
);

// ============================================================
// Entry Point
// ============================================================

const main = async () => {
  console.log("=".repeat(60));
  console.log("WowLab Standalone Simulation (NEW @wowlab/* packages)");
  console.log("=".repeat(60));

  const exit = await Effect.runPromiseExit(
    runSimulation.pipe(Effect.provide(appLayer))
  );

  console.log("=".repeat(60));

  if (Exit.isSuccess(exit)) {
    console.log("✅ SUCCESS");
    console.log(JSON.stringify(exit.value, null, 2));
    process.exit(0);
  } else {
    console.log("❌ FAILURE");
    console.error(Cause.pretty(exit.cause, { renderErrorCause: true }));
    process.exit(1);
  }
};

main();
```

**2. Update package.json scripts**

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:new": "tsx src/new/complete-simulation.ts",
    "dev:old": "tsx src/index.ts"
  }
}
```

## How to Test

Run the new simulation:
```bash
cd apps/standalone
pnpm dev:new
```

Expected output:
```
============================================================
WowLab Standalone Simulation (NEW @wowlab/* packages)
============================================================
Added player: Fire Mage
Added enemy: Training Dummy
Starting rotation
Cast Fire Blast
Cast Scorch
Cast Fire Blast
Cast Scorch
...
Rotation complete
Simulation complete. Final time: 10000ms
Snapshots collected: X
============================================================
✅ SUCCESS
{
  "success": true,
  "finalTime": 10000,
  "snapshots": X
}
```

Compare with old implementation:
```bash
pnpm dev:old
```

## Verification Criteria

- ✅ Full simulation runs without errors
- ✅ Units are created and managed
- ✅ Rotation executes spells
- ✅ Simulation processes events in time order
- ✅ Snapshots are collected
- ✅ **ZERO @ts-ignore in entire codebase**
- ✅ All services compose cleanly
- ✅ Metadata is pluggable (using InMemoryMetadata)

## Success Metrics

Compare the two implementations:

**Old packages (@packages/innocent-*):**
- 7 packages
- 13 `@ts-ignore` comments in AppLayer.ts
- Confusing `DefaultWithoutDependencies` pattern
- Only metadata is pluggable

**New packages (@wowlab/*):**
- 4 packages (43% reduction)
- **ZERO `@ts-ignore` comments**
- Clean `Effect.Service` with dependencies
- Any service can be pluggable (metadata, logger, RNG)

## Next Steps

Once Phase 9 is verified:
1. Migrate `apps/portal` to use `@wowlab/*`
2. Migrate `apps/cli` to use `@wowlab/*`
3. Add remaining services (CastQueue, Periodic, etc.)
4. Delete old `@packages/innocent-*` packages
5. Celebrate 🎉

## Rollback Plan

If anything fails:
- Keep using `@packages/innocent-*` in apps
- Fix issues in `@wowlab/*` packages
- Re-test in standalone
- Only migrate apps when stable

The new packages live alongside old ones - no risk to existing functionality.
