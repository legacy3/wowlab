//! Handler module - polymorphic spec handlers.
//!
//! This module provides the trait-based handler system that eliminates
//! match statements on spec types throughout the codebase.

mod traits;
mod registry;

pub use traits::SpecHandler;
pub use registry::{HandlerRegistry, create_default_registry};
