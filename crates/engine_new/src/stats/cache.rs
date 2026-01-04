use super::{PrimaryStats, Ratings, CombatStats};
use crate::types::SpecId;

/// Cached stat calculations to avoid recomputation
#[derive(Clone, Debug)]
pub struct StatCache {
    /// Primary stats (str/agi/int/stam)
    pub primary: PrimaryStats,
    /// Rating values
    pub ratings: Ratings,
    /// Computed combat stats
    pub combat: CombatStats,
    /// Spec (for mastery interpretation)
    pub spec: SpecId,
    /// Is cache valid?
    dirty: bool,
}

impl StatCache {
    pub fn new(spec: SpecId) -> Self {
        Self {
            primary: PrimaryStats::default(),
            ratings: Ratings::default(),
            combat: CombatStats::default(),
            spec,
            dirty: true,
        }
    }

    /// Mark cache as needing recalculation
    pub fn invalidate(&mut self) {
        self.dirty = true;
    }

    /// Recalculate if dirty
    pub fn update(&mut self, mastery_coeff: f32) {
        if !self.dirty {
            return;
        }

        self.compute_combat_stats(mastery_coeff);
        self.dirty = false;
    }

    fn compute_combat_stats(&mut self, mastery_coeff: f32) {
        use super::ratings::rating_to_percent;
        use super::attributes::primary_stat_for_spec;
        use crate::types::RatingType;

        // Get primary stat for this spec
        let primary = self.primary.get(primary_stat_for_spec(self.spec));

        // Attack power / spell power from primary stat
        // Most specs: 1 primary = 1 AP/SP
        self.combat.attack_power = primary;
        self.combat.spell_power = primary;

        // Crit: base + rating
        let crit_from_rating = rating_to_percent(self.ratings.crit, RatingType::Crit);
        self.combat.crit_chance = CombatStats::BASE_CRIT + crit_from_rating / 100.0;

        // Haste: multiplicative
        let haste_pct = rating_to_percent(self.ratings.haste, RatingType::Haste);
        self.combat.haste = 1.0 + haste_pct / 100.0;

        // Mastery: spec coefficient matters
        let mastery_from_rating = rating_to_percent(self.ratings.mastery, RatingType::Mastery);
        self.combat.mastery = mastery_from_rating * mastery_coeff;

        // Versatility
        let vers_pct = rating_to_percent(self.ratings.versatility, RatingType::Versatility);
        self.combat.versatility_damage = vers_pct / 100.0;
        self.combat.versatility_dr = vers_pct / 200.0; // Half for DR
    }

    // Convenience getters that ensure cache is fresh
    #[inline]
    pub fn crit_chance(&self) -> f32 {
        self.combat.crit_chance
    }

    #[inline]
    pub fn haste(&self) -> f32 {
        self.combat.haste
    }

    #[inline]
    pub fn mastery(&self) -> f32 {
        self.combat.mastery
    }

    #[inline]
    pub fn attack_power(&self) -> f32 {
        self.combat.attack_power
    }

    #[inline]
    pub fn spell_power(&self) -> f32 {
        self.combat.spell_power
    }

    #[inline]
    pub fn versatility(&self) -> f32 {
        self.combat.versatility_damage
    }
}
