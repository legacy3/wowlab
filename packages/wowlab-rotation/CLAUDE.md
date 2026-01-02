# wowlab-rotation

Rotation action primitives and simulation context for spell casting logic.

Note: The Rust simulation engine (`crates/engine/`) uses Rhai scripts for rotations. This TypeScript package provides complementary Effect-based rotation primitives.

## Modules

- **Actions**: Spell casting, control flow (wait, loop), condition checking
- **Context**: RotationContext combining spell and control actions

## Structure

```
src/
  Actions.ts         # Re-exports SpellActions, ControlActions
  Context.ts         # Re-exports RotationContext
  internal/
    actions/
      spell/         # SpellActions service
      control/       # ControlActions service
    context/         # RotationContext service
```

## RotationContext

High-level context providing all rotation actions:

```ts
import * as Context from "@wowlab/rotation/Context";

// Access via service
const ctx = yield * Context.RotationContext;
ctx.spell.cast(unitId, spellId);
ctx.control.wait(duration);
```

## SpellActions

Service with `cast` and `canCast` methods:

```ts
import { SpellActions } from "@wowlab/rotation/Actions";

// In an Effect with SpellActions provided
const actions = yield * SpellActions;
const result = yield * actions.cast(unitId, spellId, targetId);
const canCast = yield * actions.canCast(unitId, spellId);
```

## Service Pattern

Actions use `Effect.Service` pattern:

```ts
export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [UnitService.Default, UnitAccessor.Default, ...],
    effect: Effect.gen(function* () {
      // ... implementation
      return { cast, canCast };
    }),
  },
) {}
```

## Key Conventions

- All actions return `Effect` with typed errors from `@wowlab/core/Errors`
- Actions depend on services from `@wowlab/services`
- No direct state mutation - use service APIs
