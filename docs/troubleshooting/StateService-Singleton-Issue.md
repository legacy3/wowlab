# StateService Singleton Issue

**Date:** 2025-11-23
**Status:** UNRESOLVED
**Severity:** Critical - Blocks rotation simulation from running

## Problem Summary

The `StateService` is being instantiated multiple times instead of as a singleton, causing different parts of the application to have separate state instances. This manifests as:

- Units added via `UnitService.add()` are stored in one StateService instance
- The rotation fiber's `CastQueue` accesses a different StateService instance with empty state
- Result: "Player unit not found" error because the CastQueue sees an empty units map

## Root Cause

**Effect services use reference equality.** When `StateService.Default` is included in multiple layers or merged/provided incorrectly, Effect creates multiple instances of the service, each with its own `SynchronizedRef` for state.

## Evidence

Debug logging added to StateService showed multiple ref IDs being created:

```
[StateService:wcx26s] updateState - new units count: 2
[StateService:wcx26s] updateState - new unit IDs: [ 'player', 'enemy' ]
...
[StateService:b122zn] getState - units count: 0
[StateService:b122zn] getState - unit IDs: []
```

Two different StateService instances (`wcx26s` and `b122zn`) exist simultaneously.

## Key Files

- `/packages/wowlab-services/src/internal/state/StateService.ts` - The state service implementation
- `/packages/wowlab-runtime/src/AppLayer.ts` - Layer composition that was causing duplication
- `/apps/standalone/src/runtime/RotationRuntime.ts` - Runtime setup that may have been duplicating layers

## Attempted Solutions

### 1. Changed `effect:` to `scoped:` ❌

**Reasoning:** Thought `scoped:` would create a singleton per scope.

**Result:** Made it worse - scoped services create one instance per scope, and forked fibers create new scopes. Still got multiple instances.

**Code:**
```typescript
export class StateService extends Effect.Service<StateService>()(
  "StateService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* SynchronizedRef.make(Entities.GameState.createGameState());
      // ...
    }),
  },
) {}
```

### 2. Global module-level Ref with `Effect.runSync` ❌

**Reasoning:** Create a truly global ref at module load time, before any service instantiation.

**Result:** Module was loaded 3 times (different bundles/chunks), creating 3 separate global refs. This is a bundling/module resolution issue that makes global variables unreliable.

**Code:**
```typescript
const makeStateRef = Effect.runSync(
  SynchronizedRef.make(Entities.GameState.createGameState()),
);

export class StateService extends Effect.Service<StateService>()(
  "StateService",
  {
    sync: () => ({
      getState: () => SynchronizedRef.get(makeStateRef),
      // ...
    }),
  },
) {}
```

**Evidence:** Debug logs showed 3 ref IDs created: `ez9etd`, `q5n4ge`, `4xs7ih`

### 3. Fixed Layer Composition in RotationRuntime ⚠️

**Reasoning:** Found `Layer.merge(baseAppLayer)` after `Layer.provide(baseAppLayer)` in RotationRuntime, which would include StateService twice by reference.

**Changes:**
```typescript
// BEFORE (in RotationRuntime.ts)
const fullLayer = Context.RotationContext.Default.pipe(
  Layer.provide(baseAppLayer),
  Layer.merge(baseAppLayer),  // ← DUPLICATE!
  // ...
);

// AFTER
const fullLayer = Context.RotationContext.Default.pipe(
  Layer.provide(baseAppLayer),
  // Removed the duplicate merge
  // ...
);
```

**Result:** Caused "Service not found" errors - the duplicate merge was actually needed to expose services at the top level.

### 4. Attempted AppLayer.ts Fix ⚠️

**Original code:**
```typescript
return ServicesLayer.pipe(Layer.provide(BaseLayer), Layer.merge(BaseLayer));
```

**Attempted fixes:**
- `Layer.provide(ServicesLayer, BaseLayer)` → Services not exposed
- `Layer.merge(appLayer, BaseLayer)` → SimulationService not found
- `Layer.merge(BaseLayer, providedServices)` → Unknown result (testing interrupted)

## Current State

The code is in a broken state:

1. StateService reverted to using `effect:` with `SynchronizedRef`
2. AppLayer.ts has `Layer.merge(BaseLayer, providedServices)` which may or may not work
3. RotationRuntime.ts no longer has the duplicate merge

## What We Don't Understand

1. **How Effect's layer memoization works** - Does Effect cache layer instances by reference? If so, why are we getting duplicates?

2. **The correct pattern for exposing services from dependent layers** - When you do `Layer.provide(A, B)`, how do you expose both A's and B's services at the top level without creating duplicates?

3. **Whether the duplicate merge was intentional** - The original code had `Layer.merge(baseAppLayer)` after providing it. Was this actually correct and necessary?

4. **Fiber scope inheritance** - Do forked fibers share the same layer instances, or do they get fresh instances?

## Next Steps

1. **Consult Effect documentation** on:
   - Layer memoization and caching
   - Proper patterns for merging and providing layers
   - Service lifecycle and singleton guarantees

2. **Check Effect Discord/GitHub** for similar issues

3. **Consider alternative architecture**:
   - Use a single top-level Effect.gen that creates all services explicitly
   - Pass state explicitly instead of through services
   - Use a different state management pattern

4. **Add more debug logging** to understand layer instantiation order

## Lessons Learned

- Effect services are NOT automatically singletons - it depends on layer composition
- Reference equality matters - using the same layer reference is crucial
- Global variables don't work in bundled environments due to module duplication
- `scoped:` vs `effect:` in Effect.Service affects instance lifecycle
- Need deeper understanding of Effect's layer system before making changes
