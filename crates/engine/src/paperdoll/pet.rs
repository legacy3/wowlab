//! Pet stat inheritance system.
//!
//! Pets inherit stats from their owner with class-specific coefficients.
//! This module provides:
//! - [`PetCoefficients`] - Inheritance multipliers for each stat
//! - [`PetStats`] - Computed pet stats derived from owner
//!
//! # Pet Stat Inheritance
//!
//! Different pet types have different inheritance coefficients:
//! - Hunter main pets: 60% AP from owner AP, 70% stamina
//! - Warlock pets: 50% AP from SP, 100% SP from SP
//! - DK ghouls: 63.18% AP from owner AP
//!
//! Secondary stats (crit, haste, versatility) are inherited at 100%.

// Re-export PetType from types module for use in this module and external consumers
pub use super::types::PetType;

/// Pet stat inheritance coefficients.
///
/// These coefficients determine how much of the owner's stats
/// are inherited by the pet. Different pet types have different
/// scaling ratios.
///
/// # Examples
///
/// ```
/// use engine::paperdoll::pet::PetCoefficients;
///
/// // Hunter main pet inherits 60% AP
/// let coeffs = PetCoefficients::hunter_main_pet();
/// assert_eq!(coeffs.ap_from_ap, 0.60);
///
/// // Warlock pets scale from spell power
/// let coeffs = PetCoefficients::warlock_pet();
/// assert_eq!(coeffs.sp_from_sp, 1.00);
/// ```
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PetCoefficients {
    /// Pet armor = owner armor * this
    pub armor: f32,

    /// Pet health = owner health * this
    pub health: f32,

    /// Pet AP = owner AP * this
    pub ap_from_ap: f32,

    /// Pet AP = owner SP * this (caster pets)
    pub ap_from_sp: f32,

    /// Pet SP = owner AP * this
    pub sp_from_ap: f32,

    /// Pet SP = owner SP * this (caster pets)
    pub sp_from_sp: f32,

    /// Pet stamina = owner stamina * this
    pub stamina_inherit: f32,

    /// Pet intellect = owner intellect * this
    pub intellect_inherit: f32,
}

impl Default for PetCoefficients {
    fn default() -> Self {
        Self {
            armor: 1.0,
            health: 1.0,
            ap_from_ap: 0.0,
            ap_from_sp: 0.0,
            sp_from_ap: 0.0,
            sp_from_sp: 0.0,
            stamina_inherit: 0.75,
            intellect_inherit: 0.30,
        }
    }
}

impl PetCoefficients {
    /// Hunter main pet (60% AP scaling, 70% stamina).
    ///
    /// Standard hunter companion pet with moderate AP inheritance.
    pub fn hunter_main_pet() -> Self {
        Self {
            ap_from_ap: 0.60,
            stamina_inherit: 0.70,
            ..Default::default()
        }
    }

    /// Hunter Dire Beast (100% AP scaling).
    ///
    /// Temporary beast summoned by the Dire Beast ability.
    pub fn hunter_dire_beast() -> Self {
        Self {
            ap_from_ap: 1.00,
            ..Default::default()
        }
    }

    /// Hunter Dark Hound - Beast Mastery spec (500% AP scaling).
    ///
    /// Pack Leader hero talent Dark Hound for BM hunters.
    pub fn hunter_dark_hound_bm() -> Self {
        Self {
            ap_from_ap: 5.00,
            ..Default::default()
        }
    }

    /// Hunter Dark Hound - other specs (605% AP scaling).
    ///
    /// Pack Leader hero talent Dark Hound for MM/SV hunters.
    pub fn hunter_dark_hound() -> Self {
        Self {
            ap_from_ap: 6.05,
            ..Default::default()
        }
    }

    /// Hunter Fenryr/Hati hero pets (200% AP scaling).
    ///
    /// Hero talent pets with enhanced damage scaling.
    pub fn hunter_hero_pet() -> Self {
        Self {
            ap_from_ap: 2.00,
            ..Default::default()
        }
    }

    /// Warlock pet (SP scaling, 50% health).
    ///
    /// Standard warlock demon with spell power inheritance.
    pub fn warlock_pet() -> Self {
        Self {
            ap_from_sp: 0.50,
            sp_from_sp: 1.00,
            health: 0.50,
            ..Default::default()
        }
    }

    /// Death Knight Ghoul (63.18% AP scaling).
    ///
    /// Unholy DK permanent ghoul companion.
    pub fn dk_ghoul() -> Self {
        Self {
            ap_from_ap: 0.6318,
            ..Default::default()
        }
    }
}

