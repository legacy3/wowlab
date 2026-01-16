//! Literal value expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use super::FieldType;

/// Literal value expressions.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum LiteralExpr {
    /// Boolean literal.
    Bool { value: bool },
    /// Integer literal.
    Int { value: i64 },
    /// Float literal.
    Float { value: f64 },
}

impl LiteralExpr {
    /// Get the field type for this literal.
    pub fn field_type(&self) -> FieldType {
        match self {
            Self::Bool { .. } => FieldType::Bool,
            Self::Int { .. } => FieldType::Int,
            Self::Float { .. } => FieldType::Float,
        }
    }
}
