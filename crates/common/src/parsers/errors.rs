//! Error types for the parsers crate

use thiserror::Error;

/// Errors that can occur when loading or parsing DBC CSV files
#[cfg(feature = "dbc")]
#[derive(Debug, Error)]
pub enum DbcError {
    #[error("Failed to read CSV file '{path}': {source}")]
    CsvRead {
        path: String,
        #[source]
        source: csv::Error,
    },

    #[error("Failed to parse row in '{table}': {source}")]
    CsvParse {
        table: String,
        #[source]
        source: csv::Error,
    },

    #[error("IO error reading '{path}': {source}")]
    Io {
        path: String,
        #[source]
        source: std::io::Error,
    },

    #[error("Table '{table}' not found at path: {path}")]
    TableNotFound { table: String, path: String },
}

/// Errors that can occur during transformation
#[derive(Debug, Error)]
pub enum TransformError {
    #[error("Spell {spell_id} not found in DBC cache")]
    SpellNotFound { spell_id: i32 },

    #[error("Spec {spec_id} not found in DBC cache")]
    SpecNotFound { spec_id: i32 },

    #[error("Class {class_id} not found in DBC cache")]
    ClassNotFound { class_id: i32 },

    #[error("Global color {color_id} not found in DBC cache")]
    GlobalColorNotFound { color_id: i32 },

    #[error("Global string {string_id} not found in DBC cache")]
    GlobalStringNotFound { string_id: i32 },

    #[error("Loadout for spec {spec_id} not found")]
    LoadoutNotFound { spec_id: i32 },

    #[error("Item {item_id} not found in DBC cache")]
    ItemNotFound { item_id: i32 },

    #[cfg(feature = "dbc")]
    #[error("DBC error: {0}")]
    Dbc(#[from] DbcError),
}

/// Errors that can occur during trait string encoding/decoding
#[derive(Debug, Error)]
pub enum TraitError {
    #[error("Invalid characters in trait string")]
    InvalidCharacters,

    #[error("Trait string too short")]
    TooShort,

    #[error("Invalid bit read: not enough data")]
    NotEnoughData,
}
