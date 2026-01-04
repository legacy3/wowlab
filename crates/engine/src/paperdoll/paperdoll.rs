//! Main Paperdoll struct and core stat computation.
//!
//! The Paperdoll is the complete character stat sheet, owning all stat computation
//! and caching. It combines base stats (race/class/level), gear stats, and active
//! modifiers from buffs/debuffs.

use super::coefficients::ClassCoefficients;
use super::rating::RatingTable;
use super::types::{Attribute, CacheKey, ClassId, RaceId, RatingType, SpecId};

// ============================================================================
// BaseStats
// ============================================================================

/// Base stats from race and class at a given level.
/// These are immutable after character creation.
#[derive(Clone, Debug)]
pub struct BaseStats {
    /// Base attributes from race + class + level.
    /// Index by Attribute enum.
    pub attributes: [f32; Attribute::COUNT],

    /// Base health before stamina contribution.
    pub base_health: f32,

    /// Base mana (casters only).
    pub base_mana: f32,

    /// Base crit chance (typically 5%).
    pub base_crit: f32,

    /// Base dodge chance (class-dependent).
    pub base_dodge: f32,

    /// Base parry chance (melee only).
    pub base_parry: f32,

    /// Base block chance (shield users).
    pub base_block: f32,
}

impl Default for BaseStats {
    fn default() -> Self {
        Self {
            attributes: [0.0; Attribute::COUNT],
            base_health: 0.0,
            base_mana: 0.0,
            base_crit: 0.05, // 5% base crit
            base_dodge: 0.0,
            base_parry: 0.0,
            base_block: 0.0,
        }
    }
}

// ============================================================================
// GearStats
// ============================================================================

/// Stats from gear, enchants, gems, and passive effects.
/// Updated when equipment changes.
#[derive(Clone, Debug)]
pub struct GearStats {
    /// Flat attribute bonuses from gear.
    /// Index by Attribute enum.
    pub attributes: [f32; Attribute::COUNT],

    /// Combat rating values from gear.
    /// Index by RatingType enum.
    pub ratings: [f32; RatingType::COUNT],

    /// Flat attack power bonus (from effects, not attributes).
    pub flat_attack_power: f32,

    /// Flat spell power bonus (from effects, not attributes).
    pub flat_spell_power: f32,

    /// Base armor from gear.
    pub armor: f32,

    /// Bonus armor (tanks).
    pub bonus_armor: f32,

    /// Main-hand weapon DPS.
    pub weapon_dps_main: f32,

    /// Off-hand weapon DPS.
    pub weapon_dps_off: f32,

    /// Main-hand weapon speed (seconds).
    pub weapon_speed_main: f32,

    /// Off-hand weapon speed (seconds).
    pub weapon_speed_off: f32,
}

impl Default for GearStats {
    fn default() -> Self {
        Self {
            attributes: [0.0; Attribute::COUNT],
            ratings: [0.0; RatingType::COUNT],
            flat_attack_power: 0.0,
            flat_spell_power: 0.0,
            armor: 0.0,
            bonus_armor: 0.0,
            weapon_dps_main: 0.0,
            weapon_dps_off: 0.0,
            weapon_speed_main: 0.0,
            weapon_speed_off: 0.0,
        }
    }
}

// ============================================================================
// ActiveModifiers
// ============================================================================

/// Active stat modifiers from auras/buffs.
/// These stack additively within category, multiplicatively between.
#[derive(Clone, Debug)]
pub struct ActiveModifiers {
    // Attribute modifiers
    pub strength_flat: f32,
    pub strength_pct: f32,
    pub agility_flat: f32,
    pub agility_pct: f32,
    pub intellect_flat: f32,
    pub intellect_pct: f32,
    pub stamina_flat: f32,
    pub stamina_pct: f32,

    // Power modifiers
    pub attack_power_flat: f32,
    pub attack_power_pct: f32,
    pub spell_power_flat: f32,
    pub spell_power_pct: f32,

