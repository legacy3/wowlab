//! Class-level shared behavior.
//!
//! Classes share behavior across their specializations. For example, all
//! Hunter specs share focus regeneration, pet mechanics, and certain
//! abilities like Kill Shot.
//!
//! This module provides traits and implementations for class-level behavior
//! that specs can inherit and optionally override.

pub mod hunter;

pub use hunter::HunterClass;