/// Owner stats needed for pet inheritance.
///
/// This trait abstracts the stats that pets need from their owner,
/// allowing `PetStats` to work with any stat cache implementation.
pub trait OwnerStats {
    fn attack_power(&self) -> f32;
    fn spell_power(&self) -> f32;
    fn crit_chance(&self) -> f32;
    fn haste_mult(&self) -> f32;
    fn vers_damage(&self) -> f32;
    fn max_health(&self) -> f32;
    fn armor(&self) -> f32;
    fn stamina(&self) -> f32;
    fn intellect(&self) -> f32;
}

/// Stat cache fields needed by pet inheritance.
///
/// This struct mirrors the relevant fields from `StatCache` to allow
/// pet stats to be updated from the owner. When `StatCache` is implemented,
/// it should implement the `OwnerStats` trait.
#[derive(Clone, Debug, Default)]
pub struct StatCache {
    pub attack_power: f32,
    pub spell_power: f32,
    pub crit_chance: f32,
    pub haste_mult: f32,
    pub vers_damage: f32,
    pub max_health: f32,
    pub armor: f32,
    pub stamina: f32,
    pub intellect: f32,
}

impl OwnerStats for StatCache {
    #[inline]
    fn attack_power(&self) -> f32 {
        self.attack_power
    }

    #[inline]
    fn spell_power(&self) -> f32 {
        self.spell_power
    }

    #[inline]
    fn crit_chance(&self) -> f32 {
        self.crit_chance
    }

    #[inline]
    fn haste_mult(&self) -> f32 {
        self.haste_mult
    }

    #[inline]
    fn vers_damage(&self) -> f32 {
        self.vers_damage
    }

    #[inline]
    fn max_health(&self) -> f32 {
        self.max_health
    }

    #[inline]
    fn armor(&self) -> f32 {
        self.armor
    }

    #[inline]
    fn stamina(&self) -> f32 {
        self.stamina
    }

    #[inline]
    fn intellect(&self) -> f32 {
        self.intellect
    }
}

/// Pet computed stats derived from owner.
///
/// All pet stats are derived from the owner's stats using the pet's
/// inheritance coefficients. The pet does not have independent base stats.
///
/// # Stat Inheritance
///
/// Power stats (AP/SP) are scaled by coefficients:
/// - `attack_power = owner.AP * ap_from_ap + owner.SP * ap_from_sp`
/// - `spell_power = owner.AP * sp_from_ap + owner.SP * sp_from_sp`
///
/// Secondary stats are inherited at 100%:
/// - Crit chance
/// - Haste multiplier
/// - Versatility
///
/// Defensive stats are scaled by coefficients:
/// - Health and armor use their respective multipliers
/// - Stamina and intellect use inheritance percentages
///
/// # Example
///
/// ```
/// use engine::paperdoll::pet::{PetStats, PetType, PetCoefficients, StatCache};
///
/// let mut pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());
///
/// let owner = StatCache {
///     attack_power: 10000.0,
///     crit_chance: 0.25,
///     haste_mult: 1.20,
///     vers_damage: 0.05,
///     max_health: 400000.0,
///     armor: 5000.0,
///     stamina: 8000.0,
///     ..Default::default()
/// };
///
/// pet.update_from_owner(&owner, 0.0);
///
/// // Pet gets 60% of owner AP
/// assert_eq!(pet.attack_power, 6000.0);
/// // Secondary stats are 100%
/// assert_eq!(pet.crit_chance, 0.25);
/// ```
#[derive(Clone, Debug)]
pub struct PetStats {
    /// Pet type determines base coefficients.
    pub pet_type: PetType,

    /// Inheritance coefficients.
    pub coefficients: PetCoefficients,

    // === Derived Power Stats ===
    /// Pet attack power (from owner AP and/or SP).
    pub attack_power: f32,

    /// Pet spell power (from owner AP and/or SP).
    pub spell_power: f32,

    // === Inherited Secondary Stats (100% from owner) ===
    /// Crit chance as decimal (0.25 = 25%).
    pub crit_chance: f32,

    /// Haste as multiplier (1.25 = 25% haste).
    pub haste_mult: f32,

    /// Versatility damage bonus as decimal.
    pub versatility: f32,

    // === Scaled Stats ===
    /// Maximum health (scaled from owner).
    pub max_health: f32,

    /// Armor value (scaled from owner).
    pub armor: f32,

    /// Stamina (inherited percentage from owner).
    pub stamina: f32,

    /// Intellect (inherited percentage from owner).
    pub intellect: f32,

    // === Pet-specific modifiers ===
    /// Combined damage multiplier including versatility and pet bonuses.
    pub damage_multiplier: f32,

