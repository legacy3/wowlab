use crate::types::{Attribute, DamageSchool, RatingType};

/// A stat modifier from a buff/aura
#[derive(Clone, Debug)]
pub enum StatModifier {
    /// Flat addition to primary stat
    PrimaryFlat { attr: Attribute, amount: f32 },
    /// Percentage increase to primary stat
    PrimaryMult { attr: Attribute, pct: f32 },
    /// Flat addition to rating
    RatingFlat { rating: RatingType, amount: f32 },
    /// Percentage increase to rating
    RatingMult { rating: RatingType, pct: f32 },
    /// Flat attack power
    AttackPowerFlat(f32),
    /// Percentage attack power
    AttackPowerMult(f32),
    /// Flat spell power
    SpellPowerFlat(f32),
    /// Percentage spell power
    SpellPowerMult(f32),
    /// Damage multiplier (all)
    DamageMult(f32),
    /// Damage multiplier (school-specific)
    SchoolDamageMult { school: DamageSchool, pct: f32 },
    /// Haste multiplier (stacks multiplicatively)
    HasteMult(f32),
    /// Crit damage multiplier
    CritDamageMult(f32),
}

/// Collection of active stat modifiers
#[derive(Clone, Debug, Default)]
pub struct ModifierStack {
    pub modifiers: Vec<StatModifier>,
}

impl ModifierStack {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add(&mut self, modifier: StatModifier) {
        self.modifiers.push(modifier);
    }

    pub fn clear(&mut self) {
        self.modifiers.clear();
    }

    /// Get total damage multiplier
    pub fn damage_mult(&self, school: DamageSchool) -> f32 {
        let mut mult = 1.0;
        for m in &self.modifiers {
            match m {
                StatModifier::DamageMult(pct) => mult *= 1.0 + pct,
                StatModifier::SchoolDamageMult { school: s, pct } if *s == school => {
                    mult *= 1.0 + pct;
                }
                _ => {}
            }
        }
        mult
    }

    /// Get total haste multiplier
    pub fn haste_mult(&self) -> f32 {
        let mut mult = 1.0;
        for m in &self.modifiers {
            if let StatModifier::HasteMult(pct) = m {
                mult *= 1.0 + pct;
            }
        }
        mult
    }
}
