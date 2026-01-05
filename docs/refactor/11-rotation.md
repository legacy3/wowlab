# Phase 11: Rotation

## Goal

Create a high-performance rotation system using Rhai scripting with AST optimization caching.

## Prerequisites

Phase 10 complete. `cargo test -p engine` passes.

## Key Insight

Rotation scripts are **pure** - they cannot mutate game state. This means:
- `$talent.foo.enabled` returns the same value everywhere in one tick
- `$spell.bar.ready()` returns the same value everywhere in one tick

So we can:
1. Extract ALL method calls during preprocessing
2. Evaluate each ONCE per tick
3. Inject ALL values (properties + method results) as constants
4. Let Rhai's optimizer aggressively fold and eliminate dead branches

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPILE TIME (once)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Preprocess: $state lookups → flat variables, extract method calls   │
│  2. Parse: Rhai compiles to unoptimized AST                             │
│  3. Schema: Extract all variable names from AST                         │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATIC OPTIMIZATION (on talent/config change)        │
├─────────────────────────────────────────────────────────────────────────┤
│  4. optimize_partial(): Bake in talents, config → partial AST           │
│     - Eliminates talent branches that will never be taken               │
│     - Only re-run when talents/config change (rarely)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    DYNAMIC OPTIMIZATION (on state change)               │
├─────────────────────────────────────────────────────────────────────────┤
│  5. Evaluate method calls ONCE (spell.ready(), aura.stacks(), etc.)     │
│  6. optimize_from_partial(): Inject dynamic state → final AST           │
│     - Eliminates branches based on cooldowns, resources, buffs          │
│     - Re-run when game state changes                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         TICK EXECUTION (every tick)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  7. evaluate_optimized(): Walk minimal AST → Action                     │
│     - AST is already folded to just the action string                   │
│     - ~0.05 μs per tick                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Script Syntax

Use `$` prefix for state lookups (distinguished from local variables):

```rhai
// Properties → flattened to constants
$talent.killer_instinct.enabled  → talent_killer_instinct_enabled
$target.health_pct               → target_health_pct
$power.focus                     → power_focus
$aura.frenzy.remaining           → aura_frenzy_remaining

// Spell names → stringified for cast()
$spell.kill_command              → "kill_command"

// Method calls → extracted, evaluated once per tick
$spell.kill_command.ready()      → __m0
$aura.frenzy.stacks()            → __m1

// Local variables → unchanged
let x = 5;
x + 1                            → x + 1
```

### Namespace Configuration

| Namespace | Behavior | Example |
|-----------|----------|---------|
| `talent` | Flatten | `$talent.x.enabled` → `talent_x_enabled` |
| `target` | Flatten | `$target.health` → `target_health` |
| `power` | Flatten | `$power.focus` → `power_focus` |
| `aura` | Flatten | `$aura.x.stacks` → `aura_x_stacks` |
| `cooldown` | Flatten | `$cooldown.x.ready` → `cooldown_x_ready` |
| `player` | Flatten | `$player.level` → `player_level` |
| `config` | Flatten | `$config.aoe` → `config_aoe` |
| `spell` | Stringify | `$spell.fireball` → `"fireball"` |

## Performance

| Operation | Cost | When |
|-----------|------|------|
| `optimize_partial()` | ~12 μs | On talent/config change |
| `optimize_from_partial()` | ~2 μs | On state change |
| `evaluate_optimized()` | ~0.05 μs | Every tick |
| Plain Rhai eval | ~1.6 μs | Every tick |

**Results:**
- **6.6x speedup** vs plain Rhai (10 ticks per state change)
- **Break-even: 1.1 ticks** — always worth optimizing

## Files to Create

```
src/
├── lib.rs              # Add: pub mod rotation;
└── rotation/
    ├── mod.rs
    ├── action.rs       # Action enum
    ├── preprocess.rs   # Script preprocessing
    ├── schema.rs       # StateSchema & GameState
    ├── compiler.rs     # RotationCompiler
    └── bindings.rs     # Game state bindings
```

## Specifications

### Update `Cargo.toml`

```toml
[dependencies]
rhai = { version = "1", features = ["sync", "no_function", "no_module"] }
```

