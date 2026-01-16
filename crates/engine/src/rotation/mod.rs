//! JIT-compiled rotation system.
//!
//! Compiles user-defined rotations from JSON to native machine code
//! via Cranelift for ~3ns evaluation time.
//!
//! # Pipeline
//!
//! ```text
//! JSON → AST → Cranelift IR → Native Code
//!                                  ↓
//!        SimState → Context → evaluate() → EvalResult
//! ```
//!
//! Names are resolved at parse time using a SpecResolver, eliminating
//! the need for a separate resolution phase.
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
pub mod eval;
pub mod expr;
mod parser;
mod resolver;
mod validate;

#[cfg(test)]
mod tests;

// Re-export evaluation result type (output of compiled rotation)
// This is what SpecHandler::next_action returns
pub use action::Action;

// Re-export AST types (Action renamed to AstAction to avoid conflict)
pub use ast::{Action as AstAction, Expr, Rotation, ValueType, VarOp};

// Re-export compiler (only with jit feature)
#[cfg(feature = "jit")]
pub use compiler::{CompiledRotation, EvalResult};

// Re-export context types
pub use context::{populate_context, ContextField, ContextSchema, ExprKey, SchemaBuilder};

// Re-export domain expression types
pub use expr::{
    AuraOn, BuffExpr, CombatExpr, CooldownExpr, DebuffExpr, DotExpr, FieldType, GcdExpr, PetExpr,
    PlayerExpr, PopulateContext, ResourceExpr, SpellExpr, TalentExpr, TargetExpr, UnifiedAuraExpr,
};

// Re-export error types
pub use error::{Error, Result};

// Re-export resolver types
pub use resolver::SpecResolver;

// Re-export validation types
pub use validate::{
    get_var_path_schema, validate_rotation, ValidationError, ValidationResult, ValidationWarning,
    VarPathCategory, VarPathInfo,
};
