mod idx;
mod time;
mod resource;
mod class;
mod attribute;
mod damage;
mod snapshot;

// Re-export all index types
pub use idx::{
    SpellIdx, AuraIdx, ProcIdx, UnitIdx, TargetIdx,
    PetIdx, EnemyIdx, SnapshotIdx, ResourceIdx,
};
pub use time::*;
pub use resource::*;
pub use class::*;
pub use attribute::*;
pub use damage::*;
pub use snapshot::*;

#[cfg(test)]
mod tests;
