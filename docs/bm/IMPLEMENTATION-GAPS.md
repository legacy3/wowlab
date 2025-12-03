# Beast Mastery Hunter Implementation Gap Analysis

Comprehensive analysis of what's documented in `@docs/bm/` vs what's implemented in `@packages/`.

---

## Foundation Status

### Implemented (Ready to Use)

| Component          | Location                                 | Notes                                          |
| ------------------ | ---------------------------------------- | ---------------------------------------------- |
| Unit entity        | `@wowlab/core/entities/Unit.ts`          | Auras, spells, power, position, paperDoll      |
| Spell entity       | `@wowlab/core/entities/Spell.ts`         | Charges, cooldowns, transforms                 |
| Aura entity        | `@wowlab/core/entities/Aura.ts`          | Stacks, expiry, transforms                     |
| GameState          | `@wowlab/core/entities/GameState.ts`     | Units, projectiles, time tracking              |
| Power system       | `@wowlab/core/entities/Power.ts`         | Current/max values                             |
| SpellInfo schema   | `@wowlab/core/entities/Spell.ts`         | 100+ fields from DBC                           |
| Effect-TS services | `@wowlab/services/`                      | Full service framework                         |
| Combat Log Schemas | `@wowlab/core/schemas/combat-log/`       | Full WoW CLEU event types                      |
| EventQueue         | `@wowlab/services/combat-log/EventQueue` | Effect.Queue for events                        |
| HandlerRegistry    | `@wowlab/services/combat-log/Handler*`   | Subscribe by subevent + spellId                |
| CombatLogService   | `@wowlab/services/combat-log/CombatLog*` | Unified emit + subscribe API                   |
| SimDriver          | `@wowlab/services/combat-log/SimDriver`  | Event loop: dequeue → handlers → emit → mutate |
| Emitter            | `@wowlab/services/combat-log/Emitter`    | emit(), emitAt(), emitBatch() for handlers     |
| StateService       | `@wowlab/services/state/StateService`    | GameState ref with get/set/update              |
| DBC schemas        | `@wowlab/core/schemas/dbc/`              | Spell*, Item* from game data                   |

### Event System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SimDriver.run(endTime)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Poll EventQueue                                                      │
│  2. Update StateService.currentTime                                      │
│  3. Create Emitter for this event                                        │
│  4. Get handlers from HandlerRegistry                                    │
│  5. Execute handlers (sorted by priority)                                │
│  6. Queue emitted events (sorted by timestamp)                           │
│  7. Apply generic state mutations                                        │
│  8. Repeat until queue empty or endTime reached                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Handler signature:**

```typescript
type EventHandler<E, R, Err> = (
  event: E,
  emitter: Emitter,
) => Effect.Effect<void, Err, R>;
```

**Register a handler:**

```typescript
yield *
  combatLog.onSpell("SPELL_CAST_SUCCESS", KILL_COMMAND, onKillCommandCast, {
    id: "bm:kill-command",
    priority: 10,
  });
```

---

## Not Implemented (Ordered by Priority)

### Phase 1: State Mutations in SimDriver

The SimDriver currently logs events but doesn't mutate GameState. We need:

| #    | Feature                | Notes                                              |
| ---- | ---------------------- | -------------------------------------------------- |
| 1.1  | **Aura application**   | SPELL_AURA_APPLIED → add aura to unit              |
| 1.2  | **Aura removal**       | SPELL_AURA_REMOVED → remove aura from unit         |
| 1.3  | **Aura stack changes** | SPELL_AURA_APPLIED_DOSE → update stacks            |
| 1.4  | **Aura refresh**       | SPELL_AURA_REFRESH → reset duration                |
| 1.5  | **Power changes**      | SPELL_ENERGIZE → add power, spell costs → subtract |
| 1.6  | **Health changes**     | SPELL_DAMAGE/HEAL → update health                  |
| 1.7  | **Unit summoning**     | SPELL_SUMMON → add unit to GameState               |
| 1.8  | **Unit death**         | UNIT_DIED → mark unit dead or remove               |
| 1.9  | **Cooldown tracking**  | SPELL_CAST_SUCCESS → start cooldown                |
| 1.10 | **Cast state**         | SPELL_CAST_START/SUCCESS → update isCasting        |

### Phase 2: Pet System

| #   | Feature                    | Notes                                     |
| --- | -------------------------- | ----------------------------------------- |
| 2.1 | **Pet as Unit entity**     | Reuse Unit type, add isPet/petType fields |
| 2.2 | **PetManager service**     | Lifecycle: summon, despawn, target sync   |
| 2.3 | **Pet scaling**            | AP=0.6x, Stamina=0.7x from hunter         |
| 2.4 | **Main Pet + Animal Comp** | Two permanent pets (AC auto-attacks only) |
| 2.5 | **Temporary pet pool**     | Dire Beast, CotW pets, Pack Leader beasts |
| 2.6 | **SPELL_SUMMON handler**   | Create pet unit on summon event           |