### `src/rotation/action.rs`

```rust
use rhai::{ASTNode, Expr, Stmt, AST};

/// Action to perform - the output of rotation evaluation.
#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    Cast(String),
    CastOn(String, String),
    Wait(f64),
    WaitGcd,
    Pool(String, f64),
    None,
}

/// Action encoding prefixes used by registered functions.
pub mod encoding {
    pub const CAST: &str = "CAST:";
    pub const WAIT: &str = "WAIT:";
    pub const WAIT_GCD: &str = "WAIT_GCD";
}

/// Extract the first action from an optimized AST.
pub fn extract(ast: &AST) -> Action {
    let mut action = Action::None;

    ast.walk(&mut |nodes: &[ASTNode]| {
        if let Some(a) = nodes.last().and_then(try_extract_action) {
            action = a;
            return false; // stop walking
        }
        true
    });

    action
}

fn try_extract_action(node: &ASTNode) -> Option<Action> {
    let expr = match node {
        ASTNode::Stmt(Stmt::Expr(e)) => e.as_ref(),
        ASTNode::Expr(e) => e,
        _ => return None,
    };

    if let Expr::StringConstant(s, _) = expr {
        return parse_action_string(s.as_str());
    }
    None
}

fn parse_action_string(s: &str) -> Option<Action> {
    if let Some(spell) = s.strip_prefix(encoding::CAST) {
        Some(Action::Cast(spell.to_string()))
    } else if let Some(secs) = s.strip_prefix(encoding::WAIT) {
        secs.parse().ok().map(Action::Wait)
    } else if s == encoding::WAIT_GCD {
        Some(Action::WaitGcd)
    } else {
        None
    }
}
```

### `src/rotation/preprocess.rs`

```rust
use std::collections::HashSet;

/// Result of preprocessing a script.
#[derive(Debug, Clone)]
pub struct TransformResult {
    pub script: String,
    pub method_calls: Vec<MethodCall>,
}

/// An extracted method call.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct MethodCall {
    /// Placeholder variable name (e.g., "__m0").
    pub var: String,
    /// Namespace (e.g., "spell", "aura").
    pub namespace: String,
    /// Path segments (e.g., ["kill_command"]).
    pub path: Vec<String>,
    /// Method name (e.g., "ready").
    pub method: String,
}

/// Namespace configuration.
#[derive(Clone, Debug)]
pub struct NamespaceConfig {
    pub flatten: HashSet<&'static str>,
    pub stringify: HashSet<&'static str>,
}

impl Default for NamespaceConfig {
    fn default() -> Self {
        Self {
            flatten: ["talent", "aura", "config", "target", "power", "player", "cooldown"]
                .into_iter()
                .collect(),
            stringify: ["spell"].into_iter().collect(),
        }
    }
}

/// Transform a script, extracting method calls.
pub fn transform(script: &str, config: &NamespaceConfig) -> TransformResult {
    // ... character-by-character transformation
    // See crates/poc/src/preprocess.rs for full implementation
}
```

### `src/rotation/schema.rs`

