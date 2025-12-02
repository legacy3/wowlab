# Beast Mastery Hunter Implementation Gap Analysis

Comprehensive analysis of what's documented in `@docs/bm/` vs what's implemented in `@packages/`.

## Already Implemented (Foundation)

| Component                             | Status | Location                             |
| ------------------------------------- | ------ | ------------------------------------ |
| Unit entity with auras, spells, power | ✅     | `@wowlab/core/entities/Unit.ts`      |
| Spell entity with charges/cooldowns   | ✅     | `@wowlab/core/entities/Spell.ts`     |
| Aura entity with stacks/expiry        | ✅     | `@wowlab/core/entities/Aura.ts`      |
| GameState with time tracking          | ✅     | `@wowlab/core/entities/GameState.ts` |
| Power system (Focus support)          | ✅     | `@wowlab/core/entities/Power.ts`     |
| Spell info schema (100+ fields)       | ✅     | `@wowlab/core/schemas/Spell.ts`      |
| Effect-TS service framework           | ✅     | `@wowlab/services/`                  |
| SpellActions.canCast/cast             | ✅     | `@wowlab/rotation/SpellActions.ts`   |
| GCD handling                          | ✅     | `@wowlab/rotation/`                  |
| DBC schemas (Spell*, Item*)           | ✅     | `@wowlab/core/schemas/dbc/`          |

---

## Not Implemented (Ordered by Priority)

### Phase 1: Entity Graph & Stat System

| #   | Feature                         | Notes                                         |
| --- | ------------------------------- | --------------------------------------------- |
| 1.1 | **Pet as Unit entity**          | Shared Unit type with `PetBehavior` trait     |
| 1.2 | **PetManager service**          | Lifecycle: summon, despawn, target sync       |
| 1.3 | **Pet scaling module**          | AP=0.6x, Stamina=0.7x from hunter             |
| 1.4 | **Stat propagation**            | Haste→GCD/swing/tick, Crit/Vers/Mastery hooks |
| 1.5 | **Main Pet + Animal Companion** | Two permanent pets (AC auto-attacks only)     |
| 1.6 | **Temporary pet pool**          | Dire Beast, CotW pets, Pack Leader beasts     |

### Phase 2: Damage Pipeline

| #   | Feature                               | Notes                            |
| --- | ------------------------------------- | -------------------------------- |
| 2.1 | **AP scaling framework**              | Coefficient × AP × modifiers     |
| 2.2 | **Mastery: Master of Beasts** (76657) | Pet damage multiplier            |
| 2.3 | **Crit damage calculation**           | Base 2x, Piercing Fangs modifier |
| 2.4 | **Versatility modifier**              | Damage and damage reduction      |
| 2.5 | **Target armor tables**               | Physical damage mitigation       |
| 2.6 | **AoE damage reduction**              | Beyond target cap                |

### Phase 3: Continuous Systems (Auto-attacks & DoTs)

| #   | Feature                       | Notes                                         |
| --- | ----------------------------- | --------------------------------------------- |
| 3.1 | **Auto-attack system**        | Hunter ranged autos                           |
| 3.2 | **Pet auto-attacks**          | Claw/Bite/Smack + swing timer                 |
| 3.3 | **Auto-attack crit tracking** | Required for Wild Call                        |
| 3.4 | **DoT tick system**           | Scheduled periodic events                     |
| 3.5 | **Barbed Shot DoT** (217200)  | 8s bleed, ticks reduce KC CD (Master Handler) |
| 3.6 | **Bloodshed DoT** (321538)    | Pet applies bleed                             |
| 3.7 | **Haste affects tick rate**   | Dynamic tick scheduling                       |

### Phase 4: Buff/Debuff Framework

| #    | Feature                              | Notes                                  |
| ---- | ------------------------------------ | -------------------------------------- |
| 4.1  | **Buff application service**         | Generic buff/debuff handling           |
| 4.2  | **Stacking rules**                   | Add vs refresh vs cap                  |
| 4.3  | **Duration extension**               | For Fury of the Wyvern, etc.           |
| 4.4  | **Snapshot vs dynamic flags**        | Most BM buffs are dynamic              |
| 4.5  | **Frenzy** (272790)                  | 0-3 stacks, attack speed per stack     |
| 4.6  | **Bestial Wrath hunter** (19574)     | 25% damage, 15s duration               |
| 4.7  | **Bestial Wrath pet** (186254)       | Separate buff, triggers Piercing Fangs |
| 4.8  | **Beast Cleave player** (268877)     | Enables cleave mode                    |
| 4.9  | **Beast Cleave pet** (118455)        | Cleave on melee (snapshot per-hit)     |
| 4.10 | **Thrill of the Hunt** (257946)      | Crit stacks from Barbed Shot           |
| 4.11 | **Barbed Shot Focus regen** (246152) | Focus/tick, multiple instances         |
| 4.12 | **Piercing Fangs** (392054)          | Pet crit damage during BW              |

