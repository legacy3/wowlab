//! Class and specialization coefficient data.
//!
//! This module defines how primary attributes convert to derived stats
//! for each class and specialization.
//!
//! Mastery coefficients are extracted from SimC source files.
//! Each spec's mastery has a unique effect that scales with mastery rating.

use super::types::{Attribute, MasteryEffect, SpecId};

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

    /// Mastery effect type and scaling for this spec.
    /// Determines how mastery rating converts to gameplay effect.
    pub mastery_effect: MasteryEffect,

    /// Primary stat for this spec.
    pub primary_stat: Attribute,

    /// Whether this spec uses spell power for damage/healing calculations.
    pub uses_spell_power: bool,

    /// Whether this spec can parry attacks.
    pub can_parry: bool,

    /// Whether this spec can block attacks.
    pub can_block: bool,

    /// Whether this spec can dual wield weapons.
    pub can_dual_wield: bool,
}

impl Default for ClassCoefficients {
    /// Returns Beast Mastery Hunter coefficients as the default.
    fn default() -> Self {
        Self::beast_mastery()
    }
}

impl ClassCoefficients {
    // =========================================================================
    // Base templates for primary stat types
    // =========================================================================

    /// Base template for Agility-based DPS specs.
    /// Used by: Hunter, Rogue, Monk (WW/BrM), Druid (Feral/Guardian), DH, Shaman (Enh)
    pub fn agility_base() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_effect: MasteryEffect::default(),
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: false,
            can_block: false,
            can_dual_wield: false,
        }
    }

    /// Base template for Strength-based DPS specs.
    /// Used by: Warrior (Arms/Fury), DK (Frost/Unholy), Paladin (Ret)
    pub fn strength_base() -> Self {
        Self {
            ap_per_strength: 1.0,
            ap_per_agility: 0.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_effect: MasteryEffect::default(),
            primary_stat: Attribute::Strength,
            uses_spell_power: false,
            can_parry: true,
            can_block: false,
            can_dual_wield: false,
        }
    }

    /// Base template for Intellect-based caster DPS specs.
    /// Used by: Mage, Warlock, Priest (Shadow), Shaman (Ele), Druid (Balance), Evoker (Dev)
    pub fn intellect_base() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 0.0,
            sp_per_intellect: 1.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_effect: MasteryEffect::default(),
            primary_stat: Attribute::Intellect,
            uses_spell_power: true,
            can_parry: false,
            can_block: false,
            can_dual_wield: false,
        }
    }

    /// Base template for Intellect-based healer specs.
    /// Used by: Priest (Disc/Holy), Paladin (Holy), Shaman (Resto), Druid (Resto),
    ///          Monk (MW), Evoker (Pres/Aug)
    pub fn healer_base() -> Self {
        Self::intellect_base()
    }

    /// Base template for Strength-based tank specs.
    /// Used by: Warrior (Prot), DK (Blood), Paladin (Prot)
    pub fn strength_tank_base() -> Self {
        Self {
            ap_per_strength: 1.0,
            ap_per_agility: 0.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0, // Tanks get parry from mastery/spec passives
            mastery_effect: MasteryEffect::default(),
            primary_stat: Attribute::Strength,
            uses_spell_power: false,
            can_parry: true,
            can_block: true,
            can_dual_wield: false,
        }
    }

    /// Base template for Agility-based tank specs.
    /// Used by: Monk (BrM), Druid (Guardian), DH (Vengeance)
    pub fn agility_tank_base() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0,
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_effect: MasteryEffect::default(),
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: true,
            can_block: false,
            can_dual_wield: false,
        }
    }

    // =========================================================================
    // Builder methods
    // =========================================================================

    /// Set the mastery effect type for this spec.
    #[inline]
    pub fn with_mastery_effect(mut self, effect: MasteryEffect) -> Self {
        self.mastery_effect = effect;
        self
    }

    /// Set whether this spec can block attacks.
    #[inline]
    pub fn with_block(mut self, can_block: bool) -> Self {
        self.can_block = can_block;
        self
    }

    /// Set whether this spec can dual wield weapons.
    #[inline]
    pub fn with_dual_wield(mut self, can_dw: bool) -> Self {
        self.can_dual_wield = can_dw;
        self
    }

    /// Set whether this spec can parry attacks.
    #[inline]
    pub fn with_parry(mut self, can_parry: bool) -> Self {
        self.can_parry = can_parry;
        self
    }

    // =========================================================================
    // Warrior (Strength) - Class 1
    // =========================================================================

    /// Arms Warrior coefficients.
    /// Mastery: Deep Wounds - Increases bleed damage.
    /// SimC: mastery.deep_wounds_ARMS
    pub fn arms() -> Self {
        Self::strength_base()
            .with_mastery_effect(MasteryEffect::DotMultiplier {
                base_percent: 10.0,
                per_mastery: 2.0,
            })
            .with_dual_wield(false)
    }

    /// Fury Warrior coefficients.
    /// Mastery: Unshackled Fury - Increases damage while Enraged.
    /// SimC: mastery.unshackled_fury
    pub fn fury() -> Self {
        Self::strength_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 1.4,
            })
            .with_dual_wield(true)
    }

    /// Protection Warrior coefficients.
    /// Mastery: Critical Block - Increases block chance and critical block chance.
    /// SimC: mastery.critical_block
    pub fn protection_warrior() -> Self {
        Self::strength_tank_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 1.5 })
            .with_block(true)
    }

    // =========================================================================
    // Paladin (Strength/Intellect) - Class 2
    // =========================================================================

    /// Holy Paladin coefficients.
    /// Mastery: Lightbringer - Increases healing to nearby targets.
    /// SimC: mastery.lightbringer
    pub fn holy_paladin() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 1.2 })
    }

    /// Protection Paladin coefficients.
    /// Mastery: Divine Bulwark - Increases block chance, Attack Power, and damage reduction.
    /// SimC: mastery.divine_bulwark
    pub fn protection_paladin() -> Self {
        Self::strength_tank_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 1.0 })
            .with_block(true)
    }

    /// Retribution Paladin coefficients.
    /// Mastery: Highlord's Judgment - Increases Holy damage and Judgment proc chance.
    /// SimC: mastery.highlords_judgment
    pub fn retribution() -> Self {
        Self::strength_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 1.85,
            })
            .with_dual_wield(false)
    }

    // =========================================================================
    // Hunter (Agility) - Class 3
    // =========================================================================

    /// Beast Mastery Hunter coefficients.
    /// Mastery: Master of Beasts - Increases pet damage.
    /// SimC: mastery.master_of_beasts
    pub fn beast_mastery() -> Self {
        Self::agility_base().with_mastery_effect(MasteryEffect::PetDamageMultiplier {
            base_percent: 18.0,
            per_mastery: 1.7,
        })
    }

    /// Marksmanship Hunter coefficients.
    /// Mastery: Sniper Training - Increases range and damage of ranged abilities.
    /// SimC: mastery.sniper_training
    pub fn marksmanship() -> Self {
        Self::agility_base().with_mastery_effect(MasteryEffect::DamageMultiplier {
            base_percent: 5.0,
            per_mastery: 1.2,
        })
    }

    /// Survival Hunter coefficients.
    /// Mastery: Spirit Bond - Increases damage and pet Focus regeneration.
    /// SimC: mastery.spirit_bond
    pub fn survival() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 8.0,
                per_mastery: 0.85,
            })
            .with_parry(true) // Melee spec can parry
    }

    // =========================================================================
    // Rogue (Agility) - Class 4
    // =========================================================================

    /// Assassination Rogue coefficients.
    /// Mastery: Potent Assassin - Increases poison and bleed damage.
    /// SimC: mastery.potent_assassin
    pub fn assassination() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DotMultiplier {
                base_percent: 10.0,
                per_mastery: 2.2,
            })
            .with_dual_wield(true)
            .with_parry(true)
    }

    /// Outlaw Rogue coefficients.
    /// Mastery: Main Gauche - Chance for off-hand attack on main-hand abilities.
    /// SimC: mastery.main_gauche
    pub fn outlaw() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::ProcChance {
                base_chance: 10.0,
                per_mastery: 1.7,
            })
            .with_dual_wield(true)
            .with_parry(true)
    }

    /// Subtlety Rogue coefficients.
    /// Mastery: Executioner - Increases finishing move damage.
    /// SimC: mastery.executioner
    pub fn subtlety() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 2.76,
            })
            .with_dual_wield(true)
            .with_parry(true)
    }

    // =========================================================================
    // Priest (Intellect) - Class 5
    // =========================================================================

    /// Discipline Priest coefficients.
    /// Mastery: Grace - Increases healing and absorption on targets with Atonement.
    /// SimC: mastery_spells.grace
    pub fn discipline() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 1.15 })
    }

    /// Holy Priest coefficients.
    /// Mastery: Echo of Light - Heals leave a HoT on the target.
    /// SimC: mastery_spells.echo_of_light
    pub fn holy_priest() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 1.25 })
    }

    /// Shadow Priest coefficients.
    /// Mastery: Shadow Weaving - Increases damage for each DoT on target.
    /// SimC: mastery_spells.shadow_weaving
    pub fn shadow() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DamageMultiplier {
            base_percent: 5.0,
            per_mastery: 0.8,
        })
    }

    // =========================================================================
    // Death Knight (Strength) - Class 6
    // =========================================================================

    /// Blood Death Knight coefficients.
    /// Mastery: Blood Shield - Attack Power bonus and shield absorb from Death Strike.
    /// SimC: mastery.blood_shield
    pub fn blood() -> Self {
        Self::strength_tank_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 2.0 })
            .with_block(false) // DKs don't block
            .with_parry(true)
    }

    /// Frost Death Knight coefficients.
    /// Mastery: Frozen Heart - Increases Frost damage.
    /// SimC: mastery.frozen_heart
    pub fn frost_dk() -> Self {
        Self::strength_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 2.0,
            })
            .with_dual_wield(true)
    }

    /// Unholy Death Knight coefficients.
    /// Mastery: Dreadblade - Increases Shadow damage and minion damage.
    /// SimC: mastery.dreadblade
    pub fn unholy() -> Self {
        Self::strength_base()
            .with_mastery_effect(MasteryEffect::PetDamageMultiplier {
                base_percent: 10.0,
                per_mastery: 1.8,
            })
            .with_dual_wield(false)
    }

    // =========================================================================
    // Shaman (Agility/Intellect) - Class 7
    // =========================================================================

    /// Elemental Shaman coefficients.
    /// Mastery: Elemental Overload - Chance for spells to trigger additional damage.
    /// SimC: mastery.elemental_overload
    pub fn elemental() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::ProcChance {
            base_chance: 10.0,
            per_mastery: 1.875,
        })
    }

    /// Enhancement Shaman coefficients.
    /// Mastery: Enhanced Elements - Increases Fire/Frost/Nature damage and proc chances.
    /// SimC: mastery.enhanced_elements
    pub fn enhancement() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 2.0,
            })
            .with_dual_wield(true)
            .with_parry(true)
    }

    /// Restoration Shaman coefficients.
    /// Mastery: Deep Healing - Increased healing on lower health targets.
    /// SimC: mastery.deep_healing
    pub fn restoration_shaman() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 3.0 })
    }

    // =========================================================================
    // Mage (Intellect) - Class 8
    // =========================================================================

    /// Arcane Mage coefficients.
    /// Mastery: Savant - Increases max mana, mana regen, and Arcane damage per charge.
    /// SimC: spec.savant
    pub fn arcane() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DamageMultiplier {
            base_percent: 5.0,
            per_mastery: 1.2,
        })
    }

    /// Fire Mage coefficients.
    /// Mastery: Ignite - Increases critical strike damage and applies Ignite DoT.
    /// SimC: spec.ignite
    pub fn fire() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DotMultiplier {
            base_percent: 5.0,
            per_mastery: 0.75,
        })
    }

    /// Frost Mage coefficients.
    /// Mastery: Icicles - Stores damage in Icicles and increases Frozen target damage.
    /// SimC: spec.icicles
    pub fn frost_mage() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::ProcChance {
            base_chance: 10.0,
            per_mastery: 2.25,
        })
    }

    // =========================================================================
    // Warlock (Intellect) - Class 9
    // =========================================================================

    /// Affliction Warlock coefficients.
    /// Mastery: Potent Afflictions - Increases DoT damage.
    /// SimC: warlock_base.potent_afflictions
    pub fn affliction() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DotMultiplier {
            base_percent: 10.0,
            per_mastery: 2.5,
        })
    }

    /// Demonology Warlock coefficients.
    /// Mastery: Master Demonologist - Increases demon damage.
    /// SimC: warlock_base.master_demonologist
    pub fn demonology() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::PetDamageMultiplier {
            base_percent: 10.0,
            per_mastery: 1.5,
        })
    }

    /// Destruction Warlock coefficients.
    /// Mastery: Chaotic Energies - Increases damage within a random range.
    /// SimC: warlock_base.chaotic_energies
    pub fn destruction() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DamageMultiplier {
            base_percent: 10.0,
            per_mastery: 1.75,
        })
    }

    // =========================================================================
    // Monk (Agility/Intellect) - Class 10
    // =========================================================================

    /// Brewmaster Monk coefficients.
    /// Mastery: Elusive Brawler - Increases Attack Power and grants stacking dodge.
    /// SimC: baseline.brewmaster.mastery
    pub fn brewmaster() -> Self {
        Self::agility_tank_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 1.0 })
            .with_dual_wield(true)
    }

    /// Mistweaver Monk coefficients.
    /// Mastery: Gust of Mists - Bonus healing on targets affected by certain abilities.
    /// SimC: baseline.mistweaver.mastery
    pub fn mistweaver() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 4.2 })
    }

    /// Windwalker Monk coefficients.
    /// Mastery: Combo Strikes - Damage bonus when not repeating abilities.
    /// SimC: baseline.windwalker.mastery
    pub fn windwalker() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 1.25,
            })
            .with_dual_wield(true)
            .with_parry(true)
    }

    // =========================================================================
    // Druid (Agility/Intellect) - Class 11
    // =========================================================================

    /// Balance Druid coefficients.
    /// Mastery: Astral Invocation - Increases Arcane/Nature damage and DoT bonuses.
    /// SimC: mastery.astral_invocation
    pub fn balance() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DamageMultiplier {
            base_percent: 5.0,
            per_mastery: 1.1,
        })
    }

    /// Feral Druid coefficients.
    /// Mastery: Razor Claws - Increases bleed and finishing move damage.
    /// SimC: mastery.razor_claws
    pub fn feral() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DotMultiplier {
                base_percent: 10.0,
                per_mastery: 2.0,
            })
            .with_parry(false) // Cat form cannot parry
    }

    /// Guardian Druid coefficients.
    /// Mastery: Nature's Guardian - Increases Attack Power, max health, and healing received.
    /// SimC: mastery.natures_guardian
    pub fn guardian() -> Self {
        Self::agility_tank_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 1.25 })
            .with_parry(false) // Bear form cannot parry
    }

    /// Restoration Druid coefficients.
    /// Mastery: Harmony - Increases healing per HoT on target.
    /// SimC: mastery.harmony
    pub fn restoration_druid() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 1.25 })
    }

    // =========================================================================
    // Demon Hunter (Agility) - Class 12
    // =========================================================================

    /// Havoc Demon Hunter coefficients.
    /// Mastery: Demonic Presence / A Fire Inside - Increases Chaos damage.
    /// SimC: mastery.demonic_presence / mastery.a_fire_inside
    pub fn havoc() -> Self {
        Self::agility_base()
            .with_mastery_effect(MasteryEffect::DamageMultiplier {
                base_percent: 10.0,
                per_mastery: 1.8,
            })
            .with_dual_wield(true)
            .with_parry(true)
    }

    /// Vengeance Demon Hunter coefficients.
    /// Mastery: Fel Blood - Increases Armor, Attack Power while Demon Spikes active.
    /// SimC: mastery.fel_blood
    pub fn vengeance() -> Self {
        Self::agility_tank_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 1.5 })
            .with_dual_wield(true)
            .with_parry(true)
    }

    // =========================================================================
    // Evoker (Intellect) - Class 13
    // =========================================================================

    /// Devastation Evoker coefficients.
    /// Mastery: Giantkiller - Increases damage based on target health.
    /// SimC: spec.mastery (Devastation)
    pub fn devastation() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::DamageMultiplier {
            base_percent: 5.0,
            per_mastery: 1.25,
        })
    }

    /// Preservation Evoker coefficients.
    /// Mastery: Life-Binder - Increases healing on lower health targets.
    /// SimC: spec.mastery (Preservation)
    pub fn preservation() -> Self {
        Self::healer_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 1.8 })
    }

    /// Augmentation Evoker coefficients.
    /// Mastery: Timewalker - Increases buff durations and grants Versatility to allies.
    /// SimC: spec.mastery (Augmentation)
    pub fn augmentation() -> Self {
        Self::intellect_base().with_mastery_effect(MasteryEffect::Generic { coefficient: 1.0 })
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
pub fn from_spec(spec: SpecId) -> ClassCoefficients {
    match spec {
        // Warrior
        SpecId::Arms => ClassCoefficients::arms(),
        SpecId::Fury => ClassCoefficients::fury(),
        SpecId::ProtectionWarrior => ClassCoefficients::protection_warrior(),

        // Paladin
        SpecId::Holy => ClassCoefficients::holy_paladin(),
        SpecId::ProtectionPaladin => ClassCoefficients::protection_paladin(),
        SpecId::Retribution => ClassCoefficients::retribution(),

        // Hunter
        SpecId::BeastMastery => ClassCoefficients::beast_mastery(),
        SpecId::Marksmanship => ClassCoefficients::marksmanship(),
        SpecId::Survival => ClassCoefficients::survival(),

        // Rogue
        SpecId::Assassination => ClassCoefficients::assassination(),
        SpecId::Outlaw => ClassCoefficients::outlaw(),
        SpecId::Subtlety => ClassCoefficients::subtlety(),

        // Priest
        SpecId::Discipline => ClassCoefficients::discipline(),
        SpecId::HolyPriest => ClassCoefficients::holy_priest(),
        SpecId::Shadow => ClassCoefficients::shadow(),

        // Death Knight
        SpecId::Blood => ClassCoefficients::blood(),
        SpecId::Frost => ClassCoefficients::frost_dk(),
        SpecId::Unholy => ClassCoefficients::unholy(),

        // Shaman
        SpecId::Elemental => ClassCoefficients::elemental(),
        SpecId::Enhancement => ClassCoefficients::enhancement(),
        SpecId::Restoration => ClassCoefficients::restoration_shaman(),

        // Mage
        SpecId::Arcane => ClassCoefficients::arcane(),
        SpecId::Fire => ClassCoefficients::fire(),
        SpecId::FrostMage => ClassCoefficients::frost_mage(),

        // Warlock
        SpecId::Affliction => ClassCoefficients::affliction(),
        SpecId::Demonology => ClassCoefficients::demonology(),
        SpecId::Destruction => ClassCoefficients::destruction(),

        // Monk
        SpecId::Brewmaster => ClassCoefficients::brewmaster(),
        SpecId::Mistweaver => ClassCoefficients::mistweaver(),
        SpecId::Windwalker => ClassCoefficients::windwalker(),

        // Druid
        SpecId::Balance => ClassCoefficients::balance(),
        SpecId::Feral => ClassCoefficients::feral(),
        SpecId::Guardian => ClassCoefficients::guardian(),
        SpecId::RestorationDruid => ClassCoefficients::restoration_druid(),

        // Demon Hunter
        SpecId::Havoc => ClassCoefficients::havoc(),
        SpecId::Vengeance => ClassCoefficients::vengeance(),

        // Evoker
        SpecId::Devastation => ClassCoefficients::devastation(),
        SpecId::Preservation => ClassCoefficients::preservation(),
        SpecId::Augmentation => ClassCoefficients::augmentation(),
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
        match coeff.mastery_effect {
            MasteryEffect::PetDamageMultiplier { per_mastery, .. } => {
                assert!((per_mastery - 1.7).abs() < 0.01);
            }
            _ => panic!("BM should have PetDamageMultiplier mastery effect"),
        }
    }

    #[test]
    fn test_marksmanship_coefficients() {
        let coeff = ClassCoefficients::marksmanship();
        assert_eq!(coeff.ap_per_agility, 1.0);
        assert_eq!(coeff.primary_stat, Attribute::Agility);
        match coeff.mastery_effect {
            MasteryEffect::DamageMultiplier { per_mastery, .. } => {
                assert!((per_mastery - 1.2).abs() < 0.01);
            }
            _ => panic!("MM should have DamageMultiplier mastery effect"),
        }
    }

    #[test]
    fn test_survival_coefficients() {
        let coeff = ClassCoefficients::survival();
        assert_eq!(coeff.ap_per_agility, 1.0);
        assert_eq!(coeff.primary_stat, Attribute::Agility);
        assert!(coeff.can_parry); // Melee spec
    }

    #[test]
    fn test_from_spec_all_specs() {
        // Test that all specs return valid coefficients
        let specs = [
            SpecId::Arms,
            SpecId::Fury,
            SpecId::ProtectionWarrior,
            SpecId::Holy,
            SpecId::ProtectionPaladin,
            SpecId::Retribution,
            SpecId::BeastMastery,
            SpecId::Marksmanship,
            SpecId::Survival,
            SpecId::Assassination,
            SpecId::Outlaw,
            SpecId::Subtlety,
            SpecId::Discipline,
            SpecId::HolyPriest,
            SpecId::Shadow,
            SpecId::Blood,
            SpecId::Frost,
            SpecId::Unholy,
            SpecId::Elemental,
            SpecId::Enhancement,
            SpecId::Restoration,
            SpecId::Arcane,
            SpecId::Fire,
            SpecId::FrostMage,
            SpecId::Affliction,
            SpecId::Demonology,
            SpecId::Destruction,
            SpecId::Brewmaster,
            SpecId::Mistweaver,
            SpecId::Windwalker,
            SpecId::Balance,
            SpecId::Feral,
            SpecId::Guardian,
            SpecId::RestorationDruid,
            SpecId::Havoc,
            SpecId::Vengeance,
            SpecId::Devastation,
            SpecId::Preservation,
            SpecId::Augmentation,
        ];

        for spec in specs {
            let coeff = from_spec(spec);
            assert!(coeff.health_per_stamina > 0.0, "Spec {:?} has invalid stamina", spec);
            let effect_type = coeff.mastery_effect.effect_type();
            assert!(
                !effect_type.is_empty(),
                "Spec {:?} has invalid mastery effect",
                spec
            );
        }
    }

    #[test]
    fn test_primary_stat_types() {
        // Agility specs
        assert_eq!(from_spec(SpecId::BeastMastery).primary_stat, Attribute::Agility);
        assert_eq!(from_spec(SpecId::Assassination).primary_stat, Attribute::Agility);
        assert_eq!(from_spec(SpecId::Havoc).primary_stat, Attribute::Agility);
        assert_eq!(from_spec(SpecId::Windwalker).primary_stat, Attribute::Agility);
        assert_eq!(from_spec(SpecId::Feral).primary_stat, Attribute::Agility);
        assert_eq!(from_spec(SpecId::Enhancement).primary_stat, Attribute::Agility);

        // Strength specs
        assert_eq!(from_spec(SpecId::Arms).primary_stat, Attribute::Strength);
        assert_eq!(from_spec(SpecId::Fury).primary_stat, Attribute::Strength);
        assert_eq!(from_spec(SpecId::Blood).primary_stat, Attribute::Strength);
        assert_eq!(from_spec(SpecId::Retribution).primary_stat, Attribute::Strength);

        // Intellect specs
        assert_eq!(from_spec(SpecId::Fire).primary_stat, Attribute::Intellect);
        assert_eq!(from_spec(SpecId::Affliction).primary_stat, Attribute::Intellect);
        assert_eq!(from_spec(SpecId::Shadow).primary_stat, Attribute::Intellect);
        assert_eq!(from_spec(SpecId::Balance).primary_stat, Attribute::Intellect);
        assert_eq!(from_spec(SpecId::Elemental).primary_stat, Attribute::Intellect);
        assert_eq!(from_spec(SpecId::Devastation).primary_stat, Attribute::Intellect);
    }

    #[test]
    fn test_tank_specs_can_parry() {
        assert!(from_spec(SpecId::ProtectionWarrior).can_parry);
        assert!(from_spec(SpecId::ProtectionPaladin).can_parry);
        assert!(from_spec(SpecId::Blood).can_parry);
        assert!(from_spec(SpecId::Brewmaster).can_parry);
        assert!(from_spec(SpecId::Vengeance).can_parry);
        // Guardian druids cannot parry (bear form)
        assert!(!from_spec(SpecId::Guardian).can_parry);
    }

    #[test]
    fn test_block_specs() {
        // Only plate tanks can block
        assert!(from_spec(SpecId::ProtectionWarrior).can_block);
        assert!(from_spec(SpecId::ProtectionPaladin).can_block);
        // DKs don't block
        assert!(!from_spec(SpecId::Blood).can_block);
        // Leather/Mail tanks don't block
        assert!(!from_spec(SpecId::Guardian).can_block);
        assert!(!from_spec(SpecId::Brewmaster).can_block);
        assert!(!from_spec(SpecId::Vengeance).can_block);
    }

    #[test]
    fn test_dual_wield_specs() {
        // Dual wield specs
        assert!(from_spec(SpecId::Fury).can_dual_wield);
        assert!(from_spec(SpecId::Frost).can_dual_wield);
        assert!(from_spec(SpecId::Assassination).can_dual_wield);
        assert!(from_spec(SpecId::Outlaw).can_dual_wield);
        assert!(from_spec(SpecId::Subtlety).can_dual_wield);
        assert!(from_spec(SpecId::Enhancement).can_dual_wield);
        assert!(from_spec(SpecId::Windwalker).can_dual_wield);
        assert!(from_spec(SpecId::Brewmaster).can_dual_wield);
        assert!(from_spec(SpecId::Havoc).can_dual_wield);
        assert!(from_spec(SpecId::Vengeance).can_dual_wield);

        // Non-dual wield specs
        assert!(!from_spec(SpecId::Arms).can_dual_wield);
        assert!(!from_spec(SpecId::BeastMastery).can_dual_wield);
        assert!(!from_spec(SpecId::Fire).can_dual_wield);
    }

    #[test]
    fn test_spell_power_specs() {
        // Caster DPS use spell power
        assert!(from_spec(SpecId::Fire).uses_spell_power);
        assert!(from_spec(SpecId::Affliction).uses_spell_power);
        assert!(from_spec(SpecId::Shadow).uses_spell_power);
        assert!(from_spec(SpecId::Balance).uses_spell_power);
        assert!(from_spec(SpecId::Elemental).uses_spell_power);
        assert!(from_spec(SpecId::Devastation).uses_spell_power);

        // Healers use spell power
        assert!(from_spec(SpecId::Discipline).uses_spell_power);
        assert!(from_spec(SpecId::Holy).uses_spell_power);
        assert!(from_spec(SpecId::Restoration).uses_spell_power);
        assert!(from_spec(SpecId::Mistweaver).uses_spell_power);

        // Physical DPS don't use spell power
        assert!(!from_spec(SpecId::Arms).uses_spell_power);
        assert!(!from_spec(SpecId::BeastMastery).uses_spell_power);
        assert!(!from_spec(SpecId::Assassination).uses_spell_power);
        assert!(!from_spec(SpecId::Havoc).uses_spell_power);
    }

    #[test]
    fn test_builder_methods() {
        let coeff = ClassCoefficients::agility_base()
            .with_mastery_effect(MasteryEffect::Generic { coefficient: 2.5 })
            .with_block(true)
            .with_dual_wield(true)
            .with_parry(true);

        match coeff.mastery_effect {
            MasteryEffect::Generic { coefficient } => {
                assert!((coefficient - 2.5).abs() < 0.01);
            }
            _ => panic!("Should have Generic mastery effect"),
        }
        assert!(coeff.can_block);
        assert!(coeff.can_dual_wield);
        assert!(coeff.can_parry);
    }

    #[test]
    fn test_base_templates() {
        // Agility base
        let agi = ClassCoefficients::agility_base();
        assert_eq!(agi.primary_stat, Attribute::Agility);
        assert_eq!(agi.ap_per_agility, 1.0);
        assert_eq!(agi.ap_per_strength, 0.0);
        assert!(!agi.uses_spell_power);

        // Strength base
        let str_ = ClassCoefficients::strength_base();
        assert_eq!(str_.primary_stat, Attribute::Strength);
        assert_eq!(str_.ap_per_strength, 1.0);
        assert_eq!(str_.ap_per_agility, 0.0);
        assert!(!str_.uses_spell_power);

        // Intellect base
        let int = ClassCoefficients::intellect_base();
        assert_eq!(int.primary_stat, Attribute::Intellect);
        assert_eq!(int.sp_per_intellect, 1.0);
        assert!(int.uses_spell_power);

        // Tank bases
        let str_tank = ClassCoefficients::strength_tank_base();
        assert!(str_tank.can_parry);
        assert!(str_tank.can_block);

        let agi_tank = ClassCoefficients::agility_tank_base();
        assert!(agi_tank.can_parry);
        assert!(!agi_tank.can_block);
    }

    #[test]
    fn test_default_is_beast_mastery() {
        let default = ClassCoefficients::default();
        let bm = ClassCoefficients::beast_mastery();
        assert_eq!(default.ap_per_agility, bm.ap_per_agility);
        assert_eq!(default.mastery_effect, bm.mastery_effect);
    }

    #[test]
    fn test_hunter_mastery_effects() {
        use super::super::types::MasteryEffect;

        // Beast Mastery: Pet damage multiplier
        let bm = ClassCoefficients::beast_mastery();
        match bm.mastery_effect {
            MasteryEffect::PetDamageMultiplier {
                base_percent,
                per_mastery,
            } => {
                assert!((base_percent - 18.0).abs() < 0.01);
                assert!((per_mastery - 1.7).abs() < 0.01);
            }
            _ => panic!("BM should have PetDamageMultiplier mastery effect"),
        }

        // Marksmanship: Damage multiplier
        let mm = ClassCoefficients::marksmanship();
        match mm.mastery_effect {
            MasteryEffect::DamageMultiplier {
                base_percent,
                per_mastery,
            } => {
                assert!((base_percent - 5.0).abs() < 0.01);
                assert!((per_mastery - 1.2).abs() < 0.01);
            }
            _ => panic!("MM should have DamageMultiplier mastery effect"),
        }

        // Survival: Damage multiplier
        let sv = ClassCoefficients::survival();
        match sv.mastery_effect {
            MasteryEffect::DamageMultiplier {
                base_percent,
                per_mastery,
            } => {
                assert!((base_percent - 8.0).abs() < 0.01);
                assert!((per_mastery - 0.85).abs() < 0.01);
            }
            _ => panic!("SV should have DamageMultiplier mastery effect"),
        }
    }

    #[test]
    fn test_mastery_effect_calculation() {
        let bm = ClassCoefficients::beast_mastery();

        // At 0% mastery from rating, should get base 18%
        let bonus = bm.mastery_effect.calculate_bonus(0.0);
        assert!((bonus - 0.18).abs() < 0.001);

        // At 20% mastery from rating (20 "points"), should get 18% + 34% = 52%
        let bonus = bm.mastery_effect.calculate_bonus(0.20);
        assert!((bonus - 0.52).abs() < 0.001);
    }
}
