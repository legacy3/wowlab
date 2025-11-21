# Phase 5: Business Services (Accessors, Unit, Spell)

**Goal:** Implement accessor and business logic services using Effect.Service with proper dependencies.

## What to Build

### Add to Package Structure

```
packages/wowlab-services/src/internal/
  accessors/
    index.ts
    UnitAccessor.ts      # Unit query service
    SpellAccessor.ts     # Spell query service
  unit/
    index.ts
    UnitService.ts       # Unit CRUD operations
  spell/
    index.ts
    SpellService.ts      # Spell CRUD operations
  scheduler/
    index.ts
    EventSchedulerService.ts  # Priority queue scheduler
```

### Files to Create

**1. UnitAccessor**

```typescript
// src/internal/accessors/UnitAccessor.ts
import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class UnitAccessor extends Effect.Service<UnitAccessor>()(
  "UnitAccessor",
  {
    dependencies: [StateService.Default],
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        get: (unitId: Branded.UnitID) =>
          Effect.gen(function* () {
            const gameState = yield* state.getState();
            const unit = gameState.units.get(unitId);

            return unit
              ? Effect.succeed(unit)
              : Effect.fail(new Errors.UnitNotFound({ unitId }));
          }).pipe(Effect.flatten),

        getAll: () =>
          Effect.gen(function* () {
            const gameState = yield* state.getState();
            return Array.from(gameState.units.values());
          }),
      };
    }),
  },
) {}
```

**2. SpellAccessor**

```typescript
// src/internal/accessors/SpellAccessor.ts
import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class SpellAccessor extends Effect.Service<SpellAccessor>()(
  "SpellAccessor",
  {
    dependencies: [StateService.Default],
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        get: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const gameState = yield* state.getState();
            const unit = gameState.units.get(unitId);

            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }

            const spell = unit.spells.get(spellId);
            return spell
              ? Effect.succeed(spell)
              : Effect.fail(new Errors.SpellNotFound({ unitId, spellId }));
          }).pipe(Effect.flatten),
      };
    }),
  },
) {}
```

**3. Update internal/accessors/index.ts**

```typescript
// src/internal/accessors/index.ts
export * from "./UnitAccessor.js";
export * from "./SpellAccessor.js";
```

**4. Add Accessors barrel**

```typescript
// src/Accessors.ts
export * from "./internal/accessors/index.js";

// src/index.ts (add Accessors export)
export * as Accessors from "./Accessors.js";
```

**5. UnitService**

```typescript
// src/internal/unit/UnitService.ts
import * as Entities from "@wowlab/core/Entities";
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";
import { UnitAccessor } from "../accessors/UnitAccessor.js";

export class UnitService extends Effect.Service<UnitService>()("UnitService", {
  dependencies: [StateService.Default, UnitAccessor.Default],
  effect: Effect.gen(function* () {
    const state = yield* StateService;
    const accessor = yield* UnitAccessor;

    return {
      add: (unit: Entities.Unit) =>
        state.updateState((s) => s.setIn(["units", unit.id], unit)),

      remove: (unitId: Branded.UnitID) =>
        state.updateState((s) => s.set("units", s.units.delete(unitId))),

      update: (unit: Entities.Unit) =>
        state.updateState((s) => s.setIn(["units", unit.id], unit)),

      // Health operations
      health: {
        damage: (unitId: Branded.UnitID, amount: number) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentState = yield* state.getState();
            const updatedHealth = unit.health.transform.value.decrement({
              amount,
              time: currentState.currentTime,
            });

            yield* state.updateState((s) =>
              s.setIn(["units", unitId, "health"], updatedHealth),
            );
          }),
      },
    };
  }),
}) {}
```

**6. EventSchedulerService**

