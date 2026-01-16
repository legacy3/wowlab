# SimC API Analysis

Comprehensive analysis of SimC expression APIs to identify overlaps, redundancies, and restructuring opportunities for API v2.

---

## Executive Summary

### Key Findings

1. **DoT vs Debuff**: Separate systems due to **storage location** (target vs action), not fundamental difference. API separation is partially legacy cruft.
2. **Cooldown Aliases**: `ready`/`up` are identical. But `remains_guess` is NOT the same as `remains` - it estimates reduced cooldowns.
3. **Buff Aliases**: SimC does NOT have `active`/`inactive`/`stacks` aliases. Only `up`/`down`/`stack` exist.
4. **Enemy Count APIs**: `active_enemies` (sim-wide) vs `spell_targets` (action-specific). Both needed.
5. **Action History**: `prev.X` is equivalent to `prev_gcd.1.X`. Redundant but useful shorthand.

### Recommended API v2 Changes

| SimC API | Recommendation | Rationale |
|----------|---------------|-----------|
| `cd.X.ready` / `cd.X.up` | Keep only `ready` | True aliases |
| `cd.X.remains_guess` | Keep separate from `remains` | Different semantics (estimates reduction) |
| `debuff.*` / `dot.*` | Unify with flags | Storage detail leaked into API |
| `active_enemies` / `spell_targets` | Keep both | Different semantics |
| `prev.X` / `prev_gcd.1.X` | Keep `prev_gcd.N.X` only | `prev` is just shorthand |

---

## 1. Resources

**Source**: `player.cpp:12587-12680`

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `resource.focus` | float | Current amount |
| `resource.focus.max` | float | Maximum amount |
| `resource.focus.deficit` | float | `max - current` |
| `resource.focus.pct` / `.percent` | float | `current / max * 100` |
| `resource.focus.regen` | float | Base regeneration rate |
| `resource.focus.net_regen` | float | Net rate (gained - lost) / time |
| `resource.focus.time_to_max` | float | Seconds to reach maximum |
| `resource.focus.time_to_X` | float | Seconds to reach value X |
| `resource.focus.max_nonproc` | float | Max without proc buffs |
| `resource.focus.pct_nonproc` | float | Percentage using nonproc max |

### Overlaps/Issues

- `.pct` and `.percent` are aliases (same implementation)
- `net_regen` vs `regen`: Different values but similar names

### API v2 Recommendation

Keep all properties but standardize naming:
- Use `percent` not `pct` (full words)
- Keep `regen` for base, rename `net_regen` to `regeneration_rate`

---

## 2. Cooldowns

**Source**: `cooldown.cpp:518-625`

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `cd.X.ready` | bool | Cooldown is available |
| `cd.X.up` | bool | **ALIAS for ready** (true alias) |
| `cd.X.remains` | float | Actual time until ready |
| `cd.X.remains_guess` | float | **ESTIMATED** time (accounts for CD reduction) |
| `cd.X.remains_expected` | float | **ALIAS for remains_guess** |
| `cd.X.duration` | float | Base cooldown duration |
| `cd.X.duration_guess` | float | **ESTIMATED** duration (accounts for CD reduction) |
| `cd.X.duration_expected` | float | **ALIAS for duration_guess** |
| `cd.X.charges` | int | Current charges |
| `cd.X.charges_max` | int | Maximum charges |
| `cd.X.charges_fractional` | float | Fractional charge count |
| `cd.X.recharge_time` | float | Time to next charge |
| `cd.X.full_recharge` | float | Time until all charges |

### Overlaps/Issues (CORRECTED)

**True aliases (identical implementation):**

```cpp
// cooldown.cpp:541-542 - Same handler
if ( name == "up" || name == "ready" )
  return make_mem_fn_expr( "cooldown_up", *this, &cooldown_t::up );
```

**NOT aliases - different implementations:**

