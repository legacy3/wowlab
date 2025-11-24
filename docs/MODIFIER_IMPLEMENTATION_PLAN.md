# Modifier Implementation Plan

## Current State

```
✅ Event scheduler infrastructure
✅ Spell lifecycle service
✅ Modifier type definitions
⚠️  CastQueueService (broken - needs fixes)
❌ Resource consumption
❌ Damage system
❌ Spell modifiers attached
```

---

## PHASE 1: Fix Computed Entity Access

**Files:**

- `packages/wowlab-services/src/internal/accessors/SpellAccessor.ts`
- `packages/wowlab-services/src/internal/castQueue/CastQueueService.ts`

### 1.1 Fix SpellAccessor.get() to Recompute (Line 24-30)

**Current:**

```typescript
const spell = unit.spells.all.get(spellId as Schemas.Branded.SpellID);
return spell ? Effect.succeed(spell) : Effect.fail(...);
```

**Problem:** Returns spell with stale computed values (isReady not updated as time advances)

**Fix:** Recompute spell with current time before returning:

```typescript
const spell = unit.spells.all.get(spellId as Schemas.Branded.SpellID);
if (!spell) return Effect.fail(...);
return Effect.succeed(spell.with({}, gameState.currentTime));
```

---

### 1.2 Fix CastQueueService Spell Access (Line 151)

**Current:**

```typescript
const currentSpell = player.spells.all.get(spell.info.id) ?? spell;
```

**Problem:** Gets spell without recomputing - stale isReady value

**Fix:** Recompute with current time:

```typescript
const rawSpell = player.spells.all.get(spell.info.id) ?? spell;
const currentSpell = rawSpell.with({}, currentState.currentTime);
```

**Note:** With computed entities, cooldowns work automatically - no need to manually update `isReady` in event handlers!

---

### 1.3 Clear isCasting Flag (Line 212-231)

**Current:** SPELL_CAST_COMPLETE event executes `lifecycle.executeOnCast()` only

**Problem:** Never clears `isCasting=false` - units stuck casting forever

**Fix:** Add state update to clear `isCasting` flag after modifiers run

---

### 1.4 Fix SPELL_CHARGE_READY Event (Line 249-262)

**Current:**

```typescript
yield* scheduler.scheduleInput({
  at: chargeReadyTime,
  spell: modifiedSpell,
  type: Events.EventType.SPELL_CHARGE_READY,
});
```

**Problem:** Event has `execute: Effect.void` - doesn't increment charges

**Fix:** Add execute function that increments charges:

```typescript
yield* scheduler.schedule({
  type: Events.EventType.SPELL_CHARGE_READY,
  time: chargeReadyTime,
  execute: Effect.gen(function* () {
    const state = yield* StateService;
    const currentState = yield* state.getState();
    const player = currentState.units.find(u => u.isPlayer);
    const spell = player.spells.all.get(modifiedSpell.info.id);

    const updatedSpell = spell.transform.charges.increment({
      amount: 1,
      time: currentState.currentTime
    });

    // Update player with new spell
    yield* state.updateState(s => s.set("units",
      s.units.set(player.id, player.set("spells", {
        all: player.spells.all.set(spell.info.id, updatedSpell),
        meta: player.spells.meta
      }))
    ));
  }),
  // ... rest of event
});
```

---

## PHASE 2: Add Resource Consumption

### 2.1 Create UnitService.consumePower() Method

**File:** `packages/wowlab-services/src/internal/unit/UnitService.ts`

**Add method:**

```typescript
consumePower: (unitId: UnitID, powerType: PowerType, amount: number) => Effect<void>
```

**Logic:**

- Get unit from state
- Get current power for powerType from `unit.power.get(powerType)`
- Subtract amount from `power.current`
- Update unit with new power value
- Update state

---

### 2.2 Create ConsumeSpellResource Modifier

**File:** `packages/wowlab-services/src/internal/modifiers/shared/ConsumeSpellResource.ts`

**Export:**

```typescript
export const ConsumeSpellResource: SpellModifier = {
  name: "consume-spell-resource",
  onCast: (spell) => Effect.gen(function* () {
    if (spell.info.manaCost === 0) return;

    const unitService = yield* UnitService;
    yield* unitService.consumePower(playerId, MANA, spell.info.manaCost);
  })
}
```

---

## PHASE 3: Add Damage System

### 3.1 Create CombatService.calculateBaseDamage()

