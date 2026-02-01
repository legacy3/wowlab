//! JSON rotation -> Cranelift JIT -> native code (~3ns eval).

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