    // Secondary stat modifiers (flat rating or pct bonus)
    pub crit_rating_flat: f32,
    pub crit_pct: f32,
    pub haste_rating_flat: f32,
    pub haste_pct: f32,
    pub mastery_rating_flat: f32,
    pub mastery_pct: f32,
    pub versatility_rating_flat: f32,
    pub versatility_pct: f32,

    // Damage/healing multipliers
    pub damage_done_pct: f32,
    pub healing_done_pct: f32,
    pub damage_taken_pct: f32,

    // Pet modifiers
    pub pet_damage_pct: f32,
}

impl Default for ActiveModifiers {
    fn default() -> Self {
        Self {
            strength_flat: 0.0,
            strength_pct: 0.0,
            agility_flat: 0.0,
            agility_pct: 0.0,
            intellect_flat: 0.0,
            intellect_pct: 0.0,
            stamina_flat: 0.0,
            stamina_pct: 0.0,
            attack_power_flat: 0.0,
            attack_power_pct: 0.0,
            spell_power_flat: 0.0,
            spell_power_pct: 0.0,
            crit_rating_flat: 0.0,
            crit_pct: 0.0,
            haste_rating_flat: 0.0,
            haste_pct: 0.0,
            mastery_rating_flat: 0.0,
            mastery_pct: 0.0,
            versatility_rating_flat: 0.0,
            versatility_pct: 0.0,
            damage_done_pct: 0.0,
            healing_done_pct: 0.0,
            damage_taken_pct: 0.0,
            pet_damage_pct: 0.0,
        }
    }
}

// ============================================================================
// StatCache
// ============================================================================

/// Cached computed stat values.
/// Recomputed when invalidated by stat changes.
#[derive(Clone, Debug)]
pub struct StatCache {
    /// Bitmask of valid cache entries.
    /// Bit N = CacheKey::N is valid.
    pub valid: u32,

    // === Final Attributes ===
    pub strength: f32,
    pub agility: f32,
    pub intellect: f32,
    pub stamina: f32,

    // === Power Stats ===
    pub attack_power: f32,
    pub spell_power: f32,

    // === Secondary Stats (percentages/multipliers) ===
    /// Crit chance as decimal (0.25 = 25%).
    pub crit_chance: f32,

    /// Haste as multiplier (1.25 = 25% haste).
    pub haste_mult: f32,

    /// Mastery value (spec-specific effect amount).
    pub mastery_value: f32,

    /// Versatility damage bonus as decimal.
    pub vers_damage: f32,

    /// Versatility damage reduction as decimal (half of damage).
    pub vers_mitigation: f32,

    // === Tertiary Stats ===
    pub leech_pct: f32,
    pub speed_pct: f32,
    pub avoidance_pct: f32,

    // === Defensive Stats ===
    pub max_health: f32,
    pub armor: f32,
    pub dodge_chance: f32,
    pub parry_chance: f32,
    pub block_chance: f32,

    // === Final Multipliers (includes aura effects) ===
    pub damage_multiplier: f32,
    pub healing_multiplier: f32,
    pub damage_taken_multiplier: f32,

    // === Pre-computed for hot path ===
    /// 1.0 + crit_chance (for expected crit damage).
    pub crit_mult: f32,

    /// Combined damage multiplier: (1+vers) * (1+aura_dmg) * (1+mastery_effect).
    pub total_damage_mult: f32,

    /// GCD in milliseconds at current haste.
    pub gcd_ms: u32,

    /// Auto-attack speed in milliseconds.
    pub auto_attack_ms: u32,
}

