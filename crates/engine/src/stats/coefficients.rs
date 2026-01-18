use crate::types::{MasteryEffect, SpecId};

/// Class/spec coefficients for stat calculations
#[derive(Clone, Debug)]
pub struct SpecCoefficients {
    /// Mastery base value (before any rating)
    pub mastery_base: f32,
    /// Mastery coefficient (how much % per point)
    pub mastery_coeff: f32,
    /// How mastery affects damage
    pub mastery_effect: MasteryEffect,
    /// Haste affects DoT tick rate
    pub haste_affects_dots: bool,
    /// Haste affects cooldowns
    pub haste_affects_cooldowns: bool,
}

impl SpecCoefficients {
    pub fn for_spec(spec: SpecId) -> Self {
        use MasteryEffect::*;
        use SpecId::*;

        match spec {
            BeastMastery => Self {
                mastery_base: 16.0,
                mastery_coeff: 2.0,
                mastery_effect: PetAndOwnerDamage { owner_pct: 0.0 },
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            Marksmanship => Self {
                mastery_base: 10.0,
                mastery_coeff: 1.25,
                mastery_effect: AllDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            Survival => Self {
                mastery_base: 16.0,
                mastery_coeff: 2.0,
                mastery_effect: AllDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            Fury => Self {
                mastery_base: 16.0,
                mastery_coeff: 2.0,
                mastery_effect: AllDamage,
                haste_affects_dots: false,
                haste_affects_cooldowns: false,
            },
            Arms => Self {
                mastery_base: 20.0,
                mastery_coeff: 2.5,
                mastery_effect: DotDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            // Add more specs as needed...
            _ => Self {
                mastery_base: 8.0,
                mastery_coeff: 1.0,
                mastery_effect: AllDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
        }
    }
}
