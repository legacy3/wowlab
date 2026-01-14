//! Flat output types for transformed DBC data
//!
//! These types match the TypeScript schemas exactly (camelCase in JSON via serde).

mod aura;
mod item;
mod shared;
mod spec;
mod spell;
mod talent;

pub use aura::AuraDataFlat;
pub use item::{
    ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus, ItemSetInfo,
    ItemStat,
};
pub use shared::{KnowledgeSource, PeriodicType, RefreshBehavior};
pub use spec::SpecDataFlat;
pub use spell::{EmpowerStage, LearnSpell, SpellDataFlat};
pub use talent::{
    PointLimits, TalentEdge, TalentNode, TalentNodeEntry, TalentSelection, TalentSubTree,
    TalentTreeFlat, TalentTreeWithSelections,
};
