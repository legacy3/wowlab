//! Handler module - polymorphic spec handlers.
//!
//! This module provides the trait-based handler system that eliminates
//! match statements on spec types throughout the codebase.

mod registry;
mod traits;

#[cfg(feature = "jit")]
pub use registry::create_handler;
pub use registry::HandlerRegistry;
pub use traits::SpecHandler;
