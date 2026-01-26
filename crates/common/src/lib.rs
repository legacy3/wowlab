//! wowlab-common - Shared types, parsers, and statistics for wowlab.
//!
//! This crate consolidates functionality previously split across multiple crates:
//! - `types` - Core data structures for spells, items, talents, etc.
//! - `parsers` - SimC profile parsing, DBC loading, spell description rendering
//! - `stats` - Mathematical utilities for simulation statistics
//!
//! # Features
//!
//! - `wasm` - Enable WASM bindings for use in JavaScript
//! - `crypto` - Enable node authentication (Ed25519 signing)
//! - `dbc` - Enable DBC CSV file loading
//! - `full` - Enable all optional features (crypto + dbc)

pub mod parsers;
pub mod stats;
pub mod types;

#[cfg(feature = "wasm")]
pub mod wasm;

// Combat types
pub use types::combat::{DamageFlags, DamageSchool, HitResult, ResourceType};

// Game types
pub use types::game::{
    Attribute, ClassId, DerivedStat, MasteryEffect, PetKind, PetType, RaceId, RatingType, SpecId,
};

// Sim types
pub use types::sim::{
    AuraIdx, ChunkResult, EnemyIdx, PetIdx, ProcIdx, ResourceIdx, SimTime, SimulationResult,
    SnapshotFlags, SnapshotIdx, SpellIdx, TargetIdx, UnitIdx,
};

// Spell description types
pub use types::spell_desc::{
    EffectDependency, SpellDescDependencies, SpellDescRenderResult, SpellValueDependency,
};

// Data types - commonly used flat structures
pub use types::data::{
    argb_to_hex, rgb_to_hex, AppliedBonus, AuraDataFlat, ClassDataFlat, CurveFlat, CurvePointFlat,
    EmpowerStage, GlobalColorFlat, GlobalStringFlat, ItemBonusFlat, ItemClassification,
    ItemDataFlat, ItemDropSource, ItemEffect, ItemQuality, ItemScalingData, ItemSetBonus,
    ItemSetInfo, ItemStat, ItemSummary, KnowledgeSource, LearnSpell, PeriodicType, PointLimits,
    RandPropPointsFlat, RefreshBehavior, ScaledItemStats, ScaledStat, SpecDataFlat, SpellCost,
    SpellDamage, SpellDataFlat, SpellEffect, SpellRange, SpellSummary, SpellTiming,
    TalentNodeSummary, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree,
    TraitTreeFlat, TraitTreeWithSelections,
};

// SimC parsing
pub use parsers::{
    parse_simc, Character, Item, Loadout, ParseError, Profession, Profile, Slot, Talents, WowClass,
};

// DBC data loading
#[cfg(feature = "dbc")]
pub use parsers::DbcData;

// Error types
pub use parsers::{TraitError, TransformError};
#[cfg(feature = "dbc")]
pub use parsers::DbcError;

// DBC → Flat transformation
#[cfg(feature = "dbc")]
pub use parsers::{
    transform_all_auras, transform_all_classes, transform_all_curve_points, transform_all_curves,
    transform_all_global_colors, transform_all_global_strings, transform_all_item_bonuses,
    transform_all_items, transform_all_rand_prop_points, transform_all_specs, transform_all_spells,
    transform_all_trait_trees, transform_aura, transform_class, transform_global_color,
    transform_global_string, transform_item, transform_spec, transform_spell, transform_trait_tree,
};
pub use parsers::SpellKnowledgeContext;

// Talent loadout encoding/decoding
pub use parsers::{
    apply_decoded_traits, decode_trait_loadout, encode_minimal_loadout, encode_trait_loadout,
    DecodedTraitLoadout, DecodedTraitNode,
};

// Spell description parsing
pub use parsers::{
    analyze_spell_desc_dependencies, parse_spell_desc, render_spell_desc, NullResolver,
    ParsedSpellDescription, SpellDescParseResult, SpellDescResolver, SpellDescriptionNode,
    TestResolver, VariableNode,
};

// Item scaling functions
pub use parsers::{
    apply_item_bonuses, get_bonus_description, get_stat_budget, get_stat_name, interpolate_curve,
};

// Crypto (node authentication)
#[cfg(feature = "crypto")]
pub use parsers::{
    build_sign_message, derive_claim_code, derive_claim_code_from_base64, keypair_from_base64,
    sha256_hex, verify_signature, verify_signature_base64, CryptoError, NodeKeypair,
};

pub use stats::{
    correlation, covariance, ema, ema_span, linear_regression, sma, LinearRegression, Summary,
};
