//! SimulationCraft Profile Parser
//!
//! Parses SimC profile strings into structured data. These profiles are exported
//! by the SimC addon and contain character data including equipment, talents, and stats.

mod errors;
mod lexer;
mod parser;
mod types;

pub use errors::ParseError;
pub use parser::parse;
pub use types::{Character, Item, Loadout, Profession, Profile, Slot, Talents, WowClass};

// ============================================================================
// WASM Bindings
// ============================================================================

use wasm_bindgen::prelude::*;

/// Parse a SimC profile string and return the result as a Profile object.
#[wasm_bindgen(js_name = parseSimc)]
pub fn parse_simc(input: &str) -> Result<Profile, JsError> {
    parse(input).map_err(|e| JsError::new(&e.to_string()))
}