impl Default for StatCache {
    fn default() -> Self {
        Self {
            valid: 0,
            strength: 0.0,
            agility: 0.0,
            intellect: 0.0,
            stamina: 0.0,
            attack_power: 0.0,
            spell_power: 0.0,
            crit_chance: 0.05, // 5% base
            haste_mult: 1.0,
            mastery_value: 0.0,
            vers_damage: 0.0,
            vers_mitigation: 0.0,
            leech_pct: 0.0,
            speed_pct: 0.0,
            avoidance_pct: 0.0,
            max_health: 1.0,
            armor: 0.0,
            dodge_chance: 0.0,
            parry_chance: 0.0,
            block_chance: 0.0,
            damage_multiplier: 1.0,
            healing_multiplier: 1.0,
            damage_taken_multiplier: 1.0,
            crit_mult: 1.05,
            total_damage_mult: 1.0,
            gcd_ms: 1500,
            auto_attack_ms: 2000,
        }
    }
}

impl super::pet::OwnerStats for StatCache {
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

// ============================================================================
// Paperdoll
// ============================================================================

/// The complete character stat sheet.
/// Owns all stat computation and caching.
#[derive(Clone, Debug)]
pub struct Paperdoll {
    // === Identity ===
    pub level: u8,
    pub class: ClassId,
    pub spec: SpecId,
    pub race: RaceId,

    // === Stat Layers ===
    /// Base stats from race/class/level (immutable after init).
    pub base: BaseStats,

    /// Stats from gear and passive effects.
    pub gear: GearStats,

    /// Active modifiers from buffs/debuffs.
    pub modifiers: ActiveModifiers,

    // === Conversion Data ===
    /// Rating conversion table for current level.
    pub rating_table: RatingTable,

    /// Class/spec conversion coefficients.
    pub coefficients: ClassCoefficients,

    // === Cache ===
    /// Cached computed values.
    pub cache: StatCache,
}

impl Paperdoll {
    /// Create a Paperdoll from configuration values.
    ///
    /// This is the primary way to create a Paperdoll from TOML config or other sources.
    /// Takes explicit stat values (primaries as flat values, secondaries as ratings).
    /// Ratings are converted to percentages with diminishing returns via recompute().
    #[must_use]
    #[allow(clippy::too_many_arguments)]
    pub fn from_config(
        level: u8,
        spec: SpecId,
        agility: f32,
        strength: f32,
        intellect: f32,
        stamina: f32,
        crit_rating: f32,
        haste_rating: f32,
        mastery_rating: f32,
        versatility_rating: f32,
    ) -> Self {
        let mut paperdoll = Self::new(level, ClassId::Hunter, spec, RaceId::Orc);

        // Set gear attributes
        paperdoll.gear.attributes[Attribute::Agility as usize] = agility;
        paperdoll.gear.attributes[Attribute::Strength as usize] = strength;
        paperdoll.gear.attributes[Attribute::Intellect as usize] = intellect;
        paperdoll.gear.attributes[Attribute::Stamina as usize] = stamina;

        // Set gear ratings (will be converted to % with DR in recompute)
        paperdoll.gear.ratings[RatingType::CritMelee as usize] = crit_rating;
        paperdoll.gear.ratings[RatingType::HasteMelee as usize] = haste_rating;
        paperdoll.gear.ratings[RatingType::Mastery as usize] = mastery_rating;
        paperdoll.gear.ratings[RatingType::VersatilityDamage as usize] = versatility_rating;

        // Compute all derived values through proper layer system
        paperdoll.recompute();
        paperdoll
    }

    /// Create a new paperdoll for a character.
    #[must_use]
    pub fn new(level: u8, class: ClassId, spec: SpecId, race: RaceId) -> Self {
        let rating_table = match level {
            70 => RatingTable::level_70(),
            80 => RatingTable::level_80(),
            _ => RatingTable::level_80(), // Default to current
        };

        let coefficients = match spec {
            SpecId::BeastMastery => ClassCoefficients::beast_mastery(),
            SpecId::Marksmanship => ClassCoefficients::marksmanship(),
            SpecId::Survival => ClassCoefficients::survival(),
            _ => ClassCoefficients::default(),
        };

        Self {
            level,
            class,
            spec,
            race,
            base: BaseStats::default(),
            gear: GearStats::default(),
            modifiers: ActiveModifiers::default(),
            rating_table,
            coefficients,
            cache: StatCache::default(),
        }
    }

