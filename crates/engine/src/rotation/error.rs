//! Rotation compilation errors.

use thiserror::Error;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Error)]
pub enum Error {
    #[error("JSON parse error: {0}")]
    JsonParse(#[from] serde_json::Error),

    #[error("invalid JsonLogic: {0}")]
    InvalidJsonLogic(String),

    #[error("unknown variable: {0}")]
    UnknownVariable(String),

    #[error("unknown operator: {0}")]
    UnknownOperator(String),

    #[error("type mismatch: expected {expected}, got {got}")]
    TypeMismatch {
        expected: &'static str,
        got: &'static str,
    },

    #[error("compilation error: {0}")]
    Compilation(String),
}