```cpp
// cd.X.remains - Returns ACTUAL remaining time
// cooldown.cpp:520-521
std::max(timespan_t::zero(), ready - sim.current_time())

// cd.X.remains_guess / remains_expected - Returns ESTIMATED time
// cooldown.cpp:591-606
// For cooldowns reduced by external effects, estimates actual duration
if ( remains() == duration )
  return duration;
if ( up() )
  return 0_ms;
double reduction = ( sim.current_time() - last_start ) /
                   ( duration - remains() );
return remains() * reduction;
```

**Key insight**: The `*_guess` and `*_expected` variants exist for cooldowns that can be reduced by abilities (like Wildfire Infusion reducing Wildfire Bomb CD). They estimate the ACTUAL cooldown based on observed reduction rate.

**Actual relationships:**
- `ready` = `up` ✓ true alias
- `remains_guess` = `remains_expected` ✓ true alias (of each other)
- `remains` ≠ `remains_guess` ✗ DIFFERENT - actual vs estimated
- `duration_guess` = `duration_expected` ✓ true alias (of each other)
- `duration` ≠ `duration_guess` ✗ DIFFERENT - base vs estimated

### API v2 Recommendation

**Keep both variants with clearer names:**
- `cd.X.ready` - Is it available?
- `cd.X.remains` - Actual time remaining
- `cd.X.remains_estimated` - Estimated time (for reducible CDs)
- `cd.X.duration` - Base duration
- `cd.X.duration_estimated` - Estimated actual duration

**Remove:**
- `cd.X.up` (redundant with `ready`)
- `cd.X.remains_expected` (redundant with `remains_guess`)
- `cd.X.duration_expected` (redundant with `duration_guess`)

---

## 3. Buffs

**Source**: `buff.cpp:331-579`

### Properties (CORRECTED - Actual SimC Implementation)

| Property | Type | Description | Exists? |
|----------|------|-------------|---------|
| `buff.X.up` | bool | Buff is currently active | ✓ YES |
| `buff.X.down` | bool | Buff is not active | ✓ YES |
| `buff.X.remains` | float | Time until buff expires | ✓ YES |
| `buff.X.stack` | int | Current stack count | ✓ YES |
| `buff.X.max_stack` | int | Maximum stack count | ✓ YES |
| `buff.X.duration` | float | Base duration | ✓ YES |
| `buff.X.refreshable` | bool | Would refresh extend duration | ✓ YES |
| `buff.X.react` | int | Stacks that have "reacted" | ✓ YES |
| `buff.X.cooldown_remains` | float | Time until buff can be applied | ✓ YES |
| `buff.X.value` | float | Stored value in buff | ✓ YES |
| `buff.X.elapsed` | float | Time since buff was applied | ✓ YES |
| `buff.X.tick_time` | float | Periodic tick interval | ✓ YES |
| `buff.X.tick_time_remains` | float | Time to next tick | ✓ YES |

### Non-Existent Aliases (CORRECTION)

The following DO NOT exist in SimC despite common assumptions:

| Assumed Alias | Reality |
|---------------|---------|
| `buff.X.active` | ✗ Does not exist - use `buff.X.up` |
| `buff.X.inactive` | ✗ Does not exist - use `buff.X.down` |
| `buff.X.stacks` | ✗ Does not exist - use `buff.X.stack` |
| `buff.X.max_stacks` | ✗ Does not exist - use `buff.X.max_stack` |

**Verified from buff.cpp expression handlers:**
```cpp
type == "up"           // EXISTS
type == "down"         // EXISTS
type == "stack"        // EXISTS
type == "max_stack"    // EXISTS
// "active", "inactive", "stacks", "max_stacks" - NOT FOUND
```

### API v2 Recommendation

**Since the "cleaner" names don't exist in SimC, we have freedom to choose:**
- `buff.X.active` (clearer than `up`)
- `buff.X.inactive` (clearer than `down`)
- `buff.X.stacks` (plural makes more sense)
- `buff.X.stacks_max` (consistent with other `.X_max` patterns)

---

## 4. Debuffs vs DoTs (DEEP SYSTEMS ANALYSIS)

### The Question

> "this dot vs debuff thing always struck me as odd in simc"

### The Real Answer: Storage Location Leaked Into API

The separation exists because of **where data is stored**, not because they're fundamentally different concepts.

### Architecture Comparison