### Phase 3: Continuous Systems (Scheduled Events)

| #   | Feature                     | Notes                                         |
| --- | --------------------------- | --------------------------------------------- |
| 3.1 | **Auto-attack scheduler**   | Schedule SWING_DAMAGE/RANGE_DAMAGE events     |
| 3.2 | **Pet auto-attacks**        | Claw/Bite/Smack + swing timer                 |
| 3.3 | **DoT tick scheduler**      | Schedule SPELL_PERIODIC_DAMAGE events         |
| 3.4 | **Barbed Shot DoT**         | 8s bleed, ticks reduce KC CD (Master Handler) |
| 3.5 | **Bloodshed DoT**           | Pet applies bleed                             |
| 3.6 | **Haste affects tick rate** | Dynamic tick scheduling based on haste        |
| 3.7 | **Focus regen scheduler**   | Schedule SPELL_PERIODIC_ENERGIZE for focus    |

### Phase 4: Damage Pipeline

| #   | Feature                       | Notes                                 |
| --- | ----------------------------- | ------------------------------------- |
| 4.1 | **AP scaling framework**      | Coefficient x AP x modifiers          |
| 4.2 | **Mastery: Master of Beasts** | Pet damage multiplier                 |
| 4.3 | **Crit damage calculation**   | Base 2x, Piercing Fangs modifier      |
| 4.4 | **Versatility modifier**      | Damage and damage reduction           |
| 4.5 | **Target armor tables**       | Physical damage mitigation            |
| 4.6 | **AoE damage reduction**      | Beyond target cap                     |
| 4.7 | **Stat propagation**          | Haste→GCD/swing/tick, Crit/Vers hooks |

### Phase 5: Core BM Spell Handlers

Each spell becomes an event handler registered with `combatLog.onSpell()`:

| #   | Spell                     | Trigger Event      | Handler Emits                         |
| --- | ------------------------- | ------------------ | ------------------------------------- |
| 5.1 | **Kill Command** (34026)  | SPELL_CAST_SUCCESS | Pet KC cast → SPELL_DAMAGE            |
| 5.2 | **Barbed Shot** (217200)  | SPELL_CAST_SUCCESS | DoT events, Frenzy aura, Focus buff   |
| 5.3 | **Cobra Shot** (193455)   | SPELL_CAST_SUCCESS | SPELL_DAMAGE, KC CD reduction         |
| 5.4 | **Multi-Shot** (2643)     | SPELL_CAST_SUCCESS | AoE SPELL_DAMAGE, Beast Cleave aura   |
| 5.5 | **Bestial Wrath** (19574) | SPELL_CAST_SUCCESS | Hunter + Pet BW auras, Scent of Blood |
| 5.6 | **Call of the Wild**      | SPELL_CAST_SUCCESS | SPELL_SUMMON for each pet             |
| 5.7 | **Bloodshed** (321530)    | SPELL_CAST_SUCCESS | Pet attack + DoT                      |
| 5.8 | **Kill Shot** (53351)     | SPELL_CAST_SUCCESS | Execute damage                        |

### Phase 6: Buff/Debuff Handlers

Handlers that respond to aura events:

| #   | Buff                        | Trigger Event      | Effect                     |
| --- | --------------------------- | ------------------ | -------------------------- |
| 6.1 | **Frenzy** (272790)         | SPELL_AURA_APPLIED | +attack speed per stack    |
| 6.2 | **Bestial Wrath** (19574)   | SPELL_AURA_APPLIED | +25% damage                |
| 6.3 | **Beast Cleave** (268877)   | SPELL_AURA_APPLIED | Enable cleave mode         |
| 6.4 | **Thrill of the Hunt**      | SPELL_AURA_APPLIED | +crit from Barbed Shot     |
| 6.5 | **Piercing Fangs** (392054) | SPELL_AURA_APPLIED | +pet crit damage during BW |

### Phase 7: Proc Handlers

Handlers that roll RNG and emit proc events:

