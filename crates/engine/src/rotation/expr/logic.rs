//! Logical expressions (and, or, not).

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use super::FieldType;

/// Logical expressions that combine other expressions.
///
/// Note: These are not directly populated - they are handled by the compiler
/// which recursively evaluates the operands.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum LogicExpr<E> {
    /// Logical AND (all operands must be true).
    And { operands: Vec<E> },
    /// Logical OR (any operand must be true).
    Or { operands: Vec<E> },
    /// Logical NOT (negate operand).
    Not { operand: Box<E> },
}

impl<E> LogicExpr<E> {
    /// Get the field type (always bool).
    pub fn field_type(&self) -> FieldType {
        FieldType::Bool
    }
}