```typescript
// src/internal/scheduler/EventSchedulerService.ts
import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import TinyQueue from "tinyqueue";

export class EventSchedulerService extends Effect.Service<EventSchedulerService>()(
  "EventSchedulerService",
  {
    effect: Effect.gen(function* () {
      const queueRef = yield* Ref.make(
        new TinyQueue<Events.SimulationEvent>([], (a, b) => a.time - b.time),
      );

      return {
        schedule: (event: Events.SimulationEvent) =>
          Ref.update(queueRef, (queue) => {
            queue.push(event);
            return queue;
          }),

        dequeue: () =>
          Ref.modify(queueRef, (queue) => {
            const event = queue.pop();
            return [event, queue] as const;
          }),

        peek: () => Ref.get(queueRef).pipe(Effect.map((queue) => queue.peek())),

        clear: () =>
          Ref.set(queueRef, new TinyQueue([], (a, b) => a.time - b.time)),
      };
    }),
  },
) {}
```

**7. Add barrel exports**

```typescript
// src/Unit.ts
export * from "./internal/unit/index.js";

// src/Scheduler.ts
export * from "./internal/scheduler/index.js";

// src/index.ts (update)
export * as Accessors from "./Accessors.js";
export * as Unit from "./Unit.js";
export * as Scheduler from "./Scheduler.js";
```

## Reference Implementation

Copy from `@packages/innocent-services/src/internal/`:

- `accessors/*` → UnitAccessor, SpellAccessor
- `unit/*` → UnitService
- `scheduler/*` → EventSchedulerService

## How to Test in Standalone

**Create:** `apps/standalone/src/new/phase-05-test.ts`

```typescript
import * as State from "@wowlab/services/State";
import * as Accessors from "@wowlab/services/Accessors";
import * as Unit from "@wowlab/services/Unit";
import * as Entities from "@wowlab/core/Entities";
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const testBusinessServices = Effect.gen(function* () {
  const unitService = yield* Unit.UnitService;
  const unitAccessor = yield* Accessors.UnitAccessor;

  // Create a test unit
  const unitId = Branded.UnitID.make("player");
  const unit = Entities.Unit.create({ id: unitId, name: "Test Player" });

  // Add unit
  yield* unitService.add(unit);
  console.log("Added unit:", unit.name);

  // Get unit via accessor
  const retrieved = yield* unitAccessor.get(unitId);
  console.log("Retrieved unit:", retrieved.name);

  // Update unit health
  yield* unitService.health.damage(unitId, 100);
  console.log("Damaged unit for 100");

  const updated = yield* unitAccessor.get(unitId);
  console.log("Updated health:", updated.health.value);

  return { success: true };
});

const appLayer = Layer.mergeAll(
  State.StateServiceLive,
  Accessors.UnitAccessor.Default,
  Unit.UnitService.Default,
);

const main = async () => {
  const result = await Effect.runPromise(
    testBusinessServices.pipe(Effect.provide(appLayer)),
  );
  console.log("Result:", result);
};

main();
```

Run:

```bash
cd apps/standalone
pnpm tsx src/new/phase-05-test.ts
```

## Verification Criteria

- ✅ Services use Effect.Service with dependencies array
- ✅ NO @ts-ignore needed (Effect deduplicates StateService automatically)
- ✅ Accessors work correctly
- ✅ Unit CRUD operations work
- ✅ Services compose cleanly with Layer.mergeAll
- ✅ UnitAccessor returns `UnitNotFound` on missing IDs; SpellAccessor returns `SpellNotFound`
- ✅ Health update helpers keep `health.value` within min/max bounds
- ✅ Parity audit: Unit/Spell service methods mirror existing @packages/innocent-\* behaviors (method names + error types)

## Parity audit (business layer)

- Match method surface area of `@packages/innocent-services` Unit/Spell modules (create/add/remove/update/health/damage/heal/spendResource).
- Events/errors emitted must keep the same tag names so downstream listeners remain compatible.
- Accessors must be read-only and side-effect free; all mutations go through services.

## Next Phase

Phase 6: Simulation orchestration services