| #   | Proc               | Trigger Event       | Condition                        | Effect                      |
| --- | ------------------ | ------------------- | -------------------------------- | --------------------------- |
| 7.1 | **Wild Call**      | SWING_DAMAGE (crit) | Pet auto-attack crits            | Reset Barbed Shot charge    |
| 7.2 | **Killer Cobra**   | SPELL_CAST_SUCCESS  | Cobra Shot during BW             | Reset KC cooldown (100%)    |
| 7.3 | **Scent of Blood** | SPELL_AURA_APPLIED  | BW applied                       | Full Barbed Shot charges    |
| 7.4 | **Dire Command**   | SPELL_CAST_SUCCESS  | Kill Command cast                | Chance to summon Dire Beast |
| 7.5 | **War Orders**     | SPELL_CAST_SUCCESS  | Barbed Shot cast                 | Chance to reset KC          |
| 7.6 | **Deathblow**      | Various             | KC, Bleak Arrows, Withering Fire | Enable Kill Shot any HP     |

### Phase 8: Focus Economy

| #   | Feature                    | Notes                      |
| --- | -------------------------- | -------------------------- |
| 8.1 | **Base Focus regen**       | 5/sec scheduled events     |
| 8.2 | **Barbed Shot Focus buff** | Multiple instances running |
| 8.3 | **Focus cost deduction**   | On SPELL_CAST_SUCCESS      |
| 8.4 | **Focus cap check**        | 100 base, don't overcap    |
| 8.5 | **BW cost reduction**      | If talented                |

### Phase 9: Cooldown/Charge Interactions

| #   | Feature                    | Notes                         |
| --- | -------------------------- | ----------------------------- |
| 9.1 | **Barbed Wrath**           | Barbed Shot → BW CD reduction |
| 9.2 | **Master Handler**         | DoT tick → KC CD reduction    |
| 9.3 | **Alpha Predator**         | +1 Kill Command charge        |
| 9.4 | **CotW CD reduction**      | Per pet summoned              |
| 9.5 | **Charge reset mechanics** | Scent of Blood, Wild Call     |

### Phase 10: APL/Rotation Framework

| #    | Feature                    | Notes                                   |
| ---- | -------------------------- | --------------------------------------- |
| 10.1 | **Condition evaluator**    | `buff.X.up`, `charges_fractional>=Y`    |
| 10.2 | **Action list structure**  | Named lists (st, cleave, cds)           |
| 10.3 | **Target selection**       | `target_if=min:dot.barbed_shot.remains` |
| 10.4 | **Charge management**      | `full_recharge_time<gcd`                |
| 10.5 | **Buff timing conditions** | `buff.X.tick_time_remains>gcd`          |
| 10.6 | **Multi-target detection** | Switch st↔cleave                       |

### Phase 11: Hero Talents - Pack Leader

| #    | Feature                           | Notes                             |
| ---- | --------------------------------- | --------------------------------- |
| 11.1 | **Howl of the Pack Leader state** | Cycle: Wyvern→Boar→Bear           |
| 11.2 | **Beast summon on KC**            | Consume Howl buff → SPELL_SUMMON  |
| 11.3 | **Wyvern + Wyvern's Cry buff**    | Damage increase                   |
| 11.4 | **Boar Charge + Hogstrider**      | Damage + stacks                   |
| 11.5 | **Bear + Rend Flesh DoT**         | Bleed + damage buff               |
| 11.6 | **Fury of the Wyvern**            | KC extends Wyvern's Cry           |
| 11.7 | **Huntmaster's Call**             | Dire Beast → stacks → Fenryr/Hati |

### Phase 12: Hero Talents - Dark Ranger

| #    | Feature                      | Notes                            |
| ---- | ---------------------------- | -------------------------------- |
| 12.1 | **Black Arrow** (466930)     | Replaces Kill Shot               |
| 12.2 | **Black Arrow DoT** (468574) | Shadow damage                    |
| 12.3 | **Bleak Arrows auto-attack** | Replace auto shot                |
| 12.4 | **Deathblow proc sources**   | KC, Bleak Arrows, Withering Fire |
| 12.5 | **Withering Fire buff**      | Extra Black Arrows per tick      |
| 12.6 | **Shadow Hounds RPPM**       | DoT tick → spawn Dark Hound      |

### Phase 13: Tier Sets (TWW S3)

| #    | Feature             | Notes                    |
| ---- | ------------------- | ------------------------ |
| 13.1 | **Pack Leader 2pc** | Beast summon → stat buff |
| 13.2 | **Pack Leader 4pc** | Stampede damage          |
| 13.3 | **Dark Ranger 4pc** | Blighted Quiver proc     |

---

## Handler Implementation Pattern

Every spell/proc/buff becomes an event handler:

