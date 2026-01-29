//! Domain expression sub-enums for the rotation system.
//!
//! Each domain module defines expressions that operate on a specific game concept
//! and implements the PopulateContext trait for distributed context population.

mod arithmetic;
mod aura;
mod combat;
mod cooldown;
mod enemy;
mod gcd;
mod literal;
mod logic;
mod pet;
mod player;
mod resource;
mod spell;
mod talent;
mod target;
mod variable;

pub use arithmetic::ArithmeticExpr;
pub use aura::{AuraExpr, AuraOn, BuffExpr, DebuffExpr, DotExpr, UnifiedAuraExpr};
pub use combat::CombatExpr;
pub use cooldown::CooldownExpr;
pub use enemy::EnemyExpr;
pub use gcd::GcdExpr;
pub use literal::LiteralExpr;
pub use logic::LogicExpr;
pub use pet::PetExpr;
pub use player::PlayerExpr;
pub use resource::ResourceExpr;
pub use spell::SpellExpr;
pub use talent::TalentExpr;
pub use target::{PercentValue, TargetExpr};
pub use variable::VariableExpr;

use crate::sim::SimState;
use serde::{Deserialize, Serialize};
use wowlab_common::types::SimTime;

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
/// Using unsafe pointer writes to avoid bounds checking overhead in hot paths.
#[inline(always)]
pub fn write_bool(buffer: &mut [u8], offset: usize, value: bool) {
    // SAFETY: Caller guarantees offset is within bounds (schema ensures this)
    unsafe {
        *buffer.get_unchecked_mut(offset) = value as u8;
    }
}

#[inline(always)]
pub fn write_i32(buffer: &mut [u8], offset: usize, value: i32) {
    // SAFETY: Caller guarantees offset + 4 is within bounds (schema ensures this)
    unsafe {
        let ptr = buffer.as_mut_ptr().add(offset) as *mut i32;
        ptr.write_unaligned(value);
    }
}

#[inline(always)]
pub fn write_f64(buffer: &mut [u8], offset: usize, value: f64) {
    // SAFETY: Caller guarantees offset + 8 is within bounds (schema ensures this)
    unsafe {
        let ptr = buffer.as_mut_ptr().add(offset) as *mut f64;
        ptr.write_unaligned(value);
    }
}
