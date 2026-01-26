//! Core type definitions for wowlab.
//!
//! This module contains foundational types shared across the wowlab ecosystem:
//! - Combat types (damage schools, resources)
//! - Game types (classes, specs, attributes)
//! - Data types (spell, aura, item, talent flat structures)
//! - Simulation types (indices, time)
//! - Spell description types (dependencies, render results)

pub mod combat;
pub mod data;
pub mod game;
pub mod sim;
pub mod spell_desc;

// Re-export commonly used types
pub use combat::{DamageFlags, DamageSchool, HitResult, ResourceType};
pub use data::{
    argb_to_hex, rgb_to_hex, AppliedBonus, AuraDataFlat, ClassDataFlat, CurveFlat, CurvePointFlat,
    EmpowerStage, GlobalColorFlat, GlobalStringFlat, ItemBonusFlat, ItemClassification,
    ItemDataFlat, ItemDropSource, ItemEffect, ItemQuality, ItemScalingData, ItemSetBonus,
    ItemSetInfo, ItemStat, ItemSummary, KnowledgeSource, LearnSpell, PeriodicType, PointLimits,
    RandPropPointsFlat, RefreshBehavior, ScaledItemStats, ScaledStat, SpecDataFlat, SpellCost,
    SpellDamage, SpellDataFlat, SpellEffect, SpellRange, SpellSummary, SpellTiming,
    TalentNodeSummary, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree,
    TraitTreeFlat, TraitTreeWithSelections,
};
pub use game::{
    Attribute, ClassId, DerivedStat, MasteryEffect, PetKind, PetType, RaceId, RatingType, SpecId,
};
pub use sim::{
    AuraIdx, ChunkResult, EnemyIdx, PetIdx, ProcIdx, ResourceIdx, SimTime, SimulationResult,
    SnapshotFlags, SnapshotIdx, SpellIdx, TargetIdx, UnitIdx,
};
pub use spell_desc::{
    EffectDependency, SpellDescDependencies, SpellDescRenderResult, SpellValueDependency,
};
