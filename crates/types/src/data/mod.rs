//! Data types for flat DBC structures (spell, aura, item, talent, spec).

mod aura;
mod global;
mod item;
mod shared;
mod spec;
mod spell;
mod talent;

pub use aura::AuraDataFlat;
pub use global::{argb_to_hex, rgb_to_hex, ClassDataFlat, GlobalColorFlat, GlobalStringFlat};
pub use item::{
    ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus, ItemSetInfo,
    ItemStat,
};
pub use shared::{KnowledgeSource, PeriodicType, RefreshBehavior};
pub use spec::SpecDataFlat;
pub use spell::{EmpowerStage, LearnSpell, SpellDataFlat};
pub use talent::{
    PointLimits, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree, TraitTreeFlat,
    TraitTreeWithSelections,
};
