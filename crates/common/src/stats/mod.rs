//! Statistics: streaming (Welford) and batch algorithms.

mod summary;

pub use summary::*;

#[cfg(test)]
mod tests;
