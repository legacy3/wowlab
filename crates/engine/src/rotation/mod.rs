//! Rotation scripting with Rhai AST compilation and predictive condition gating.
//!
//! This module provides a high-performance rotation system that:
//! - Parses Rhai scripts at compile time to extract spell priorities
//! - Uses predictive gating to skip conditions that can't be true yet
//! - Tracks when disabled conditions should be re-evaluated
//!
//! # Script Syntax
//!
//! Rotation scripts use Rhai syntax with if statements:
//!
//! ```text
//! // Cooldowns first
//! if bestial_wrath.ready() { cast("bestial_wrath") }
//!
//! // Priority abilities
//! if kill_command.ready() { cast("kill_command") }
//!
//! // Conditional casts
//! if hot_streak.active() && pyroblast.ready() { cast("pyroblast") }
//!
//! // Filler (always try)
//! if true { cast("fireball") }
//! ```
//!
//! # Supported Conditions
//!
//! - `spell_name.ready()` - Spell off cooldown or has charges
//! - `aura_name.active()` - Aura/buff is currently active
//! - `&&`, `||`, `!` - Logical operators
//!
//! # Predictive Gating
//!
//! When a condition evaluates to false, the compiler determines if we can
//! predict when it will become true (e.g., cooldown ready time). If so,
//! the condition is marked as "Disabled" until that time, saving CPU cycles.

mod compiler;
mod condition;
mod engine;

pub use compiler::RotationError;
pub use engine::{PredictiveRotation, RotationStats};