| Aspect | Debuff (`buff_t`) | DoT (`dot_t`) |
|--------|-------------------|---------------|
| **Storage Location** | `target->debuffs[id]` | `action->get_dot(target)` |
| **Ownership** | Target owns it | Action owns it (per target) |
| **Query Semantics** | "What's on this enemy?" | "What did this action apply?" |
| **Class Hierarchy** | `buff_t` | `dot_t` (unrelated) |

### Why This Matters

**Debuffs are target-centric:**
```cpp
// "Is Mortal Wounds on this target?"
target->debuffs.mortal_wounds->check()

// Multiple players can query the SAME debuff instance
// Debuff exists once per target, regardless of who applied it
```

**DoTs are action-centric:**
```cpp
// "What is MY Corruption doing to this target?"
action->get_dot(target)->ticking()

// Each player has their OWN dot instance on the target
// Two warlocks = two separate Corruption dot_t objects
```

### The Overlap Problem

Many abilities are BOTH a debuff AND a DoT:
- **Serpent Sting**: Debuff (target has the status) + DoT (periodic damage)
- **Bloodshed**: Debuff (applied to target) + DoT (ticks for damage)
- **Corruption**: Debuff (status effect) + DoT (damage ticks)

SimC handles this by creating BOTH:
```cpp
// On cast:
target->debuffs[SERPENT_STING]->trigger();  // buff_t instance
action->get_dot(target)->trigger();          // dot_t instance

// In APL, BOTH can be queried:
debuff.serpent_sting.up      // Check buff_t on target
dot.serpent_sting.ticking    // Check dot_t on action
```

**Problem**: Two objects must be kept in sync. This is error-prone.

### What Each System Tracks

**Debuff (`buff_t`) - Status tracking:**
- Stack count (current/max)
- Duration remaining
- Refreshable state
- React count (for latency simulation)
- Custom value storage

**DoT (`dot_t`) - Tick scheduling:**
- Next tick time (sub-ms precision)
- Ticks remaining
- Tick interval (haste-scaled)
- Snapshot state (AP, SP, crit at application)
- Persistent multiplier (buffs captured at cast)
- Pandemic refresh calculation

### Is The Separation Justified?

| Aspect | Verdict | Reasoning |
|--------|---------|-----------|
| Storage location | ✓ Justified | Different query patterns (target vs action state) |
| Separate classes | ~ Partial | Avoids bloating buff_t with tick logic |
| Separate API | ✗ Cruft | Implementation detail leaked to users |
| Duplicate properties | ✗ Cruft | `.remains`, `.refreshable` exist in both with different implementations |

### The Better Design (Wowlab Approach)

Unify at the data level, differentiate with flags:

```rust
pub struct AuraInstance {
    aura_id: AuraIdx,
    expires_at: SimTime,
    stacks: u8,

    // DoT-specific (Option = only present if periodic)
    snapshot: Option<ActionState>,
    next_tick: Option<SimTime>,
    tick_interval: Option<SimTime>,

    // Behavioral flags
    flags: AuraFlags {
        is_debuff: bool,      // Applied to enemy
        is_periodic: bool,    // Has tick damage
        can_pandemic: bool,   // Supports pandemic refresh
        snapshots: bool,      // Captures stats at application
    }
}
```

**Advantages:**
- Single source of truth (no sync bugs)
- Query "all debuffs" or "all periodic effects" via flags
- Cleaner mental model: an aura is an aura

### API v2 Recommendation

**Unify the API - don't repeat SimC's mistake:**

```
# Single namespace with clear properties:
aura.serpent_sting.active           # Is it on target?
aura.serpent_sting.remains          # Time remaining
aura.serpent_sting.ticking          # Is it dealing periodic damage?
aura.serpent_sting.ticks_remaining  # DoT-specific
aura.serpent_sting.tick_time        # DoT-specific
aura.serpent_sting.stacks           # Stack count
aura.serpent_sting.refreshable      # Can extend with pandemic?
```

**Key insight**: The debuff/dot split is an implementation artifact. Users shouldn't need to know where data is stored.

---

## 5. Target & Enemy Expressions

