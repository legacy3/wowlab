//! External tuning data module.
//!
//! This module provides runtime tuning capabilities without recompilation.
//! Tuning data is loaded from TOML files and can override macro-defined values
//! for spells, auras, and class-wide parameters.

mod tuning;
mod loader;

pub use tuning::*;
pub use loader::*;

#[cfg(test)]
mod tests;
