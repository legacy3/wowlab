//! Rotation compilation errors.

use thiserror::Error;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Error)]
pub enum Error {
    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("invalid syntax: {0}")]
    Syntax(String),

    #[error("unknown variable path: {0}")]
    UnknownPath(String),

    #[error("unknown spell: {0}")]
    UnknownSpell(String),

    #[error("unknown aura: {0}")]
    UnknownAura(String),

    #[error("unknown talent: {0}")]
    UnknownTalent(String),

    #[error("unknown action list: {0}")]
    UnknownList(String),

    #[error("unknown user variable: {0}")]
    UnknownUserVar(String),

    #[error("unknown operator: {0}")]
    UnknownOperator(String),

    #[error("type error: expected {expected}, got {got}")]
    TypeError {
        expected: &'static str,
        got: &'static str,
    },

    #[error("invalid argument count: {op} requires {expected} args, got {got}")]
    ArgCount {
        op: &'static str,
        expected: usize,
        got: usize,
    },

    #[error("compilation error: {0}")]
    Compilation(String),

    #[error("circular variable reference: {0}")]
    CircularRef(String),
}
