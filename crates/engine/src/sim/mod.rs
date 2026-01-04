//! Simulation engine and state management.
//!
//! This module contains the core simulation logic:
//! - [`SimState`] - Mutable simulation state (time, player, target, events)
//! - [`EventQueue`] - Timing wheel event queue for O(1) operations
//! - [`run_simulation`] / [`run_batch`] - Main simulation entry points
//! - [`SimResult`] / [`BatchResult`] - Simulation output types

mod engine;
mod events;
mod results;
mod state;

pub use engine::{run_batch, run_batch_parallel, run_simulation, run_simulation_with_report};
pub use events::{EventQueue, SimEvent, TimedEvent};
pub use results::{
    ActionLog, ActionLogEntry, ActionType, BatchAccumulator, BatchResult, SimReport, SimResult,
    SpellBreakdown,
};
pub use state::{
    AuraInstance, AuraRuntime, AuraTracker, SimResultsAccum, SimState, SpellRuntime,
    SpellState, TargetState, UnitState,
};
