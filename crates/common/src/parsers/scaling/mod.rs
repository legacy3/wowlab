//! Item scaling functions
//!
//! Pure functions to compute scaled item stats from bonus IDs.
//! These can be called from Rust or via WASM from the web interface.

mod bonus;
mod curve;
mod stats;

pub use bonus::{apply_item_bonuses, get_bonus_description};
pub use curve::interpolate_curve;
pub use stats::{get_stat_budget, get_stat_name};
