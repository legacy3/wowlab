# Rhai Scripting System

The simulation engine uses [Rhai](https://rhai.rs/) as an embedded scripting language for rotation logic. This document covers the architecture, APIs, and optimization strategies.

## Architecture Overview

The rotation system lives in `crates/engine/src/rotation/` with a two-pass optimization architecture:

| Module | Purpose |
|--------|---------|
| `compiler.rs` | Rhai engine creation, AST parsing, compilation |
| `bindings.rs` | Game state binding trait and caching layer |
| `preprocess.rs` | Script transformation (`$state` → variables) |
| `schema.rs` | Variable slot mapping and state management |
| `action.rs` | Action extraction from optimized AST |

### Two-Pass Optimization

1. **Static optimization** (on talent change): Bakes talents/config into AST, eliminates dead branches
2. **Dynamic optimization** (on state change): Injects runtime state and optimizes AST
3. **Cached evaluation** (every tick): Reuses optimized AST when state unchanged

## Script Syntax

Scripts use the `$` prefix for state lookups, transformed during preprocessing:

```rhai
// Property access → flattened to variables
$talent.killer_instinct.enabled      → talent_killer_instinct_enabled
$target.health_pct                   → target_health_pct
$power.focus                         → power_focus
$aura.frenzy.remaining               → aura_frenzy_remaining

// Spell names → stringified for cast()
$spell.kill_command                  → "kill_command"

// Method calls → extracted and evaluated once per tick
$spell.kill_command.ready()          → __m0
$aura.frenzy.stacks()                → __m1
```

### Supported Namespaces

- `$spell` - Spell names (stringified for `cast()`)
- `$talent` - Talent configuration (booleans)
- `$aura` - Buff/debuff state (remaining, stacks)
- `$cooldown` - Cooldown state (remaining, ready, charges)
- `$power` - Resource values (focus, mana, etc.)
- `$target` - Target state (health_pct)
- `$player` - Player state
- `$config` - User configuration

## Exposed APIs

### Registered Functions

```rhai
cast(spell: &str) → Action::Cast
// Example: cast("kill_command")

wait(secs: f64) → Action::Wait
// Example: wait(1.5)

wait_gcd() → Action::WaitGcd
// Example: wait_gcd()
```

### Method Calls

Evaluated by spec-specific bindings:

```rhai
$cooldown.spell_name.ready()       → bool
$cooldown.spell_name.has_charge()  → bool
$aura.aura_name.active()           → bool
$aura.aura_name.stacks()           → bool (> 0)
```

## Example Rotation

```rhai
// BM Hunter rotation (rotations/bm_hunter.rhai)
if $cooldown.bestial_wrath.ready() {
    cast($spell.bestial_wrath)
} else if $cooldown.kill_command.ready() && $power.focus >= 30.0 {
    cast($spell.kill_command)
} else if $cooldown.barbed_shot.has_charge() {
    cast($spell.barbed_shot)
} else if $power.focus >= 35.0 {
    cast($spell.cobra_shot)
} else {
    wait_gcd()
}
```

## Execution Flow

### Initialization

1. Script file loaded from disk
2. Preprocessor transforms `$state` lookups to variables
3. Rhai parses to unoptimized AST
4. Schema extracted from AST (all variable names)
5. Stored in static `OnceLock<Rotation<T>>`

### Per-Simulation Setup

1. Create rotation bindings for spec
2. Call `set_static_state()` with player talents
3. Create partial AST with talents baked in
4. Clear dynamic cache

### Per-Tick Execution

```
handler.on_gcd(&mut state)
  → get_rotation().next_action(state)
    → evaluate_methods()           // cooldown.ready(), aura.active()
    → hash method results
    → check cache (hash match = return cached action)
    → cache miss:
      → update state with current values
      → inject method results
      → optimize AST with full state
      → extract action from optimized AST
      → cache result
```

## State Types

### StateSchema

Maps variable names to slot indices for O(1) access:

```rust
pub struct StateSchema {
    slots: HashMap<String, usize>,
    methods: Vec<MethodCall>,
}
```

### GameState

Flat vector of `Dynamic` values indexed by slot:

```rust
pub struct GameState {
    values: Vec<Dynamic>,
    schema: Arc<StateSchema>,
}
```

### Action

```rust
pub enum Action {
    Cast(String),           // Cast a spell
    CastOn(String, String), // Cast on target
    Wait(f64),              // Wait in seconds
    WaitGcd,                // Wait for GCD
    Pool(String, f64),      // Pool resources
    None,                   // No action
}
```

## Adding a New Spec

1. **Create bindings** implementing `RotationBindings` trait:

```rust
// src/specs/your_spec/rotation.rs
impl RotationBindings for YourSpecBindings {
    fn update_state(&self, state: &SimState, game_state: &mut GameState) {
        game_state.set_float("power_mana", state.power.mana);
        game_state.set_float("target_health_pct", state.target.health_pct);
        // ... map all state variables
    }

    fn evaluate_method(&self, state: &SimState, method: &MethodCall) -> bool {
        match (method.namespace.as_str(), method.method.as_str()) {
            ("cooldown", "ready") => {
                let spell = &method.path[0];
                self.is_cooldown_ready(state, spell)
            }
            ("aura", "active") => {
                let aura = &method.path[0];
                self.is_aura_active(state, aura)
            }
            _ => false,
        }
    }
}
```

2. **Create handler** that uses the rotation:

```rust
// src/specs/your_spec/handler.rs
impl SpecHandler for YourSpecHandler {
    fn on_gcd(&self, state: &mut SimState) -> Option<Action> {
        get_rotation().next_action(state, &self.bindings)
    }
}
```

## Performance

| Operation | Time | When |
|-----------|------|------|
| `optimize_partial()` | ~12 μs | On talent change |
| `optimize_from_partial()` | ~2 μs | On state change |
| Cached evaluation | ~0.05 μs | Every tick (cache hit) |
| Plain Rhai eval | ~1.6 μs | Every tick |

**Result:** ~6.6x speedup with 80-90% cache hit rate.

## CLI Commands

### Validate Rotation

```bash
./target/release/engine validate -f rotation.rhai
```

### Run Simulation

```bash
./target/release/engine sim -f rotations/bm_hunter.rhai
```

## Error Handling

- **Compilation errors**: Return `Box<rhai::EvalAltResult>` with line numbers
- **Runtime errors**: Method evaluation failures return `false` (safe default)
- **Unknown spells**: Skip action, reschedule GCD
- **Unknown auras/cooldowns**: Skip those checks

## Key Design Decisions

1. **Pure script model**: Scripts cannot mutate game state, enabling aggressive optimization
2. **Preprocessed lookups**: `$` notation transforms to variables for constant folding
3. **Multi-level caching**: Base AST → partial AST (talents) → optimized AST (dynamic state)
4. **Trait-based bindings**: Each spec implements `RotationBindings` for custom state mapping
5. **Thread-safe storage**: `OnceLock` + `RwLock` for parallel simulations
