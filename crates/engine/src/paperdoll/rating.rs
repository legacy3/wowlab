//! Rating conversion tables and diminishing returns.
//!
//! This module handles the conversion of combat rating values to percentage bonuses,
//! including level-specific rating divisors and soft-cap diminishing returns.

use super::types::RatingType;

/// Combat rating conversion table for a specific level.
///
/// Contains the amount of rating required for 1% of each stat type.
/// Values are level-dependent and sourced from actual WoW game data.
#[derive(Clone, Debug)]
pub struct RatingTable {
    /// Character level this table applies to.
    pub level: u8,

    // Defense rating divisors (rating per 1%)
    /// Dodge rating required for 1% dodge chance.
    pub dodge: f32,
    /// Parry rating required for 1% parry chance.
    pub parry: f32,
    /// Block rating required for 1% block chance.
    pub block: f32,

    // Secondary stat rating divisors
    /// Crit rating required for 1% crit chance.
    pub crit: f32,
    /// Haste rating required for 1% haste.
    pub haste: f32,
    /// Mastery rating required for 1 mastery point.
    pub mastery: f32,
    /// Versatility rating required for 1% versatility.
    pub versatility: f32,

    // Tertiary stat rating divisors
    /// Leech rating required for 1% leech.
    pub leech: f32,
    /// Speed rating required for 1% speed.
    pub speed: f32,
    /// Avoidance rating required for 1% avoidance.
    pub avoidance: f32,
}

impl RatingTable {
    /// Get the rating divisor for a given rating type.
    ///
    /// Returns the amount of rating required for 1% of the specified stat.
    /// For combined rating types (e.g., CritMelee, CritRanged, CritSpell),
    /// the same divisor is returned.
    pub fn get(&self, rating: RatingType) -> f32 {
        match rating {
            // Defense ratings
            RatingType::Dodge => self.dodge,
            RatingType::Parry => self.parry,
            RatingType::Block => self.block,

            // Crit ratings (all use same divisor)
            RatingType::CritMelee | RatingType::CritRanged | RatingType::CritSpell => self.crit,

            // Haste ratings (all use same divisor)
            RatingType::HasteMelee | RatingType::HasteRanged | RatingType::HasteSpell => self.haste,

            // Universal secondary stats
            RatingType::Mastery => self.mastery,
            RatingType::VersatilityDamage | RatingType::VersatilityHealing => self.versatility,

            // Tertiary stats
            RatingType::Leech => self.leech,
            RatingType::Speed => self.speed,
            RatingType::Avoidance => self.avoidance,
        }
    }

    /// Create rating table for level 70 (Dragonflight).
    ///
    /// Values sourced from WoW Dragonflight game data.
    pub fn level_70() -> Self {
        Self {
            level: 70,
            // Defense ratings
            dodge: 198.5,
            parry: 198.5,
            block: 90.0,
            // Secondary stats
            crit: 185.3,
            haste: 157.2,
            mastery: 185.3,
            versatility: 185.3,
            // Tertiary stats (estimated based on level scaling)
            leech: 53.0,
            speed: 26.5,
            avoidance: 53.0,
        }
    }

    /// Create rating table for level 80 (The War Within).
    ///
    /// Values sourced from WoW The War Within game data.
    pub fn level_80() -> Self {
        Self {
            level: 80,
            // Defense ratings
            dodge: 750.0,
            parry: 750.0,
            block: 340.0,
            // Secondary stats
            crit: 700.0,
            haste: 502.1,
            mastery: 700.0,
            versatility: 700.0,
            // Tertiary stats
            leech: 200.0,
            speed: 100.0,
            avoidance: 200.0,
        }
    }
}

impl Default for RatingTable {
    fn default() -> Self {
        Self::level_80()
    }
}

// Soft cap constants for diminishing returns
/// Soft cap for secondary stats (crit, haste, mastery, versatility).
const SECONDARY_SOFT_CAP: f32 = 0.30;
/// Soft cap for tertiary stats (leech, speed, avoidance).
const TERTIARY_SOFT_CAP: f32 = 0.10;
/// Soft cap for defense stats (dodge, parry, block).
const DEFENSE_SOFT_CAP: f32 = 0.20;