**Source**: `player.cpp:11826-11975`, `action.cpp`, `sim.cpp`

### Properties

| Property | Type | Description | Source |
|----------|------|-------------|--------|
| `target.health_percent` | float | Target's current health % | `player.cpp` |
| `target.time_to_die` | float | Estimated seconds until target dies | `player.cpp` |
| `target.time_to_pct_X` | float | Seconds until target reaches X% health | `player.cpp` |
| `target.distance` | float | Distance to target | `player.cpp` |
| `active_enemies` | int | Count of all active enemies in sim | `sim.cpp:3584` |
| `spell_targets` | int | Enemies hit by THIS action | `action.cpp:4163` |

### active_enemies vs spell_targets (VERIFIED)

**`active_enemies` - Global simulation count:**
```cpp
// sim.cpp:3584
if ( name_str == "active_enemies" )
  return make_ref_expr( name_str, active_enemies );
```

**`spell_targets` - Action-specific with filtering:**
```cpp
// action.cpp:4163
if ( name == "spell_targets" )
  return make_fn_expr( name, [this]() { return target_list().size(); } );
```

**Key difference**: `target_list()` applies:
- Range restrictions (enemies beyond spell range excluded)
- AoE caps (Multi-Shot can only hit N targets)
- Spell-specific targeting rules

### When They Differ

| Scenario | active_enemies | spell_targets |
|----------|----------------|---------------|
| 5 enemies, 3 in range | 5 | 3 |
| 10 enemies, 5-target AoE cap | 10 | 5 |
| Single target fight | 1 | 1 |

### API v2 Recommendation

Keep both with clearer names:
- `enemy.count` - Total enemies (was `active_enemies`)
- `action.targets` - Targets this action would hit (was `spell_targets`)

---

## 6. Combat & Time

**Source**: `sim.cpp:3445-3642`

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `time` / `combat.time` | float | Seconds since combat started |
| `fight_remains` / `combat.remaining` | float | Estimated seconds until combat ends |
| `fight_style` | enum | Patchwerk, DungeonRoute, etc. |
| `expected_combat_length` | float | Configured fight duration |
| `iteration` | int | Current simulation iteration |

### Overlaps/Issues

**Aliases:**
- `time` = `combat.time` (same value)
- `fight_remains` = `combat.remaining` (same value)

### API v2 Recommendation

Use namespaced version only:
- `combat.time` (not bare `time`)
- `combat.remaining` (not `fight_remains`)

---

## 7. Player State

**Source**: `player.cpp:11865-12235`

### Health Properties

| Property | Type | Description |
|----------|------|-------------|
| `player.health` | float | Current health |
| `player.health.max` | float | Maximum health |
| `player.health.percent` | float | Health percentage |
| `player.health.deficit` | float | Max - current |
| `incoming_damage_Xs` | float | Damage taken in X second window |

### Stat Properties

| Property | Type | Description |
|----------|------|-------------|
| `stat.strength` | float | Strength value |
| `stat.agility` | float | Agility value |
| `stat.intellect` | float | Intellect value |
| `stat.stamina` | float | Stamina value |
| `stat.attack_power` | float | Attack power (computed) |
| `stat.spell_power` | float | Spell power (computed) |
| `stat.crit_rating` | float | Raw crit rating |
| `stat.haste_rating` | float | Raw haste rating |
| `stat.mastery_rating` | float | Raw mastery rating |
| `stat.versatility_rating` | float | Raw versatility rating |

### Haste Properties (OVERLAP)

| Property | Description | Source |
|----------|-------------|--------|
| `attack_haste` | Attack speed multiplier | Cache |
| `spell_haste` | Cast speed multiplier | Cache |
| `spell_cast_speed` | Same as spell_haste | Cache |
| `stat.haste_rating` | Raw rating value | Stats |
| `raw_haste_pct` | Initial percentage | Initial |

**4 ways to express haste - too many!**

### Defense Properties

| Property | Type | Description |
|----------|------|-------------|
| `dodge_chance` | float | Dodge chance (with DR) |
| `parry_chance` | float | Parry chance (with DR) |
| `block_chance` | float | Block chance |

