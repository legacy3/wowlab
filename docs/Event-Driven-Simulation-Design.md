# Event-Driven Simulation Design

## Overview

This document outlines the design principles and architecture for WowLab's event-driven spell rotation simulation. It explains current issues, compares with the old `innocent-` implementation, and provides a roadmap for making the system more maintainable and correct.

## Current Issues (wowlab-services)

### 1. APL_EVALUATE Scheduling Problem

**Current behavior:**

- APL_EVALUATE is scheduled after EVERY cast at the same time as the next APL evaluation
- This creates a "cascading" effect where multiple APL evaluations can be scheduled
- The rotation runs continuously without proper event-driven control

**Example timeline (incorrect):**

```
0ms     - APL_EVALUATE (initial)
0ms     - Cast Bestial Wrath
1500ms  - SPELL_CAST_COMPLETE
1500ms  - APL_EVALUATE (scheduled from previous cast)
1500ms  - Cast Bestial Wrath again
3000ms  - SPELL_CAST_COMPLETE
3000ms  - APL_EVALUATE (scheduled from previous cast)
...repeats
```

### 2. Cooldown Management

**Missing:**

- Spell cooldowns are not properly set when a cast completes
- The `recoveryTime` from spell data isn't used
- No SPELL_COOLDOWN_READY events to wake up the rotation

**Current implementation:**