    /// Invalidate a cached stat (triggers recomputation on next access).
    ///
    /// This implements invalidation chains where changing one stat
    /// automatically invalidates dependent stats.
    pub fn invalidate(&mut self, key: CacheKey) {
        self.cache.valid &= !(1 << key as u32);

        // Invalidation chains
        match key {
            CacheKey::Strength => {
                if self.coefficients.ap_per_strength > 0.0 {
                    self.invalidate(CacheKey::AttackPower);
                }
                if self.coefficients.parry_per_strength > 0.0 {
                    self.invalidate(CacheKey::ParryChance);
                }
            }
            CacheKey::Agility => {
                if self.coefficients.ap_per_agility > 0.0 {
                    self.invalidate(CacheKey::AttackPower);
                }
                if self.coefficients.crit_per_agility > 0.0 {
                    self.invalidate(CacheKey::CritChance);
                }
                if self.coefficients.dodge_per_agility > 0.0 {
                    self.invalidate(CacheKey::DodgeChance);
                }
            }
            CacheKey::Intellect => {
                if self.coefficients.sp_per_intellect > 0.0 {
                    self.invalidate(CacheKey::SpellPower);
                }
                if self.coefficients.crit_per_intellect > 0.0 {
                    self.invalidate(CacheKey::CritChance);
                }
            }
            CacheKey::Stamina => {
                self.invalidate(CacheKey::MaxHealth);
            }
            CacheKey::AttackPower | CacheKey::SpellPower => {
                self.invalidate(CacheKey::PetAttackPower);
            }
            CacheKey::VersatilityDamage => {
                self.invalidate(CacheKey::VersatilityMitigation);
                self.invalidate(CacheKey::DamageMultiplier);
            }
            CacheKey::MasteryValue => {
                self.invalidate(CacheKey::DamageMultiplier);
            }
            _ => {}
        }
    }

    /// Invalidate all cached stats.
    pub fn invalidate_all(&mut self) {
        self.cache.valid = 0;
    }

    /// Convert a rating value to percentage with diminishing returns.
    ///
    /// Returns the effective percentage as a decimal (e.g., 0.25 for 25%).
    #[must_use]
    pub fn rating_to_percent(&self, rating_type: RatingType, rating: f32) -> f32 {
        if rating <= 0.0 {
            return 0.0;
        }

        // Convert rating to base percentage as decimal (700 rating / 700 divisor / 100 = 0.01 = 1%)
        let base = rating / self.rating_table.get(rating_type) / 100.0;
        self.apply_dr(rating_type, base)
    }

    /// Apply diminishing returns curve.
    ///
    /// Formula: effective = value / (1 + value / soft_cap)
    ///
    /// This gives:
    /// - Linear scaling up to ~15%
    /// - Soft cap around 30%
    /// - Hard cap approaches 2x soft_cap asymptotically
    fn apply_dr(&self, rating_type: RatingType, value: f32) -> f32 {
        let soft_cap = match rating_type {
            // Secondary stats: ~30% soft cap
            RatingType::CritMelee
            | RatingType::CritRanged
            | RatingType::CritSpell
            | RatingType::HasteMelee
            | RatingType::HasteRanged
            | RatingType::HasteSpell
            | RatingType::Mastery
            | RatingType::VersatilityDamage
            | RatingType::VersatilityHealing => 0.30,

            // Tertiary stats: ~10% soft cap
            RatingType::Leech | RatingType::Speed | RatingType::Avoidance => 0.10,

            // Defense: ~20% soft cap
            RatingType::Dodge | RatingType::Parry | RatingType::Block => 0.20,
        };

        // DR formula
        value / (1.0 + value / soft_cap)
    }

