//! Math and statistics utilities.
//!
//! Use types from this module instead of importing statrs directly.

mod running;
mod summary;

pub use running::*;
pub use summary::*;

#[cfg(test)]
mod tests;
