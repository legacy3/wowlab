//! Simulation runtime types (indices, time, results).

mod idx;
mod result;
mod snapshot;
mod time;

pub use idx::{
    AuraIdx, EnemyIdx, PetIdx, ProcIdx, ResourceIdx, SnapshotIdx, SpellIdx, TargetIdx, UnitIdx,
};
pub use result::{ChunkResult, SimulationResult};
pub use snapshot::SnapshotFlags;
pub use time::SimTime;
