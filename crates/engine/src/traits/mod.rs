//! Trait system for spec customization and proc effects.
//!
//! This module provides:
//! - Trait string parsing (base64 encoded format from game exports)
//! - Trait definitions with effects (spell mods, procs, passive auras)
//! - Runtime proc tracking with ICD and chance
//!
//! # Trait String Format
//!
//! The game uses a base64-encoded binary format:
//! - 8 bits: Serialization version
//! - 16 bits: Specialization ID
//! - 128 bits: Tree hash (validation, can be zeroed)
//! - Remaining: Node selections (variable per node)
//!
//! # Example
//!
//! ```toml
//! [spec]
//! traits = "B8DAAIXa..."  # Base64 trait export string
//! ```

mod parser;
mod proc;
mod types;

pub use parser::{parse_trait_string, TraitLoadout, TraitParseError};
pub use proc::{ActiveProc, ProcEffect, ProcTracker, ProcTrigger};
pub use types::{SpellModification, TraitDefinition, TraitEffect, TraitTree};
