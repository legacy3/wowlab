//! Data types for flat DBC structures (spell, aura, item, talent, spec).

mod aura;
mod global;
mod item;
mod scaling;
mod shared;
mod spec;
mod spell;
mod partial;
mod r#trait;

pub use aura::AuraDataFlat;
pub use global::{argb_to_hex, rgb_to_hex, ClassDataFlat, GlobalColorFlat, GlobalStringFlat};
pub use item::{
    ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus, ItemSetInfo,
    ItemStat,
};
pub use scaling::{
    AppliedBonus, CurveFlat, CurvePointFlat, ItemBonusFlat, ItemQuality, ItemScalingData,
    RandPropPointsFlat, ScaledItemStats, ScaledStat,
};
pub use shared::{KnowledgeSource, PeriodicType, RefreshBehavior};
pub use spec::SpecDataFlat;
pub use spell::{EmpowerStage, LearnSpell, SpellDataFlat, SpellEffect};
pub use partial::{
    ItemSummary, SpellCost, SpellDamage, SpellRange, SpellSummary, SpellTiming, TalentNodeSummary,
};
pub use r#trait::{
    PointLimits, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree, TraitTreeFlat,
    TraitTreeWithSelections,
};
