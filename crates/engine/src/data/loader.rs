//! Tuning data loader and application logic.
//!
//! Handles loading TOML tuning files and applying overrides to spell/aura definitions.

use super::tuning::{TuningData, SpellTuning, AuraTuning};
use crate::spec::{SpellDef, AuraDef, CastType};
use crate::types::{ResourceType, SimTime};
use std::path::Path;
use tracing::{debug, info, warn};

/// Error type for tuning operations.
#[derive(Debug)]
pub enum TuningError {
    /// Failed to read file
    Io(std::io::Error),
    /// Failed to parse TOML
    Parse(toml::de::Error),
}

impl std::fmt::Display for TuningError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TuningError::Io(e) => write!(f, "IO error: {}", e),
            TuningError::Parse(e) => write!(f, "Parse error: {}", e),
        }
    }
}

impl std::error::Error for TuningError {}

impl From<std::io::Error> for TuningError {
    fn from(e: std::io::Error) -> Self {
        TuningError::Io(e)
    }
}

impl From<toml::de::Error> for TuningError {
    fn from(e: toml::de::Error) -> Self {
        TuningError::Parse(e)
    }
}

/// Load tuning data from a TOML file.
pub fn load_tuning(path: &Path) -> Result<TuningData, TuningError> {
    let content = std::fs::read_to_string(path)?;
    let tuning: TuningData = toml::from_str(&content)?;
    info!(path = %path.display(), spells = tuning.spell.len(), auras = tuning.aura.len(), "Loaded tuning data");
    Ok(tuning)
}

/// Load and merge multiple tuning files.
///
/// Later files override earlier ones.
pub fn load_tuning_files(paths: &[&Path]) -> Result<TuningData, TuningError> {
    let mut combined = TuningData::empty();

    for path in paths {
        if path.exists() {
            let tuning = load_tuning(path)?;
            combined.merge(tuning);
        } else {
            warn!(path = %path.display(), "Tuning file not found, skipping");
        }
    }

    Ok(combined)
}

/// Apply spell tuning overrides to spell definitions.
pub fn apply_spell_overrides(spells: &mut [SpellDef], overrides: &std::collections::HashMap<String, SpellTuning>) {
    for spell in spells.iter_mut() {
        let name = spell.name.to_lowercase().replace(' ', "_").replace('-', "_");

        if let Some(tuning) = overrides.get(&name) {
            apply_spell_tuning(spell, tuning);
            debug!(spell = spell.name, "Applied tuning overrides");
        }
    }
}

/// Apply aura tuning overrides to aura definitions.
pub fn apply_aura_overrides(auras: &mut [AuraDef], overrides: &std::collections::HashMap<String, AuraTuning>) {
    for aura in auras.iter_mut() {
        let name = aura.name.to_lowercase().replace(' ', "_").replace('-', "_");

        if let Some(tuning) = overrides.get(&name) {
            apply_aura_tuning(aura, tuning);
            debug!(aura = aura.name, "Applied tuning overrides");
        }
    }
}

/// Apply a single SpellTuning to a SpellDef.
fn apply_spell_tuning(spell: &mut SpellDef, tuning: &SpellTuning) {
    // Cooldown
    if let Some(cd) = tuning.cooldown {
        spell.cooldown = SimTime::from_secs_f32(cd);
    }

    // Charges
    if let Some(charges) = tuning.charges {
        spell.charges = charges;
    }
    if let Some(recharge) = tuning.recharge_time {
        spell.charge_time = SimTime::from_secs_f32(recharge);
    }

    // Cast time
    if let Some(cast_ms) = tuning.cast_time {
        spell.cast_type = if cast_ms == 0 {
            CastType::Instant
        } else {
            CastType::Cast(cast_ms)
        };
    }

    // Focus cost
    if let Some(cost) = tuning.cost_focus {
        apply_resource_cost(&mut spell.costs, ResourceType::Focus, cost);
    }

    // Mana cost
    if let Some(cost) = tuning.cost_mana {
        apply_resource_cost(&mut spell.costs, ResourceType::Mana, cost);
    }

    // Energy cost
    if let Some(cost) = tuning.cost_energy {
        apply_resource_cost(&mut spell.costs, ResourceType::Energy, cost);
    }

    // Rage cost
    if let Some(cost) = tuning.cost_rage {
        apply_resource_cost(&mut spell.costs, ResourceType::Rage, cost);
    }

    // Focus gain
    if let Some(gain) = tuning.focus_gain {
        apply_resource_gain(&mut spell.gains, ResourceType::Focus, gain);
    }

    // Damage coefficients
    if let Some(ref mut dmg) = spell.damage {
        if let Some(ap) = tuning.ap_coefficient {
            dmg.ap_coefficient = ap;
        }
        if let Some(sp) = tuning.sp_coefficient {
            dmg.sp_coefficient = sp;
        }
        if let Some(weapon) = tuning.weapon_coefficient {
            dmg.weapon_coefficient = weapon;
        }
        if let Some(base) = tuning.base_damage {
            dmg.base_damage = base;
        }
    }
}

