//! Data types for flat DBC structures (spell, aura, item, talent, spec).

mod aura;
mod global;
mod item;
mod scaling;
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
pub use scaling::{CurveFlat, CurvePointFlat, ItemBonusFlat, RandPropPointsFlat};
pub use shared::{KnowledgeSource, PeriodicType, RefreshBehavior};
pub use spec::SpecDataFlat;
pub use spell::{EmpowerStage, LearnSpell, SpellDataFlat, SpellEffect};
pub use r#trait::{
    PointLimits, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree, TraitTreeFlat,
    TraitTreeWithSelections,
};