```rust
use crate::rotation::preprocess::MethodCall;
use rhai::{Dynamic, Scope};
use std::collections::HashMap;

/// Schema mapping variable names to slot indices.
#[derive(Debug, Default, Clone)]
pub struct StateSchema {
    keys: Vec<String>,
    slots: HashMap<String, usize>,
    method_calls: Vec<MethodCall>,
}

impl StateSchema {
    pub fn new() -> Self { Self::default() }

    pub fn register(&mut self, name: &str) -> usize {
        if let Some(&slot) = self.slots.get(name) {
            slot
        } else {
            let slot = self.keys.len();
            self.keys.push(name.to_string());
            self.slots.insert(name.to_string(), slot);
            slot
        }
    }

    pub fn set_method_calls(&mut self, calls: Vec<MethodCall>) {
        self.method_calls = calls;
    }

    pub fn method_calls(&self) -> &[MethodCall] { &self.method_calls }
    pub fn slot(&self, name: &str) -> Option<usize> { self.slots.get(name).copied() }
    pub fn keys(&self) -> &[String] { &self.keys }
    pub fn len(&self) -> usize { self.keys.len() }
}

/// Game state using slot-indexed arrays.
#[derive(Clone, Debug)]
pub struct GameState {
    values: Vec<Dynamic>,
}

impl GameState {
    pub fn new(schema: &StateSchema) -> Self {
        Self { values: vec![Dynamic::UNIT; schema.len()] }
    }

    pub fn set(&mut self, slot: usize, value: Dynamic) { self.values[slot] = value; }
    pub fn set_bool(&mut self, slot: usize, value: bool) { self.values[slot] = Dynamic::from(value); }
    pub fn set_int(&mut self, slot: usize, value: i64) { self.values[slot] = Dynamic::from(value); }
    pub fn set_float(&mut self, slot: usize, value: f64) { self.values[slot] = Dynamic::from(value); }

    pub fn to_scope<'a>(&self, schema: &'a StateSchema) -> Scope<'a> {
        let mut scope = Scope::new();
        for (key, value) in schema.keys().iter().zip(self.values.iter()) {
            scope.push_constant_dynamic(key.as_str(), value.clone());
        }
        scope
    }
}
```

### `src/rotation/compiler.rs`

```rust
use crate::rotation::{action, preprocess, Action, GameState, NamespaceConfig, StateSchema};
use rhai::{ASTNode, Dynamic, Engine, Expr, OptimizationLevel, AST};

/// Rotation script compiler using AST optimization caching.
pub struct RotationCompiler {
    engine: Engine,
    base_ast: AST,
    schema: StateSchema,
}

impl RotationCompiler {
    pub fn compile(script: &str) -> Result<Self, Box<rhai::EvalAltResult>> {
        Self::compile_with(script, &NamespaceConfig::default())
    }

    pub fn compile_with(script: &str, config: &NamespaceConfig) -> Result<Self, Box<rhai::EvalAltResult>> {
        let result = preprocess::transform(script, config);
        let mut engine = create_engine();

        engine.set_optimization_level(OptimizationLevel::None);
        let base_ast = engine.compile(&result.script)?;

        let mut schema = extract_schema(&base_ast);
        for call in &result.method_calls {
            schema.register(&call.var);
        }
        schema.set_method_calls(result.method_calls);

        Ok(Self { engine, base_ast, schema })
    }

    pub fn schema(&self) -> &StateSchema { &self.schema }
    pub fn new_state(&self) -> GameState { GameState::new(&self.schema) }

    /// Optimize AST with current state (~2 μs from partial, ~12 μs full).
    pub fn optimize(&self, state: &GameState) -> AST {
        let scope = state.to_scope(&self.schema);
        self.engine.optimize_ast(&scope, self.base_ast.clone(), OptimizationLevel::Full)
    }

    /// Extract action from optimized AST (~0.05 μs).
    pub fn evaluate_optimized(&self, optimized: &AST) -> Action {
        action::extract(optimized)
    }

    /// Full evaluation: optimize + extract.
    pub fn evaluate(&self, state: &GameState) -> Action {
        action::extract(&self.optimize(state))
    }

    /// Create partial AST with static state baked in.
    pub fn optimize_partial(&self, static_state: &GameState) -> AST {
        let scope = static_state.to_scope(&self.schema);
        self.engine.optimize_ast(&scope, self.base_ast.clone(), OptimizationLevel::Full)
    }

    /// Optimize from a partial AST (~2 μs).
    pub fn optimize_from_partial(&self, partial: &AST, state: &GameState) -> AST {
        let scope = state.to_scope(&self.schema);
        self.engine.optimize_ast(&scope, partial.clone(), OptimizationLevel::Full)
    }
}

fn create_engine() -> Engine {
    let mut engine = Engine::new();
    engine.register_fn("cast", |spell: &str| Dynamic::from(format!("CAST:{}", spell)));
    engine.register_fn("wait", |secs: f64| Dynamic::from(format!("WAIT:{}", secs)));
    engine.register_fn("wait_gcd", || Dynamic::from("WAIT_GCD".to_string()));
    engine
}

fn extract_schema(ast: &AST) -> StateSchema {
    let mut schema = StateSchema::new();
    ast.walk(&mut |nodes: &[ASTNode]| {
        if let Some(ASTNode::Expr(Expr::Variable(var, _, _))) = nodes.last() {
            schema.register(var.1.as_str());
        }
        true
    });
    schema
}
```

