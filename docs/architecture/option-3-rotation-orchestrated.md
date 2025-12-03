# Option 3: Rotation-Orchestrated Scheduler

## Overview

The Rotation logic is the orchestrator. It decides what to cast, computes when the next decision point will be, advances time to that point, then drains all events up to that time. This gives rotation full control over the simulation timeline.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ROTATION-ORCHESTRATED SCHEDULER                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Rotation Scheduler                                  │
│                                                                             │
│  1. Decide next spell                                                       │
│  2. Call SpellActions.cast() ──────────────────────▶ emits CLEU events     │
│  3. Compute nextDecisionTime = now + max(GCD, castTime)                     │
│  4. Advance time: currentTime = nextDecisionTime    ◀─── OWNS TIME         │
│  5. Drain events: simDriver.run(currentTime)                                │
│  6. Loop back to step 1                                                     │
│                                                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    │ step 2: cast
                                    ▼
                             ┌──────────────┐
                             │ SpellActions │
                             └──────┬───────┘
                                    │
                                    │ emit events at currentTime
                                    ▼
                             ┌──────────────┐
                             │  EventQueue  │
                             └──────┬───────┘
                                    │
                                    │ step 5: drain
                                    ▼
                             ┌──────────────┐
                             │  SimDriver   │ (just processes, doesn't own time)
                             └──────┬───────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │ HandlerRegistry │
                            └────────┬────────┘
                                     │
                                     ▼
                             ┌──────────────┐
                             │ StateService │
                             └──────────────┘
```

## Event Flow Example

```
Rotation Step 1 @ t=0.000:
  └─▶ Decide: Cast Bestial Wrath (off-GCD)
  └─▶ SpellActions.cast(BESTIAL_WRATH)
      └─▶ Emits SPELL_CAST_SUCCESS@0.000
      └─▶ Emits SPELL_AURA_APPLIED@0.000 (buff)
  └─▶ Compute: nextDecisionTime = 0.000 (off-GCD, can cast again immediately)
  └─▶ Drain: simDriver.run(0.000)
      └─▶ Processes SPELL_CAST_SUCCESS, SPELL_AURA_APPLIED

Rotation Step 2 @ t=0.000:
  └─▶ Decide: Cast Kill Command (has GCD)
  └─▶ SpellActions.cast(KILL_COMMAND)
      └─▶ Emits SPELL_CAST_SUCCESS@0.000
      └─▶ Emits SPELL_DAMAGE@0.000
  └─▶ Compute: nextDecisionTime = 0.000 + 1.5 = 1.500
  └─▶ Advance: currentTime = 1.500
  └─▶ Drain: simDriver.run(1.500)
      └─▶ Processes SPELL_CAST_SUCCESS, SPELL_DAMAGE
      └─▶ Processes any buff expirations <= 1.500

Rotation Step 3 @ t=1.500:
  └─▶ Decide: Cast Barbed Shot (has GCD)
  └─▶ SpellActions.cast(BARBED_SHOT)
      └─▶ Emits SPELL_CAST_SUCCESS@1.500
      └─▶ Emits SPELL_AURA_APPLIED@1.500 (Frenzy)
  └─▶ Compute: nextDecisionTime = 1.500 + 1.5 = 3.000
  └─▶ Advance: currentTime = 3.000
  └─▶ Drain: simDriver.run(3.000)

... and so on
```

## Component Responsibilities

### Rotation Scheduler (Main Loop)

```typescript
const runRotation = (duration: number) =>
  Effect.gen(function* () {
    const spellActions = yield* SpellActions;
    const stateService = yield* StateService;
    const simDriver = yield* SimDriver;
    const rotation = yield* RotationLogic;

    while (true) {
      const state = yield* stateService.getState();
      if (state.currentTime >= duration) break;

      // 1. Decide what to cast
      const decision = yield* rotation.decide(state);

      if (decision.type === "cast") {
        // 2. Cast the spell (emits events at currentTime)
        yield* spellActions.cast(state.playerId, decision.spellId);

        // 3. Compute next decision time
        const spell = yield* getSpellInfo(decision.spellId);
        const gcd = spell.triggersGcd ? spell.gcd : 0;
        const castTime = spell.castTime;
        const delay = Math.max(gcd, castTime);
        const nextTime = state.currentTime + delay;

        // 4. Advance time
        yield* stateService.updateState((s) => s.set("currentTime", nextTime));

        // 5. Drain events up to new time
        yield* simDriver.run(nextTime);
      } else if (decision.type === "wait") {
        // Wait for a specific time (e.g., cooldown)
        const nextTime = decision.until;
        yield* stateService.updateState((s) => s.set("currentTime", nextTime));
        yield* simDriver.run(nextTime);
      }
    }
  });
```

### SpellActions (Passive Event Emitter)

```typescript
// SpellActions does NOT advance time - just emits events
const cast = (unitId: UnitID, spellId: number) =>
  Effect.gen(function* () {
    const state = yield* stateService.getState();
    const now = state.currentTime;
    const spell = yield* getSpellInfo(spellId);
    const unit = yield* getUnit(unitId);

    // Emit cast success at current time
    yield* combatLog.emit(
      new SpellCastSuccess({
        timestamp: now,
        sourceGUID: unitId,
        sourceName: unit.name,
        spellId,
        spellName: spell.name,
        spellSchool: spell.school,
      }),
    );

    // Emit associated effects
    if (spell.appliesBuff) {
      yield* combatLog.emit(
        new SpellAuraApplied({
          timestamp: now,
          destGUID: unitId,
          spellId: spell.buffId,
          auraType: "BUFF",
        }),
      );

      // Schedule buff removal
      yield* combatLog.emit(
        new SpellAuraRemoved({
          timestamp: now + spell.buffDuration,
          destGUID: unitId,
          spellId: spell.buffId,
          auraType: "BUFF",
        }),
      );
    }

    if (spell.damage > 0) {
      yield* combatLog.emit(
        new SpellDamage({
          timestamp: now,
          sourceGUID: unitId,
          destGUID: state.targetId,
          spellId,
          amount: spell.damage,
        }),
      );
    }

    // Update cooldown (not time!)
    yield* updateSpellCooldown(unitId, spellId, now + spell.cooldown);
  });
```

### SimDriver (Passive Event Processor)

```typescript
// SimDriver just processes events - doesn't control time
const run = (upToTime: number) =>
  Effect.gen(function* () {
    while (true) {
      const maybeEvent = yield* queue.poll;
      if (Option.isNone(maybeEvent)) break;

      const event = maybeEvent.value;
      if (event.timestamp > upToTime) {
        yield* queue.offer(event); // put back
        break;
      }

      // Process (but don't set time - rotation already did)
      const handlers = yield* registry.getHandlers(event);
      for (const h of handlers) {
        yield* h.handler(event);
      }
    }
  });
```

### Rotation Logic (Decision Only)

```typescript
interface RotationDecision {
  type: "cast" | "wait";
  spellId?: number;
  until?: number;
}

const decide = (state: GameState): Effect.Effect<RotationDecision> =>
  Effect.gen(function* () {
    const player = state.units.get(state.playerId);

    // Priority list
    if (
      canCast(player, BESTIAL_WRATH) &&
      !hasBuff(player, BESTIAL_WRATH_BUFF)
    ) {
      return { type: "cast", spellId: BESTIAL_WRATH };
    }

    if (canCast(player, KILL_COMMAND)) {
      return { type: "cast", spellId: KILL_COMMAND };
    }

    if (canCast(player, COBRA_SHOT)) {
      return { type: "cast", spellId: COBRA_SHOT };
    }

    // Nothing to cast - wait for next cooldown
    const nextCooldown = findNextCooldownExpiry(player);
    return { type: "wait", until: nextCooldown };
  });
```

## GCD Handling

GCD is computed locally by the rotation scheduler, not tracked via events:

```typescript
// In rotation scheduler
const gcd = spell.triggersGcd ? spell.gcd : 0;
const delay = Math.max(gcd, castTime);
const nextTime = currentTime + delay;

// Time jumps forward by the GCD
yield * stateService.updateState((s) => s.set("currentTime", nextTime));
```

No GCD aura events needed - the time skip IS the GCD.

## Platform Behavior

### Simulation Mode

```typescript
// Rotation drives everything
const runSimulation = (duration: number) =>
  Effect.gen(function* () {
    yield* runRotation(duration);
  });
```

### Bot Mode

```typescript
// Tricky - rotation predicts, but WoW is truth
const runBot = () =>
  Effect.gen(function* () {
    // Process incoming WoW events
    onWowEvent((event) => {
      combatLog.emit(event);
      simDriver.run(event.timestamp);
    });

    // Rotation runs in parallel, sending keybinds
    // But must reconcile predictions with actual WoW state
    yield* runRotationWithReconciliation();
  });
```

### Browser Mode

```typescript
// Same as simulation
const runBrowser = (duration: number) =>
  Effect.gen(function* () {
    yield* runRotation(duration);
  });
```

## Pros

1. **Full control** - Rotation decides exactly when things happen
2. **Easy lookahead** - Can compute future states before committing
3. **Good for bot planning** - Can pre-calculate sequences
4. **Simple GCD** - Just a time skip, no extra events
5. **Clear flow** - Main loop is obvious

## Cons

1. **Time skipping** - Might miss events between decision points
2. **Desync risk** - In bot mode, predictions may not match WoW
3. **Not purely event-driven** - Rotation drives time, not events
4. **Tight coupling** - Rotation must understand spell mechanics
5. **Two time writers** - Both rotation and drain can affect state

## When to Use

- Bot automation where you need to pre-plan actions
- Simulations where rotation logic needs full control
- When you want explicit time advancement
- Prototyping rotation logic before committing to event-driven