    // === Pre-computed ===
    /// Expected crit multiplier: 1.0 + crit_chance.
    pub crit_mult: f32,

    /// Attack speed in milliseconds (base 2000ms / haste).
    pub attack_speed_ms: u32,
}

impl Default for PetStats {
    fn default() -> Self {
        Self {
            pet_type: PetType::default(),
            coefficients: PetCoefficients::default(),
            attack_power: 0.0,
            spell_power: 0.0,
            crit_chance: 0.05,
            haste_mult: 1.0,
            versatility: 0.0,
            max_health: 1.0,
            armor: 0.0,
            stamina: 0.0,
            intellect: 0.0,
            damage_multiplier: 1.0,
            crit_mult: 1.05,
            attack_speed_ms: 2000,
        }
    }
}

impl PetStats {
    /// Create pet stats with given type and coefficients.
    ///
    /// The pet starts with default values. Call `update_from_owner`
    /// to compute actual stats from the owner.
    pub fn new(pet_type: PetType, coefficients: PetCoefficients) -> Self {
        Self {
            pet_type,
            coefficients,
            damage_multiplier: 1.0,
            crit_mult: 1.0,
            attack_speed_ms: 2000,
            ..Default::default()
        }
    }

    /// Update all pet stats from owner's stat cache.
    ///
    /// # Arguments
    ///
    /// * `owner_cache` - The owner's computed stat cache
    /// * `pet_damage_mod` - Additional pet damage modifier percentage (e.g., from talents)
    ///
    /// # Stat Calculations
    ///
    /// Power stats are computed using coefficients:
    /// - `attack_power = owner.AP * ap_from_ap + owner.SP * ap_from_sp`
    /// - `spell_power = owner.AP * sp_from_ap + owner.SP * sp_from_sp`
    ///
    /// Secondary stats (crit, haste, versatility) are inherited at 100%.
    ///
    /// Defensive stats use their respective multipliers:
    /// - `max_health = owner.max_health * health`
    /// - `armor = owner.armor * armor`
    /// - `stamina = owner.stamina * stamina_inherit`
    /// - `intellect = owner.intellect * intellect_inherit`
    pub fn update_from_owner<T: OwnerStats>(&mut self, owner_cache: &T, pet_damage_mod: f32) {
        let coeff = &self.coefficients;

        // === Power Stats ===
        // Pet AP from owner AP and/or SP
        self.attack_power =
            owner_cache.attack_power() * coeff.ap_from_ap + owner_cache.spell_power() * coeff.ap_from_sp;

        // Pet SP from owner AP and/or SP
        self.spell_power =
            owner_cache.attack_power() * coeff.sp_from_ap + owner_cache.spell_power() * coeff.sp_from_sp;

        // === Direct Inheritance (100%) ===
        self.crit_chance = owner_cache.crit_chance();
        self.haste_mult = owner_cache.haste_mult();
        self.versatility = owner_cache.vers_damage();

        // === Scaled Inheritance ===
        self.max_health = owner_cache.max_health() * coeff.health;
        self.armor = owner_cache.armor() * coeff.armor;
        self.stamina = owner_cache.stamina() * coeff.stamina_inherit;
        self.intellect = owner_cache.intellect() * coeff.intellect_inherit;

        // === Damage Multiplier ===
        // Versatility + pet damage modifier (talent/passive bonuses)
        self.damage_multiplier = (1.0 + self.versatility) * (1.0 + pet_damage_mod / 100.0);

        // === Pre-computed ===
        self.crit_mult = 1.0 + self.crit_chance;

        // Pet base attack speed is 2000ms, scaled by haste
        let base_attack_speed_ms = 2000.0;
        self.attack_speed_ms = (base_attack_speed_ms / self.haste_mult) as u32;
    }

    /// Calculate pet ability damage.
    ///
    /// # Arguments
    ///
    /// * `base_min` - Minimum base damage of the ability
    /// * `base_max` - Maximum base damage of the ability
    /// * `ap_coeff` - Attack power coefficient for scaling
    ///
    /// # Returns
    ///
    /// Expected damage including crit and damage multipliers.
    ///
    /// # Formula
    ///
    /// ```text
    /// base = (base_min + base_max) / 2
    /// ap_damage = ap_coeff * attack_power
    /// total = (base + ap_damage) * crit_mult * damage_multiplier
    /// ```
    #[inline]
    pub fn calculate_damage(&self, base_min: f32, base_max: f32, ap_coeff: f32) -> f32 {
        let base = (base_min + base_max) * 0.5;
        let ap_damage = ap_coeff * self.attack_power;

        (base + ap_damage) * self.crit_mult * self.damage_multiplier
    }