/// Apply diminishing returns to a rating-derived value.
///
/// Uses a soft cap formula: `value / (1 + value / soft_cap)`
///
/// This produces:
/// - Linear scaling at low values (when value << soft_cap)
/// - Gradual diminishing returns as value approaches soft_cap
/// - Asymptotic approach to soft_cap as a hard cap (never exceeds it)
///
/// # Arguments
///
/// * `rating_type` - The type of rating to determine which soft cap to use
/// * `value` - The raw percentage value before diminishing returns
///
/// # Returns
///
/// The effective percentage value after applying diminishing returns.
///
/// # Soft Caps by Category
///
/// - Secondary stats (crit/haste/mastery/vers): 30% soft cap
/// - Tertiary stats (leech/speed/avoidance): 10% soft cap
/// - Defense stats (dodge/parry/block): 20% soft cap
pub fn apply_dr(rating_type: RatingType, value: f32) -> f32 {
    if value <= 0.0 {
        return 0.0;
    }

    let soft_cap = match rating_type {
        // Secondary stats: 30% soft cap
        RatingType::CritMelee
        | RatingType::CritRanged
        | RatingType::CritSpell
        | RatingType::HasteMelee
        | RatingType::HasteRanged
        | RatingType::HasteSpell
        | RatingType::Mastery
        | RatingType::VersatilityDamage
        | RatingType::VersatilityHealing => SECONDARY_SOFT_CAP,

        // Tertiary stats: 10% soft cap
        RatingType::Leech | RatingType::Speed | RatingType::Avoidance => TERTIARY_SOFT_CAP,

        // Defense stats: 20% soft cap
        RatingType::Dodge | RatingType::Parry | RatingType::Block => DEFENSE_SOFT_CAP,
    };

    // Diminishing returns formula
    value / (1.0 + value / soft_cap)
}

