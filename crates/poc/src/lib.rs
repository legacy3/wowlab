//! # Rotation Script Compiler
//!
//! High-performance rotation compiler using Rhai's `optimize_ast()` for
//! compile-time branch elimination.
//!
//! ## Syntax
//!
//! Use `$` prefix for state lookups (distinguished from local variables):
//!
//! ```text
//! $talent.foo.enabled  → talent_foo_enabled  (static, foldable)
//! $spell.fireball      → "fireball"          (spell name string)
//! $spell.fire.ready()  → spell.fire.ready()  (dynamic method)
//! talent.foo.enabled   → talent.foo.enabled  (local var, unchanged)
//! ```
//!
//! ## Architecture
//!
//! ```text
//! ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
//! │  preprocess  │ -> │   compile    │ -> │   optimize   │ -> │   extract    │
//! │              │    │              │    │              │    │              │
//! │ $talent.x.y  │    │ Parse AST,   │    │ Fold consts, │    │ Walk AST,    │
//! │ → talent_x_y │    │ build schema │    │ dead code    │    │ find action  │
//! └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
//! ```
//!
//! ## Performance
//!
//! | Operation | Cost | When |
//! |-----------|------|------|
//! | `optimize()` | ~11 μs | On state change |
//! | `evaluate_optimized()` | ~0.09 μs | Every tick |
//! | Plain Rhai | ~1.3 μs | Every tick |

pub mod action;
pub mod compiler;
pub mod eval;
pub mod preprocess;
pub mod schema;

// Re-exports
pub use action::Action;
pub use compiler::RotationCompiler;
pub use eval::PlainEvaluator;
pub use preprocess::NamespaceConfig;
pub use schema::{GameState, StateSchema};

// Legacy aliases
pub type RotationFast = RotationCompiler;
pub type FastGameState = GameState;
pub type RotationPlain = PlainEvaluator;
pub type Preprocessor = NamespaceConfig;
