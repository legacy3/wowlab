//! High-performance rotation system using Rhai scripting with AST optimization.
//!
//! # Key Insight
//!
//! Rotation scripts are **pure** - they cannot mutate game state. This means:
//! - `$talent.foo.enabled` returns the same value everywhere in one tick
//! - `$spell.bar.ready()` returns the same value everywhere in one tick
//!
//! So we can:
//! 1. Extract ALL method calls during preprocessing
//! 2. Evaluate each ONCE per tick
//! 3. Inject ALL values (properties + method results) as constants
//! 4. Let Rhai's optimizer aggressively fold and eliminate dead branches
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         COMPILE TIME (once)                             │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │  1. Preprocess: $state lookups → flat variables, extract method calls   │
//! │  2. Parse: Rhai compiles to unoptimized AST                             │
//! │  3. Schema: Extract all variable names from AST                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                                    ↓
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    STATIC OPTIMIZATION (on talent/config change)        │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │  4. optimize_partial(): Bake in talents, config → partial AST           │
//! │     - Eliminates talent branches that will never be taken               │
//! │     - Only re-run when talents/config change (rarely)                   │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                                    ↓
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    DYNAMIC OPTIMIZATION (on state change)               │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │  5. Evaluate method calls ONCE (spell.ready(), aura.stacks(), etc.)     │
//! │  6. optimize_from_partial(): Inject dynamic state → final AST           │
//! │     - Eliminates branches based on cooldowns, resources, buffs          │
//! │     - Re-run when game state changes                                    │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                                    ↓
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         TICK EXECUTION (every tick)                     │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │  7. evaluate_optimized(): Walk minimal AST → Action                     │
//! │     - AST is already folded to just the action string                   │
//! │     - ~0.05 μs per tick                                                 │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Script Syntax
//!
//! Use `$` prefix for state lookups (distinguished from local variables):
//!
//! ```text
//! // Properties → flattened to constants
//! $talent.killer_instinct.enabled  → talent_killer_instinct_enabled
//! $target.health_pct               → target_health_pct
//! $power.focus                     → power_focus
//! $aura.frenzy.remaining           → aura_frenzy_remaining
//!
//! // Spell names → stringified for cast()
//! $spell.kill_command              → "kill_command"
//!
//! // Method calls → extracted, evaluated once per tick
//! $spell.kill_command.ready()      → __m0
//! $aura.frenzy.stacks()            → __m1
//!
//! // Local variables → unchanged
//! let x = 5;
//! x + 1                            → x + 1
//! ```
//!
//! # Performance
//!
//! | Operation | Cost | When |
//! |-----------|------|------|
//! | `optimize_partial()` | ~12 μs | On talent/config change |
//! | `optimize_from_partial()` | ~2 μs | On state change |
//! | `evaluate_optimized()` | ~0.05 μs | Every tick |
//! | Plain Rhai eval | ~1.6 μs | Every tick |
//!
//! **Results:**
//! - **6.6x speedup** vs plain Rhai (10 ticks per state change)
//! - **Break-even: 1.1 ticks** — always worth optimizing
//!
//! # Example
//!
//! ```ignore
//! use engine_new::rotation::{RotationCompiler, Action};
//!
//! let script = r#"
//!     if $talent.killer_instinct.enabled && $target.health_pct < 0.2 {
//!         cast($spell.kill_shot)
//!     } else if $spell.bestial_wrath.ready() {
//!         cast($spell.bestial_wrath)
//!     } else if $spell.kill_command.ready() && $power.focus >= 30.0 {
//!         cast($spell.kill_command)
//!     } else {
//!         wait_gcd()
//!     }
//! "#;
//!
//! let compiler = RotationCompiler::compile(script)?;
//!
//! // Get extracted method calls
//! for call in compiler.schema().method_calls() {
//!     println!("{} <- ${}.{}.{}()", call.var, call.namespace, call.path.join("."), call.method);
//! }
//!
//! // Create and populate state
//! let mut state = compiler.new_state();
//! let schema = compiler.schema();
//!
//! // Static state (talents)
//! state.set_bool(schema.slot("talent_killer_instinct_enabled").unwrap(), true);
//!
//! // Dynamic state (changes each tick)
//! state.set_float(schema.slot("target_health_pct").unwrap(), 0.8);
//! state.set_float(schema.slot("power_focus").unwrap(), 50.0);
//!
//! // Inject method call results (evaluated once per tick)
//! state.set_bool(schema.slot("__m0").unwrap(), false); // bestial_wrath not ready
//! state.set_bool(schema.slot("__m1").unwrap(), true);  // kill_command ready
//!
//! // Evaluate
//! let action = compiler.evaluate(&state);
//! assert_eq!(action, Action::Cast("kill_command".into()));
//! ```

pub mod action;
pub mod bindings;
pub mod compiler;
pub mod json_dsl;
pub mod preprocess;
pub mod schema;

#[cfg(test)]
mod tests;

// Re-exports for public API
pub use action::Action;
pub use bindings::{NoOpBindings, Rotation, RotationBindings};
pub use compiler::RotationCompiler;
pub use json_dsl::{JsonRotation, RotationDef, SpellResolver};
pub use preprocess::{MethodCall, NamespaceConfig};
pub use schema::{GameState, StateSchema};