### `src/rotation/bindings.rs`

```rust
use crate::rotation::{Action, GameState, RotationCompiler, StateSchema};
use crate::sim::SimState;

/// Trait for binding game state to rotation state.
pub trait RotationBindings {
    /// Update rotation state from simulation state.
    fn update_state(&self, state: &mut GameState, schema: &StateSchema, sim: &SimState);

    /// Evaluate extracted method calls.
    fn evaluate_methods(&self, schema: &StateSchema, sim: &SimState) -> Vec<(usize, bool)>;
}

/// Rotation handler combining compiler and bindings.
pub struct Rotation<B: RotationBindings> {
    compiler: RotationCompiler,
    bindings: B,
    partial_ast: Option<rhai::AST>,
}

impl<B: RotationBindings> Rotation<B> {
    pub fn new(script: &str, bindings: B) -> Result<Self, String> {
        let compiler = RotationCompiler::compile(script)
            .map_err(|e| e.to_string())?;
        Ok(Self { compiler, bindings, partial_ast: None })
    }

    /// Bake in static state (call when talents change).
    pub fn set_static_state(&mut self, sim: &SimState) {
        let mut state = self.compiler.new_state();
        self.bindings.update_state(&mut state, self.compiler.schema(), sim);
        self.partial_ast = Some(self.compiler.optimize_partial(&state));
    }

    /// Get next action.
    pub fn next_action(&self, sim: &SimState) -> Action {
        let mut state = self.compiler.new_state();
        let schema = self.compiler.schema();

        // Update dynamic state
        self.bindings.update_state(&mut state, schema, sim);

        // Evaluate method calls and inject results
        for (slot, value) in self.bindings.evaluate_methods(schema, sim) {
            state.set_bool(slot, value);
        }

        // Optimize and extract
        let ast = match &self.partial_ast {
            Some(partial) => self.compiler.optimize_from_partial(partial, &state),
            None => self.compiler.optimize(&state),
        };

        self.compiler.evaluate_optimized(&ast)
    }
}
```

## Example Usage

```rust
let script = r#"
    if $talent.killer_instinct.enabled && $target.health_pct < 0.2 {
        cast($spell.kill_shot)
    } else if $spell.bestial_wrath.ready() {
        cast($spell.bestial_wrath)
    } else if $spell.kill_command.ready() && $power.focus >= 30.0 {
        cast($spell.kill_command)
    } else {
        wait_gcd()
    }
"#;

let compiler = RotationCompiler::compile(script)?;

// Get extracted method calls
for call in compiler.schema().method_calls() {
    println!("{} <- ${}.{}.{}()", call.var, call.namespace, call.path.join("."), call.method);
}
// Output:
//   __m0 <- $spell.bestial_wrath.ready()
//   __m1 <- $spell.kill_command.ready()

// Create and populate state
let mut state = compiler.new_state();
let schema = compiler.schema();

// Static state (talents)
state.set_bool(schema.slot("talent_killer_instinct_enabled").unwrap(), true);

// Dynamic state (changes each tick)
state.set_float(schema.slot("target_health_pct").unwrap(), 0.8);
state.set_float(schema.slot("power_focus").unwrap(), 50.0);

// Inject method call results (evaluated once per tick)
state.set_bool(schema.slot("__m0").unwrap(), false); // bestial_wrath not ready
state.set_bool(schema.slot("__m1").unwrap(), true);  // kill_command ready

// Evaluate
let action = compiler.evaluate(&state);
assert_eq!(action, Action::Cast("kill_command".into()));
```

## Success Criteria

```bash
cargo test -p engine
```

All rotation tests pass. Benchmark shows:
- `optimize_from_partial()` < 3 μs
- `evaluate_optimized()` < 0.1 μs
- 5x+ speedup over plain Rhai evaluation

## Reference Implementation

See `crates/poc/` for a complete, tested implementation of this approach.