    /// Recompute all cached stats from scratch.
    pub fn recompute(&mut self) {
        let base = &self.base;
        let gear = &self.gear;
        let mods = &self.modifiers;
        let coeff = &self.coefficients;

        // === Attributes ===
        let str_base = base.attributes[Attribute::Strength as usize]
            + gear.attributes[Attribute::Strength as usize]
            + mods.strength_flat;
        self.cache.strength = str_base * (1.0 + mods.strength_pct / 100.0);

        let agi_base = base.attributes[Attribute::Agility as usize]
            + gear.attributes[Attribute::Agility as usize]
            + mods.agility_flat;
        self.cache.agility = agi_base * (1.0 + mods.agility_pct / 100.0);

        let int_base = base.attributes[Attribute::Intellect as usize]
            + gear.attributes[Attribute::Intellect as usize]
            + mods.intellect_flat;
        self.cache.intellect = int_base * (1.0 + mods.intellect_pct / 100.0);

        let sta_base = base.attributes[Attribute::Stamina as usize]
            + gear.attributes[Attribute::Stamina as usize]
            + mods.stamina_flat;
        self.cache.stamina = sta_base * (1.0 + mods.stamina_pct / 100.0);

        // === Attack Power ===
        let ap_base = self.cache.strength * coeff.ap_per_strength
            + self.cache.agility * coeff.ap_per_agility
            + gear.flat_attack_power
            + mods.attack_power_flat;
        self.cache.attack_power = ap_base * (1.0 + mods.attack_power_pct / 100.0);

        // === Spell Power ===
        let sp_base = self.cache.intellect * coeff.sp_per_intellect
            + gear.flat_spell_power
            + mods.spell_power_flat;
        self.cache.spell_power = sp_base * (1.0 + mods.spell_power_pct / 100.0);

        // === Crit Chance ===
        let crit_from_rating = self.rating_to_percent(
            RatingType::CritMelee,
            gear.ratings[RatingType::CritMelee as usize] + mods.crit_rating_flat,
        );
        let crit_from_agi = if coeff.crit_per_agility > 0.0 {
            self.cache.agility / coeff.crit_per_agility / 100.0
        } else {
            0.0
        };
        self.cache.crit_chance =
            base.base_crit + crit_from_rating + crit_from_agi + mods.crit_pct / 100.0;
        self.cache.crit_mult = 1.0 + self.cache.crit_chance;

        // === Haste ===
        let haste_from_rating = self.rating_to_percent(
            RatingType::HasteMelee,
            gear.ratings[RatingType::HasteMelee as usize] + mods.haste_rating_flat,
        );
        let haste_pct = haste_from_rating + mods.haste_pct / 100.0;
        self.cache.haste_mult = 1.0 + haste_pct;

        // === Mastery ===
        let mastery_from_rating = self.rating_to_percent(
            RatingType::Mastery,
            gear.ratings[RatingType::Mastery as usize] + mods.mastery_rating_flat,
        );
        let mastery_pct = mastery_from_rating + mods.mastery_pct / 100.0;
        self.cache.mastery_value = mastery_pct * coeff.mastery_coefficient;

        // === Versatility ===
        let vers_from_rating = self.rating_to_percent(
            RatingType::VersatilityDamage,
            gear.ratings[RatingType::VersatilityDamage as usize] + mods.versatility_rating_flat,
        );
        self.cache.vers_damage = vers_from_rating + mods.versatility_pct / 100.0;
        self.cache.vers_mitigation = self.cache.vers_damage / 2.0;

        // === Tertiary Stats ===
        self.cache.leech_pct =
            self.rating_to_percent(RatingType::Leech, gear.ratings[RatingType::Leech as usize]);
        self.cache.speed_pct =
            self.rating_to_percent(RatingType::Speed, gear.ratings[RatingType::Speed as usize]);
        self.cache.avoidance_pct = self.rating_to_percent(
            RatingType::Avoidance,
            gear.ratings[RatingType::Avoidance as usize],
        );

        // === Defensive Stats ===
        self.cache.max_health = base.base_health + self.cache.stamina * coeff.health_per_stamina;
        self.cache.armor = gear.armor + gear.bonus_armor;

        // Dodge from rating + base + agility
        let dodge_from_rating = self.rating_to_percent(
            RatingType::Dodge,
            gear.ratings[RatingType::Dodge as usize],
        );
        let dodge_from_agi = if coeff.dodge_per_agility > 0.0 {
            self.cache.agility / coeff.dodge_per_agility / 100.0
        } else {
            0.0
        };
        self.cache.dodge_chance = base.base_dodge + dodge_from_rating + dodge_from_agi;

        // Parry from rating + base + strength
        let parry_from_rating = self.rating_to_percent(
            RatingType::Parry,
            gear.ratings[RatingType::Parry as usize],
        );
        let parry_from_str = if coeff.parry_per_strength > 0.0 {
            self.cache.strength / coeff.parry_per_strength / 100.0
        } else {
            0.0
        };
        self.cache.parry_chance = if coeff.can_parry {
            base.base_parry + parry_from_rating + parry_from_str
        } else {
            0.0
        };

        // Block from rating + base
        let block_from_rating = self.rating_to_percent(
            RatingType::Block,
            gear.ratings[RatingType::Block as usize],
        );
        self.cache.block_chance = if coeff.can_block {
            base.base_block + block_from_rating
        } else {
            0.0
        };

        // === Final Multipliers ===
        self.cache.damage_multiplier =
            (1.0 + self.cache.vers_damage) * (1.0 + mods.damage_done_pct / 100.0);
        self.cache.healing_multiplier =
            (1.0 + self.cache.vers_damage) * (1.0 + mods.healing_done_pct / 100.0);
        self.cache.damage_taken_multiplier =
            (1.0 - self.cache.vers_mitigation) * (1.0 + mods.damage_taken_pct / 100.0);

        // === Combined damage mult for hot path ===
        // Includes: versatility, aura bonuses, mastery effect
        self.cache.total_damage_mult =
            self.cache.damage_multiplier * (1.0 + self.cache.mastery_value);

        // === Pre-computed timing ===
        let base_gcd_ms = 1500.0;
        self.cache.gcd_ms = ((base_gcd_ms / self.cache.haste_mult).max(750.0)) as u32;

        let base_auto_ms = gear.weapon_speed_main * 1000.0;
        if base_auto_ms > 0.0 {
            self.cache.auto_attack_ms = (base_auto_ms / self.cache.haste_mult) as u32;
        }

        // Mark all as valid
        self.cache.valid = u32::MAX;
    }