    /// Calculate pet auto-attack damage.
    ///
    /// # Arguments
    ///
    /// * `weapon_min` - Minimum weapon damage
    /// * `weapon_max` - Maximum weapon damage
    ///
    /// # Returns
    ///
    /// Expected auto-attack damage including AP scaling, crit, and multipliers.
    ///
    /// # Formula
    ///
    /// Pet auto-attacks scale with attack power using the standard formula:
    /// ```text
    /// base = (weapon_min + weapon_max) / 2
    /// ap_bonus = attack_power / 14.0 * (attack_speed_ms / 1000.0)
    /// total = (base + ap_bonus) * crit_mult * damage_multiplier
    /// ```
    #[inline]
    pub fn calculate_auto_attack(&self, weapon_min: f32, weapon_max: f32) -> f32 {
        let base = (weapon_min + weapon_max) * 0.5;
        // Standard AP to damage formula: AP / 14 * swing_time_seconds
        let swing_time_secs = self.attack_speed_ms as f32 / 1000.0;
        let ap_bonus = self.attack_power / 14.0 * swing_time_secs;

        (base + ap_bonus) * self.crit_mult * self.damage_multiplier
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_coefficients() {
        let coeffs = PetCoefficients::default();
        assert_eq!(coeffs.armor, 1.0);
        assert_eq!(coeffs.health, 1.0);
        assert_eq!(coeffs.ap_from_ap, 0.0);
        assert_eq!(coeffs.ap_from_sp, 0.0);
        assert_eq!(coeffs.sp_from_ap, 0.0);
        assert_eq!(coeffs.sp_from_sp, 0.0);
        assert_eq!(coeffs.stamina_inherit, 0.75);
        assert_eq!(coeffs.intellect_inherit, 0.30);
    }

    #[test]
    fn test_hunter_main_pet_coefficients() {
        let coeffs = PetCoefficients::hunter_main_pet();
        assert_eq!(coeffs.ap_from_ap, 0.60);
        assert_eq!(coeffs.stamina_inherit, 0.70);
        // Other values should be default
        assert_eq!(coeffs.armor, 1.0);
        assert_eq!(coeffs.health, 1.0);
    }

    #[test]
    fn test_hunter_dire_beast_coefficients() {
        let coeffs = PetCoefficients::hunter_dire_beast();
        assert_eq!(coeffs.ap_from_ap, 1.00);
    }

    #[test]
    fn test_hunter_dark_hound_bm_coefficients() {
        let coeffs = PetCoefficients::hunter_dark_hound_bm();
        assert_eq!(coeffs.ap_from_ap, 5.00);
    }

    #[test]
    fn test_hunter_dark_hound_coefficients() {
        let coeffs = PetCoefficients::hunter_dark_hound();
        assert_eq!(coeffs.ap_from_ap, 6.05);
    }

    #[test]
    fn test_hunter_hero_pet_coefficients() {
        let coeffs = PetCoefficients::hunter_hero_pet();
        assert_eq!(coeffs.ap_from_ap, 2.00);
    }

    #[test]
    fn test_warlock_pet_coefficients() {
        let coeffs = PetCoefficients::warlock_pet();
        assert_eq!(coeffs.ap_from_sp, 0.50);
        assert_eq!(coeffs.sp_from_sp, 1.00);
        assert_eq!(coeffs.health, 0.50);
    }

    #[test]
    fn test_dk_ghoul_coefficients() {
        let coeffs = PetCoefficients::dk_ghoul();
        assert_eq!(coeffs.ap_from_ap, 0.6318);
    }

    #[test]
    fn test_pet_stats_new() {
        let pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());
        assert_eq!(pet.pet_type, PetType::HunterMainPet);
        assert_eq!(pet.coefficients.ap_from_ap, 0.60);
        assert_eq!(pet.damage_multiplier, 1.0);
        assert_eq!(pet.crit_mult, 1.0);
        assert_eq!(pet.attack_speed_ms, 2000);
    }

    #[test]
    fn test_update_from_owner_hunter_pet() {
        let mut pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());

        let owner = StatCache {
            attack_power: 10000.0,
            spell_power: 0.0,
            crit_chance: 0.25,
            haste_mult: 1.20,
            vers_damage: 0.05,
            max_health: 400000.0,
            armor: 5000.0,
            stamina: 8000.0,
            intellect: 1000.0,
        };

        pet.update_from_owner(&owner, 0.0);

