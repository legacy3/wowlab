//! Error types for SimC profile parsing

use thiserror::Error;

/// Errors that can occur during profile parsing
#[derive(Debug, Error)]
pub enum ParseError {
    #[error("Missing class definition (e.g., warrior=\"CharName\")")]
    MissingClass,

    #[error("Missing character name")]
    MissingName,

    #[error("Unexpected token at position {position}")]
    UnexpectedToken { position: usize },
}
