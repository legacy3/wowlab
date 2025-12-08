# SimulationCraft Aura/Buff System Analysis

This document provides a comprehensive breakdown of how SimulationCraft handles auras, buffs, debuffs, and all their edge cases. Based on analysis of the `engine/buff/` directory.

---

## Table of Contents

1. [Refresh Behaviors](#refresh-behaviors)
2. [Stacking Mechanics](#stacking-mechanics)
3. [Duration & Tick Management](#duration--tick-management)
4. [Application & Removal Flow](#application--removal-flow)
5. [Modification Hooks & External Linking](#modification-hooks--external-linking)
6. [Specialized Buff Subclasses](#specialized-buff-subclasses)
7. [Key Enums & Constants](#key-enums--constants)

---

## Refresh Behaviors

SimC defines all refresh behaviors upfront in `engine/sc_enums.hpp:149`:

```cpp
enum buff_refresh_behavior {
  BUFF_REFRESH_DISABLED,   // Refresh does nothing to duration
  BUFF_REFRESH_DURATION,   // Refresh replaces duration entirely
  BUFF_REFRESH_EXTEND,     // Refresh adds full duration to remaining
  BUFF_REFRESH_PANDEMIC,   // Refresh adds duration + min(30% base, remaining)
  BUFF_REFRESH_TICK,       // Carry over residual tick fraction
  BUFF_REFRESH_MAX,        // Keep max of (remaining, new duration)
  BUFF_REFRESH_CUSTOM      // Delegate to user callback
};
```

### Auto-Detection Logic

Constructors auto-pick behavior based on buff type (`engine/buff/buff.cpp:719`, `engine/buff/buff.cpp:1372`):

| Buff Type                | Default Refresh Behavior  |
| ------------------------ | ------------------------- |
| Ticking (periodic)       | `PANDEMIC`                |
| Ticking with extend flag | `TICK`                    |
| Non-periodic             | `DURATION` (full replace) |

### The `refresh_duration` Switch

Located at `engine/buff/buff.cpp:1865-1878`, this is the core logic:

```
DISABLED  → duration = 0 (no refresh)
PANDEMIC  → duration = new_duration + min(remaining, new_duration * 0.3)
TICK      → duration = new_duration + (remaining_tick_fraction * tick_period)
EXTEND    → duration = remaining + new_duration
MAX       → duration = max(remaining, new_duration)
CUSTOM    → calls refresh_duration_callback(this, new_duration, remaining)
```

### Pandemic Window

The "pandemic window" is **30% of the base duration**. When refreshing:

- You keep up to 30% of the remaining duration
- This prevents "clipping" losses while not allowing infinite extension

Example: A 12s DoT refreshed at 4s remaining:

- Pandemic cap = 12 \* 0.3 = 3.6s
- New duration = 12 + min(4, 3.6) = 15.6s

### Custom Refresh Callbacks

Set via `set_refresh_duration_callback` (`engine/buff/buff.cpp:1396`):

```cpp
buff->set_refresh_duration_callback([](buff_t* b, timespan_t new_dur, timespan_t remaining) {
  // Custom logic here
  return new_dur + remaining * 0.5; // Example: 50% carryover
});
```

Once set, `refresh_behavior_overridden` is locked to prevent auto-detection from overriding it.

---

## Stacking Mechanics

### Stack Configuration

From `engine/buff/buff.cpp:913-974`:

- `set_max_stack(int)` - Enforces 1-999 bounds, resizes uptime/react arrays
- `set_initial_stack(int)` - Starting stacks on application
- `_resolve_stacks(int)` - Converts `-1` to "use initial" or "use max when reversing"

### The `bump` Function

Core stack incrementing at `engine/buff/buff.cpp:2545-2605`:

1. Clamps to max stacks
2. Counts overflow (for metrics)
3. Cancels oldest expiration for async buffs
4. Updates per-stack uptime tracking
5. Fires react-ready triggers
6. Schedules immediate expire if `expire_at_max_stack` is set

### Synchronous vs Asynchronous Stacking

**Synchronous** (default): All stacks share one expiration timer.

**Asynchronous** (`engine/buff/buff.cpp:226`, `engine/sc_enums.hpp:176`):

- Each stack has its own `expiration_t` event
- Each application ticks down independently
- Can share a single `tick_event` when desired
- Handles overflow by replacing/merging oldest expirations

Example: Rogue's Deadly Poison stacks - each application has its own duration.

### Special Stack Policies

| Policy                    | Description                               | Location        |
| ------------------------- | ----------------------------------------- | --------------- |
| `reverse`                 | New triggers decrement existing stacks    | `buff.hpp:99`   |
| `reverse_stack_reduction` | How many stacks to remove per tick        | `buff.cpp:2109` |
| `consume_all_stacks`      | Consume takes all vs partial              | `buff.cpp:1039` |
| `expire_at_max_stack`     | Auto-expire when hitting cap              | `buff.cpp:2659` |
| `freeze_stacks`           | Prevent auto-increment/decrement per tick | `buff.hpp:134`  |

### Tick-Time Stack Changes

- `partial_tick` - Allows truncated final ticks (`buff.cpp:180`)
- `tick_on_application` - Fire callback immediately on apply
- `tick_zero` - Same as above, different timing semantics
- `tick_callback` - User function called each tick

### Reaction System

For simulating player reaction time to buff procs (`engine/buff/buff.cpp:1956`, `200`, `289`):

- `stack_react_time` - When player "notices" the stack
- `react_ready_trigger` - Event queue for reaction windows
- `buff_delay_t` - Bunches rapid applications to mimic server batching

---

## Duration & Tick Management

### Base Duration Calculation

From `engine/buff/buff.cpp:601`, `849`:

```
effective_duration = spell_data_duration
                   × buff_duration_multiplier
                   × get_time_duration_multiplier()
```

Where `get_time_duration_multiplier()` is product of base + dynamic multipliers.

### Affecting Aura Pipeline

`apply_affecting_effect` at `engine/buff/buff.cpp:1492-1629` handles modifications:

- Flat/percent duration changes
- Cooldown modifications
- Stack count changes
- Tick time adjustments
- Effect magnitude scaling
- Category recharge modifications
- Time-rate modifiers (with ignore option)

### Period Discovery

At `engine/buff/buff.cpp:1118-1293`:

1. Scans aura effects for periodic subtypes
2. Sets `buff_period`
3. Auto-picks PANDEMIC/TICK refresh defaults
4. Determines `tick_time_behavior`:

```cpp
enum buff_tick_time_behavior {
  BUFF_TICK_TIME_UNHASTED,  // Static tick time
  BUFF_TICK_TIME_HASTED,    // Tick time / (1 + haste)
  BUFF_TICK_TIME_CUSTOM     // User callback
};
```

### Tick Event (`tick_t`)

At `engine/buff/buff.cpp:180`:

1. Increments `current_tick`
2. Computes total ticks including partial tails
3. Fires callbacks BEFORE altering stacks
4. Honors `reverse`/`freeze_stacks`
5. Always reschedules unless buff fully expired

### Manual Duration Controls

| Function                                       | Purpose                       | Location        |
| ---------------------------------------------- | ----------------------------- | --------------- |
| `extend_duration(timespan_t)`                  | Add time (fails for async)    | `buff.cpp:2246` |
| `extend_duration_or_trigger(timespan_t)`       | Extend if up, else trigger    | `buff.cpp:2298` |
| `reschedule_tick(timespan_t)`                  | Realign tick timer            | `buff.cpp:2312` |
| `set_dynamic_time_duration_multiplier(double)` | Slow/fast clock (capped 100×) | `buff.cpp:862`  |

---

## Application & Removal Flow

### Trigger Flow

`trigger()` at `engine/buff/buff.cpp:1999-2145`:

1. Check cooldowns/internal cooldowns
2. Check RPPM or flat proc chance
3. Check sleeping-state
4. Apply "server delay" bundling
5. Delegate to `execute()`
6. Log trigger spacing
7. Run expansion-specific hooks
8. Apply stacks (or decrement for reverse buffs)

### Start Flow

`start()` at `engine/buff/buff.cpp:2345`:

1. Schedule expirations (sorted when multiple exist)
2. Update regen if aura affects caches
3. Toggle constant flag for pre-pull permanents
4. Prime ticks (respecting `tick_on_application`)
5. Increment `start_count`

### Refresh Flow

`refresh()` at `engine/buff/buff.cpp:2456-2520`:

1. Bump stacks/value
2. Apply `refresh_duration` policy
3. Cancel/rebuild expiration events
4. Handle infinite durations
5. Optionally clip or preserve tick timers (based on `buff_tick_behavior`)
6. Handle `tick_zero`/`tick_on_application` for HoTs

### Stack Manipulation

| Function         | Purpose                              | Location        |
| ---------------- | ------------------------------------ | --------------- |
| `increment(int)` | Add stacks                           | `buff.cpp:2169` |
| `decrement(int)` | Remove stacks                        | `buff.cpp:2200` |
| `consume(int)`   | Remove + trigger ICD + return amount | `buff.cpp:2743` |

### Expire Flow

`expire()` at `engine/buff/buff.cpp:2775-2925`:

1. Optional `expiration_delay`
2. Cancel tick/delay events
3. Record remaining duration and stack count
4. Clear stack uptime
5. Fire `expire_callback` + virtual overrides
6. Flip regen/cache flags
7. Reset values
8. Log aura loss

### Utility Controls

| Function                       | Purpose                                    | Location        |
| ------------------------------ | ------------------------------------------ | --------------- |
| `override_buff(int, double)`   | Force constant values                      | `buff.cpp:2684` |
| `cancel()`                     | Immediate removal                          | `buff.cpp:2140` |
| `predict()`                    | Force `may_react` to pass                  | `buff.cpp:2905` |
| `reset()`                      | Clear events/cooldowns/dynamic multipliers | `buff.hpp:370`  |
| `allow_precombat(bool)`        | Allow in prepull                           | -               |
| `can_trigger(action_state_t*)` | Check spell flags                          | -               |
| `can_consume(action_state_t*)` | Check "can proc from procs"                | -               |

---

## Modification Hooks & External Linking

### Cache Invalidation

At `engine/buff/buff.cpp:1237`, `3114`:

- `add_invalidate(cache_e)` - Mark what stats to recalc
- `init_haste_type()` - Determine haste category
- `adjust_haste()` - Apply haste changes
- `set_affects_regen(bool)` - Toggle dynamic regen recalcs

### Spell Flag Processing

At `engine/buff/buff.cpp:705-744`:

| Flag                          | Effect                       |
| ----------------------------- | ---------------------------- |
| `SX_TICK_ON_APPLICATION`      | Enable `tick_on_application` |
| `SX_DOT_HASTED`               | Use hasted tick timing       |
| `SX_IGNORE_FOR_MOD_TIME_RATE` | Ignore time-rate modifiers   |

### Default Value Mapping

At `engine/buff/buff.cpp:1195-1224`:

- Map values from effect slots
- Auto-populate school masks
- Auto-populate multipliers
- Classify as "% stat buffs" for player stat aggregation

### Proc Modeling

At `engine/buff/buff.cpp:1389-1404`:

- Manual chance overrides
- RPPM frequency/modifier/scale knobs
- Driver cooldown wiring
- Internal cooldowns (instantiated on demand)

### Label/Category System

At `engine/buff/buff.cpp:1492-1678`:

- "Affected by spell" masks
- Label-based modifiers (by school/property)
- Category recharge/charge adjustments

---

## Specialized Buff Subclasses

### `stat_buff_t`

For buffs that modify player stats. At `engine/buff/buff.cpp:3289-3505`:

**Features:**

- Parses spell effects into stat deltas
- Rating translations (e.g., crit rating → crit %)
- Hybrid stat support (e.g., Agility/Intellect)
- Manual overrides via `add_stat()`
- Check predicates for conditional stats
- Per-stack rounding (mirrors in-game truncation)
- Uses `player->stat_gain/lose`

```cpp
stat_buff_t* buff = make_buff<stat_buff_t>(player, "example")
  ->add_stat(STAT_CRIT_RATING, 500)
  ->add_stat(STAT_HASTE_RATING, 300);
```

### `cost_reduction_buff_t`

For "next spell costs X less" effects. At `engine/buff/buff.cpp:3581-3642`:

**Features:**

- Detects power-school reductions from spell data
- Manual overrides
- On bump/expire adjusts `player->cost_reduction`
- Per-stack cost reduction

### `absorb_buff_t`

For shield/absorb effects. At `engine/buff/buff.cpp:3660-3777`:

**Features:**

- Registers with `player->absorb_buff_list`
- Optionally cumulates shield values on refresh
- `absorb_used` tracks consuming action
- Eligibility filters (school, spell type)
- Priority ordering hooks
- Alternative absorb schools

```cpp
absorb_buff_t* shield = make_buff<absorb_buff_t>(player, "example")
  ->set_absorb_school(SCHOOL_MAGIC)
  ->set_absorb_source(action);
```

### `movement_buff_t`

For sprint/snare effects. At `engine/buff/buff.cpp:3803-3815`:

**Features:**

- Couples triggers/expirations to movement callbacks
- Stops actor moving when aura ends
- Interacts with simulation movement state

### `damage_buff_t`

For damage modifiers. At `engine/buff/buff.cpp:3830-4108`:

**Features:**

- Tracks four independent modifiers:
  1. Direct damage multiplier
  2. Periodic damage multiplier
  3. Auto-attack multiplier
  4. Crit chance bonus
- Parses flat and label-based spell effects
- Dynamic multipliers driven by other buffs
- Query helpers for affected spells
- Combined multiplier calculation

```cpp
damage_buff_t* buff = make_buff<damage_buff_t>(player, "example")
  ->set_direct_mod(1.10)    // +10% direct
  ->set_periodic_mod(1.15); // +15% periodic
```

---

## Key Enums & Constants

### `buff_refresh_behavior` (sc_enums.hpp:149)

```cpp
BUFF_REFRESH_DISABLED   = 0  // No duration change
BUFF_REFRESH_DURATION   = 1  // Replace entirely
BUFF_REFRESH_EXTEND     = 2  // Add to remaining
BUFF_REFRESH_PANDEMIC   = 3  // 30% carryover cap
BUFF_REFRESH_TICK       = 4  // Residual tick carryover
BUFF_REFRESH_MAX        = 5  // Keep maximum
BUFF_REFRESH_CUSTOM     = 6  // User callback
```

### `buff_tick_behavior` (sc_enums.hpp)

```cpp
BUFF_TICK_CLIP     // New application clips current tick
BUFF_TICK_REFRESH  // Preserve tick timer on refresh
```

### `buff_tick_time_behavior` (sc_enums.hpp)

```cpp
BUFF_TICK_TIME_UNHASTED  // Static period
BUFF_TICK_TIME_HASTED    // Period affected by haste
BUFF_TICK_TIME_CUSTOM    // User callback
```

### `buff_stack_behavior` (sc_enums.hpp:176)

```cpp
BUFF_STACK_DEFAULT       // Normal stacking
BUFF_STACK_ASYNCHRONOUS  // Independent stack timers
```

---

## Implementation Checklist for WowLab

When implementing aura handling, ensure support for:

- [ ] All 7 refresh behaviors (disabled, duration, extend, pandemic, tick, max, custom)
- [ ] Synchronous and asynchronous stacking
- [ ] Stack caps with overflow tracking
- [ ] Reverse stacking (decrement on trigger)
- [ ] `expire_at_max_stack` behavior
- [ ] Pandemic window calculation (30% cap)
- [ ] Tick carryover for periodic effects
- [ ] Hasted vs unhasted tick times
- [ ] `tick_on_application` / `tick_zero`
- [ ] Partial ticks
- [ ] Duration multipliers (base + dynamic)
- [ ] Internal cooldowns on buffs
- [ ] RPPM proc handling
- [ ] Reaction time simulation
- [ ] Cache invalidation on apply/expire
- [ ] Stat buff aggregation
- [ ] Cost reduction tracking
- [ ] Absorb shield stacking/priority
- [ ] Damage modifier stacking

---

## File References

| File                       | Purpose                  |
| -------------------------- | ------------------------ |
| `engine/buff/buff.hpp`     | Buff class declarations  |
| `engine/buff/buff.cpp`     | Core buff implementation |
| `engine/sc_enums.hpp`      | Enum definitions         |
| `engine/player/player.hpp` | Player buff lists        |
| `engine/action/action.cpp` | Action-buff interactions |

---

_Generated from SimulationCraft source analysis, December 2025_

---

# Part 2: Data Sourcing Analysis

## Where Does SimC Get Its Data?

SimulationCraft does **NOT** manually define buff metadata. It extracts data directly from Blizzard's game files.

### The Data Pipeline

```
Blizzard CDN (DB2/DBC files)
         ↓
    casc_extract (tool)
         ↓
    dbc_extract3 (Python)
         ↓
    engine/dbc/generated/*.inc (C++ arrays)
         ↓
    SimC engine links against these
```

### Key Source Files

| SimC Location                            | Purpose                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `casc_extract/`                          | Fetches raw DB2/DBC from Blizzard CDN            |
| `dbc_extract3/`                          | Python scripts to convert DB2 → C++ `.inc` files |
| `engine/dbc/generated/sc_spell_data.inc` | Generated spell data arrays                      |
| `engine/dbc/spell_data.cpp`              | Loads the generated `.inc` files                 |
| `engine/dbc/sc_extra_data.inc`           | Hard-coded constants (minimal)                   |

---

## DB2 Tables Used by SimC

From `casc_extract/dbfile` manifest:

| DB2 Table               | Data Provided                          |
| ----------------------- | -------------------------------------- |
| `Spell.db2`             | Base spell info, IDs                   |
| `SpellEffect.db2`       | Effect types, amplitudes, tick periods |
| `SpellAuraOptions.db2`  | Proc chances, stack caps, RPPM         |
| `SpellDuration.db2`     | Canonical durations                    |
| `SpellClassOptions.db2` | Class/spec associations                |
| `SpellPower.db2`        | Resource costs                         |
| `SpellLabel.db2`        | Spell labels for affecting auras       |
| `SpellScaling.db2`      | Level/ilvl scaling coefficients        |
| `SpellCooldowns.db2`    | Cooldown values                        |
| `SpellCategories.db2`   | GCD categories, charge systems         |

---

## How Refresh Behavior Is Determined

### From Spell Attributes (Automatic)

SimC reads **spell attributes** from `SpellMisc` to determine behavior:

```cpp
// engine/buff/buff.cpp:1118-1157
// When constructing a buff, set_period() checks:
if (spell->has_attribute(SX_REFRESH_EXTENDS_DURATION))
    set_refresh_behavior(BUFF_REFRESH_PANDEMIC);
```

Key attribute flags (from `Attributes_0` through `Attributes_15` in SpellMisc):

| Flag                          | Meaning                         |
| ----------------------------- | ------------------------------- |
| `SX_REFRESH_EXTENDS_DURATION` | Use pandemic refresh            |
| `SX_TICK_ON_APPLICATION`      | Tick fires immediately on apply |
| `SX_DOT_HASTED`               | Tick period affected by haste   |
| `SX_IGNORE_FOR_MOD_TIME_RATE` | Ignore time-rate modifiers      |

### Auto-Detection Logic

```cpp
// engine/buff/buff.cpp:1372-1394
if (buff_has_periodic_effect) {
    default_refresh = BUFF_REFRESH_PANDEMIC;
} else {
    default_refresh = BUFF_REFRESH_DURATION;
}
```

### Manual Overrides in Class Modules

When DB flags are wrong or insufficient, class modules override:

```cpp
// engine/class_modules/sc_shaman.cpp:14400-14456
// Example: Elemental Blast buffs forced to pandemic
buff->set_refresh_behavior(BUFF_REFRESH_PANDEMIC);

// Example: Unlimited Power refresh disabled
buff->set_refresh_behavior(BUFF_REFRESH_DISABLED);
```

**This is the exception, not the rule.** Most buffs work correctly from DB data alone.

---

## Specific Data Fields & Their Sources

### Duration

**Source:** `SpellDuration.db2` → `SpellDuration.csv`

```csv
ID,Duration,MaxDuration
1,10000,10000      # 10 seconds
3,60000,60000      # 60 seconds
```

- Duration in milliseconds
- Linked via `DurationIndex` in `SpellMisc`

### Stack Caps & Proc Data

**Source:** `SpellAuraOptions.db2` → `SpellAuraOptions.csv`

```csv
ID,DifficultyID,CumulativeAura,ProcCategoryRecovery,ProcChance,ProcCharges,SpellProcsPerMinuteID,ProcTypeMask_0,ProcTypeMask_1,SpellID
```

| Column                  | Purpose                      |
| ----------------------- | ---------------------------- |
| `CumulativeAura`        | Max stacks (0 = no stacking) |
| `ProcChance`            | Proc chance (100 = 100%)     |
| `ProcCharges`           | Number of charges            |
| `SpellProcsPerMinuteID` | Links to RPPM table          |
| `ProcTypeMask_*`        | What can trigger the proc    |

### Tick Period (Amplitude)

**Source:** `SpellEffect.db2` → `SpellEffect.csv`

```csv
ID,EffectAura,EffectAmplitude,EffectAuraPeriod,...
```

| Column             | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `EffectAmplitude`  | Legacy tick period                        |
| `EffectAuraPeriod` | Modern tick period (milliseconds)         |
| `EffectAura`       | Aura type (e.g., 6 = SPELL_AURA_MOD_STAT) |

### Spell Attributes (Flags)

**Source:** `SpellMisc.db2` → `SpellMisc.csv`

```csv
ID,Attributes_0,Attributes_1,...,Attributes_15,DurationIndex,CastingTimeIndex,...
```

The `Attributes_*` columns are **bitmasks**. Each bit represents a flag like:

- Bit X in Attributes_3 = `SX_REFRESH_EXTENDS_DURATION`
- Bit Y in Attributes_7 = `SX_TICK_ON_APPLICATION`

SimC defines these in `engine/dbc/data_enums.hh`.

---

## wowlab-data CSV Inventory

The `/Users/user/Source/wowlab-data/data/tables/` directory contains the **same data** that SimC extracts from DB2 files, but in CSV format.

### Key Spell Tables Available

| CSV File                     | Records | Purpose                            |
| ---------------------------- | ------- | ---------------------------------- |
| `Spell.csv`                  | ~200k   | Base spell names/descriptions      |
| `SpellMisc.csv`              | ~200k   | Attributes, duration/range indexes |
| `SpellEffect.csv`            | ~500k   | All spell effects with values      |
| `SpellAuraOptions.csv`       | ~15k    | Proc/stack configuration           |
| `SpellDuration.csv`          | ~2k     | Duration lookup table              |
| `SpellCategories.csv`        | ~50k    | GCD/category info                  |
| `SpellCooldowns.csv`         | ~20k    | Cooldown values                    |
| `SpellPower.csv`             | ~30k    | Resource costs                     |
| `SpellLabel.csv`             | ~10k    | Label associations                 |
| `SpellProcsPerMinute.csv`    | ~500    | RPPM base frequencies              |
| `SpellProcsPerMinuteMod.csv` | ~2k     | RPPM modifiers                     |

### Linking Tables Together

To get full spell data, join on SpellID:

```
Spell.csv (ID = SpellID)
    ↓
SpellMisc.csv (SpellID) → DurationIndex → SpellDuration.csv (ID)
    ↓
SpellEffect.csv (SpellID) → Effect details, tick periods
    ↓
SpellAuraOptions.csv (SpellID) → Stack caps, proc chances
```

---

## What SimC Does NOT Get From Data

Some things require manual overrides in class modules:

1. **Refresh behavior quirks** - When the game behaves differently than flags suggest
2. **Spec-specific interactions** - Talent modifications not in spell data
3. **Bug workarounds** - When Blizzard's data is wrong
4. **Complex proc conditions** - Beyond simple ProcTypeMask

Example locations:

- `engine/class_modules/sc_*.cpp` - Per-class overrides
- `engine/dbc/sc_extra_data.inc` - Global hard-coded values

---

## Summary: Data vs Code

| Aspect               | Source                    | Manual Override Needed? |
| -------------------- | ------------------------- | ----------------------- |
| Duration             | `SpellDuration.db2`       | Rarely                  |
| Tick Period          | `SpellEffect.db2`         | Rarely                  |
| Stack Cap            | `SpellAuraOptions.db2`    | Rarely                  |
| Proc Chance          | `SpellAuraOptions.db2`    | Sometimes               |
| RPPM                 | `SpellProcsPerMinute.db2` | Sometimes               |
| Refresh Behavior     | `SpellMisc` attributes    | Sometimes               |
| Pandemic Window      | Hardcoded 30%             | Never (universal rule)  |
| Hasted Ticks         | `SpellMisc` attributes    | Rarely                  |
| Async Stacking       | Manual per-buff           | Always                  |
| Complex Interactions | Manual                    | Always                  |

**Bottom line:** ~90% of buff metadata comes directly from Blizzard's DB2 files. SimC only overrides when the game behavior differs from the data.

---

## Recommendations for WowLab

1. **Use wowlab-data CSVs** as the primary data source
2. **Parse SpellMisc attributes** to auto-detect refresh behaviors
3. **Create an override system** for the ~10% of cases that need manual tweaks
4. **Mirror SimC's attribute flag definitions** from `engine/dbc/data_enums.hh`

The data is already available - it's the same data SimC uses, just in CSV format instead of compiled C++ arrays.

---

# Part 3: Spell Attribute Bitmasks

The `Attributes_0` through `Attributes_15` columns in `spell_misc` are **bitmasks**. Each attribute is identified by a single number that encodes both which column (0-15) and which bit (0-31) to check.

## How Attributes Work

The attribute number encodes:

- **Column** = `attribute_number / 32`
- **Bit** = `attribute_number % 32`

Example: `SX_REFRESH_EXTENDS_DURATION = 436`

- Column = 436 / 32 = **13** → `Attributes_13`
- Bit = 436 % 32 = **20** → bit 20
- Check: `(Attributes_13 & (1 << 20)) !== 0`

## Key Spell Attributes for Aura Handling

From SimC's `engine/dbc/data_enums.hh:1818-1875`:

### Aura Refresh & Duration

| Attribute                     | Value | Column | Bit | Purpose                                            |
| ----------------------------- | ----- | ------ | --- | -------------------------------------------------- |
| `SX_REFRESH_EXTENDS_DURATION` | 436   | 13     | 20  | **Pandemic refresh** - extends duration on refresh |
| `SX_ROLLING_PERIODIC`         | 334   | 10     | 14  | Rolling periodic (tick carryover)                  |
| `SX_DURATION_HASTED`          | 273   | 8      | 17  | Duration scales with haste                         |

### Tick Behavior

| Attribute                | Value | Column | Bit | Purpose                             |
| ------------------------ | ----- | ------ | --- | ----------------------------------- |
| `SX_TICK_ON_APPLICATION` | 169   | 5      | 9   | Tick fires immediately on apply     |
| `SX_DOT_HASTED`          | 173   | 5      | 13  | Tick period affected by haste       |
| `SX_DOT_HASTED_MELEE`    | 278   | 8      | 22  | Tick period affected by melee haste |
| `SX_TICK_MAY_CRIT`       | 265   | 8      | 9   | Periodic ticks can crit             |
| `SX_TREAT_AS_PERIODIC`   | 121   | 3      | 25  | Treat direct damage as periodic     |

### Proc Behavior

| Attribute                           | Value | Column | Bit | Purpose                         |
| ----------------------------------- | ----- | ------ | --- | ------------------------------- |
| `SX_NOT_A_PROC`                     | 105   | 3      | 9   | Cannot be triggered by procs    |
| `SX_CAN_PROC_FROM_PROCS`            | 122   | 3      | 26  | Can be triggered by other procs |
| `SX_SUPPRESS_CASTER_PROCS`          | 112   | 3      | 16  | Doesn't trigger caster's procs  |
| `SX_SUPPRESS_TARGET_PROCS`          | 113   | 3      | 17  | Doesn't trigger target's procs  |
| `SX_DISABLE_WEAPON_PROCS`           | 151   | 4      | 23  | Doesn't trigger weapon procs    |
| `SX_CAN_PROC_FROM_SUPPRESSED_TGT`   | 254   | 7      | 30  | Can proc from suppressed target |
| `SX_CAN_PROC_FROM_SUPPRESSED`       | 385   | 12     | 1   | Can proc from suppressed        |
| `SX_ENABLE_PROCS_FROM_SUPPRESSED`   | 384   | 12     | 0   | Enable procs from suppressed    |
| `SX_ONLY_PROC_FROM_CLASS_ABILITIES` | 415   | 12     | 31  | Only proc from class abilities  |
| `SX_ALLOW_CLASS_ABILITY_PROCS`      | 416   | 13     | 0   | Allow class ability procs       |

### Combat & Targeting

| Attribute        | Value | Column | Bit | Purpose                      |
| ---------------- | ----- | ------ | --- | ---------------------------- |
| `SX_PASSIVE`     | 6     | 0      | 6   | Passive spell (auto-applied) |
| `SX_HIDDEN`      | 7     | 0      | 7   | Hidden from UI               |
| `SX_CHANNELED`   | 34    | 1      | 2   | Channeled spell              |
| `SX_CHANNELED_2` | 38    | 1      | 6   | Channeled spell (alt flag)   |
| `SX_CANNOT_CRIT` | 93    | 2      | 29  | Cannot critically strike     |
| `SX_ALWAYS_HIT`  | 114   | 3      | 18  | Always hits (no miss)        |
| `SX_NO_DODGE`    | 247   | 7      | 23  | Cannot be dodged             |
| `SX_NO_PARRY`    | 248   | 7      | 24  | Cannot be parried            |
| `SX_NO_MISS`     | 249   | 7      | 25  | Cannot miss                  |
| `SX_NO_BLOCK`    | 256   | 8      | 0   | Cannot be blocked            |
| `SX_NO_THREAT`   | 42    | 1      | 10  | Generates no threat          |

### Scaling & Modifiers

| Attribute                         | Value | Column | Bit | Purpose                      |
| --------------------------------- | ----- | ------ | --- | ---------------------------- |
| `SX_SCALE_ILEVEL`                 | 354   | 11     | 2   | Scales with item level       |
| `SX_MASTERY_AFFECTS_POINTS`       | 285   | 8      | 29  | Mastery affects spell points |
| `SX_DISABLE_PLAYER_MULT`          | 221   | 6      | 29  | Disable player multiplier    |
| `SX_DISABLE_TARGET_MULT`          | 136   | 4      | 8   | Disable target multiplier    |
| `SX_DISABLE_PLAYER_HEALING_MULT`  | 312   | 9      | 24  | Disable player healing mult  |
| `SX_DISABLE_TARGET_POSITIVE_MULT` | 321   | 10     | 1   | Disable target positive mult |

### Miscellaneous

| Attribute                     | Value | Column | Bit | Purpose                    |
| ----------------------------- | ----- | ------ | --- | -------------------------- |
| `SX_FOOD_AURA`                | 95    | 2      | 31  | Food buff                  |
| `SX_DONT_DISPLAY_IN_AURA_BAR` | 60    | 1      | 28  | Hidden from aura bar       |
| `SX_NO_CANCEL`                | 31    | 0      | 31  | Cannot be cancelled        |
| `SX_IGNORE_FOR_MOD_TIME_RATE` | 196   | 6      | 4   | Ignore time rate modifiers |
| `SX_REQ_MAIN_HAND`            | 106   | 3      | 10  | Requires main hand weapon  |
| `SX_REQ_OFF_HAND`             | 120   | 3      | 24  | Requires off hand weapon   |
| `SX_TREAT_AS_AREA_EFFECT`     | 175   | 5      | 15  | Treat as area effect       |
| `SX_TARGET_SPECIFIC_COOLDOWN` | 330   | 10     | 10  | Per-target cooldown        |

---

## Aura Types (EffectAura Values)

The `EffectAura` column in `spell_effect` identifies the aura type. Key values from `engine/dbc/data_enums.hh:1011+`:

### Periodic Effects

| Value | Name                       | Description                         |
| ----- | -------------------------- | ----------------------------------- |
| 3     | `A_PERIODIC_DAMAGE`        | Periodic damage (DoT)               |
| 8     | `A_PERIODIC_HEAL`          | Periodic healing (HoT)              |
| 20    | `A_PERIODIC_HEAL_PCT`      | Periodic % healing                  |
| 23    | `A_PERIODIC_TRIGGER_SPELL` | Periodically triggers another spell |
| 24    | `A_PERIODIC_ENERGIZE`      | Periodic resource gain              |
| 53    | `A_PERIODIC_LEECH`         | Periodic damage + heal              |
| 64    | `A_PERIODIC_MANA_LEECH`    | Periodic mana drain                 |

### Stat Modifiers

| Value | Name                        | Description                |
| ----- | --------------------------- | -------------------------- |
| 29    | `A_MOD_STAT`                | Modify a stat              |
| 79    | `A_MOD_DAMAGE_PERCENT_DONE` | % damage done modifier     |
| 14    | `A_MOD_DAMAGE_TAKEN`        | Flat damage taken modifier |
| 13    | `A_MOD_DAMAGE_DONE`         | Flat damage done modifier  |
| 52    | `A_MOD_CRIT_PERCENT`        | Crit chance modifier       |
| 57    | `A_MOD_SPELL_CRIT_CHANCE`   | Spell crit chance          |
| 49    | `A_MOD_DODGE_PERCENT`       | Dodge chance               |
| 47    | `A_MOD_PARRY_PERCENT`       | Parry chance               |

### Speed & Haste

| Value | Name                            | Description               |
| ----- | ------------------------------- | ------------------------- |
| 31    | `A_MOD_INCREASE_SPEED`          | Movement speed            |
| 65    | `A_MOD_CASTING_SPEED_NOT_STACK` | Cast speed (non-stacking) |
| 9     | `A_MOD_ATTACKSPEED_NORMALIZED`  | Attack speed              |

### Absorbs & Shields

| Value | Name              | Description                     |
| ----- | ----------------- | ------------------------------- |
| 69    | `A_SCHOOL_ABSORB` | Absorb damage (school-specific) |
| 15    | `A_DAMAGE_SHIELD` | Damage shield (reflect)         |

### Procs & Triggers

| Value | Name                    | Description                 |
| ----- | ----------------------- | --------------------------- |
| 42    | `A_PROC_TRIGGER_SPELL`  | Proc triggers a spell       |
| 43    | `A_PROC_TRIGGER_DAMAGE` | Proc triggers damage        |
| 4     | `A_DUMMY`               | Dummy aura (script-handled) |

### CC & Control

| Value | Name            | Description |
| ----- | --------------- | ----------- |
| 12    | `A_MOD_STUN`    | Stun        |
| 26    | `A_MOD_ROOT`    | Root        |
| 27    | `A_MOD_SILENCE` | Silence     |
| 7     | `A_MOD_FEAR`    | Fear        |
| 5     | `A_MOD_CONFUSE` | Confuse     |
| 6     | `A_MOD_CHARM`   | Charm       |

### Resource & Cost

| Value | Name                          | Description              |
| ----- | ----------------------------- | ------------------------ |
| 72    | `A_MOD_POWER_COST_SCHOOL_PCT` | % power cost modifier    |
| 73    | `A_MOD_POWER_COST_SCHOOL`     | Flat power cost modifier |

### Add/Modify Abilities

| Value | Name                           | Description                     |
| ----- | ------------------------------ | ------------------------------- |
| 107   | `A_ADD_FLAT_MODIFIER`          | Flat modifier to spell property |
| 108   | `A_ADD_PCT_MODIFIER`           | % modifier to spell property    |
| 271   | `A_ADD_FLAT_MODIFIER_BY_LABEL` | Flat mod by spell label         |
| 272   | `A_ADD_PCT_MODIFIER_BY_LABEL`  | % mod by spell label            |

---

## Property Types (for A*ADD*\*\_MODIFIER)

When `EffectAura` is 107/108/271/272, `EffectMiscValue_0` contains the property being modified:

| Value | Name                | What It Modifies  |
| ----- | ------------------- | ----------------- |
| 0     | `P_GENERIC`         | Generic/damage    |
| 1     | `P_DURATION`        | Duration          |
| 4     | `P_STACK`           | Stack count       |
| 7     | `P_CRIT`            | Crit chance       |
| 10    | `P_CAST_TIME`       | Cast time         |
| 11    | `P_COOLDOWN`        | Cooldown          |
| 14    | `P_RESOURCE_COST_1` | Resource cost     |
| 18    | `P_PROC_CHANCE`     | Proc chance       |
| 19    | `P_TICK_TIME`       | Tick period       |
| 21    | `P_GCD`             | Global cooldown   |
| 22    | `P_TICK_DAMAGE`     | Tick damage       |
| 26    | `P_PROC_FREQUENCY`  | Proc frequency    |
| 37    | `P_MAX_STACKS`      | Max stacks        |
| 38    | `P_PROC_COOLDOWN`   | Internal cooldown |

---

## Example: Checking if a Spell Has Pandemic Refresh

```typescript
function hasPandemicRefresh(spellMisc: SpellMisc): boolean {
  // SX_REFRESH_EXTENDS_DURATION = 436
  // Column = 436 / 32 = 13 → Attributes_13
  // Bit = 436 % 32 = 20
  const mask = 1 << 20; // 1048576
  return (spellMisc.Attributes_13 & mask) !== 0;
}
```

## Example: Checking if a DoT is Hasted

```typescript
function isHastedDot(spellMisc: SpellMisc): boolean {
  // SX_DOT_HASTED = 173
  // Column = 173 / 32 = 5 → Attributes_5
  // Bit = 173 % 32 = 13
  const mask = 1 << 13; // 8192
  return (spellMisc.Attributes_5 & mask) !== 0;
}
```

## Example: Full Attribute Check Utility

```typescript
function hasSpellAttribute(spellMisc: SpellMisc, attribute: number): boolean {
  const column = Math.floor(attribute / 32);
  const bit = attribute % 32;
  const mask = 1 << bit;

  const attrKey = `Attributes_${column}` as keyof SpellMisc;
  const attrValue = spellMisc[attrKey] as number;

  return (attrValue & mask) !== 0;
}

// Usage:
const SX_REFRESH_EXTENDS_DURATION = 436;
const SX_DOT_HASTED = 173;
const SX_TICK_ON_APPLICATION = 169;

if (hasSpellAttribute(spell, SX_REFRESH_EXTENDS_DURATION)) {
  refreshBehavior = "pandemic";
}
```

---

## Complete Attribute Constant Reference

```typescript
// Aura Refresh & Duration
const SX_REFRESH_EXTENDS_DURATION = 436; // Pandemic refresh
const SX_ROLLING_PERIODIC = 334; // Rolling periodic
const SX_DURATION_HASTED = 273; // Duration scales with haste

// Tick Behavior
const SX_TICK_ON_APPLICATION = 169; // Tick on apply
const SX_DOT_HASTED = 173; // Hasted tick period
const SX_DOT_HASTED_MELEE = 278; // Melee haste ticks
const SX_TICK_MAY_CRIT = 265; // Ticks can crit
const SX_TREAT_AS_PERIODIC = 121; // Treat as periodic

// Proc Behavior
const SX_NOT_A_PROC = 105; // Not a proc
const SX_CAN_PROC_FROM_PROCS = 122; // Can proc from procs
const SX_SUPPRESS_CASTER_PROCS = 112; // Suppress caster procs
const SX_SUPPRESS_TARGET_PROCS = 113; // Suppress target procs

// Combat Flags
const SX_PASSIVE = 6; // Passive
const SX_HIDDEN = 7; // Hidden
const SX_CHANNELED = 34; // Channeled
const SX_CANNOT_CRIT = 93; // Cannot crit
const SX_ALWAYS_HIT = 114; // Always hits
const SX_NO_THREAT = 42; // No threat

// Scaling
const SX_SCALE_ILEVEL = 354; // Scale with ilvl
const SX_MASTERY_AFFECTS_POINTS = 285; // Mastery scaling
const SX_IGNORE_FOR_MOD_TIME_RATE = 196; // Ignore time rate mods
```

---

## Summary: What We Have vs What We Need

| Data Point       | Available In                                         | Column(s)                   |
| ---------------- | ---------------------------------------------------- | --------------------------- |
| Duration         | `spell_duration` via `spell_misc.DurationIndex`      | `Duration`                  |
| Tick Period      | `spell_effect`                                       | `EffectAuraPeriod`          |
| Stack Cap        | `spell_aura_options`                                 | `CumulativeAura`            |
| Proc Chance      | `spell_aura_options`                                 | `ProcChance`                |
| RPPM             | `spell_procs_per_minute` via `SpellProcsPerMinuteID` | `BaseProcRate`              |
| Pandemic Refresh | `spell_misc`                                         | `Attributes_13 & (1 << 20)` |
| Hasted Ticks     | `spell_misc`                                         | `Attributes_5 & (1 << 13)`  |
| Tick on Apply    | `spell_misc`                                         | `Attributes_5 & (1 << 9)`   |
| Aura Type        | `spell_effect`                                       | `EffectAura`                |

**We have everything. No manual definitions needed for the core aura mechanics.**

---

# Part 4: WoWLab Implementation Plan

## The Core Problem

WoWLab emits native CLEU events and uses a TinyQueue priority queue that **doesn't support cancellation**. When we apply an aura:

1. We schedule `SPELL_AURA_REMOVED` at `currentTime + duration`
2. If `SPELL_AURA_REFRESH` happens before expiry, the old removal is still queued
3. We need to "cancel" the old removal without actually removing it from the queue

**Solution: Generation-based validity checking** - Instead of cancelling events, we check if they're still valid when they fire.

---

## 1. Cancellation Strategy: Generation Counters

Each aura tracks a `removalGeneration` counter. When scheduling a removal:

1. Increment `removalGeneration`
2. Store the generation in the scheduled event
3. When the removal fires, compare generations
4. If they don't match → event is stale, ignore it

```typescript
// Pseudo-code flow
SPELL_AURA_APPLIED:
  schedule.removalGeneration++
  schedule.removalAt = currentTime + duration
  emitAt(duration, { ...SPELL_AURA_REMOVED, generation: schedule.removalGeneration })

SPELL_AURA_REFRESH:
  schedule.removalGeneration++  // Invalidates old scheduled removal
  newDuration = calculateRefreshDuration(...)
  schedule.removalAt = currentTime + newDuration
  emitAt(newDuration, { ...SPELL_AURA_REMOVED, generation: schedule.removalGeneration })

SPELL_AURA_REMOVED handler:
  if (event.generation !== schedule.removalGeneration) return  // Stale, ignore
  if (event.timestamp < schedule.removalAt - epsilon) return   // Early, ignore
  // Actually remove the aura
```

This works for tick events too - each refresh bumps `tickGeneration`.

---

## 2. Data Structures

### AuraScheduleState (new)

Store in `Unit.auras.meta.schedules: Map<SpellID, AuraScheduleState>`:

```typescript
interface AuraScheduleState {
  // Removal scheduling
  removalAt: number; // When removal is scheduled (seconds)
  removalGeneration: number; // Incremented on each reschedule

  // Tick scheduling
  tickAt?: number; // Next tick time
  tickGeneration: number; // Incremented on refresh
  tickProgress?: number; // Fraction of current tick elapsed (for carryover)

  // Cached from spell data
  baseDurationMs: number;
  pandemicCapMs: number; // baseDuration * 0.3
  refreshBehavior: RefreshBehavior;
  tickPeriodMs?: number;
  hastedTicks: boolean;
  tickOnApplication: boolean;
  stackCap: number;

  // For haste calculations
  casterUnitId: string;
  hasteSnapshot?: number; // Caster's haste at application time
}
```

### AuraDefinition (cached per spell)

```typescript
interface AuraDefinition {
  spellId: number;
  baseDurationMs: number; // From SpellDuration table
  maxStacks: number; // From SpellAuraOptions.CumulativeAura
  tickPeriodMs?: number; // From SpellEffect.EffectAuraPeriod
  refreshBehavior: RefreshBehavior;
  flags: {
    pandemicRefresh: boolean; // SX_REFRESH_EXTENDS_DURATION (436)
    hastedTicks: boolean; // SX_DOT_HASTED (173)
    tickOnApplication: boolean; // SX_TICK_ON_APPLICATION (169)
    durationHasted: boolean; // SX_DURATION_HASTED (273)
    rollingPeriodic: boolean; // SX_ROLLING_PERIODIC (334)
    tickMayCrit: boolean; // SX_TICK_MAY_CRIT (265)
  };
}
```

### RefreshBehavior Enum

```typescript
type RefreshBehavior =
  | "disabled" // No refresh
  | "duration" // Replace entirely (non-periodic default)
  | "pandemic" // 30% carryover cap (periodic default)
  | "extend" // Add full duration to remaining
  | "tick" // Carry residual tick fraction
  | "max" // Keep maximum of remaining vs new
  | "custom"; // Per-spell callback
```

---

## 3. Code Changes Required

### New Files

| File                                                                  | Purpose                                     |
| --------------------------------------------------------------------- | ------------------------------------------- |
| `packages/wowlab-services/src/internal/aura/AuraDefinitionService.ts` | Load & cache AuraDefinition from spell data |
| `packages/wowlab-services/src/internal/aura/AuraScheduler.ts`         | Pure helpers for scheduling removal/ticks   |
| `packages/wowlab-services/src/internal/aura/RefreshCalculator.ts`     | Duration calculation per refresh behavior   |
| `packages/wowlab-core/src/internal/schemas/AuraScheduleState.ts`      | Schema definitions                          |

### Modified Files

| File                                                                | Changes                                                  |
| ------------------------------------------------------------------- | -------------------------------------------------------- |
| `packages/wowlab-core/src/internal/entities/Unit.ts`                | Type `AuraCollection.meta` properly with `schedules` map |
| `packages/wowlab-core/src/internal/entities/Aura.ts`                | Add duration/tick fields to track state                  |
| `packages/wowlab-services/src/internal/combat-log/handlers/aura.ts` | Integrate scheduler, check generations                   |
| `packages/wowlab-services/src/internal/metadata/MetadataService.ts` | Add `loadAuraDefinition()` method                        |

---

## 4. Refresh Duration Calculation

Implement `resolveRefreshDuration()` matching SimC's logic:

```typescript
function resolveRefreshDuration(
  currentTime: number,
  existingAura: Aura,
  definition: AuraDefinition,
  schedule: AuraScheduleState,
): number {
  const remainingMs = Math.max(0, (schedule.removalAt - currentTime) * 1000);
  const baseMs = definition.baseDurationMs;

  switch (definition.refreshBehavior) {
    case "disabled":
      return 0; // No refresh

    case "duration":
      return baseMs; // Replace entirely

    case "pandemic": {
      const cap = baseMs * 0.3;
      const carry = Math.min(remainingMs, cap);
      return baseMs + carry;
    }

    case "extend":
      return remainingMs + baseMs;

    case "tick": {
      const tickProgress = schedule.tickProgress ?? 0;
      const tickCarry = tickProgress * (definition.tickPeriodMs ?? 0);
      return baseMs + tickCarry;
    }

    case "max":
      return Math.max(remainingMs, baseMs);

    default:
      return baseMs;
  }
}
```

### Auto-Detecting Refresh Behavior

```typescript
function determineRefreshBehavior(definition: AuraDefinition): RefreshBehavior {
  // If spell has SX_REFRESH_EXTENDS_DURATION flag
  if (definition.flags.pandemicRefresh) {
    return "pandemic";
  }

  // If spell has periodic effect (tick period > 0)
  if (definition.tickPeriodMs && definition.tickPeriodMs > 0) {
    return "pandemic"; // Periodic defaults to pandemic
  }

  // Non-periodic defaults to duration replace
  return "duration";
}
```

---

## 5. Periodic Tick Scheduling

### On Aura Application

```typescript
function scheduleInitialTicks(
  emitter: Emitter,
  definition: AuraDefinition,
  schedule: AuraScheduleState,
  event: SpellAuraApplied,
): void {
  if (!definition.tickPeriodMs) return;

  // Calculate hasted tick period
  let tickPeriod = definition.tickPeriodMs;
  if (definition.flags.hastedTicks && schedule.hasteSnapshot) {
    tickPeriod = tickPeriod / (1 + schedule.hasteSnapshot);
  }

  // Tick on application?
  const firstTickDelay = definition.flags.tickOnApplication ? 0 : tickPeriod;

  schedule.tickGeneration++;
  schedule.tickAt = emitter.currentTime + firstTickDelay / 1000;
  schedule.tickProgress = 0;

  emitter.emitAt(firstTickDelay, {
    _tag: isPeriodic(definition)
      ? "SPELL_PERIODIC_DAMAGE"
      : "SPELL_PERIODIC_HEAL",
    spellId: event.spellId,
    // ... other fields
    _tickGeneration: schedule.tickGeneration,
  });
}
```

### On Refresh (Tick Carryover)

```typescript
function rescheduleTicksOnRefresh(
  emitter: Emitter,
  definition: AuraDefinition,
  schedule: AuraScheduleState,
): void {
  if (!definition.tickPeriodMs || !schedule.tickAt) return;

  // Calculate how much of the current tick has elapsed
  const elapsed =
    emitter.currentTime - (schedule.tickAt - definition.tickPeriodMs / 1000);
  schedule.tickProgress = elapsed / (definition.tickPeriodMs / 1000);

  // For TICK refresh behavior, this progress carries over
  // For PANDEMIC, we just continue from current progress

  schedule.tickGeneration++;
  const remainingTickTime =
    (1 - schedule.tickProgress) * definition.tickPeriodMs;
  schedule.tickAt = emitter.currentTime + remainingTickTime / 1000;

  emitter.emitAt(remainingTickTime, {
    _tag: "SPELL_PERIODIC_DAMAGE",
    // ...
    _tickGeneration: schedule.tickGeneration,
  });
}
```

### Tick Handler

```typescript
function handlePeriodicTick(
  event: SpellPeriodicDamage,
  schedule: AuraScheduleState,
): void {
  // Check if tick is stale
  if (event._tickGeneration !== schedule.tickGeneration) return;

  // Process the tick (damage calculation, etc.)
  // ...

  // Schedule next tick if aura still active
  if (emitter.currentTime < schedule.removalAt) {
    schedule.tickGeneration++;
    const nextTickDelay = definition.tickPeriodMs; // Apply haste here too
    schedule.tickAt = emitter.currentTime + nextTickDelay / 1000;

    emitter.emitAt(nextTickDelay, {
      _tag: "SPELL_PERIODIC_DAMAGE",
      _tickGeneration: schedule.tickGeneration,
    });
  }
}
```

---

## 6. Edge Cases

### Zero/Infinite Duration

```typescript
if (definition.baseDurationMs <= 0) {
  // Permanent buff - no removal scheduled
  schedule.removalAt = Infinity;
  schedule.removalGeneration = 0;
  return;
}
```

### Manual Removal (Dispel/Death)

```typescript
// When manually removing an aura, clear the schedule
function manuallyRemoveAura(unitId: string, spellId: number): void {
  const schedule = getSchedule(unitId, spellId);
  if (schedule) {
    // Setting generation to -1 ensures any queued events are ignored
    schedule.removalGeneration = -1;
    schedule.tickGeneration = -1;
    deleteSchedule(unitId, spellId);
  }
  // Emit SPELL_AURA_REMOVED immediately
}
```

### Multiple Casters

For spells that can be applied by multiple casters separately:

```typescript
// Key should be composite: spellId + casterUnitId
type ScheduleKey = `${SpellID}:${UnitID}`;

// Or use a nested map:
schedules: Map<SpellID, Map<CasterUnitID, AuraScheduleState>>;
```

### Out-of-Order Timestamps

```typescript
function emitAtSafe(
  emitter: Emitter,
  delayMs: number,
  event: CombatLogEvent,
): void {
  // Clamp to prevent negative delays
  const safeDelay = Math.max(0, delayMs);
  emitter.emitAt(safeDelay, event);
}
```

### Stack Cap Enforcement

```typescript
function applyStackChange(
  aura: Aura,
  definition: AuraDefinition,
  amount: number,
): number {
  const newStacks = Math.min(aura.stacks + amount, definition.maxStacks);
  return newStacks;
}
```

---

## 7. Loading Spell Data

### AuraDefinitionService

```typescript
class AuraDefinitionService {
  private cache = new Map<SpellID, AuraDefinition>();

  getDefinition(
    spellId: SpellID,
  ): Effect.Effect<AuraDefinition, SpellNotFound> {
    return Effect.gen(function* () {
      if (this.cache.has(spellId)) {
        return this.cache.get(spellId)!;
      }

      // Load from database
      const misc = yield* MetadataService.loadSpellMisc(spellId);
      const duration = yield* MetadataService.loadSpellDuration(
        misc.DurationIndex,
      );
      const auraOptions = yield* MetadataService.loadSpellAuraOptions(spellId);
      const effects = yield* MetadataService.loadSpellEffects(spellId);

      // Find periodic effect for tick period
      const periodicEffect = effects.find(
        (e) => [3, 8, 53].includes(e.EffectAura), // A_PERIODIC_DAMAGE, A_PERIODIC_HEAL, A_PERIODIC_LEECH
      );

      const definition: AuraDefinition = {
        spellId,
        baseDurationMs: duration.Duration,
        maxStacks: auraOptions?.CumulativeAura ?? 1,
        tickPeriodMs: periodicEffect?.EffectAuraPeriod,
        refreshBehavior: "duration", // Will be auto-detected
        flags: {
          pandemicRefresh: hasAttribute(misc, 436),
          hastedTicks: hasAttribute(misc, 173),
          tickOnApplication: hasAttribute(misc, 169),
          durationHasted: hasAttribute(misc, 273),
          rollingPeriodic: hasAttribute(misc, 334),
          tickMayCrit: hasAttribute(misc, 265),
        },
      };

      // Auto-detect refresh behavior
      definition.refreshBehavior = determineRefreshBehavior(definition);

      this.cache.set(spellId, definition);
      return definition;
    });
  }
}

function hasAttribute(misc: SpellMisc, attribute: number): boolean {
  const column = Math.floor(attribute / 32);
  const bit = attribute % 32;
  const attrValue = misc[`Attributes_${column}`] as number;
  return (attrValue & (1 << bit)) !== 0;
}
```

---

## 8. Handler Integration

### Updated SPELL_AURA_APPLIED Handler

```typescript
const applyAura = (event: SpellAuraApplied) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    // Load spell definition
    const definition = yield* AuraDefinitionService.getDefinition(
      event.spellId,
    );

    // Create or get schedule state
    const schedule = createScheduleState(definition, event, state.currentTime);

    // Create the aura
    const aura = Aura.create(
      {
        casterUnitId: event.sourceGUID,
        expiresAt: schedule.removalAt,
        info: {
          spellId: event.spellId,
          duration: definition.baseDurationMs / 1000,
        },
        stacks: Math.min(event.amount ?? 1, definition.maxStacks),
      },
      state.currentTime,
    );

    // Update unit with aura and schedule
    const updatedUnit = unit
      .setIn(["auras", "all", event.spellId], aura)
      .setIn(["auras", "meta", "schedules", event.spellId], schedule);

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );

    // Schedule removal event
    const emitter = yield* Emitter;
    emitter.emitAt(definition.baseDurationMs, {
      _tag: "SPELL_AURA_REMOVED",
      ...eventBaseFields(event),
      _removalGeneration: schedule.removalGeneration,
    });

    // Schedule ticks if periodic
    if (definition.tickPeriodMs) {
      scheduleInitialTicks(emitter, definition, schedule, event);
    }
  });
```

### Updated SPELL_AURA_REMOVED Handler

```typescript
const removeAura = (event: SpellAuraRemoved) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const schedule = unit.auras.meta.schedules?.get(event.spellId);

    // Check if this removal is still valid
    if (schedule) {
      // Stale generation?
      if (
        event._removalGeneration !== undefined &&
        event._removalGeneration !== schedule.removalGeneration
      ) {
        return; // Ignore stale removal
      }

      // Too early? (with 1ms epsilon for float precision)
      if (event.timestamp < schedule.removalAt - 0.001) {
        return; // Ignore early removal
      }
    }

    // Actually remove the aura
    const updatedUnit = unit
      .deleteIn(["auras", "all", event.spellId])
      .deleteIn(["auras", "meta", "schedules", event.spellId]);

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );
  });
```

### Updated SPELL_AURA_REFRESH Handler

```typescript
const refreshAura = (event: SpellAuraRefresh) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const existingAura = unit.auras.all.get(event.spellId);
    if (!existingAura) return;

    const schedule = unit.auras.meta.schedules?.get(event.spellId);
    if (!schedule) return;

    const definition = yield* AuraDefinitionService.getDefinition(
      event.spellId,
    );

    // Calculate new duration
    const newDurationMs = resolveRefreshDuration(
      state.currentTime,
      existingAura,
      definition,
      schedule,
    );

    if (newDurationMs === 0) return; // Refresh disabled

    // Update schedule
    schedule.removalGeneration++;
    schedule.removalAt = state.currentTime + newDurationMs / 1000;

    // Update aura
    const updatedAura = existingAura.with(
      {
        expiresAt: schedule.removalAt,
      },
      state.currentTime,
    );

    const updatedUnit = unit
      .setIn(["auras", "all", event.spellId], updatedAura)
      .setIn(["auras", "meta", "schedules", event.spellId], schedule);

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );

    // Schedule new removal (old one will be ignored due to generation mismatch)
    const emitter = yield* Emitter;
    emitter.emitAt(newDurationMs, {
      _tag: "SPELL_AURA_REMOVED",
      ...eventBaseFields(event),
      _removalGeneration: schedule.removalGeneration,
    });

    // Reschedule ticks
    if (definition.tickPeriodMs) {
      rescheduleTicksOnRefresh(emitter, definition, schedule);
    }
  });
```

---

## 9. Summary

| Component            | Implementation                                                                       |
| -------------------- | ------------------------------------------------------------------------------------ |
| Event Cancellation   | Generation counters on scheduled events                                              |
| Data Source          | Spell data from MCP server (SpellMisc, SpellDuration, SpellEffect, SpellAuraOptions) |
| Refresh Behavior     | Auto-detected from attributes, defaults pandemic for periodic                        |
| Duration Calculation | `resolveRefreshDuration()` implementing all 6 behaviors                              |
| Tick Scheduling      | Generation-based with haste snapshot and carryover                                   |
| Caching              | `AuraDefinitionService` caches definitions per spell                                 |

**Key Principle:** We never mutate the queue. We emit events and check validity when they fire. This keeps the architecture clean and deterministic while supporting all the complex refresh behaviors from WoW.