**File:** `packages/wowlab-services/src/internal/combat/CombatService.ts` (new)

**Method:**

```typescript
calculateBaseDamage: (spell: Spell, caster: Unit) => number
```

**Logic:**

- Extract base damage from spell effects
- Apply AP/SP coefficients from spell data
- Apply caster stats from paperDoll
- Return final damage number

**Source:** Port logic from `packages/innocent-services/src/internal/combat/`

---

### 3.2 Create LaunchSpellProjectile Modifier

**File:** `packages/wowlab-services/src/internal/modifiers/shared/LaunchSpellProjectile.ts`

**Export:**

```typescript
export const LaunchSpellProjectile: SpellModifier = {
  name: "launch-spell-projectile",
  onCast: (spell) => Effect.gen(function* () {
    const combat = yield* CombatService;
    const scheduler = yield* EventSchedulerService;
    const state = yield* StateService;
    const lifecycle = yield* SpellLifecycleService;

    const currentState = yield* state.getState();
    const player = currentState.units.find(u => u.isPlayer);

    const damage = combat.calculateBaseDamage(spell, player);
    const travelTime = 1000; // TODO: Calculate from spell.info.speed

    yield* scheduler.schedule({
      type: Events.EventType.PROJECTILE_IMPACT,
      time: currentState.currentTime + travelTime,
      execute: Effect.gen(function* () {
        yield* lifecycle.executeOnDamage(spell, damage);
      }),
      payload: { spell, damage },
      // ... rest of event
    });
  })
}
```

---

### 3.3 Add PROJECTILE_IMPACT Handler to SimulationService

**File:** `packages/wowlab-services/src/internal/simulation/SimulationService.ts`

**Location:** Line 98-102

**Current:**

```typescript
if (
  nextEvent.type === Events.EventType.SPELL_COOLDOWN_READY ||
  nextEvent.type === Events.EventType.SPELL_CHARGE_READY
) {
  yield* scheduler.scheduleAPL(nextEvent.time);
}
```

**Add:**

```typescript
if (
  nextEvent.type === Events.EventType.SPELL_COOLDOWN_READY ||
  nextEvent.type === Events.EventType.SPELL_CHARGE_READY ||
  nextEvent.type === Events.EventType.PROJECTILE_IMPACT
) {
  yield* scheduler.scheduleAPL(nextEvent.time);
}
```

---

## PHASE 4: Attach Modifiers to Spells

**File:** `apps/standalone/src/rotations/beast-mastery.ts`

**Current:** All spells have `modifiers: []`

**Change:**

```typescript
import { ConsumeSpellResource, LaunchSpellProjectile } from "@wowlab/services/modifiers/shared"

const CobraShot = Spell.create({
  info: spellInfo,
  modifiers: [
    ConsumeSpellResource,
    LaunchSpellProjectile,
  ]
})
```

**Apply to all 4 spells:** Cobra Shot, Kill Command, Kill Shot, Barbed Shot

---

## File Structure

```
packages/wowlab-services/src/internal/
├── castQueue/
│   └── CastQueueService.ts          # FIX Phase 1
├── combat/
│   ├── index.ts                     # NEW Phase 3.1
│   └── CombatService.ts             # NEW Phase 3.1
├── modifiers/
│   └── shared/
│       ├── index.ts                 # UPDATE Phase 2 & 3
│       ├── ConsumeSpellResource.ts  # NEW Phase 2.2
│       └── LaunchSpellProjectile.ts # NEW Phase 3.2
├── simulation/
│   └── SimulationService.ts         # FIX Phase 3.3
└── unit/
    └── UnitService.ts               # FIX Phase 2.1 (if method missing)
```

---

## What NOT to Port

- ❌ `ModifierRuntime` abstraction layer (wowlab uses direct Effect services)
- ❌ `SpellModifierBuilder` factory pattern (not needed)
- ❌ TriggerSpellCooldown modifier (logic already in CastQueueService, just broken)
- ❌ ClearCastingState modifier (logic already in CastQueueService, just broken)
- ❌ Profile bundle/composer system (not using profiles yet)

---

## Critical Bugs Found in wowlab-*

1. **Computed entities not recomputed on access** - SpellAccessor returns stale spells with old `isReady` values
2. **CastQueueService accesses spells without recomputing** - Gets stale computed values
3. **isCasting stuck forever** - Flag set to true, never cleared back to false
4. **SPELL_CHARGE_READY doesn't increment charges** - Event fires but `execute: Effect.void` (no callback)
5. **PROJECTILE_IMPACT has no execute callback** - Event scheduled but damage never applied
6. **No resource consumption** - Infinite mana
7. **scheduleInput() vs schedule() inconsistency** - Mixed patterns across codebase (needs architectural decision)

