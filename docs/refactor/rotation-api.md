# Rotation Scripting API Reference

## Overview

The rotation system uses [Rhai](https://rhai.rs/) for runtime scripting. Users write real Rhai code with clean namespacing (`spell.*`, `aura.*`, `power.*`) to define priority-based rotations.

**Performance**: ~2.5μs per script evaluation (accepts 2x overhead for clean namespacing).

## Namespaces

### `spell` — Spell Access

Access spells by name. Names are snake_case versions of spell names.

```rhai
spell.kill_command      // SpellHandle for Kill Command
spell.bestial_wrath     // SpellHandle for Bestial Wrath
spell.barbed_shot       // SpellHandle for Barbed Shot
```

#### SpellHandle Properties

| Property | Type | Description |
|----------|------|-------------|
| `.ready` | `bool` | Off cooldown AND resources available AND not on GCD |
| `.cooldown` | `f64` | Remaining cooldown in seconds |
| `.cooldown_up` | `bool` | Cooldown is ready (ignores resource/GCD) |
| `.charges` | `i64` | Current charges (for charge-based spells) |
| `.max_charges` | `i64` | Maximum charges |
| `.recharge` | `f64` | Time until next charge in seconds |
| `.cost` | `f64` | Resource cost |
| `.usable` | `bool` | Can be cast right now (all conditions met) |

#### SpellHandle Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `.ready()` | `bool` | Alias for `.ready` property |

---

### `aura` — Buff/Debuff Access

Access active auras (buffs on player, debuffs on target).

```rhai
aura.frenzy             // AuraHandle for Frenzy buff
aura.bestial_wrath      // AuraHandle for Bestial Wrath buff
aura.barbed_shot        // AuraHandle for Barbed Shot debuff
```

#### AuraHandle Properties

| Property | Type | Description |
|----------|------|-------------|
| `.up` | `bool` | Aura is currently active |
| `.down` | `bool` | Aura is not active |
| `.stacks` | `i64` | Current stack count (0 if not active) |
| `.remaining` | `f64` | Time remaining in seconds (0 if not active) |
| `.duration` | `f64` | Full duration of the aura |
| `.max_stacks` | `i64` | Maximum possible stacks |
| `.refreshable` | `bool` | Can be refreshed (remaining < 30% of duration) |

---

### `power` — Resource Access

Access player resources.

```rhai
power.focus             // Current focus
power.mana              // Current mana
power.rage              // Current rage
power.energy            // Current energy
```

#### Resource Properties

| Property | Type | Description |
|----------|------|-------------|
| `power.<type>` | `f64` | Current resource amount |
| `power.<type>_max` | `f64` | Maximum resource |
| `power.<type>_deficit` | `f64` | Amount below max |
| `power.<type>_pct` | `f64` | Percentage (0.0–1.0) |
| `power.<type>_regen` | `f64` | Regen per second |
| `power.<type>_time_to_max` | `f64` | Seconds until full |

---

### `target` — Target Info

```rhai
target.health           // Current health
target.health_pct       // Health percentage (0.0–1.0)
target.time_to_die      // Estimated seconds until death
target.distance         // Distance in yards
```

---

### `fight` — Encounter Info

```rhai
fight.remains           // Seconds remaining in fight
fight.duration          // Total fight duration
fight.in_execute        // Target below execute threshold
fight.enemies           // Number of active enemies
```

---

### `player` — Player State

```rhai
player.gcd              // Remaining GCD in seconds
player.casting          // Currently casting
player.channeling       // Currently channeling
player.moving           // Currently moving
player.health_pct       // Player health percentage
```

---

## Actions

### `cast(spell)` — Cast a Spell

Returns an action to cast the given spell on the primary target.

```rhai
cast(spell.kill_command)
```

### `cast_on(spell, target)` — Cast on Specific Target

```rhai
cast_on(spell.multi_shot, target.aoe_center)
```

### `wait(seconds)` — Wait Duration

```rhai
wait(0.5)  // Wait 500ms
```

### `wait_gcd()` — Wait for GCD

```rhai
wait_gcd()
```

### `pool(spell, max_wait)` — Pool Resources

Wait for resources to cast spell, up to max_wait seconds.

```rhai
pool(spell.kill_command, 1.0)
```

### `none()` — No Action

Explicitly return no action.

```rhai
none()
```

---

## Script Structure

Scripts are evaluated top-to-bottom. The **first action returned** is executed.

```rhai
// Priority 1: Maintain Bestial Wrath
if spell.bestial_wrath.ready() {
    cast(spell.bestial_wrath)
}

// Priority 2: Kill Command on cooldown
else if spell.kill_command.ready() && power.focus >= 30 {
    cast(spell.kill_command)
}

// Priority 3: Maintain Frenzy stacks
else if spell.barbed_shot.ready() && aura.frenzy.remaining < 2.0 {
    cast(spell.barbed_shot)
}

// Priority 4: Cobra Shot as filler
else if spell.cobra_shot.ready() && power.focus >= 35 {
    cast(spell.cobra_shot)
}

// Nothing to do
else {
    wait_gcd()
}
```

---

## Complete Example: Beast Mastery Hunter

```rhai
// Cooldowns
if spell.bestial_wrath.ready() {
    cast(spell.bestial_wrath)
}

// Call of the Wild (if talented)
if spell.call_of_the_wild.ready() && aura.bestial_wrath.up {
    cast(spell.call_of_the_wild)
}

// Kill Command - high priority
if spell.kill_command.ready() {
    cast(spell.kill_command)
}

// Barbed Shot - maintain Frenzy, don't overcap charges
if spell.barbed_shot.ready() && (
    aura.frenzy.remaining < 2.0 ||
    spell.barbed_shot.charges == spell.barbed_shot.max_charges
) {
    cast(spell.barbed_shot)
}

// Dire Beast
if spell.dire_beast.ready() {
    cast(spell.dire_beast)
}

// Kill Shot in execute
if spell.kill_shot.ready() && target.health_pct < 0.2 {
    cast(spell.kill_shot)
}

// Cobra Shot filler
if spell.cobra_shot.ready() && power.focus >= 50 {
    cast(spell.cobra_shot)
}

// Wait for something
wait_gcd()
```

---

## Advanced Patterns

### Resource Pooling

```rhai
// Pool focus for Kill Command if close to ready
if spell.kill_command.cooldown < 1.0 && power.focus < 30 {
    pool(spell.kill_command, 1.0)
}
```

### Conditional Cooldown Usage

```rhai
// Only use cooldowns if fight is long enough
if spell.bestial_wrath.ready() && fight.remains > 15.0 {
    cast(spell.bestial_wrath)
}
```

### Stack Management

```rhai
// Refresh at max stacks for pandemic
if spell.barbed_shot.ready() && aura.frenzy.stacks == 3 && aura.frenzy.refreshable {
    cast(spell.barbed_shot)
}
```

### Multi-Target

```rhai
// Multi-Shot to apply Beast Cleave
if fight.enemies >= 2 && aura.beast_cleave.remaining < 0.5 {
    cast(spell.multi_shot)
}
```

---

## Implementation Notes

### Namespace Object Pattern

Each namespace (`spell`, `aura`, `power`) is a Rhai object with custom indexer:

```rust
// spell.kill_command triggers:
engine.register_indexer_get(|spells: &SpellNamespace, name: &str| -> SpellHandle {
    spells.get(name)
});
```

### Property Access Pattern

Properties like `.ready` are registered as getters:

```rust
engine.register_get("ready", |h: &SpellHandle| -> bool {
    h.is_ready()
});
```

### Performance Characteristics

| Operation | Cost |
|-----------|------|
| Namespace lookup (`spell.x`) | ~500ns |
| Property access (`.ready`) | ~200ns |
| Method call (`.ready()`) | ~300ns |
| Full script eval | ~2.5μs |

For a 5-minute fight with 1500ms average decision interval, expect ~200 script evaluations = ~0.5ms total overhead.

---

## Error Handling

Invalid spell/aura names return a "null" handle where:
- `.ready` = `false`
- `.up` = `false`
- `.stacks` = `0`
- `.cooldown` = `999999.0`

This allows scripts to reference optional/talented spells without crashing.
