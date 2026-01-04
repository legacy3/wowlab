//! Class and specialization coefficient data.
//!
//! This module defines how primary attributes convert to derived stats
//! for each class and specialization.

use super::types::{Attribute, SpecId};

/// Class-specific stat conversion coefficients.
///
/// These coefficients determine how primary attributes (Strength, Agility,
/// Intellect, Stamina) convert to derived stats like Attack Power, Spell Power,
/// and Health for each class/spec combination.
#[derive(Clone, Debug)]
pub struct ClassCoefficients {
    /// Attack power per point of strength.
    pub ap_per_strength: f32,

    /// Attack power per point of agility.
    pub ap_per_agility: f32,

    /// Spell power per point of intellect.
    pub sp_per_intellect: f32,

    /// Health per point of stamina.
    pub health_per_stamina: f32,

    /// Crit chance per X agility (0 = no scaling from agility).
    /// Note: Most specs in modern WoW do not gain crit from agility.
    pub crit_per_agility: f32,

    /// Crit chance per X intellect (0 = no scaling from intellect).
    pub crit_per_intellect: f32,

    /// Dodge per X agility (0 = no scaling, tanks only).
    pub dodge_per_agility: f32,

    /// Parry per X strength (0 = no scaling, tanks only).
    pub parry_per_strength: f32,

    /// Mastery effect coefficient (spec-specific multiplier).
    /// This multiplies the base mastery percentage to get the actual effect value.
    pub mastery_coefficient: f32,

    /// Primary stat for this spec.
    pub primary_stat: Attribute,

    /// Whether this spec uses spell power for damage/healing calculations.
    pub uses_spell_power: bool,

    /// Whether this spec can parry attacks.
    pub can_parry: bool,

    /// Whether this spec can block attacks.
    pub can_block: bool,
}

impl Default for ClassCoefficients {
    /// Returns Beast Mastery Hunter coefficients as the default.
    fn default() -> Self {
        Self::beast_mastery()
    }
}

impl ClassCoefficients {
    /// Beast Mastery Hunter coefficients.
    ///
    /// - Agility-based class with 1:1 AP scaling
    /// - Master of Beasts mastery: 1% pet damage per mastery point
    /// - Standard 20 HP per stamina
    pub fn beast_mastery() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_coefficient: 1.0,
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: false,
            can_block: false,
        }
    }

    /// Marksmanship Hunter coefficients.
    ///
    /// - Agility-based ranged spec with 1:1 AP scaling
    /// - Sniper Training mastery: damage multiplier per mastery point
    /// - Similar to BM but focused on player damage rather than pet
    pub fn marksmanship() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_coefficient: 1.0,
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: false,
            can_block: false,
        }
    }

    /// Survival Hunter coefficients.
    ///
    /// - Agility-based melee spec with 1:1 AP scaling
    /// - Spirit Bond mastery: damage bonus per mastery point
    /// - Melee-focused but still agility primary
    pub fn survival() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_coefficient: 1.0,
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: false,
            can_block: false,
        }
    }
}

/// Get class coefficients for a given specialization.
///
/// # Arguments
///
/// * `spec` - The specialization identifier
///
/// # Returns
///
/// The appropriate `ClassCoefficients` for the spec.
/// Falls back to Beast Mastery coefficients for unimplemented specs.
pub fn from_spec(spec: SpecId) -> ClassCoefficients {
    match spec {
        // Hunter specs
        SpecId::BeastMastery => ClassCoefficients::beast_mastery(),
        SpecId::Marksmanship => ClassCoefficients::marksmanship(),
        SpecId::Survival => ClassCoefficients::survival(),
        // All other specs default to beast mastery for now
        _ => ClassCoefficients::default(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_beast_mastery_coefficients() {
        let coeff = ClassCoefficients::beast_mastery();
        assert_eq!(coeff.ap_per_agility, 1.0);
        assert_eq!(coeff.ap_per_strength, 0.0);
        assert_eq!(coeff.health_per_stamina, 20.0);
        assert_eq!(coeff.primary_stat, Attribute::Agility);
        assert!(!coeff.uses_spell_power);
        assert!(!coeff.can_parry);
        assert!(!coeff.can_block);
    }

    #[test]
    fn test_marksmanship_coefficients() {
        let coeff = ClassCoefficients::marksmanship();
        assert_eq!(coeff.ap_per_agility, 1.0);
        assert_eq!(coeff.primary_stat, Attribute::Agility);
    }

    #[test]
    fn test_survival_coefficients() {
        let coeff = ClassCoefficients::survival();
        assert_eq!(coeff.ap_per_agility, 1.0);
        assert_eq!(coeff.primary_stat, Attribute::Agility);
    }

    #[test]
    fn test_from_spec() {
        let bm = from_spec(SpecId::BeastMastery);
        assert_eq!(bm.mastery_coefficient, 1.0);

        let mm = from_spec(SpecId::Marksmanship);
        assert_eq!(mm.primary_stat, Attribute::Agility);

        let sv = from_spec(SpecId::Survival);
        assert_eq!(sv.ap_per_agility, 1.0);
    }

    #[test]
    fn test_default_is_beast_mastery() {
        let default = ClassCoefficients::default();
        let bm = ClassCoefficients::beast_mastery();
        assert_eq!(default.ap_per_agility, bm.ap_per_agility);
        assert_eq!(default.mastery_coefficient, bm.mastery_coefficient);
    }
}