/// Convert a rating value to percentage with diminishing returns applied.
///
/// This is the main function for converting raw rating values (e.g., from gear)
/// to the effective percentage bonus the player receives.
///
/// # Arguments
///
/// * `rating_table` - The rating conversion table for the character's level
/// * `rating_type` - The type of rating being converted
/// * `rating` - The raw rating value
///
/// # Returns
///
/// The effective percentage as a decimal (e.g., 0.25 for 25%).
/// Returns 0.0 if the rating is zero or negative.
///
/// # Example
///
/// ```ignore
/// let table = RatingTable::level_80();
/// // 1400 crit rating at level 80 = 2% base, with DR applied
/// let crit_pct = rating_to_percent(&table, RatingType::CritMelee, 1400.0);
/// ```
pub fn rating_to_percent(rating_table: &RatingTable, rating_type: RatingType, rating: f32) -> f32 {
    if rating <= 0.0 {
        return 0.0;
    }

    // Convert rating to base percentage
    let divisor = rating_table.get(rating_type);
    let base_percent = rating / divisor / 100.0; // Convert to decimal (e.g., 0.25 for 25%)

    // Apply diminishing returns
    apply_dr(rating_type, base_percent)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_level_80_crit_rating() {
        let table = RatingTable::level_80();
        assert_eq!(table.crit, 700.0);
        assert_eq!(table.haste, 502.1);
        assert_eq!(table.mastery, 700.0);
        assert_eq!(table.versatility, 700.0);
    }

    #[test]
    fn test_level_70_crit_rating() {
        let table = RatingTable::level_70();
        assert_eq!(table.crit, 185.3);
        assert_eq!(table.haste, 157.2);
        assert_eq!(table.mastery, 185.3);
        assert_eq!(table.versatility, 185.3);
    }

    #[test]
    fn test_get_rating_divisor() {
        let table = RatingTable::level_80();

        // Defense ratings
        assert_eq!(table.get(RatingType::Dodge), 750.0);
        assert_eq!(table.get(RatingType::Parry), 750.0);
        assert_eq!(table.get(RatingType::Block), 340.0);

        // Crit variants should all return same value
        assert_eq!(table.get(RatingType::CritMelee), 700.0);
        assert_eq!(table.get(RatingType::CritRanged), 700.0);
        assert_eq!(table.get(RatingType::CritSpell), 700.0);

        // Haste variants should all return same value
        assert_eq!(table.get(RatingType::HasteMelee), 502.1);
        assert_eq!(table.get(RatingType::HasteRanged), 502.1);
        assert_eq!(table.get(RatingType::HasteSpell), 502.1);
    }

    #[test]
    fn test_apply_dr_zero() {
        assert_eq!(apply_dr(RatingType::CritMelee, 0.0), 0.0);
        assert_eq!(apply_dr(RatingType::CritMelee, -1.0), 0.0);
    }

    #[test]
    fn test_apply_dr_small_values() {
        // Small values should have minimal DR effect
        let small = 0.05; // 5%
        let result = apply_dr(RatingType::CritMelee, small);

        // With 30% soft cap: 0.05 / (1 + 0.05/0.30) = 0.05 / 1.167 = 0.0428
        assert!(result < small);
        assert!(result > small * 0.8); // Should still be close to original
    }

    #[test]
    fn test_apply_dr_at_soft_cap() {
        // At the soft cap value, DR should reduce by half
        let soft_cap = SECONDARY_SOFT_CAP; // 0.30
        let result = apply_dr(RatingType::CritMelee, soft_cap);

        // At soft cap: 0.30 / (1 + 0.30/0.30) = 0.30 / 2.0 = 0.15
        let expected = soft_cap / 2.0;
        assert!((result - expected).abs() < 0.001);
    }

    #[test]
    fn test_apply_dr_different_caps() {
        let value = 0.15; // 15%

        // Secondary (30% cap)
        let secondary = apply_dr(RatingType::CritMelee, value);

        // Tertiary (10% cap) - should have more DR at same raw value
        let tertiary = apply_dr(RatingType::Leech, value);

        // Defense (20% cap) - should be between secondary and tertiary
        let defense = apply_dr(RatingType::Dodge, value);

        // Tertiary should have most DR (lowest soft cap)
        assert!(tertiary < defense);
        assert!(defense < secondary);
    }

    #[test]
    fn test_rating_to_percent_zero() {
        let table = RatingTable::level_80();
        assert_eq!(rating_to_percent(&table, RatingType::CritMelee, 0.0), 0.0);
        assert_eq!(rating_to_percent(&table, RatingType::CritMelee, -100.0), 0.0);
    }

    #[test]
    fn test_rating_to_percent_basic() {
        let table = RatingTable::level_80();

        // 700 crit rating at level 80 = 1% base crit = 0.01 decimal
        let result = rating_to_percent(&table, RatingType::CritMelee, 700.0);

        // 0.01 / (1 + 0.01/0.30) = 0.01 / 1.033 = ~0.00968
        assert!(result > 0.0);
        assert!(result < 0.01); // Should be less than base due to DR
    }

    #[test]
    fn test_rating_to_percent_high_rating() {
        let table = RatingTable::level_80();

        // Very high rating should approach but not exceed the soft cap
        // The DR formula value / (1 + value/cap) asymptotically approaches cap, not 2*cap
        let very_high = rating_to_percent(&table, RatingType::CritMelee, 100000.0);

        // 100000 / 700 / 100 = 1.4286 raw
        // 1.4286 / (1 + 1.4286/0.30) = 1.4286 / 5.76 = ~0.248
        assert!(very_high < SECONDARY_SOFT_CAP);
        assert!(very_high > 0.20); // Should be getting close to cap

        // Test with extremely high rating to verify asymptotic behavior
        let extreme = rating_to_percent(&table, RatingType::CritMelee, 1_000_000.0);

        // Should be closer to cap than very_high
        assert!(extreme > very_high);
        assert!(extreme < SECONDARY_SOFT_CAP); // Never exceeds soft cap
    }
}
