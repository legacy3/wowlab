# Handler Phase System Refactor

## Problem

Current handler priority system uses numeric priorities (0-1000) with informal ranges documented only in comments. This breaks down at scale:

- **No semantic meaning**: Priority `37` tells you nothing about purpose
- **Coordination tax**: Finding unused numbers requires checking all handlers
- **No enforcement**: Nothing prevents "cleanup" handler from using priority `500`
- **Hidden dependencies**: "Handler A needs priority < Handler B" is invisible
- **Code duplication**: Priority tables duplicated across packages
- **Merge conflicts**: Two teams picking same range → manual conflict resolution

At 500+ handlers this becomes unmaintainable.

## Solution

Replace numeric priorities with explicit phases + optional sub-priorities.

### Phase-Based Handler System

Four execution phases per event:

```typescript
enum HandlerPhase {
  CLEANUP = "CLEANUP",      // 0-20: State reset, validation, prep
  CORE = "CORE",           // 20-50: Damage, resources, cooldowns
  SECONDARY = "SECONDARY",  // 50-100: Procs, buffs, reactive effects
  POST = "POST"            // 100+: Logging, metrics, observation
}
```

**Execution order:** CLEANUP → CORE → SECONDARY → POST

**Within each phase:** Handlers run by optional `phasePriority` (lower = earlier), then registration order.

## API Design

### Handler Registration

```typescript
interface HandlerRegistration<T extends Events.EventType> {
  readonly eventType: T;
  readonly name: string;
  readonly callback: Events.ExecutionCallback<T>;
  readonly phase: HandlerPhase;
  readonly phasePriority?: number;  // Optional: defaults to 0
}

// Most handlers (90%):
registry.register({
  eventType: EventType.SPELL_CAST_COMPLETE,
  name: "myProc",
  phase: HandlerPhase.SECONDARY,
  callback: myProcHandler
  // No phasePriority needed - registration order is fine
});

// Handlers needing strict ordering (10%):
registry.register({
  eventType: EventType.SPELL_CAST_COMPLETE,
  name: "clearCastState",
  phase: HandlerPhase.CLEANUP,
  phasePriority: -10,  // Must run first
  callback: clearCastStateHandler
});
```

### Registry Implementation

```typescript
class EventHandlerRegistry {
  private handlers: Map<EventType, HandlerMetadata[]>;

  register(registration: HandlerRegistration): void {
    // Sort by: phase order → phasePriority → registrationOrder
  }

  getHandlers(eventType: EventType): ExecutionCallback[] {
    // Return handlers sorted by phase + sub-priority
  }
}

interface HandlerMetadata {
  readonly callback: ExecutionCallback;
  readonly name: string;
  readonly phase: HandlerPhase;
  readonly phasePriority: number;
  readonly registrationOrder: number;  // Auto-incremented
}
```

### Sorting Logic

```typescript
function compareHandlers(a: HandlerMetadata, b: HandlerMetadata): number {
  // 1. Phase order (CLEANUP < CORE < SECONDARY < POST)
  const phaseOrder = [
    HandlerPhase.CLEANUP,
    HandlerPhase.CORE,
    HandlerPhase.SECONDARY,
    HandlerPhase.POST
  ];
  const phaseCompare = phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
  if (phaseCompare !== 0) return phaseCompare;

  // 2. Phase priority (lower = earlier)
  const priorityCompare = a.phasePriority - b.phasePriority;
  if (priorityCompare !== 0) return priorityCompare;

  // 3. Registration order
  return a.registrationOrder - b.registrationOrder;
}
```

## Migration Map

### Current Handlers → Phases

Based on existing handlers in codebase:

| Handler | Current Priority | New Phase | Phase Priority | Reason |
|---------|-----------------|-----------|----------------|---------|
| `clearCastState` | 10 | CLEANUP | -10 | Must reset state first |
| `HotStreak.beforeCast` | N/A | CLEANUP | 0 | Modifies cast before queue |
| `cooldownReady` | 50 | CORE | 0 | State mutation |
| `incrementCharge` | 50 | CORE | 0 | State mutation |
| `applyDamage` | 40 | CORE | -5 | Authoritative damage |
| `resource.consume` | N/A | CORE | -10 | Must run before damage |
| `LaunchProjectile` | N/A | CORE | 0 | Primary damage path |
| `TriggerCooldown` | N/A | CORE | 0 | Gate future casts |
| `executeOnCast` | 50 | SECONDARY | 0 | Fire modifier hooks |
| `aura.add` | N/A | SECONDARY | 0 | Buff application |
| `BleakArrows.onHit` | N/A | SECONDARY | 0 | Proc roll |
| `HeatingUp.onDamage` | N/A | SECONDARY | 0 | Crit chain tracking |
| `executeOnDamage` | N/A | POST | 0 | Observability |
| `executeOnHit` | N/A | POST | 0 | Observability |

## File Changes

### Core Package Changes

**packages/wowlab-core/src/internal/events/HandlerPhase.ts** (new)

```typescript
export enum HandlerPhase {
  CLEANUP = "CLEANUP",
  CORE = "CORE",
  SECONDARY = "SECONDARY",
  POST = "POST"
}

export const PHASE_ORDER: readonly HandlerPhase[] = [
  HandlerPhase.CLEANUP,
  HandlerPhase.CORE,
  HandlerPhase.SECONDARY,
  HandlerPhase.POST
];
```

**packages/wowlab-core/src/internal/events/Events.ts**

- Keep `EventType` enum
- Keep `EventPayloadMap`
- Keep `EVENT_PRIORITY` (for event-level priorities)
- Remove handler priority references

### Services Package Changes

