//! Error types for CLI configuration parsing.

use thiserror::Error;

/// Errors that can occur when converting CLI configuration to simulation config.
#[derive(Debug, Error)]
pub enum ConfigError {
    /// Unknown spec identifier
    #[error("unknown spec identifier: {spec_id}")]
    UnknownSpec { spec_id: String },

    /// Unknown class name
    #[error("unknown class: {class_name}")]
    UnknownClass { class_name: String },

    /// Invalid player configuration
    #[error("invalid player config: {reason}")]
    InvalidPlayer { reason: String },

    /// Invalid spell definition
    #[error("invalid spell definition for '{spell_name}': {reason}")]
    InvalidSpell { spell_name: String, reason: String },

    /// Invalid aura definition
    #[error("invalid aura definition for '{aura_name}': {reason}")]
    InvalidAura { aura_name: String, reason: String },

    /// Spell references an unknown aura
    #[error("spell '{spell_name}' references unknown aura ID {aura_id}")]
    AuraNotFound { spell_name: String, aura_id: u32 },

    /// Paperdoll creation failed
    #[error("paperdoll creation failed: {0}")]
    Paperdoll(String),

    /// Rotation error
    #[error("rotation error: {0}")]
    Rotation(String),

    /// Unknown resource type
    #[error("unknown resource type: {resource}")]
    UnknownResource { resource: String },
}
