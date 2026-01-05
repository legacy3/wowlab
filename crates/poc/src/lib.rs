//! # Rotation Script Compiler
//!
//! High-performance rotation compiler using Rhai's `optimize_ast()` for
//! compile-time branch elimination.
//!
//! # Syntax
//!
//! Use the `$` prefix for state lookups (distinguished from local variables):
//!
//! ```text
//! $talent.foo.enabled  -> talent_foo_enabled  (property -> constant)
//! $spell.fireball      -> "fireball"          (spell name -> string)
//! $spell.fire.ready()  -> __m0                (method -> extracted)
//! talent.foo.enabled   -> talent.foo.enabled  (local var, unchanged)
//! ```
//!
//! # Key Insight
//!
//! Scripts are **pure** - they cannot mutate `$state`. This means:
//! - `$talent.foo.enabled` returns the same value everywhere in one tick
//! - `$spell.bar.ready()` returns the same value everywhere in one tick
//!
//! So we extract ALL method calls, evaluate ONCE per tick, inject as constants.
//!
//! # Architecture
//!
//! ```text
//! preprocess  ->  compile     ->  optimize    ->  extract
//!
//! $talent.x.y     Parse AST,      Fold consts,    Walk AST,
//! -> talent_x_y   extract         dead code       find action
//! $spell.x()      method_calls    elimination
//! -> __m0
//! ```
//!
//! # Performance
//!
//! | Operation | Cost | When |
//! |-----------|------|------|
//! | `optimize()` | ~11 us | On state change |
//! | `evaluate_optimized()` | ~0.09 us | Every tick |
//! | Plain Rhai | ~1.3 us | Every tick |
//!
//! # Example
//!
//! ```
//! use poc::{RotationCompiler, Action};
//!
//! let script = r#"
//!     if $talent.killer.enabled && $target.health < 0.2 {
//!         cast($spell.execute)
//!     } else {
//!         cast($spell.filler)
//!     }
//! "#;
//!
//! let compiler = RotationCompiler::compile(script).unwrap();
//! let mut state = compiler.new_state();
//!
//! // Set state values
//! let talent_slot = compiler.schema().slot("talent_killer_enabled").unwrap();
//! let health_slot = compiler.schema().slot("target_health").unwrap();
//! state.set_bool(talent_slot, true);
//! state.set_float(health_slot, 0.1);
//!
//! // Evaluate
//! assert_eq!(compiler.evaluate(&state), Action::Cast("execute".into()));
//! ```

pub mod action;
pub mod compiler;
pub mod eval;
pub mod preprocess;
pub mod schema;

// Re-exports for public API
pub use action::Action;
pub use compiler::RotationCompiler;
pub use eval::PlainEvaluator;
pub use preprocess::{MethodCall, NamespaceConfig};
pub use schema::{GameState, StateSchema};