---

## Testing After Each Phase

Run: `pnpm dev run beast-mastery` (in apps/standalone)

**After Phase 1:**

- Spells should recompute with current time when accessed (isReady updates automatically)
- Cooldowns should work via computed entity pattern
- Casting state should clear properly
- Charges should increment when charge ready event fires

**After Phase 2:**

- Mana should drain when casting

**After Phase 3:**

- Damage logs should appear
- SPELL_DAMAGE/PROJECTILE_IMPACT events scheduled

**After Phase 4:**

- Full rotation functional with all side effects

---

## Dependencies

**Phase 1:** None - just fix existing broken code

**Phase 2:** Phase 1 must be complete

**Phase 3:** Phases 1-2 should be complete

**Phase 4:** Phases 1-3 must be complete

---

## Source Files for Reference

### innocent-* (legacy, working implementation)

- `packages/innocent-services/src/internal/modifiers/shared/TriggerSpellCooldown.ts`
- `packages/innocent-services/src/internal/modifiers/shared/ConsumeSpellResource.ts`
- `packages/innocent-services/src/internal/modifiers/shared/LaunchSpellProjectile.ts`
- `packages/innocent-services/src/internal/modifiers/shared/ClearCastingState.ts`
- `packages/innocent-services/src/internal/combat/` (damage calculation)

### wowlab-* (new architecture, partially broken)

- `packages/wowlab-services/src/internal/castQueue/CastQueueService.ts` (broken)
- `packages/wowlab-services/src/internal/lifecycle/SpellLifecycleService.ts` (working)
- `packages/wowlab-services/src/internal/scheduler/EventSchedulerService.ts` (working)

---

## Notes

- All 4 shared modifiers from innocent-* had logic - 2 are already in CastQueueService (just broken), 2 need full port
- wowlab-* architecture is cleaner (no ModifierRuntime abstraction)
- **wowlab-* uses computed entity pattern** - `isReady` is computed from `cooldownExpiry <= currentTime`, not manually set
- SpellLifecycleService already correctly executes all 4 modifier hooks
- Infrastructure is 90% there, just needs bug fixes + 2 new modifiers
- **Key insight:** Spells must be recomputed with current time when accessed from state, otherwise computed values are stale

## Architectural Differences: Event Callbacks

### innocent-* Pattern

Events scheduled with custom `execute` callbacks that mutate state:

```typescript
yield* scheduler.schedule({
  execute: Effect.gen(function* () {
    // Custom logic to update state
    yield* spellAccessor.updateSpell(playerId, updatedSpell);
  }),
  // ...
});
```

### wowlab-* Pattern

Events created via `scheduleInput()` → `buildEvent()` have `execute: Effect.void`:

```typescript
// EventSchedulerService.ts lines 184-192
case Events.EventType.SPELL_COOLDOWN_READY:
  return { execute: Effect.void, ... };
```

### Why This Works (Mostly)

- **SPELL_COOLDOWN_READY:** Works with computed entities - `isReady` auto-updates when spell accessed with current time
- **SPELL_CHARGE_READY:** **BROKEN** - charges is source data, not computed, so never increments
- **PROJECTILE_IMPACT:** **BROKEN** - no execute callback to trigger damage
- **AURA_EXPIRE:** **BROKEN** - no execute callback to remove aura

### Issue Requires Further Analysis

**Inconsistent patterns in wowlab codebase:**

- SPELL_CAST_COMPLETE uses `scheduler.schedule()` with custom execute callback (line 214-231 in CastQueueService)
- SPELL_COOLDOWN_READY and SPELL_CHARGE_READY use `scheduleInput()` which creates events with `execute: Effect.void`

**Questions to resolve:**

1. Is `scheduleInput()` the new pattern and SPELL_CAST_COMPLETE should be migrated?
2. Should `scheduleInput()` only be used for data-only events (no side effects)?
3. Should we add optional `execute` parameter to `scheduleInput()`?
4. Should we delete `scheduleInput()` and use `schedule()` everywhere?

**For now:** Use `scheduler.schedule()` with execute callbacks for SPELL_CHARGE_READY and PROJECTILE_IMPACT to match SPELL_CAST_COMPLETE pattern