### Phase 5: Proc System

| #   | Feature            | Notes                                                             |
| --- | ------------------ | ----------------------------------------------------------------- |
| 5.1 | **Proc framework** | RNG roll + proc tracking                                          |
| 5.2 | **Wild Call**      | Auto crit → Barbed Shot charge reset (all active pets contribute) |
| 5.3 | **Killer Cobra**   | Cobra Shot during BW → KC reset (100%)                            |
| 5.4 | **Scent of Blood** | BW cast → full Barbed Shot charges                                |
| 5.5 | **Dire Command**   | KC cast → chance to spawn Dire Beast                              |
| 5.6 | **War Orders**     | Barbed Shot → chance to reset KC                                  |
| 5.7 | **Deathblow**      | Multiple triggers → enables Kill Shot at any HP                   |

### Phase 6: Core Spell Effects

| #    | Feature                             | Notes                                           |
| ---- | ----------------------------------- | ----------------------------------------------- |
| 6.1  | **Kill Command** (34026)            | Triggers pet Kill Command (83381)               |
| 6.2  | **Kill Command pet damage** (83381) | AP × coefficient × mastery                      |
| 6.3  | **Kill Cleave**                     | KC cleaves during Beast Cleave                  |
| 6.4  | **Barbed Shot** (217200)            | Apply DoT + Frenzy stack + Focus buff           |
| 6.5  | **Cobra Shot** (193455)             | Damage + KC CD reduction (-1s)                  |
| 6.6  | **Multi-Shot** (2643)               | AoE damage + Beast Cleave buff                  |
| 6.7  | **Bestial Wrath cast**              | Apply buff + Scent of Blood reset               |
| 6.8  | **Call of the Wild** (359844)       | Summon pets periodically, CD reduction per tick |
| 6.9  | **Bloodshed** (321530)              | Pet attack + DoT                                |
| 6.10 | **Kill Shot** (53351)               | Execute <20% or Deathblow                       |
| 6.11 | **Stomp**                           | AoE on Barbed Shot cast                         |

### Phase 7: Focus Economy

| #   | Feature                             | Notes                      |
| --- | ----------------------------------- | -------------------------- |
| 7.1 | **Base Focus regen**                | 5/sec                      |
| 7.2 | **Barbed Shot Focus buff stacking** | Multiple instances running |
| 7.3 | **Focus cost system**               | KC=30, Cobra=35, Multi=40  |
| 7.4 | **Focus cap check**                 | 100 base, don't overcap    |
| 7.5 | **Bestial Wrath cost reduction**    | If talented                |

### Phase 8: APL/Rotation Framework

| #   | Feature                          | Notes                                   |
| --- | -------------------------------- | --------------------------------------- |
| 8.1 | **Condition evaluator**          | `buff.X.up`, `charges_fractional>=Y`    |
| 8.2 | **Action list structure**        | Named lists (st, cleave, cds)           |
| 8.3 | **Target selection**             | `target_if=min:dot.barbed_shot.remains` |
| 8.4 | **Charge management conditions** | `full_recharge_time<gcd`                |
| 8.5 | **Buff timing conditions**       | `buff.X.tick_time_remains>gcd`          |
| 8.6 | **Multi-target detection**       | Switch st↔cleave                       |

### Phase 9: Cooldown/Charge Interactions

| #   | Feature                        | Notes                         |
| --- | ------------------------------ | ----------------------------- |
| 9.1 | **Barbed Wrath**               | Barbed Shot → BW CD reduction |
| 9.2 | **Master Handler**             | DoT tick → KC CD reduction    |
| 9.3 | **Alpha Predator**             | +1 Kill Command charge        |
| 9.4 | **CotW CD reduction per tick** | Per pet summoned              |
| 9.5 | **Charge reset mechanics**     | Scent of Blood, Wild Call     |

### Phase 10: Hero Talents - Pack Leader

| #     | Feature                                   | Notes                                |
| ----- | ----------------------------------------- | ------------------------------------ |
| 10.1  | **Howl of the Pack Leader state machine** | Cycle: Wyvern→Boar→Bear              |
| 10.2  | **Beast summon on KC**                    | Consume Howl buff → summon           |
| 10.3  | **Wyvern summon + Wyvern's Cry buff**     | Damage increase                      |
| 10.4  | **Boar Charge**                           | Damage + Hogstrider stacks           |
| 10.5  | **Bear + Rend Flesh DoT**                 | Bleed + damage buff                  |
| 10.6  | **Fury of the Wyvern**                    | KC extends Wyvern's Cry              |
| 10.7  | **Lead From the Front** (472743)          | BW triggers damage buff              |
| 10.8  | **Hogstrider** (472640)                   | Boar Charge → Cobra Shot enhancement |
| 10.9  | **Huntmaster's Call** (459731)            | Dire Beast → stacks → Fenryr/Hati    |
| 10.10 | **Fenryr**                                | 2x AP, Ravenous Leap, grants haste   |
| 10.11 | **Hati**                                  | 2x AP, grants damage buff            |