    /// Apply an aura's stat effect.
    pub fn apply_aura_effect(&mut self, effect: &AuraStatEffect) {
        match effect {
            AuraStatEffect::FlatAttribute { attr, amount } => {
                match attr {
                    Attribute::Strength => self.modifiers.strength_flat += amount,
                    Attribute::Agility => self.modifiers.agility_flat += amount,
                    Attribute::Intellect => self.modifiers.intellect_flat += amount,
                    Attribute::Stamina => self.modifiers.stamina_flat += amount,
                }
                self.invalidate(CacheKey::from(*attr));
            }
            AuraStatEffect::PercentAttribute { attr, percent } => {
                match attr {
                    Attribute::Strength => self.modifiers.strength_pct += percent,
                    Attribute::Agility => self.modifiers.agility_pct += percent,
                    Attribute::Intellect => self.modifiers.intellect_pct += percent,
                    Attribute::Stamina => self.modifiers.stamina_pct += percent,
                }
                self.invalidate(CacheKey::from(*attr));
            }
            AuraStatEffect::FlatAttackPower(amount) => {
                self.modifiers.attack_power_flat += amount;
                self.invalidate(CacheKey::AttackPower);
            }
            AuraStatEffect::PercentAttackPower(percent) => {
                self.modifiers.attack_power_pct += percent;
                self.invalidate(CacheKey::AttackPower);
            }
            AuraStatEffect::DamageDone(percent) => {
                self.modifiers.damage_done_pct += percent;
                self.invalidate(CacheKey::DamageMultiplier);
            }
            AuraStatEffect::DamageTaken(percent) => {
                self.modifiers.damage_taken_pct += percent;
                self.invalidate(CacheKey::DamageTakenMultiplier);
            }
            AuraStatEffect::CritChance(percent) => {
                self.modifiers.crit_pct += percent;
                self.invalidate(CacheKey::CritChance);
            }
            AuraStatEffect::HastePercent(percent) => {
                self.modifiers.haste_pct += percent;
                self.invalidate(CacheKey::HastePercent);
            }
            AuraStatEffect::MasteryPercent(percent) => {
                self.modifiers.mastery_pct += percent;
                self.invalidate(CacheKey::MasteryValue);
            }
            AuraStatEffect::PetDamage(percent) => {
                self.modifiers.pet_damage_pct += percent;
            }
        }
    }

