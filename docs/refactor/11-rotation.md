# Phase 11: Rotation

## Goal

Create the rotation system with Rhai scripting integration.

## Prerequisites

Phase 10 complete. `cargo test -p engine_new` passes (118 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod rotation;
└── rotation/
    ├── mod.rs
    ├── action.rs
    ├── script.rs
    └── bindings.rs
```

## Specifications

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
pub mod stats;
pub mod resource;
pub mod combat;
pub mod aura;
pub mod proc;
pub mod actor;
pub mod spec;
pub mod sim;
pub mod rotation;
```

### Update `Cargo.toml`

```toml
[dependencies]
rhai = { version = "1", features = ["sync", "no_function", "no_module"] }
```

### `src/rotation/mod.rs`

```rust
mod action;
mod script;
mod bindings;

pub use action::*;
pub use script::*;
pub use bindings::*;

#[cfg(test)]
mod tests;
```

### `src/rotation/action.rs`

```rust
use crate::types::{SpellIdx, TargetIdx};

/// An action to take
#[derive(Clone, Debug, PartialEq)]
pub enum Action {
    /// Cast a spell on target
    Cast { spell: SpellIdx, target: TargetIdx },
    /// Use item
    UseItem { item_id: u32 },
    /// Wait for specific duration
    Wait { ms: u32 },
    /// Wait for GCD to end
    WaitGcd,
    /// Wait for resource
    WaitResource { amount: f32 },
    /// Pool resource (wait, but don't exceed pool time)
    Pool { spell: SpellIdx, max_wait: u32 },
    /// Cancel current cast/channel
    CancelAction,
    /// No action available
    None,
}

impl Action {
    /// Create a cast action on primary target
    pub fn cast(spell: SpellIdx) -> Self {
        Self::Cast { spell, target: TargetIdx(0) }
    }

    /// Create a cast action on specific target
    pub fn cast_on(spell: SpellIdx, target: TargetIdx) -> Self {
        Self::Cast { spell, target }
    }

    /// Wait specific time
    pub fn wait(ms: u32) -> Self {
        Self::Wait { ms }
    }

    /// Is this a valid action?
    pub fn is_valid(&self) -> bool {
        !matches!(self, Action::None)
    }

    /// Is this a cast action?
    pub fn is_cast(&self) -> bool {
        matches!(self, Action::Cast { .. })
    }
}

/// Priority of an action
#[derive(Clone, Debug)]
pub struct PrioritizedAction {
    pub action: Action,
    pub priority: i32,
    pub condition_id: u32, // For debugging
}

impl PrioritizedAction {
    pub fn new(action: Action, priority: i32) -> Self {
        Self {
            action,
            priority,
            condition_id: 0,
        }
    }

    pub fn with_condition_id(mut self, id: u32) -> Self {
        self.condition_id = id;
        self
    }
}

/// Action list (priority queue of actions)
#[derive(Clone, Debug, Default)]
pub struct ActionList {
    actions: Vec<PrioritizedAction>,
}

impl ActionList {
    pub fn new() -> Self {
        Self { actions: Vec::new() }
    }

    /// Add action with priority
    pub fn add(&mut self, action: Action, priority: i32) {
        self.actions.push(PrioritizedAction::new(action, priority));
    }

    /// Get highest priority valid action
    pub fn best(&self) -> Option<&Action> {
        self.actions
            .iter()
            .filter(|a| a.action.is_valid())
            .max_by_key(|a| a.priority)
            .map(|a| &a.action)
    }

    /// Clear all actions
    pub fn clear(&mut self) {
        self.actions.clear();
    }

    /// Is empty?
    pub fn is_empty(&self) -> bool {
        self.actions.is_empty()
    }
}
```

### `src/rotation/script.rs`

```rust
use rhai::{Engine, Scope, AST, Dynamic, EvalAltResult};
use crate::types::{SpellIdx, TargetIdx, AuraIdx, SimTime};
use super::{Action, ActionList};

/// Compiled rotation script
pub struct RotationScript {
    /// Rhai engine
    engine: Engine,
    /// Compiled AST
    ast: AST,
    /// Script source (for debugging)
    source: String,
}

impl RotationScript {
    /// Compile a rotation script
    pub fn compile(source: &str) -> Result<Self, String> {
        let engine = Self::create_engine();

        let ast = engine.compile(source)
            .map_err(|e| format!("Compilation error: {}", e))?;

        Ok(Self {
            engine,
            ast,
            source: source.to_string(),
        })
    }

    /// Create engine with custom types and functions
    fn create_engine() -> Engine {
        let mut engine = Engine::new();

        // Disable features for safety
        engine.set_max_expr_depths(64, 32);
        engine.set_max_operations(10000);

        // Register Action type
        engine.register_type_with_name::<Action>("Action");

        // Register action constructors
        engine.register_fn("cast", |spell_id: i64| -> Action {
            Action::cast(SpellIdx(spell_id as u16))
        });

        engine.register_fn("cast_on", |spell_id: i64, target: i64| -> Action {
            Action::cast_on(SpellIdx(spell_id as u16), TargetIdx(target as u8))
        });

        engine.register_fn("wait", |ms: i64| -> Action {
            Action::wait(ms as u32)
        });

        engine.register_fn("wait_gcd", || -> Action {
            Action::WaitGcd
        });

        engine.register_fn("pool", |spell_id: i64, max_wait: i64| -> Action {
            Action::Pool {
                spell: SpellIdx(spell_id as u16),
                max_wait: max_wait as u32,
            }
        });

        engine.register_fn("none", || -> Action {
            Action::None
        });

        engine
    }

    /// Execute the rotation script with context
    pub fn execute(&self, ctx: &ScriptContext) -> Result<Action, String> {
        let mut scope = Scope::new();

        // Inject context values
        scope.push_constant("now", ctx.now_ms as i64);
        scope.push_constant("gcd_remaining", ctx.gcd_remaining as i64);
        scope.push_constant("resource", ctx.resource);
        scope.push_constant("resource_max", ctx.resource_max);
        scope.push_constant("resource_deficit", ctx.resource_deficit);
        scope.push_constant("target_health", ctx.target_health);
        scope.push_constant("fight_remains", ctx.fight_remains);
        scope.push_constant("enemy_count", ctx.enemy_count as i64);
        scope.push_constant("pet_active", ctx.pet_active);

        // Inject buff check functions
        let buffs = ctx.buffs.clone();
        self.engine.register_fn("buff_up", move |aura_id: i64| -> bool {
            buffs.contains(&(aura_id as u16))
        });

        let buff_stacks = ctx.buff_stacks.clone();
        self.engine.register_fn("buff_stacks", move |aura_id: i64| -> i64 {
            buff_stacks.get(&(aura_id as u16)).copied().unwrap_or(0) as i64
        });

        let debuffs = ctx.debuffs.clone();
        self.engine.register_fn("debuff_up", move |aura_id: i64| -> bool {
            debuffs.contains(&(aura_id as u16))
        });

        let cooldowns = ctx.cooldowns.clone();
        self.engine.register_fn("cooldown_ready", move |spell_id: i64| -> bool {
            cooldowns.get(&(spell_id as u16)).copied().unwrap_or(0) == 0
        });

        let cooldown_remains = ctx.cooldowns.clone();
        self.engine.register_fn("cooldown_remains", move |spell_id: i64| -> i64 {
            cooldown_remains.get(&(spell_id as u16)).copied().unwrap_or(0) as i64
        });

        // Execute
        self.engine.eval_ast_with_scope::<Action>(&mut scope, &self.ast)
            .map_err(|e| format!("Execution error: {}", e))
    }
}

/// Context passed to rotation script
#[derive(Clone, Debug, Default)]
pub struct ScriptContext {
    pub now_ms: u32,
    pub gcd_remaining: u32,
    pub resource: f32,
    pub resource_max: f32,
    pub resource_deficit: f32,
    pub target_health: f32,
    pub fight_remains: f32,
    pub enemy_count: usize,
    pub pet_active: bool,
    pub buffs: std::collections::HashSet<u16>,
    pub buff_stacks: std::collections::HashMap<u16, u8>,
    pub debuffs: std::collections::HashSet<u16>,
    pub cooldowns: std::collections::HashMap<u16, u32>,
}

impl ScriptContext {
    pub fn new() -> Self {
        Self::default()
    }

    /// Build from simulation state
    pub fn from_sim(state: &crate::sim::SimState) -> Self {
        let now = state.now();

        let mut ctx = Self {
            now_ms: now.as_millis(),
            gcd_remaining: state.player.gcd_remaining(now).as_millis(),
            target_health: state.enemies.primary().map(|e| e.health_percent()).unwrap_or(1.0),
            fight_remains: state.remaining().as_secs_f32(),
            enemy_count: state.enemies.alive_count(),
            pet_active: state.pets.active_count(now) > 0,
            ..Default::default()
        };

        // Add resource info
        if let Some(ref primary) = state.player.resources.primary {
            ctx.resource = primary.current;
            ctx.resource_max = primary.max;
            ctx.resource_deficit = primary.deficit();
        }

        // Add buff tracking
        for aura in state.player.buffs.iter() {
            if aura.is_active(now) {
                ctx.buffs.insert(aura.aura_id.0);
                ctx.buff_stacks.insert(aura.aura_id.0, aura.stacks);
            }
        }

        ctx
    }
}
```

### `src/rotation/bindings.rs`

```rust
use crate::types::{SpellIdx, AuraIdx};
use crate::sim::SimState;
use super::{Action, RotationScript, ScriptContext};

/// Spell constants for a spec
pub trait SpellBindings {
    /// Get spell ID by name
    fn spell(&self, name: &str) -> Option<SpellIdx>;
    /// Get aura ID by name
    fn aura(&self, name: &str) -> Option<AuraIdx>;
}

/// Simple spell binding map
#[derive(Clone, Debug, Default)]
pub struct SpellMap {
    spells: std::collections::HashMap<String, SpellIdx>,
    auras: std::collections::HashMap<String, AuraIdx>,
}

impl SpellMap {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register_spell(&mut self, name: &str, id: SpellIdx) {
        self.spells.insert(name.to_lowercase(), id);
    }

    pub fn register_aura(&mut self, name: &str, id: AuraIdx) {
        self.auras.insert(name.to_lowercase(), id);
    }
}

impl SpellBindings for SpellMap {
    fn spell(&self, name: &str) -> Option<SpellIdx> {
        self.spells.get(&name.to_lowercase()).copied()
    }

    fn aura(&self, name: &str) -> Option<AuraIdx> {
        self.auras.get(&name.to_lowercase()).copied()
    }
}

/// Rotation handler trait
pub trait Rotation {
    /// Get next action to perform
    fn next_action(&self, state: &SimState) -> Action;

    /// Get rotation name
    fn name(&self) -> &str;
}

/// Script-based rotation
pub struct ScriptedRotation {
    script: RotationScript,
    name: String,
}

impl ScriptedRotation {
    pub fn new(name: impl Into<String>, source: &str) -> Result<Self, String> {
        Ok(Self {
            script: RotationScript::compile(source)?,
            name: name.into(),
        })
    }
}

impl Rotation for ScriptedRotation {
    fn next_action(&self, state: &SimState) -> Action {
        let ctx = ScriptContext::from_sim(state);
        self.script.execute(&ctx).unwrap_or(Action::None)
    }

    fn name(&self) -> &str {
        &self.name
    }
}

/// Simple hardcoded rotation for testing
pub struct SimpleRotation {
    priority: Vec<SpellIdx>,
    name: String,
}

impl SimpleRotation {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            priority: Vec::new(),
            name: name.into(),
        }
    }

    pub fn add(mut self, spell: SpellIdx) -> Self {
        self.priority.push(spell);
        self
    }
}

impl Rotation for SimpleRotation {
    fn next_action(&self, state: &SimState) -> Action {
        let now = state.now();

        // Skip if on GCD
        if state.player.on_gcd(now) {
            return Action::WaitGcd;
        }

        // Find first usable spell
        for &spell in &self.priority {
            let can_use = state.player.cooldown(spell)
                .map(|cd| cd.is_ready(now))
                .unwrap_or(true);

            if can_use {
                return Action::cast(spell);
            }
        }

        Action::None
    }

    fn name(&self) -> &str {
        &self.name
    }
}
```

### `src/rotation/tests.rs`

```rust
use super::*;
use crate::types::*;

#[test]
fn action_cast() {
    let action = Action::cast(SpellIdx(123));

    assert!(action.is_valid());
    assert!(action.is_cast());
}

#[test]
fn action_none() {
    let action = Action::None;

    assert!(!action.is_valid());
    assert!(!action.is_cast());
}

#[test]
fn action_list_best() {
    let mut list = ActionList::new();

    list.add(Action::cast(SpellIdx(1)), 10);
    list.add(Action::cast(SpellIdx(2)), 20);
    list.add(Action::cast(SpellIdx(3)), 5);

    let best = list.best().unwrap();
    assert!(matches!(best, Action::Cast { spell: SpellIdx(2), .. }));
}

#[test]
fn action_list_empty() {
    let list = ActionList::new();

    assert!(list.is_empty());
    assert!(list.best().is_none());
}

#[test]
fn script_compile_simple() {
    let source = r#"
        cast(123)
    "#;

    let script = RotationScript::compile(source);
    assert!(script.is_ok());
}

#[test]
fn script_compile_conditional() {
    let source = r#"
        if resource > 50.0 {
            cast(123)
        } else {
            wait(100)
        }
    "#;

    let script = RotationScript::compile(source);
    assert!(script.is_ok());
}

#[test]
fn script_execute_simple() {
    let source = "cast(42)";
    let script = RotationScript::compile(source).unwrap();

    let ctx = ScriptContext::default();
    let result = script.execute(&ctx);

    assert!(result.is_ok());
    assert!(matches!(result.unwrap(), Action::Cast { spell: SpellIdx(42), .. }));
}

#[test]
fn script_execute_conditional() {
    let source = r#"
        if resource > 50.0 {
            cast(1)
        } else {
            cast(2)
        }
    "#;
    let script = RotationScript::compile(source).unwrap();

    // High resource
    let mut ctx = ScriptContext::default();
    ctx.resource = 75.0;
    let result = script.execute(&ctx).unwrap();
    assert!(matches!(result, Action::Cast { spell: SpellIdx(1), .. }));

    // Low resource
    ctx.resource = 25.0;
    let result = script.execute(&ctx).unwrap();
    assert!(matches!(result, Action::Cast { spell: SpellIdx(2), .. }));
}

#[test]
fn script_context_from_sim() {
    let config = crate::sim::SimConfig::default();
    let player = crate::actor::Player::new(SpecId::BeastMastery);
    let state = crate::sim::SimState::new(config, player);

    let ctx = ScriptContext::from_sim(&state);

    assert_eq!(ctx.now_ms, 0);
    assert_eq!(ctx.enemy_count, 1);
}

#[test]
fn spell_map_lookup() {
    let mut map = SpellMap::new();
    map.register_spell("Kill Command", SpellIdx(34026));
    map.register_spell("Cobra Shot", SpellIdx(193455));

    assert_eq!(map.spell("kill command"), Some(SpellIdx(34026)));
    assert_eq!(map.spell("COBRA SHOT"), Some(SpellIdx(193455)));
    assert_eq!(map.spell("Unknown"), None);
}

#[test]
fn simple_rotation() {
    let rotation = SimpleRotation::new("Test")
        .add(SpellIdx(1))
        .add(SpellIdx(2))
        .add(SpellIdx(3));

    assert_eq!(rotation.name(), "Test");
}

#[test]
fn script_wait_gcd() {
    let source = "wait_gcd()";
    let script = RotationScript::compile(source).unwrap();

    let ctx = ScriptContext::default();
    let result = script.execute(&ctx).unwrap();

    assert!(matches!(result, Action::WaitGcd));
}

#[test]
fn script_pool() {
    let source = "pool(123, 2000)";
    let script = RotationScript::compile(source).unwrap();

    let ctx = ScriptContext::default();
    let result = script.execute(&ctx).unwrap();

    assert!(matches!(result, Action::Pool { spell: SpellIdx(123), max_wait: 2000 }));
}
```

## Dependencies

Add to `Cargo.toml`:

```toml
rhai = { version = "1", features = ["sync", "no_function", "no_module"] }
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (118 + 14 = 132 tests).

## Todo Checklist

- [ ] Add `rhai` to `Cargo.toml`
- [ ] Update `src/lib.rs` to add `pub mod rotation;`
- [ ] Create `src/rotation/mod.rs`
- [ ] Create `src/rotation/action.rs`
- [ ] Create `src/rotation/script.rs`
- [ ] Create `src/rotation/bindings.rs`
- [ ] Create `src/rotation/tests.rs`
- [ ] Run `cargo test` — 132 tests pass