**packages/wowlab-services/src/internal/callbacks/registry/EventHandlerRegistry.ts**

- Change `HandlerDefinition` interface to include `phase` + optional `phasePriority`
- Update `register()` to accept new interface
- Change sorting to use phase-based comparator
- Add `registrationOrder` auto-increment counter

**packages/wowlab-services/src/internal/callbacks/bootstrap.ts**

- Update all `registry.register()` calls to use phase-based API
- Remove priority comments (phases are self-documenting)

### Remove Duplication

**Delete:** `packages/innocent-domain/src/internal/events/SimulationEvent.ts` EVENT_PRIORITY table

Consolidate on single source in `@wowlab/core`.

## Testing Strategy

### Unit Tests

```typescript
describe("EventHandlerRegistry", () => {
  it("executes CLEANUP before CORE", () => {
    const order: string[] = [];
    registry.register({
      eventType: EventType.TEST,
      name: "core",
      phase: HandlerPhase.CORE,
      callback: Effect.sync(() => order.push("core"))
    });
    registry.register({
      eventType: EventType.TEST,
      name: "cleanup",
      phase: HandlerPhase.CLEANUP,
      callback: Effect.sync(() => order.push("cleanup"))
    });

    // Execute handlers
    expect(order).toEqual(["cleanup", "core"]);
  });

  it("respects phasePriority within phase", () => {
    const order: string[] = [];
    registry.register({
      eventType: EventType.TEST,
      name: "later",
      phase: HandlerPhase.CORE,
      phasePriority: 10,
      callback: Effect.sync(() => order.push("later"))
    });
    registry.register({
      eventType: EventType.TEST,
      name: "earlier",
      phase: HandlerPhase.CORE,
      phasePriority: -10,
      callback: Effect.sync(() => order.push("earlier"))
    });

    expect(order).toEqual(["earlier", "later"]);
  });

  it("uses registration order when priorities equal", () => {
    const order: string[] = [];
    registry.register({
      eventType: EventType.TEST,
      name: "first",
      phase: HandlerPhase.CORE,
      callback: Effect.sync(() => order.push("first"))
    });
    registry.register({
      eventType: EventType.TEST,
      name: "second",
      phase: HandlerPhase.CORE,
      callback: Effect.sync(() => order.push("second"))
    });

    expect(order).toEqual(["first", "second"]);
  });
});
```

### Integration Tests

Validate critical ordering constraints:

- `clearCastState` runs before `executeOnCast` on SPELL_CAST_COMPLETE
- Resource consumption runs before damage application
- Damage runs before proc handlers
- Logging runs after all game state changes

## Benefits

### For Developers

**Before:**

```typescript
// What number do I use? Let me check 50 other handlers...
registry.register(eventType, "myHandler", callback, 47);
```

**After:**

```typescript
// Clear intent, no coordination needed
registry.register({
  eventType,
  name: "myHandler",
  phase: HandlerPhase.SECONDARY,
  callback
});
```

### For Code Review

**Before:** "Is priority 47 correct? How does it relate to priority 42?"

**After:** "Does SECONDARY phase make sense for a proc handler?" ✅

### For Debugging

**Before:**

```
Handlers: [10, 37, 42, 47, 50, 63, 89, 95, 100]
```

**After:**

```
CLEANUP: clearCastState(-10), validate(0)
CORE: consumeResource(-10), applyDamage(-5), updateCooldown(0)
SECONDARY: checkProcs(0), applyBuff(0), rollCrit(0)
POST: logEvent(0), recordMetrics(0)
```

### For Scale

At 500 handlers:

- No priority number negotiation
- Clear semantic buckets
- Self-documenting code
- Deterministic within phase (registration order)
- Only ~50 handlers need explicit sub-priority

## Non-Goals

- Backwards compatibility with old priority numbers
- Migration shims or deprecated code paths
- Gradual rollout (cut over entire system at once)
- Support for dynamic phase ordering
- Constraint graphs (`.before()`, `.after()` APIs)

## Success Criteria

1. All handler registrations use phase-based API
2. Zero references to old numeric priorities
3. All tests passing with phase-based ordering
4. Handler execution order matches current behavior
5. Documentation updated to show phase system
6. Single source of truth for handler metadata (no duplication)

## Future Extensions

### Debug Tooling

```typescript
registry.debugHandlers(EventType.SPELL_CAST_COMPLETE);
// Output:
// SPELL_CAST_COMPLETE handlers:
//   CLEANUP:
//     - clearCastState (phasePriority: -10)
//   CORE:
//     - (none)
//   SECONDARY:
//     - executeOnCast (phasePriority: 0)
//     - triggerProcs (phasePriority: 0)
//   POST:
//     - (none)
```

### Validation

Runtime checks for common mistakes:

```typescript
// Warn if POST phase handler mutates state
if (phase === HandlerPhase.POST && detectsStateMutation(callback)) {
  console.warn("POST handler mutating state - should be in CORE?");
}
```

### Metrics

Track handler execution time per phase:

```typescript
{
  event: "SPELL_CAST_COMPLETE",
  phases: {
    CLEANUP: "0.2ms",
    CORE: "1.5ms",
    SECONDARY: "3.8ms",
    POST: "0.1ms"
  }
}
```

## Open Questions

None. Design is complete and ready for implementation.

## References

- Current implementation: `packages/wowlab-services/src/internal/callbacks/registry/EventHandlerRegistry.ts`
- Handler bootstrap: `packages/wowlab-services/src/internal/callbacks/bootstrap.ts`
- Event priorities (separate concern): `packages/wowlab-core/src/internal/events/Events.ts`
- Browser event phases (inspiration): <https://www.w3.org/TR/DOM-Level-3-Events/#event-flow>
