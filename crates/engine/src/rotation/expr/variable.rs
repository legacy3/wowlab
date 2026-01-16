//! Variable reference expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

/// User-defined variable reference.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum VariableExpr {
    /// Reference to a user-defined variable.
    UserVar { name: String },
}

impl VariableExpr {
    /// Get the variable name.
    pub fn name(&self) -> &str {
        match self {
            Self::UserVar { name } => name,
        }
    }
}