### Phase 11: Hero Talents - Dark Ranger

| #    | Feature                               | Notes                                  |
| ---- | ------------------------------------- | -------------------------------------- |
| 11.1 | **Black Arrow** (466930)              | Replaces Kill Shot                     |
| 11.2 | **Black Arrow DoT** (468574)          | Shadow damage                          |
| 11.3 | **Bleak Arrows auto-attack** (468572) | Replace auto shot                      |
| 11.4 | **Deathblow proc sources**            | KC, Bleak Arrows, Withering Fire ticks |
| 11.5 | **Withering Fire buff**               | Extra Black Arrows per tick            |
| 11.6 | **Shadow Hounds RPPM**                | DoT tick → spawn Dark Hound            |
| 11.7 | **Dark Hound**                        | 5x AP pet                              |
| 11.8 | **Bleak Powder**                      | Black Arrow splash damage              |
| 11.9 | **The Bell Tolls**                    | Stacking damage buff                   |

### Phase 12: Tier Sets (TWW S3)

| #    | Feature             | Notes                                         |
| ---- | ------------------- | --------------------------------------------- |
| 12.1 | **Pack Leader 2pc** | Beast summon → stat buff (Mastery/Haste/Crit) |
| 12.2 | **Pack Leader 4pc** | Stampede damage                               |
| 12.3 | **Dark Ranger 4pc** | Blighted Quiver proc                          |

---

## Tricky Interactions

These mechanics require careful implementation to avoid bugs:

### 1. Pet Stat Recalculation

Pet stats must recalculate dynamically whenever hunter buffs or external auras change. Only a few effects (e.g., Bestial Wrath damage amp) snapshot, while Frenzy attack speed stacks compound with haste and GCD.

### 2. Beast Cleave Snapshots

Beast Cleave applies per-hit snapshots of damage modifiers. Pets added mid-buff shouldn't retroactively cleave, and Animal Companion's hidden pet cleaves at half value.

### 3. Wild Call Proc Density

Wild Call proc rate is tied to auto-attack crits from every active beast, so any haste/crit buff or temporary pet changes the proc density. Make reset logic idempotent across queued Barbed Shot charges.

### 4. Bestial Wrath Event Stream

Bestial Wrath reduces pet Focus costs and Kill Command cooldowns while extending via Barbed Shot ticks (Scent of Blood). Ensure one event stream handles both duration extension and cooldown refunds.

### 5. Call of the Wild Despawn

Call of the Wild summons inherit current buffs but expire while their queued attacks may still be mid-flight. Handle despawn + pending damage carefully to avoid orphaned events.

### 6. Killer Cobra Timing

Multi-pet Kill Command resolution: pet must be in range. Dire Beasts without Kill Command shouldn't satisfy killer abilities, and Killer Cobra should only reset Kill Command after Cobra Shot _hits_ during Bestial Wrath.

---

## Recommended Implementation Order

```
Phase 1  → Entity graph + stat scaling
Phase 2  → Damage pipeline
Phase 3  → Auto-attacks + DoT system
Phase 4  → Buff/debuff framework
Phase 5  → Proc system
Phase 6  → Core spells
Phase 7  → Focus economy
Phase 8  → APL framework
Phase 9  → Cooldown interactions
Phase 10 → Hero talents (Pack Leader)
Phase 11 → Hero talents (Dark Ranger)
Phase 12 → Tier sets
```

This order minimizes rework since each phase builds on the previous foundation.

---

## Priority Summary

### P0 (Must have for basic simulation)

- Pet system (main pet, Kill Command trigger)
- Damage calculations (AP scaling, mastery)
- Core buffs (Frenzy, Bestial Wrath)
- Core procs (Wild Call, Killer Cobra, Scent of Blood)
- Auto-attack system
- APL framework

### P1 (Needed for accurate simulation)

- Full spell roster
- All core talent effects
- DoT system with tick callbacks
- Charge/cooldown interactions
- Multi-target handling
- Focus economy

### P2 (Hero talents)

- Pack Leader full system
- Dark Ranger full system

### P3 (Polish)

- Tier sets
- Minor talents
- Edge cases

---

## Pet Modeling Recommendation

Based on Codex analysis:

1. **Model each pet as a `Unit`** - Main pet, companion, dire beast, CotW pets all as Unit entities so they automatically benefit from existing aura, stat, and event machinery

2. **Shared `PetBehavior` trait** - Common interface for pet actions and scaling

3. **Lightweight temporary pets** - Dire Beasts and CotW pets can be lightweight `Unit` records with limited action sets and lifetimes scheduled via the event queue

4. **PetManager service** - Higher-level service purely for lifecycle/orchestration (summon, despawn, target sync) rather than storing bespoke pet state outside Units

This keeps scaling, buffs, and logging centralized while maintaining flexibility for different pet types.
