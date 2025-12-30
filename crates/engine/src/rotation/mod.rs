//! Rotation module with Rhai AST-based condition extraction and predictive gating.
//!
//! # Rhai Rotation Script Syntax
//!
//! Rotation scripts use standard Rhai syntax with if statements:
//!
//! ```rhai
//! // Cast spell if condition is true
//! if bestial_wrath.ready() { cast("bestial_wrath") }
//! if kill_command.ready() { cast("kill_command") }
//!
//! // Multiple conditions
//! if hot_streak.active() && pyroblast.ready() { cast("pyroblast") }
//!
//! // Unconditional (always try to cast)
//! if true { cast("fireball") }
//! ```
//!
//! ## Supported Conditions
//!
//! - `spell_name.ready()` - Spell is off cooldown (or has charges)
//! - `aura_name.active()` - Aura/buff is currently active
//! - Logical operators: `&&`, `||`, `!`
//!
//! ## Predictive Gating
//!
//! The compiler walks the Rhai AST to extract conditions and classify their
//! dependencies. Conditions that can't become true until a specific time
//! are marked as Disabled and skipped during evaluation, reducing CPU usage.

mod compiler;
mod condition;
mod engine;

pub use compiler::RotationError;
pub use engine::{PredictiveRotation, RotationStats};
