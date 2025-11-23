# Rotation Event-Based Design

## Summary

The WowLab simulation engine is **event-based**, not time-based. However, example rotations in `apps/standalone/src/rotations/` are incorrectly implemented using time-based patterns (loops, waits, iterations), which fundamentally contradicts the event-driven architecture.

## Problem

### Current (Incorrect) Implementation

Both example rotations (`beast-mastery.ts`, `fire-mage.ts`) use:

1. **For loops with iteration counts**

   ```typescript
   for (let i = 0; i < 10; i++) {
     // rotation logic
   }
   ```

2. **Time-based waits**

   ```typescript
   yield * rotation.control.wait(500);
   ```

3. **Sequential spell casting within loops**

   ```typescript
   for (let i = 0; i < 10; i++) {
     if (canBestialWrath) {
       yield * rotation.spell.cast(playerId, 186254);
       yield * rotation.control.wait(500); // WRONG
     }
     // ... more casts with waits
   }
   ```

### Why This Is Wrong

1. **`rotation.control.wait()` doesn't exist**: The `ControlActions` service is implemented as an empty object:

   ```typescript
   // packages/innocent-rotation/src/internal/actions/control/index.ts
   export class ControlActions extends Effect.Service<ControlActions>()(
     "ControlActions",
     {
       effect: Effect.succeed({}),
     },
   ) {}
   ```

2. **Contradicts event-based architecture**: The simulation engine (`SimulationService`) uses a priority queue-based event loop that:
   - Dequeues events from a priority queue
   - Advances simulation time to event.time
   - Executes the event handler
   - Repeats until queue is empty or max duration exceeded

3. **Documentation is misleading**: `docs/rewrite/phases/phase-08.md` shows a `wait()` method that was never implemented correctly.

## Correct Architecture

### How Event-Based Simulation Works

The simulation engine follows this flow:

```text
1. Initial APL_EVALUATE event scheduled at t=0
2. Event loop dequeues next event
3. Time advances to event.time
4. Event handler (rotation) executes
5. Rotation evaluates from top, casts first available spell
6. Spell cast schedules SPELL_CAST_START, SPELL_CAST_COMPLETE events
7. Spell cast schedules NEXT APL_EVALUATE event at cast complete time
8. Spell cast interrupts rotation fiber (stops execution)
9. Loop continues with next event
```

**Key insight**: The rotation is re-evaluated from the top on every APL_EVALUATE event. It should:

- Run once per evaluation
- Cast ONE spell
- Return immediately (via interrupt)
- NOT loop or wait

### How Spell Casting Works

From `packages/innocent-services/src/internal/castQueue/index.ts:237-250`:

```typescript
// After successful spell cast:
const rotationEffect = yield * rotationRef.get;
if (rotationEffect !== null) {
  const gcdExpiry = triggersGcd ? startTime + gcd : startTime;
  const aplEvaluateTime = Math.max(completeTime, gcdExpiry);

  yield *
    scheduler.schedule({
      execute: rotationEffect, // Schedule next APL evaluation
      id: `apl_evaluate_${modifiedSpell.info.id}_${startTime}`,
      type: Events.EventType.APL_EVALUATE,
      time: aplEvaluateTime, // At cast complete OR GCD expiry
      priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
    });
}

// Interrupt the rotation fiber - cast succeeded, stop execution
return yield * Effect.interrupt;
```

When a spell successfully casts:

1. **Schedules the next APL_EVALUATE event** at cast complete time (respecting GCD)
2. **Interrupts the rotation fiber** to stop execution immediately
3. The rotation will be called again from the top when the next APL_EVALUATE event fires

### Correct Rotation Pattern

```typescript
export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery Hunter",
  spellIds: [193455, 217200, 34026, 186254],
  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      // NO LOOPS - Evaluated from top each APL_EVALUATE event

      // Priority 1: Bestial Wrath on cooldown
      const canBestialWrath = yield* rotation.spell.canCast(playerId, 186254);
      if (canBestialWrath) {
        yield* rotation.spell.cast(playerId, 186254);
        // Cast will interrupt fiber and schedule next APL_EVALUATE
        return;
      }

      // Priority 2: Barbed Shot to maintain Frenzy
      const canBarbedShot = yield* rotation.spell.canCast(playerId, 217200);
      if (canBarbedShot) {
        yield* rotation.spell.cast(playerId, 217200);
        return;
      }

      // Priority 3: Kill Command on cooldown
      const canKillCommand = yield* rotation.spell.canCast(playerId, 34026);
      if (canKillCommand) {
        yield* rotation.spell.cast(playerId, 34026);
        return;
      }

      // Priority 4: Cobra Shot as filler
      const canCobraShot = yield* rotation.spell.canCast(playerId, 193455);
      if (canCobraShot) {
        yield* rotation.spell.cast(playerId, 193455);
        return;
      }

      // If nothing can be cast, rotation will be re-evaluated at next event
    }),
  // ... setupPlayer
};
```

Key differences:

- **NO for loops** - rotation is called repeatedly by the event system
- **NO wait() calls** - time advances via scheduled events
- **NO iterations** - each call evaluates from top, casts one spell, returns
- **Priority-based** - check spells in priority order, cast first available
- **Return after cast** - let the interrupt happen, event system handles scheduling

## Impact Analysis

### Files with Incorrect Patterns

1. **Example Rotations** (both wrong):
   - `apps/standalone/src/rotations/beast-mastery.ts`
   - `apps/standalone/src/rotations/fire-mage.ts`

2. **Misleading Documentation**:
   - `docs/rewrite/phases/phase-08.md` (shows wait() method)
   - `docs/rewrite/phases/phase-09.md` (shows wait() usage)

### Files with Correct Implementation

1. **Core Engine** (all correct):
   - `packages/innocent-services/src/internal/simulation/SimulationService.ts` - Event loop
   - `packages/innocent-services/src/internal/castQueue/index.ts` - APL scheduling
   - `packages/innocent-rotation/src/internal/actions/control/index.ts` - Empty control actions

## Recommended Actions

1. **Fix Example Rotations**: Rewrite both example rotations to use correct event-based pattern
2. **Update Documentation**: Correct phase-08.md and phase-09.md to remove wait() references
3. **Add Documentation**: Create rotation authoring guide with correct patterns
4. **Remove ControlActions**: Since it's unused and misleading, consider removing it entirely

## References

- `packages/innocent-services/src/internal/simulation/SimulationService.ts:58-107` - Event loop implementation
- `packages/innocent-services/src/internal/castQueue/index.ts:233-250` - APL re-evaluation scheduling
- `packages/innocent-domain/src/internal/events/SimulationEvent.ts:8` - APL_EVALUATE event type
- `packages/innocent-domain/src/internal/events/SimulationEvent.ts:78` - Event priorities
