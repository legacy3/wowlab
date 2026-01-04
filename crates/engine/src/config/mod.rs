//! Configuration types for simulation setup.
//!
//! This module contains all the static data structures needed to configure a simulation:
//! - [`SimConfig`] - Complete simulation configuration
//! - [`SpellDef`] - Spell definitions with damage formulas and effects
//! - [`AuraDef`] - Aura/buff definitions with periodic effects
//! - [`crate::paperdoll::Paperdoll`] - Player stat paperdoll

mod aura_def;
mod sim_config;
mod spell_def;
mod stats;

pub use aura_def::{AuraDef, AuraEffect, DamageSchool, ProcTrigger, StatType};
pub use sim_config::{PetConfig, PlayerConfig, SimConfig, SpecId, TargetConfig};
pub use spell_def::{DamageFormula, ResourceCost, SpellDef, SpellEffect};
pub use stats::{ResourceConfig, ResourceType};