- Only handles GCD (global cooldown) via cooldownCategories
- Individual spell cooldowns (like Bestial Wrath's 90s CD) are not tracked
- Charges and charge recovery are not implemented

### 3. Rotation Reference Pattern Issues

**Current approach:**

```typescript
const rotationEffect = yield* rotationRef.get;
if (rotationEffect !== null) {
  yield* scheduler.schedule({
    execute: rotationEffect, // Passing around Effect directly
    type: Events.EventType.APL_EVALUATE,
    // ...
  });
}
```

**Problems:**

- Rotation effect is passed around as a raw Effect
- No clear separation between "rotation logic" and "event scheduling"
- Hard to test and reason about
- Couples the CastQueue service tightly to rotation execution

## How innocent-services Did It Right

### 1. Event-Driven APL Evaluation

**Key principle:** APL_EVALUATE is only scheduled ONCE at simulation start, then each successful cast schedules the NEXT evaluation.

```typescript
// In SimulationService - ONCE at start
yield* scheduler.schedule({
  execute: rotation,
  type: Events.EventType.APL_EVALUATE,
  time: 0,
  priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
});

// In CastQueueService - after EACH successful cast
const gcdExpiry = triggersGcd ? startTime + gcd : startTime;
const aplEvaluateTime = Math.max(completeTime, gcdExpiry);

yield* scheduler.schedule({
  execute: rotationEffect,
  type: Events.EventType.APL_EVALUATE,
  time: aplEvaluateTime,  // When cast completes AND GCD expires
  priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
});
```

**Why this works:**

- Only ONE APL_EVALUATE exists in the queue at a time
- APL runs → tries spells → first successful cast interrupts → schedules next APL
- If all spells fail, no APL is scheduled (rotation stalls - which is correct!)
- Natural feedback loop: cast succeeds → schedule next evaluation

### 2. Event Priority System

```typescript
export const EVENT_PRIORITY = {
  APL_EVALUATE: 10,           // Lowest - runs last at same timestamp
  SPELL_CAST_START: 30,
  SPELL_CHARGE_READY: 40,
  PERIODIC_SPELL: 59,
  PERIODIC_POWER: 60,
  AURA_EXPIRE: 80,
  PROJECTILE_IMPACT: 90,
  SPELL_CAST_COMPLETE: 100,   // Highest - runs first at same timestamp
} as const;
```

**Key insight:** At the same timestamp:

1. SPELL_CAST_COMPLETE (100) executes first - sets spell cooldown
2. Then APL_EVALUATE (10) runs - sees updated spell state

This ensures the rotation always sees the correct spell/cooldown state.

### 3. Cooldown Management via Spell Modifiers

**Base spell cooldown** is set during SPELL_CAST_COMPLETE via modifiers:

```typescript
// Implicit behavior in spell modifiers (not shown in code but should be there)
onCast: (spell) => Effect.gen(function*() {
  const runtime = yield* SpellbookRuntime;
  const state = yield* runtime.state.getState();
  const player = yield* runtime.units.get(playerId);

  // Set spell cooldown
  const cooldownExpiry = state.currentTime + spell.info.recoveryTime;
  const updatedSpell = spell.with({ cooldownExpiry }, state.currentTime);
  yield* runtime.spells.update(player.id, updatedSpell);

  // Schedule SPELL_COOLDOWN_READY event (if needed)
  if (spell.info.recoveryTime > 0) {
    yield* runtime.scheduler.schedule({
      type: Events.EventType.SPELL_COOLDOWN_READY,
      time: cooldownExpiry,
      payload: { spell: updatedSpell },
      execute: Effect.void, // Could trigger APL if rotation is waiting
    });
  }
})
```

### 4. Spell Transform Pattern

The `transform` API provides a clean way to modify spell state:

```typescript
// Decrement charges
spell.transform.charges.decrement({ amount: 1, time: currentTime })

// Set cooldown
spell.transform.cooldown.set({ time: currentTime + spell.info.recoveryTime })

// Clear cooldown
spell.transform.cooldown.reset({ time: currentTime })
```

**Benefits:**

- Immutable updates
- Automatic recomputation of `isReady` flag
- Type-safe bounded values (charges can't go negative)

## Design Principles for Event-Driven Simulation

### Principle 1: Events Drive Everything

**The simulation should be purely event-driven, not time-based.**

❌ **Bad (time-based):**

```typescript
// Polling loop
while (currentTime < maxDuration) {
  if (shouldRunRotation(currentTime)) {
    yield* runRotation();
  }
  currentTime += 100; // Advance by fixed increment
}
```

✅ **Good (event-driven):**

```typescript
// Event loop
while (true) {
  const nextEvent = yield* scheduler.dequeue();
  if (!nextEvent || nextEvent.time > maxDuration) break;

  yield* state.updateState(s => s.set("currentTime", nextEvent.time));
  yield* nextEvent.execute; // Events schedule other events
}
```

**Key:** Time only advances when processing events. If no events are scheduled, simulation naturally stops.

### Principle 2: Single Source of Truth for APL Scheduling

**Only one component should schedule APL_EVALUATE events: the CastQueueService.**

- SimulationService schedules ONE initial APL_EVALUATE
- CastQueueService schedules EVERY subsequent APL_EVALUATE
- No other service schedules APL_EVALUATE

### Principle 3: Event Feedback Loops

**Events should naturally schedule follow-up events:**

```
APL_EVALUATE
  → tries spells
  → first success: SPELL_CAST_START
    → (cast time passes)
    → SPELL_CAST_COMPLETE
      → spell modifiers execute
      → cooldown set
      → APL_EVALUATE scheduled for (completeTime + GCD)

If APL_EVALUATE finds no castable spells:
  → no events scheduled
  → simulation naturally pauses
  → wakes up when:
    - SPELL_COOLDOWN_READY
    - SPELL_CHARGE_READY
    - AURA_EXPIRE
    - PERIODIC_POWER (resource regen)
    - etc.
```

### Principle 4: Priority Ensures Correctness

Events at the **same timestamp** must execute in **priority order**:

```
Time 1500ms:
  [100] SPELL_CAST_COMPLETE - sets spell CD
  [ 80] AURA_EXPIRE - removes buff
  [ 10] APL_EVALUATE - sees updated state
```

This prevents race conditions where APL sees stale state.

### Principle 5: Immutable State Updates

**All state changes must be immutable and pass through the state service.**

❌ **Bad (mutation):**

```typescript
player.health.current -= damage;
```

✅ **Good (immutable):**

```typescript
const updatedPlayer = player.with({
  health: player.health.transform.damage({ amount: damage, time: currentTime })
}, currentTime);
yield* unitService.update(updatedPlayer);
```

## Architectural Improvements Needed

### 1. Spell Cooldown Modifier

Create a **base modifier** that ALL spells use to set cooldowns:

```typescript
// packages/wowlab-spellbook/src/internal/modifiers/base/CooldownModifier.ts

export const CooldownModifier = (
  spell: Entities.Spell.Spell
): SpellModifier => ({
  name: "Base Cooldown",
  onCast: Effect.gen(function*(spell, runtime) {
    // Only set cooldown if spell has one
    if (spell.info.recoveryTime <= 0) return;

    const state = yield* runtime.state.getState();
    const player = yield* runtime.units.get(playerId); // Need context

    // Set spell cooldown
    const cooldownExpiry = state.currentTime + spell.info.recoveryTime;
    const updatedSpell = spell.transform.cooldown.set({
      time: cooldownExpiry
    });

    yield* runtime.spells.update(player.id, updatedSpell);

    // Schedule SPELL_COOLDOWN_READY event
    yield* runtime.scheduler.schedule({
      type: Events.EventType.SPELL_COOLDOWN_READY,
      time: cooldownExpiry,
      payload: { spell: updatedSpell },
      priority: Events.EVENT_PRIORITY[Events.EventType.SPELL_COOLDOWN_READY],
      execute: Effect.void,
    });
  })
});
```

**Every spell's modifiers array** should include this:

```typescript
const bestialWrath = SpellInfo.create({
  id: 186254,
  name: "Bestial Wrath",
  recoveryTime: 90000, // 90 seconds
  modifiers: [
    CooldownModifier, // <-- Base modifier
    ...customModifiers,
  ]
});
```

### 2. Refactor CastQueueService APL Scheduling

**Current (wowlab-services):**

```typescript
// Schedules APL every cast - WRONG
yield* scheduler.schedule({
  execute: Effect.asVoid(rotationEffect),
  time: aplEvaluateTime,
  type: Events.EventType.APL_EVALUATE,
});
```

**Should be (innocent-services pattern):**

```typescript
// Only schedule if rotation exists AND cast succeeded
const rotationEffect = yield* rotationRef.get;
if (rotationEffect !== null) {
  const gcdExpiry = triggersGcd ? startTime + gcd : startTime;
  const aplEvaluateTime = Math.max(completeTime, gcdExpiry);

  yield* scheduler.schedule({
    execute: rotationEffect,
    id: `apl_evaluate_${spell.info.id}_${startTime}`,
    time: aplEvaluateTime,
    type: Events.EventType.APL_EVALUATE,
    priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
    payload: {},
  });
}

// Interrupt - this prevents duplicate APL scheduling
return yield* Effect.interrupt;
```

### 3. Remove Periodic APL Fallback

If the old implementation had a "periodic APL fallback" in SimulationService:

❌ **Remove this:**

```typescript
// DON'T DO THIS - it fights with event-driven scheduling
yield* scheduler.schedule({
  execute: rotation,
  type: Events.EventType.APL_EVALUATE,
  time: currentTime + 1000, // Every second fallback - WRONG
});
```

The rotation should ONLY be scheduled by:

1. **Once** at simulation start (SimulationService)
2. **After each successful cast** (CastQueueService)
3. **When spells become available** (via SPELL_COOLDOWN_READY, etc.)

### 4. Improve Rotation Context

**Current pattern:**

```typescript
const rotationRef = yield* RotationRefService; // Service that holds Effect
const rotation = yield* rotationRef.get;       // Get raw Effect
```

**Better pattern:**

```typescript
// Define rotation as a reusable context
interface RotationContext {
  readonly evaluate: Effect.Effect<void>; // The APL evaluation logic
  readonly playerId: UnitID;              // Who is casting
}

// In rotation definition
const beastMasteryRotation = (playerId: UnitID) =>
  Effect.gen(function*() {
    const rotation = yield* RotationContext;
    // ... priority-based spell casts
  });

// Set it once
yield* RotationContext.provide({
  evaluate: beastMasteryRotation(playerId),
  playerId,
});

// Access it anywhere
const { evaluate } = yield* RotationContext;
yield* scheduler.schedule({
  execute: evaluate,
  type: Events.EventType.APL_EVALUATE,
});
```

## Implementation Checklist

### Phase 1: Fix APL Scheduling (HIGH PRIORITY)

- [ ] Remove redundant APL_EVALUATE scheduling in SimulationService (keep only initial)
- [ ] Verify CastQueueService schedules NEXT APL after successful cast
- [ ] Ensure `Effect.interrupt` happens after scheduling next APL
- [ ] Test: Only ONE APL_EVALUATE should be in queue at any time

### Phase 2: Implement Spell Cooldowns

- [ ] Create `CooldownModifier` base modifier
- [ ] Add `SPELL_COOLDOWN_READY` event type (if not exists)
- [ ] Update spell validation to check `spell.isReady` (should already exist)
- [ ] Test: Bestial Wrath should not be castable until 90s cooldown expires

### Phase 3: Implement Charge System

- [ ] Create `ChargeModifier` for spells with charges
- [ ] Add `SPELL_CHARGE_READY` event type (if not exists)
- [ ] Schedule charge recovery events when charge is consumed
- [ ] Test: Barbed Shot (2 charges) should work correctly

### Phase 4: Clean Up Event Priorities

- [ ] Document all event priorities in `Events.ts`
- [ ] Ensure SPELL_CAST_COMPLETE > APL_EVALUATE
- [ ] Verify compareEvents sorts by (time, priority, id)
- [ ] Test: Events at same time execute in correct order

### Phase 5: Improve Rotation Pattern

- [ ] Replace `RotationRefService` with proper `RotationContext`
- [ ] Move rotation evaluation into context
- [ ] Decouple CastQueue from rotation execution details
- [ ] Test: Rotation can be swapped without changing services

## Testing Strategy

### Unit Tests

```typescript
describe("Event-Driven APL", () => {
  it("should schedule only ONE initial APL_EVALUATE", () => {
    // Verify queue has exactly 1 APL event after sim.run() starts
  });

  it("should schedule next APL after successful cast", () => {
    // Mock a cast success, verify next APL is scheduled
  });

  it("should NOT schedule APL if no rotation is set", () => {
    // Verify simulation without rotation doesn't create APL events
  });
});

describe("Spell Cooldowns", () => {
  it("should set cooldown after spell cast completes", () => {
    // Cast spell, verify spell.cooldownExpiry is set correctly
  });

  it("should schedule SPELL_COOLDOWN_READY event", () => {
    // Verify event is in queue at correct time
  });
});
```

### Integration Tests

```typescript
describe("Beast Mastery Rotation", () => {
  it("should cast Bestial Wrath on cooldown", () => {
    // Run 3 minutes, verify BW casts at 0s, 90s, 180s
  });

  it("should maintain Barbed Shot stacks", () => {
    // Verify Barbed Shot casts before Frenzy expires
  });
});
```

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Scheduling APL from multiple places

**Problem:** If both SimulationService and CastQueueService schedule APL independently, you get multiple concurrent evaluations.

**Solution:** Only CastQueueService schedules APL (after initial one).

### ❌ Pitfall 2: Not using Math.max for APL time

**Problem:**

```typescript
const aplTime = completeTime; // Only considers cast time
```

**Why it's wrong:** Instant off-GCD spells (completeTime = 0) would schedule APL at 0ms, before GCD expires.

**Solution:**

```typescript
const aplTime = Math.max(completeTime, gcdExpiry); // Waits for BOTH
```

### ❌ Pitfall 3: Forgetting Effect.interrupt

**Problem:** If rotation continues after scheduling a cast, it might try to cast multiple spells.

**Solution:** Always `return yield* Effect.interrupt` after successful cast.

### ❌ Pitfall 4: Not setting spell cooldowns

**Problem:** Spell validation checks `spell.isReady`, but cooldown is never set, so spell is always ready.

**Solution:** Set `spell.cooldownExpiry` in SPELL_CAST_COMPLETE modifier.

## Future Enhancements

### 1. Proactive APL Wake-up

When a spell becomes available, **automatically trigger APL evaluation:**

```typescript
// In SPELL_COOLDOWN_READY event handler
yield* scheduler.schedule({
  execute: rotationEffect,
  type: Events.EventType.APL_EVALUATE,
  time: currentTime,
  priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
});
```

This "wakes up" stalled rotations when resources become available.

### 2. Aura-Triggered APL

Some rotations need to react to aura expiration:

```typescript
// When important aura expires, re-evaluate rotation
if (aura.name === "Frenzy") {
  yield* scheduler.schedule({
    execute: rotationEffect,
    type: Events.EventType.APL_EVALUATE,
    time: currentTime,
  });
}
```

### 3. Snapshot Events

For debugging and analysis:

```typescript
yield* scheduler.schedule({
  execute: Effect.gen(function*() {
    const state = yield* StateService.getState();
    yield* PubSub.publish(snapshotPubSub, state);
  }),
  type: Events.EventType.SNAPSHOT,
  time: currentTime,
});
```

Schedule snapshots at regular intervals (e.g., every 1000ms) for timeline visualization.

## Conclusion

The key to a maintainable event-driven simulation is:

1. **Minimal APL scheduling** - Only when needed, never redundant
2. **Clear event priorities** - Ensures state is consistent
3. **Immutable updates** - State changes are predictable
4. **Self-scheduling events** - Events create other events naturally

By following the innocent-services pattern and the principles outlined here, the wowlab simulation will be:

- **Correct** - APL evaluates at the right time with correct state
- **Maintainable** - Easy to add new spells, auras, procs
- **Performant** - Only processes events that matter
- **Debuggable** - Event timeline shows exactly what happened

---

*Document created: 2025-01-23*
*Last updated: 2025-01-23*
