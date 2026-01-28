//! Arithmetic expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use super::FieldType;

/// Comparison expressions.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ComparisonExpr<E> {
    /// Greater than.
    Gt { left: Box<E>, right: Box<E> },
    /// Greater than or equal.
    Gte { left: Box<E>, right: Box<E> },
    /// Less than.
    Lt { left: Box<E>, right: Box<E> },
    /// Less than or equal.
    Lte { left: Box<E>, right: Box<E> },
    /// Equal.
    Eq { left: Box<E>, right: Box<E> },
    /// Not equal.
    Ne { left: Box<E>, right: Box<E> },
}

impl<E> ComparisonExpr<E> {
    /// Get the field type (always bool for comparisons).
    pub fn field_type(&self) -> FieldType {
        FieldType::Bool
    }
}

/// Binary arithmetic expressions.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum BinaryArithmeticExpr<E> {
    /// Addition.
    Add { left: Box<E>, right: Box<E> },
    /// Subtraction.
    Sub { left: Box<E>, right: Box<E> },
    /// Multiplication.
    Mul { left: Box<E>, right: Box<E> },
    /// Division.
    Div { left: Box<E>, right: Box<E> },
    /// Modulo.
    Mod { left: Box<E>, right: Box<E> },
    /// Minimum of two values.
    Min { left: Box<E>, right: Box<E> },
    /// Maximum of two values.
    Max { left: Box<E>, right: Box<E> },
}

/// Unary arithmetic expressions.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum UnaryArithmeticExpr<E> {
    /// Floor (round down).
    Floor { operand: Box<E> },
    /// Ceiling (round up).
    Ceil { operand: Box<E> },
    /// Absolute value.
    Abs { operand: Box<E> },
}

/// Combined arithmetic expression.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum ArithmeticExpr<E> {
    Comparison(ComparisonExpr<E>),
    Binary(BinaryArithmeticExpr<E>),
    Unary(UnaryArithmeticExpr<E>),
}
