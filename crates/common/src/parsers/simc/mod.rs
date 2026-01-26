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

#[cfg(test)]
mod tests;
