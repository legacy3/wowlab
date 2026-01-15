//! JIT-compiled rotation system.
//!
//! Compiles user-defined rotations from JSON to native machine code
//! via Cranelift for ~3ns evaluation time.
//!
//! # Pipeline
//!
//! ```text
//! JSON → AST → Name Resolution → Cranelift IR → Native Code
//!                                                     ↓
//!                           SimState → Context → evaluate() → EvalResult
//! ```
//!
//! # Example
//!
//! ```ignore
//! // Define a rotation in JSON
//! let json = r#"{
//!   "name": "BM Hunter",
//!   "actions": [
//!     { "cast": "kill_command", "if": "cd.kill_command.ready" },
//!     { "cast": "cobra_shot" }
//!   ]
//! }"#;
//!
//! // Parse and compile
//! let rotation = Rotation::from_json(json)?;
//! let resolver = SpecResolver::new("bm_hunter")
//!     .resource("focus")
//!     .spell("kill_command", 34026)
//!     .spell("cobra_shot", 193455);
//! let compiled = CompiledRotation::compile(&rotation, &resolver)?;
//!
//! // Evaluate during simulation
//! let result = compiled.evaluate(&sim_state);
//! match result.kind {
//!     1 => cast_spell(SpellIdx(result.spell_id)),
//!     2 => wait(result.wait_time),
//!     _ => idle(),
//! }
//! ```

mod action;
mod ast;
#[cfg(feature = "jit")]
mod compiler;
mod context;
mod error;
mod parser;
mod resolver;

#[cfg(test)]
mod tests;

// Re-export evaluation result type (output of compiled rotation)
// This is what SpecHandler::next_action returns
pub use action::Action;

// Re-export AST types (Action renamed to AstAction to avoid conflict)
pub use ast::{Action as AstAction, Expr, Rotation, VarOp, VarPath, ValueType};

// Re-export compiler (only with jit feature)
#[cfg(feature = "jit")]
pub use compiler::{CompiledRotation, EvalResult};

// Re-export context types
pub use context::{ContextField, ContextSchema, FieldType, SchemaBuilder};

// Re-export error types
pub use error::{Error, Result};

// Re-export resolver types
pub use resolver::{ResolvedVar, SpecResolver};
