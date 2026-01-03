//! Utility types for the simulation engine.

mod cpu;
mod rng;

pub use cpu::get_optimal_concurrency;
pub use rng::FastRng;