    /// Remove an aura's stat effect.
    pub fn remove_aura_effect(&mut self, effect: &AuraStatEffect) {
        match effect {
            AuraStatEffect::FlatAttribute { attr, amount } => {
                match attr {
                    Attribute::Strength => self.modifiers.strength_flat -= amount,
                    Attribute::Agility => self.modifiers.agility_flat -= amount,
                    Attribute::Intellect => self.modifiers.intellect_flat -= amount,
                    Attribute::Stamina => self.modifiers.stamina_flat -= amount,
                }
                self.invalidate(CacheKey::from(*attr));
            }
            AuraStatEffect::PercentAttribute { attr, percent } => {
                match attr {
                    Attribute::Strength => self.modifiers.strength_pct -= percent,
                    Attribute::Agility => self.modifiers.agility_pct -= percent,
                    Attribute::Intellect => self.modifiers.intellect_pct -= percent,
                    Attribute::Stamina => self.modifiers.stamina_pct -= percent,
                }
                self.invalidate(CacheKey::from(*attr));
            }
            AuraStatEffect::FlatAttackPower(amount) => {
                self.modifiers.attack_power_flat -= amount;
                self.invalidate(CacheKey::AttackPower);
            }
            AuraStatEffect::PercentAttackPower(percent) => {
                self.modifiers.attack_power_pct -= percent;
                self.invalidate(CacheKey::AttackPower);
            }
            AuraStatEffect::DamageDone(percent) => {
                self.modifiers.damage_done_pct -= percent;
                self.invalidate(CacheKey::DamageMultiplier);
            }
            AuraStatEffect::DamageTaken(percent) => {
                self.modifiers.damage_taken_pct -= percent;
                self.invalidate(CacheKey::DamageTakenMultiplier);
            }
            AuraStatEffect::CritChance(percent) => {
                self.modifiers.crit_pct -= percent;
                self.invalidate(CacheKey::CritChance);
            }
            AuraStatEffect::HastePercent(percent) => {
                self.modifiers.haste_pct -= percent;
                self.invalidate(CacheKey::HastePercent);
            }
            AuraStatEffect::MasteryPercent(percent) => {
                self.modifiers.mastery_pct -= percent;
                self.invalidate(CacheKey::MasteryValue);
            }
            AuraStatEffect::PetDamage(percent) => {
                self.modifiers.pet_damage_pct -= percent;
            }
        }
    }
}

// ============================================================================
// AuraStatEffect
// ============================================================================

/// Aura stat effect types for integration with the aura system.
#[derive(Clone, Debug)]
pub enum AuraStatEffect {
    /// Flat attribute bonus.
    FlatAttribute { attr: Attribute, amount: f32 },

    /// Percent attribute bonus.
    PercentAttribute { attr: Attribute, percent: f32 },

    /// Flat attack power bonus.
    FlatAttackPower(f32),

    /// Percent attack power bonus.
    PercentAttackPower(f32),

    /// Percent damage done bonus.
    DamageDone(f32),

    /// Percent damage taken modifier.
    DamageTaken(f32),

    /// Flat crit chance bonus (in percent).
    CritChance(f32),