        // Pet AP = 10000 * 0.60 = 6000
        assert_eq!(pet.attack_power, 6000.0);
        assert_eq!(pet.spell_power, 0.0);

        // 100% inheritance
        assert_eq!(pet.crit_chance, 0.25);
        assert_eq!(pet.haste_mult, 1.20);
        assert_eq!(pet.versatility, 0.05);

        // Scaled inheritance
        assert_eq!(pet.max_health, 400000.0); // health coeff = 1.0
        assert_eq!(pet.armor, 5000.0); // armor coeff = 1.0
        assert_eq!(pet.stamina, 5600.0); // 8000 * 0.70
        assert_eq!(pet.intellect, 300.0); // 1000 * 0.30

        // Damage multiplier = (1 + 0.05) * (1 + 0) = 1.05
        assert!((pet.damage_multiplier - 1.05).abs() < 0.001);

        // Crit mult = 1 + 0.25 = 1.25
        assert_eq!(pet.crit_mult, 1.25);

        // Attack speed = 2000 / 1.20 = 1666
        assert_eq!(pet.attack_speed_ms, 1666);
    }

    #[test]
    fn test_update_from_owner_warlock_pet() {
        let mut pet = PetStats::new(PetType::WarlockImp, PetCoefficients::warlock_pet());

        let owner = StatCache {
            attack_power: 1000.0,
            spell_power: 20000.0,
            crit_chance: 0.30,
            haste_mult: 1.15,
            vers_damage: 0.08,
            max_health: 500000.0,
            armor: 3000.0,
            stamina: 10000.0,
            intellect: 15000.0,
        };

        pet.update_from_owner(&owner, 10.0); // 10% pet damage bonus

        // Pet AP = 1000 * 0 + 20000 * 0.50 = 10000
        assert_eq!(pet.attack_power, 10000.0);
        // Pet SP = 1000 * 0 + 20000 * 1.00 = 20000
        assert_eq!(pet.spell_power, 20000.0);

        // Health = 500000 * 0.50 = 250000
        assert_eq!(pet.max_health, 250000.0);

        // Damage multiplier = (1 + 0.08) * (1 + 0.10) = 1.188
        assert!((pet.damage_multiplier - 1.188).abs() < 0.001);
    }

    #[test]
    fn test_calculate_damage() {
        let mut pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());

        let owner = StatCache {
            attack_power: 10000.0,
            crit_chance: 0.20,
            haste_mult: 1.0,
            vers_damage: 0.0,
            max_health: 100000.0,
            ..Default::default()
        };

        pet.update_from_owner(&owner, 0.0);

        // Pet AP = 6000
        // base = (100 + 200) / 2 = 150
        // ap_damage = 0.5 * 6000 = 3000
        // total = (150 + 3000) * 1.20 * 1.0 = 3780
        let damage = pet.calculate_damage(100.0, 200.0, 0.5);
        assert!((damage - 3780.0).abs() < 0.01);
    }

    #[test]
    fn test_calculate_auto_attack() {
        let mut pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());

        let owner = StatCache {
            attack_power: 10000.0,
            crit_chance: 0.0,
            haste_mult: 1.0,
            vers_damage: 0.0,
            max_health: 100000.0,
            ..Default::default()
        };

        pet.update_from_owner(&owner, 0.0);

        // Pet AP = 6000
        // base = (50 + 100) / 2 = 75
        // swing_time = 2.0 seconds
        // ap_bonus = 6000 / 14 * 2.0 = 857.14
        // total = (75 + 857.14) * 1.0 * 1.0 = 932.14
        let damage = pet.calculate_auto_attack(50.0, 100.0);
        assert!((damage - 932.14).abs() < 0.1);
    }

    #[test]
    fn test_haste_affects_attack_speed() {
        let mut pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());

        let owner = StatCache {
            attack_power: 10000.0,
            haste_mult: 1.50, // 50% haste
            ..Default::default()
        };

        pet.update_from_owner(&owner, 0.0);

        // Attack speed = 2000 / 1.50 = 1333
        assert_eq!(pet.attack_speed_ms, 1333);
    }

    #[test]
    fn test_pet_damage_modifier() {
        let mut pet = PetStats::new(PetType::HunterMainPet, PetCoefficients::hunter_main_pet());

        let owner = StatCache {
            vers_damage: 0.10, // 10% vers
            ..Default::default()
        };

        // 25% pet damage bonus (e.g., from mastery or talents)
        pet.update_from_owner(&owner, 25.0);

        // Damage multiplier = (1 + 0.10) * (1 + 0.25) = 1.375
        assert!((pet.damage_multiplier - 1.375).abs() < 0.001);
    }
}
