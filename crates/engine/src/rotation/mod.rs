//! JIT-compiled rotation system.
//!
//! Compiles user-defined rotations from JsonLogic to native machine code
//! via Cranelift for ~3ns evaluation time.
//!
//! # Pipeline
//!
//! ```text
//! JsonLogic JSON → AST → Cranelift IR → Native Code
//!                                            ↓
//!                    SimState → Context → evaluate() → SpellIdx
//! ```

mod action;
mod ast;
mod compiler;
mod context;
mod error;
mod parser;

#[cfg(test)]
mod tests;

pub use action::Action;
pub use ast::{Condition, Operand, Rotation, RotationNode};
pub use compiler::CompiledRotation;
pub use context::{RotationContext, ContextBuilder};
pub use error::{Error, Result};