/// Apply a single AuraTuning to an AuraDef.
fn apply_aura_tuning(aura: &mut AuraDef, tuning: &AuraTuning) {
    // Duration
    if let Some(dur) = tuning.duration {
        aura.duration = SimTime::from_secs_f32(dur);
    }

    // Max stacks
    if let Some(stacks) = tuning.max_stacks {
        aura.max_stacks = stacks;
    }

    // Periodic interval
    if let Some(interval) = tuning.tick_interval {
        if let Some(ref mut periodic) = aura.periodic {
            periodic.interval = SimTime::from_secs_f32(interval);
        }
    }

    // Periodic damage coefficients
    if let Some(ref mut periodic) = aura.periodic {
        if let Some(ap) = tuning.ap_coefficient_per_tick {
            periodic.ap_coefficient = ap;
        }
        if let Some(sp) = tuning.sp_coefficient_per_tick {
            periodic.sp_coefficient = sp;
        }
    }

    // Effect-based tuning (damage multiplier, haste per stack)
    // These require updating the aura effects vector
    if let Some(mult) = tuning.damage_multiplier {
        update_damage_multiplier_effect(&mut aura.effects, mult);
    }
    if let Some(haste) = tuning.haste_per_stack {
        update_haste_effect(&mut aura.effects, haste);
    }
}

/// Update or add a resource cost in the costs vector.
fn apply_resource_cost(costs: &mut Vec<crate::spec::ResourceCost>, resource: ResourceType, amount: f32) {
    if let Some(cost) = costs.iter_mut().find(|c| c.resource == resource) {
        cost.amount = amount;
    } else if amount > 0.0 {
        costs.push(crate::spec::ResourceCost::new(resource, amount));
    }
}

/// Update or add a resource gain in the gains vector.
fn apply_resource_gain(gains: &mut Vec<crate::spec::ResourceCost>, resource: ResourceType, amount: f32) {
    if let Some(gain) = gains.iter_mut().find(|g| g.resource == resource) {
        gain.amount = amount;
    } else if amount > 0.0 {
        gains.push(crate::spec::ResourceCost::new(resource, amount));
    }
}

/// Update the damage multiplier in aura effects.
fn update_damage_multiplier_effect(effects: &mut Vec<crate::spec::AuraEffect>, amount: f32) {
    use crate::spec::AuraEffect;

    for effect in effects.iter_mut() {
        if let AuraEffect::DamageMultiplier { amount: ref mut a, .. } = effect {
            *a = amount;
            return;
        }
    }

    // Effect not found, add it
    effects.push(AuraEffect::DamageMultiplier { amount, school: None });
}

/// Update the haste percent in aura effects.
fn update_haste_effect(effects: &mut Vec<crate::spec::AuraEffect>, amount: f32) {
    use crate::spec::AuraEffect;
    use crate::types::DerivedStat;

    for effect in effects.iter_mut() {
        if let AuraEffect::DerivedPercent { stat: DerivedStat::Haste, amount: ref mut a } = effect {
            *a = amount;
            return;
        }
    }

    // Effect not found, add it
    effects.push(AuraEffect::DerivedPercent {
        stat: DerivedStat::Haste,
        amount,
    });
}
