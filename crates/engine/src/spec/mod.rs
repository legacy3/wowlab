mod aura_def;
mod builder;
mod context;
pub mod effect;
pub mod executor;
mod spell;

pub use aura_def::*;
pub use builder::*;
pub use context::*;
pub use effect::{
    ChargeMod, CooldownMod, DamageMod, EffectCondition, ModCondition, SpellEffect, TalentDef,
};
pub use executor::{calculate_damage, execute_effects, DamageContext, EffectContext};
pub use spell::*;

#[cfg(test)]
mod tests;
