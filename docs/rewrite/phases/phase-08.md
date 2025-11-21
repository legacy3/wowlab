# Phase 8: @wowlab/rotation - Rotation API

**Goal:** Create rotation DSL and execution runtime.

## What to Build

### Package Structure

```
packages/
  wowlab-rotation/
    package.json
    tsconfig.json
    vite.config.ts
    src/
      index.ts
      Actions.ts
      Context.ts
      internal/
        actions/
          index.ts
          spell/
            index.ts
            SpellActions.ts
          unit/
            index.ts
            UnitActions.ts
          control/
            index.ts
            ControlActions.ts
        context/
          index.ts
          RotationContext.ts
```

### Files to Create

**1. `packages/wowlab-rotation/package.json`**

```json
{
  "name": "@wowlab/rotation",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./package.json": "./package.json",
    ".": "./build/index.js",
    "./*": "./build/*.js",
    "./internal/*": null
  },
  "files": ["build"],
  "scripts": {
    "build": "vite build && tsc-alias -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@wowlab/core": "workspace:*",
    "@wowlab/services": "workspace:*",
    "effect": "^3.19.4",
    "immutable": "^5.1.4"
  },
  "devDependencies": {
    "tsc-alias": "^1.8.16",
    "vite-plugin-dts": "^4.5.4"
  }
}
```

**2. SpellActions**

```typescript
// src/internal/actions/spell/SpellActions.ts
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Effect from "effect/Effect";

import * as Unit from "@wowlab/services/Unit";
import * as Accessors from "@wowlab/services/Accessors";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [Unit.UnitService.Default, Accessors.UnitAccessor.Default],
    effect: Effect.gen(function* () {
      const unitService = yield* Unit.UnitService;
      const unitAccessor = yield* Accessors.UnitAccessor;

      return {
        cast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            // Get unit
            const unit = yield* unitAccessor.get(unitId);

            // Get spell from unit
            const spell = unit.spells.get(spellId);
            if (!spell) {
              return yield* Effect.fail(
                new Error(`Spell ${spellId} not found on unit ${unitId}`),
              );
            }

            // TODO: Start cast via CastQueueService
            yield* Effect.log(`Casting ${spell.name}`);
          }),

        canCast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.get(spellId);

            // Check cooldown, resource, etc.
            return spell !== undefined;
          }),
      };
    }),
  },
) {}
```

**3. ControlActions**

```typescript
// src/internal/actions/control/ControlActions.ts
import * as Effect from "effect/Effect";

import * as State from "@wowlab/services/State";

export class ControlActions extends Effect.Service<ControlActions>()(
  "ControlActions",
  {
    dependencies: [State.StateService.Default],
    effect: Effect.gen(function* () {
      const state = yield* State.StateService;

      return {
        wait: (durationMs: number) =>
          Effect.gen(function* () {
            const currentState = yield* state.getState();
            const newTime = currentState.currentTime + durationMs;

            yield* state.updateState((s) => s.set("currentTime", newTime));
          }),

        waitUntil: (condition: Effect.Effect<boolean>) =>
          Effect.gen(function* () {
            // Poll until condition is true
            while (true) {
              const result = yield* condition;
              if (result) break;

              // Advance time slightly
              yield* Effect.sleep("100 millis");
            }
          }),
      };
    }),
  },
) {}
```

**4. RotationContext**

```typescript
// src/internal/context/RotationContext.ts
import * as Effect from "effect/Effect";

import { SpellActions } from "../actions/spell/SpellActions.js";
import { ControlActions } from "../actions/control/ControlActions.js";

/**
 * High-level rotation context that provides all rotation actions.
 */
export class RotationContext extends Effect.Service<RotationContext>()(
  "RotationContext",
  {
    dependencies: [SpellActions.Default, ControlActions.Default],
    effect: Effect.gen(function* () {
      const spell = yield* SpellActions;
      const control = yield* ControlActions;

      return {
        spell,
        control,
      };
    }),
  },
) {}
```

**5. Barrel exports**

```typescript
// src/Actions.ts
export * from "./internal/actions/index.js";

// src/Context.ts
export * from "./internal/context/index.js";

// src/index.ts
export * as Actions from "./Actions.js";
export * as Context from "./Context.js";
```

## Reference Implementation

Copy from `@packages/innocent-rotation/src/internal/`:

- `actions/*` → SpellActions, UnitActions, ControlActions
- `context/*` → RotationContext

## How to Test in Standalone

**Create:** `apps/standalone/src/new/phase-08-test.ts`

```typescript
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Context from "@wowlab/rotation/Context";
import * as Unit from "@wowlab/services/Unit";
import * as Entities from "@wowlab/core/Entities";
import * as Branded from "@wowlab/core/Schemas/Branded";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  { id: 108853, name: "Fire Blast" } as any,
];

const testRotation = Effect.gen(function* () {
  const rotation = yield* Context.RotationContext;
  const unitService = yield* Unit.UnitService;

  // Create player unit with spells
  const playerId = Branded.UnitID.make("player");
  const player = Entities.Unit.create({
    id: playerId,
    name: "Player",
  });

  yield* unitService.add(player);

  // Use rotation actions
  const canCast = yield* rotation.spell.canCast(playerId, 108853);
  console.log("Can cast Fire Blast:", canCast);

  if (canCast) {
    yield* rotation.spell.cast(playerId, 108853);
    console.log("Cast Fire Blast");
  }

  // Control actions
  yield* rotation.control.wait(1000);
  console.log("Waited 1000ms");

  return { success: true };
});

const metadataLayer = Metadata.InMemoryMetadata({
  spells: mockSpells,
  items: [],
});

// Combine runtime + rotation layers
const appLayer = Layer.mergeAll(
  createAppLayer({ metadata: metadataLayer }),
  Context.RotationContext.Default,
);

const main = async () => {
  const result = await Effect.runPromise(
    testRotation.pipe(Effect.provide(appLayer)),
  );
  console.log("Result:", result);
};

main();
```

### Rotation API surface (lock this contract in code comments)

- Actions namespace:
  - `spell.cast(spellId: Branded.SpellID)` → schedules cast respecting gcd/cooldown, fails with `Errors.SpellNotFound` or `Errors.SpellOnCooldown`.
  - `unit.target(unitId: Branded.UnitID)` → sets current target.
  - `control.wait(ms: number)` → advances time without actions.
- Context:
  - `RotationContext` exposes `state`, `actions`, `events`, plus helpers for current target and global cooldown.
- Errors: use tagged errors from `@wowlab/core/Errors`; no generic Error.
- Determinism: actions must be pure Effect; no Date.now or Math.random without RNG service.

**Update `apps/standalone/package.json`:**

```json
{
  "dependencies": {
    "@wowlab/core": "workspace:*",
    "@wowlab/services": "workspace:*",
    "@wowlab/runtime": "workspace:*",
    "@wowlab/rotation": "workspace:*"
  }
}
```

Run:

```bash
cd apps/standalone
pnpm install
pnpm tsx src/new/phase-08-test.ts
```

## Verification Criteria

- ✅ Rotation actions work (spell.cast, control.wait)
- ✅ RotationContext composes all actions
- ✅ NO @ts-ignore needed
- ✅ Rotation layer merges cleanly with runtime layer
- ✅ Actions enforce gcd/cooldown rules and emit domain errors on violations
- ✅ RotationContext exposes a stable shape: `{ state, actions, events, target }`

## Next Phase

Phase 9: Full standalone integration (complete rewrite test)