    /// Percent haste bonus.
    HastePercent(f32),

    /// Percent mastery bonus.
    MasteryPercent(f32),

    /// Percent pet damage bonus.
    PetDamage(f32),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_stats_default() {
        let stats = BaseStats::default();
        assert_eq!(stats.base_crit, 0.05);
        assert_eq!(stats.attributes[Attribute::Strength as usize], 0.0);
    }

    #[test]
    fn test_gear_stats_default() {
        let stats = GearStats::default();
        assert_eq!(stats.flat_attack_power, 0.0);
        assert_eq!(stats.ratings[RatingType::CritMelee as usize], 0.0);
    }

    #[test]
    fn test_stat_cache_default() {
        let cache = StatCache::default();
        assert_eq!(cache.crit_chance, 0.05);
        assert_eq!(cache.haste_mult, 1.0);
        assert_eq!(cache.damage_multiplier, 1.0);
        assert_eq!(cache.gcd_ms, 1500);
    }

    #[test]
    fn test_paperdoll_new() {
        let paperdoll = Paperdoll::new(80, ClassId::Hunter, SpecId::BeastMastery, RaceId::Orc);
        assert_eq!(paperdoll.level, 80);
        assert_eq!(paperdoll.class, ClassId::Hunter);
        assert_eq!(paperdoll.spec, SpecId::BeastMastery);
        assert_eq!(paperdoll.rating_table.level, 80);
    }

    #[test]
    fn test_rating_conversion() {
        let paperdoll = Paperdoll::new(80, ClassId::Hunter, SpecId::BeastMastery, RaceId::Orc);

        // At level 80, crit rating is 700 per 1%
        let crit_pct = paperdoll.rating_to_percent(RatingType::CritMelee, 700.0);
        // With DR, 1% raw becomes less
        assert!(crit_pct > 0.0 && crit_pct < 0.01);
    }

    #[test]
    fn test_invalidation_chain() {
        let mut paperdoll = Paperdoll::new(80, ClassId::Hunter, SpecId::BeastMastery, RaceId::Orc);
        paperdoll.cache.valid = u32::MAX; // Mark all valid

        // Invalidating agility should chain to attack power
        paperdoll.invalidate(CacheKey::Agility);

        // Check that agility and attack power are now invalid
        assert_eq!(paperdoll.cache.valid & (1 << CacheKey::Agility as u32), 0);
        assert_eq!(
            paperdoll.cache.valid & (1 << CacheKey::AttackPower as u32),
            0
        );
    }

    #[test]
    fn test_aura_effect_apply_remove() {
        let mut paperdoll = Paperdoll::new(80, ClassId::Hunter, SpecId::BeastMastery, RaceId::Orc);

        let effect = AuraStatEffect::DamageDone(25.0);
        paperdoll.apply_aura_effect(&effect);
        assert_eq!(paperdoll.modifiers.damage_done_pct, 25.0);

        paperdoll.remove_aura_effect(&effect);
        assert_eq!(paperdoll.modifiers.damage_done_pct, 0.0);
    }

    #[test]
    fn test_recompute() {
        let mut paperdoll = Paperdoll::new(80, ClassId::Hunter, SpecId::BeastMastery, RaceId::Orc);

        // Set some base agility
        paperdoll.base.attributes[Attribute::Agility as usize] = 1000.0;
        paperdoll.gear.attributes[Attribute::Agility as usize] = 5000.0;
        paperdoll.gear.ratings[RatingType::CritMelee as usize] = 1400.0; // ~2% before DR

        paperdoll.recompute();

        // Check computed values
        assert_eq!(paperdoll.cache.agility, 6000.0);
        assert_eq!(paperdoll.cache.attack_power, 6000.0); // 1.0 AP per agility for BM
        assert!(paperdoll.cache.crit_chance > 0.05); // Should be above base 5%
        assert_eq!(paperdoll.cache.valid, u32::MAX); // All should be valid
    }
}
