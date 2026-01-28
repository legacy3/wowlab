//! DBC CSV parsing and data structures
//!
//! This module provides:
//! - Row structs for all required DBC tables
//! - DbcData struct that loads all tables into indexed HashMaps
//! - Helper methods for lookups by ID and foreign key

mod loader;
pub mod rows;

pub use loader::DbcData;
pub use rows::*;