### Movement Properties

| Property | Type | Description |
|----------|------|-------------|
| `movement.remains` | float | Seconds until movement ends |
| `movement.distance` | float | Yards remaining |
| `movement.speed` | float | Yards per second |
| `is_moving` | bool | Currently moving |

### Position Properties

| Property | Type | Description |
|----------|------|-------------|
| `position_front` | bool | In front of target |
| `position_back` | bool | Behind target |

### API v2 Recommendation

**Simplify haste:**
- Keep only `player.haste` (spell haste multiplier)
- Keep `stat.haste_rating` for raw value
- Remove other representations

---

## 8. Talents & Equipment

**Source**: `player.cpp:12063-12407`, `unique_gear.cpp:4488-4692`, `set_bonus.cpp`

### Talent Properties

| Property | Type | Description |
|----------|------|-------------|
| `talent.X` | bool | Talent is enabled |
| `talent.X.enabled` | bool | Same as above |
| `talent.X.rank` | int | Talent rank (0 = not selected) |

**Talent Tree Search:** CLASS → SPECIALIZATION → HERO (OR logic)

### Equipment Properties

| Property | Type | Description |
|----------|------|-------------|
| `equipped.ID` | bool | Item ID equipped |
| `equipped.NAME` | bool | Item name equipped |
| `main_hand.2h` / `.1h` | bool | Weapon type check |
| `off_hand.2h` / `.1h` | bool | Weapon type check |

### Trinket Properties

| Property | Type | Description |
|----------|------|-------------|
| `trinket.1.ready` | bool | Trinket 1 cooldown ready |
| `trinket.1.cooldown.remains` | float | Time until ready |
| `trinket.1.has_buff.STAT` | bool | Has buff with stat |
| `trinket.1.proc.STAT.stack` | int | Proc buff stacks |
| `trinket.1.is.NAME` | bool | Trinket name match |
| `trinket.1.ilvl` | int | Item level |
| `trinket.1.cast_time` | float | Use effect cast time |

### Set Bonus Properties

| Property | Type | Description |
|----------|------|-------------|
| `set_bonus.tier29_2pc` | bool | 2-piece bonus active |
| `set_bonus.tier29_4pc` | bool | 4-piece bonus active |

### API v2 Recommendation

Keep most as-is but simplify trinket syntax:
- `trinket.1.*` → `trinket.slot1.*`
- `trinket.NAME.*` → `trinket.name("Name").*`

---

## 9. Pets

**Source**: `player.cpp:12423-12499`, `pet.cpp`

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pet.any.active` | bool | Any pet is active |
| `pet.X.active` | bool | Specific pet is active |
| `pet.X.remains` | float | Time until pet despawns |
| `pet.X.buff.Y.*` | various | Pet's buff properties |

### Architecture

- Pets stored in `active_pets` vector
- Each pet has `expiration` event for duration tracking
- Pet buffs are separate from player buffs (accessed via `pet.X.buff.Y`)

### API v2 Recommendation

Keep structure but rename:
- `pet.any.active` → `pet.any_active` (cleaner)
- `pet.X.remains` → `pet.X.remaining` (consistency)

---

## 10. Variables & Action History

**Source**: `action/variable.cpp`, `player.cpp:6780-6781,7541-7546`, `action.cpp:3664-3888`

### Variable Operations

| Operation | Description |
|-----------|-------------|
| `set` | var = value |
| `add` | var += value |
| `sub` | var -= value |
| `mul` | var *= value |
| `div` | var /= value (zero-safe) |
| `mod` | var = fmod(var, value) |
| `min` | var = min(var, value) |
| `max` | var = max(var, value) |
| `floor` | var = floor(var) |
| `ceil` | var = ceil(var) |
| `setif` | var = condition ? value : else_value |
| `reset` | var = default_value |

### Action History

| Expression | Description | Storage |
|------------|-------------|---------|
| `prev.X` | Last GCD action was X | Single pointer |
| `prev_gcd.N.X` | N GCDs ago was X | Vector (unlimited) |
| `prev_off_gcd.X` | X used since last GCD | Vector |
| `action.X.last_used` | Seconds since X was used | Timestamp |

### Overlaps/Issues

**`prev.X` is equivalent to `prev_gcd.1.X`:**

```cpp
// prev.X - player.cpp:3664-3685
last_foreground_action->internal_id == prev->internal_id

