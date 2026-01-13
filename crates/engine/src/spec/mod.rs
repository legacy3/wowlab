mod spell;
mod aura_def;
mod context;
mod builder;
pub mod effect;
pub mod executor;

pub use spell::*;
pub use aura_def::*;
pub use context::*;
pub use builder::*;
pub use effect::{SpellEffect, EffectCondition, DamageMod, ModCondition, TalentDef, CooldownMod, ChargeMod};
pub use executor::{EffectContext, DamageContext, execute_effects, calculate_damage};

#[cfg(test)]
mod tests;