```typescript
// packages/wowlab-specs/hunter/beast-mastery/spells/kill-command.ts
import * as Effect from "effect/Effect";
import type { EventHandler, Emitter } from "@wowlab/services/CombatLog";
import type { SpellCastSuccess } from "@wowlab/core/Schemas";
import { StateService } from "@wowlab/services/State";
import { RNGService } from "@wowlab/services/Rng";
import { KILL_COMMAND, PET_KILL_COMMAND, DIRE_BEAST } from "../constants.js";

export const onKillCommandCast: EventHandler<SpellCastSuccess> = (
  event,
  emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const rng = yield* RNGService;
    const gameState = yield* state.getState();

    // Get pet from state
    const pet = getPetFromState(gameState);
    if (!pet) return;

    // Pet performs Kill Command - emit damage event
    emitter.emit(
      new SpellDamage({
        timestamp: event.timestamp,
        sourceGUID: pet.id,
        sourceName: pet.name,
        destGUID: event.destGUID,
        destName: event.destName,
        spellId: PET_KILL_COMMAND,
        spellName: "Kill Command",
        spellSchool: 1,
        amount: calculateKCDamage(gameState),
        // ... other damage fields
      }),
    );

    // Dire Command proc check (15% chance)
    const roll = yield* rng.next();
    if (roll < 0.15) {
      emitter.emit(
        new SpellSummon({
          timestamp: event.timestamp,
          sourceGUID: event.sourceGUID,
          sourceName: event.sourceName,
          destGUID: generatePetGUID(),
          destName: "Dire Beast",
          spellId: DIRE_BEAST,
          spellName: "Dire Beast",
          spellSchool: 1,
        }),
      );
    }
  });
```

**Register in spec module:**

```typescript
// packages/wowlab-specs/hunter/beast-mastery/index.ts
export const registerBMHandlers = Effect.gen(function* () {
  const combatLog = yield* CombatLogService;

  yield* combatLog.onSpell(
    "SPELL_CAST_SUCCESS",
    KILL_COMMAND,
    onKillCommandCast,
    {
      id: "bm:kill-command",
      priority: 10,
    },
  );

  yield* combatLog.onSpell(
    "SPELL_CAST_SUCCESS",
    BARBED_SHOT,
    onBarbedShotCast,
    {
      id: "bm:barbed-shot",
      priority: 10,
    },
  );

  // ... more handlers
});
```

---

## Recommended Implementation Order

```
Phase 1  → State mutations in SimDriver (auras, power, health, cooldowns)
Phase 2  → Pet system (Unit-based pets, PetManager, scaling)
Phase 3  → Scheduled events (auto-attacks, DoTs, focus regen)
Phase 4  → Damage pipeline (AP scaling, mastery, crit, armor)
Phase 5  → Core BM spell handlers
Phase 6  → Buff/debuff handlers
Phase 7  → Proc handlers
Phase 8  → Focus economy
Phase 9  → Cooldown interactions
Phase 10 → APL framework
Phase 11 → Hero talents (Pack Leader)
Phase 12 → Hero talents (Dark Ranger)
Phase 13 → Tier sets
```

This order ensures each phase has its dependencies ready.

---

## Priority Summary

### P0 (Must have for basic simulation)

- State mutations (auras, power, cooldowns)
- Pet system (main pet, KC trigger)
- Auto-attack system (Wild Call dependency)
- Core spell handlers (KC, Barbed Shot, Cobra Shot, BW)
- Core procs (Wild Call, Killer Cobra, Scent of Blood)
- Focus economy

### P1 (Needed for accurate simulation)

- Full spell roster handlers
- All buff/debuff handlers
- DoT system with tick callbacks
- Cooldown interactions
- Multi-target handling
- Damage pipeline with mastery/crit

### P2 (Hero talents)

- Pack Leader full system
- Dark Ranger full system

### P3 (Polish)

- Tier sets
- Minor talents
- Edge cases

---

## Tricky Interactions

These mechanics require careful implementation:

### 1. Pet Stat Recalculation

Pet stats must recalculate dynamically whenever hunter buffs change. Use event handlers on SPELL_AURA_APPLIED/REMOVED to trigger recalculation.

### 2. Beast Cleave Snapshots

Beast Cleave applies per-hit snapshots. The handler for SWING_DAMAGE needs to check Beast Cleave buff and snapshot modifiers.

### 3. Wild Call Proc Density

Wild Call triggers on pet auto-attack crits. Handler on SWING_DAMAGE checks critical flag and pet source.

### 4. Bestial Wrath Event Stream

BW handler emits both hunter and pet aura events, plus Scent of Blood reset. Duration extension from Barbed Shot ticks handled by separate handler.

### 5. Killer Cobra Timing

Cobra Shot handler checks if BW buff is active before resetting KC cooldown.

### 6. Scheduled Event Ordering

DoT ticks, auto-attacks, and focus regen all use `emitter.emitAt()` with precise timestamps. SimDriver processes in timestamp order.