// prev_gcd.1.X - player.cpp:3850-3888
prev_gcd_actions[size - 1]->internal_id == previously_used->internal_id
```

Both check the most recent GCD action.

### API v2 Recommendation

Keep only `prev_gcd.N.X` format:
- More consistent
- Supports arbitrary lookback
- `prev.X` is just shorthand for `prev_gcd.1.X`

---

## Summary: APIs to Merge/Remove

### Remove (True Aliases)

| Remove | Keep Instead | Reason |
|--------|--------------|--------|
| `cd.X.up` | `cd.X.ready` | Identical implementation |
| `cd.X.remains_expected` | `cd.X.remains_guess` | Identical implementation |
| `cd.X.duration_expected` | `cd.X.duration_guess` | Identical implementation |
| `resource.X.pct` | `resource.X.percent` | Alias |
| `time` | `combat.time` | Use namespace |
| `fight_remains` | `combat.remaining` | Use namespace |
| `prev.X` | `prev_gcd.1.X` | Shorthand |
| `spell_cast_speed` | `spell_haste` | Identical |

### Keep Separate (Different Semantics)

| API 1 | API 2 | Reason |
|-------|-------|--------|
| `cd.X.remains` | `cd.X.remains_guess` | Actual vs estimated (for reducible CDs) |
| `cd.X.duration` | `cd.X.duration_guess` | Base vs estimated |
| `active_enemies` | `spell_targets` | Sim-wide vs action-specific |
| `attack_haste` | `spell_haste` | May differ with abilities |
| `talent.X` | `talent.X.rank` | Bool vs int |

### Unify (Implementation Detail Leaked)

| SimC APIs | Unified API v2 | Reason |
|-----------|----------------|--------|
| `debuff.X.*` + `dot.X.*` | `aura.X.*` | Same concept, different storage |

### Rename for Clarity

| SimC | API v2 | Reason |
|------|--------|--------|
| `active_enemies` | `enemy.count` | Clearer namespace |
| `spell_targets` | `action.targets` | Clearer namespace |
| `dot.X.ticking` | `aura.X.ticking` | Unified namespace |
| `dot.X.ticks_remain` | `aura.X.ticks_remaining` | Full word |
| `cd.X.full_recharge` | `cd.X.full_recharge_time` | Clearer |
| `cd.X.remains_guess` | `cd.X.remains_estimated` | Clearer intent |

### Buff Properties - Correct Status

| Property | SimC Status | API v2 |
|----------|-------------|--------|
| `buff.X.up` | ✓ Exists | `buff.X.active` |
| `buff.X.down` | ✓ Exists | `buff.X.inactive` |
| `buff.X.stack` | ✓ Exists | `buff.X.stacks` |
| `buff.X.max_stack` | ✓ Exists | `buff.X.stacks_max` |
| `buff.X.active` | ✗ Does NOT exist | N/A |
| `buff.X.inactive` | ✗ Does NOT exist | N/A |
| `buff.X.stacks` | ✗ Does NOT exist | N/A |
| `buff.X.max_stacks` | ✗ Does NOT exist | N/A |

---

## Implementation Notes

### Type Safety

SimC silently converts strings to expressions. In API v2:
- Validate all paths at parse time
- Require `$` prefix for user variables
- Return errors for unknown paths

### Expression Evaluation

SimC uses RPN (Reverse Polish Notation) with expression tree optimization.
API v2 should:
- Use typed AST nodes
- Evaluate at compile time where possible
- Cache constant expressions

### Lessons from SimC

What to avoid:
- Implementation details leaking into API (`debuff.*` vs `dot.*`)
- Multiple aliases for same value (`up`/`ready`, `stack`/`stacks`)
- Inconsistent naming (`pct` vs `percent`, `remain` vs `remaining`)
- Silently accepting invalid expressions
