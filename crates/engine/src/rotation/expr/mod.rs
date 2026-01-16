//! Domain expression sub-enums for the rotation system.
//!
//! Each domain module defines expressions that operate on a specific game concept
//! and implements the PopulateContext trait for distributed context population.

mod resource;
mod cooldown;
mod aura;
mod combat;
mod target;
mod enemy;
mod player;
mod spell;
mod talent;
mod gcd;
mod pet;
mod logic;
mod arithmetic;
mod literal;
mod variable;

pub use resource::ResourceExpr;
pub use cooldown::CooldownExpr;
pub use aura::{AuraExpr, AuraOn, BuffExpr, DebuffExpr, DotExpr, UnifiedAuraExpr};
pub use combat::CombatExpr;
pub use target::{PercentValue, TargetExpr};
pub use enemy::EnemyExpr;
pub use player::PlayerExpr;
pub use spell::SpellExpr;
pub use talent::TalentExpr;
pub use gcd::GcdExpr;
pub use pet::PetExpr;
pub use logic::LogicExpr;
pub use arithmetic::ArithmeticExpr;
pub use literal::LiteralExpr;
pub use variable::VariableExpr;

use crate::sim::SimState;
use crate::types::SimTime;
use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

/// Trait for populating a context buffer from simulation state.
///
/// Each domain expression type implements this to write its value to the context buffer.
pub trait PopulateContext {
    /// Populate the context buffer at the given offset.
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime);

    /// Return the field type for this expression.
    fn field_type(&self) -> FieldType;
}

/// Field type for memory layout in context buffers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum FieldType {
    Bool,  // 1 byte
    Int,   // 4 bytes (i32)
    Float, // 8 bytes (f64)
}

impl FieldType {
    pub fn size(self) -> usize {
        match self {
            Self::Bool => 1,
            Self::Int => 4,
            Self::Float => 8,
        }
    }

    pub fn alignment(self) -> usize {
        self.size()
    }
}

/// Write helpers for context buffer population.
#[inline]
pub fn write_bool(buffer: &mut [u8], offset: usize, value: bool) {
    buffer[offset] = if value { 1 } else { 0 };
}

#[inline]
pub fn write_i32(buffer: &mut [u8], offset: usize, value: i32) {
    let bytes = value.to_ne_bytes();
    buffer[offset..offset + 4].copy_from_slice(&bytes);
}

#[inline]
pub fn write_f64(buffer: &mut [u8], offset: usize, value: f64) {
    let bytes = value.to_ne_bytes();
    buffer[offset..offset + 8].copy_from_slice(&bytes);
}
