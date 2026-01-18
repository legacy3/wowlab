//! Flat output types for transformed DBC data
//!
//! These types match the TypeScript schemas exactly (camelCase in JSON via serde).

mod aura;
mod global;
mod item;
mod shared;
mod spec;
mod spell;
mod r#trait;

pub use aura::AuraDataFlat;
pub use global::{argb_to_hex, rgb_to_hex, ClassDataFlat, GlobalColorFlat, GlobalStringFlat};
pub use item::{
    ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus, ItemSetInfo,
    ItemStat,
};
pub use r#trait::{
    PointLimits, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree, TraitTreeFlat,
    TraitTreeWithSelections,
};
pub use shared::{KnowledgeSource, PeriodicType, RefreshBehavior};
pub use spec::SpecDataFlat;
pub use spell::{EmpowerStage, LearnSpell, SpellDataFlat};
