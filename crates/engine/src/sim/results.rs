//! Simulation result types.

use serde::Serialize;

/// Results from a single simulation run.
#[derive(Debug, Clone, Default, Serialize)]
pub struct SimResult {
    /// Total damage dealt.
    pub damage: f32,
    /// Damage per second.
    pub dps: f32,
    /// Total spell casts.
    pub casts: u32,
}

/// Aggregated results from a batch of simulations.
#[derive(Debug, Clone, Default, Serialize)]
pub struct BatchResult {
    /// Number of iterations run.
    pub iterations: u32,
    /// Mean DPS across all iterations.
    pub mean_dps: f32,
    /// Standard deviation of DPS.
    pub std_dps: f32,
    /// Minimum DPS observed.
    pub min_dps: f32,
    /// Maximum DPS observed.
    pub max_dps: f32,
    /// Total casts across all iterations.
    pub total_casts: u64,

    /// Damage breakdown by spell.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub spell_breakdown: Vec<SpellBreakdown>,
}

/// Damage contribution from a single spell.
#[derive(Debug, Clone, Default, Serialize)]
pub struct SpellBreakdown {
    /// Spell identifier.
    pub spell_id: u32,
    /// Total damage dealt by this spell.
    pub total_damage: f32,
    /// Number of casts.
    pub casts: u64,
    /// DPS contribution from this spell.
    pub dps_contribution: f32,
    /// Percentage of total damage.
    pub pct_of_total: f32,
}

/// Accumulator for batch statistics.
///
/// Uses index-based lookup for O(1) per-spell accumulation.
pub struct BatchAccumulator {
    /// Number of iterations accumulated.
    pub iterations: u32,
    /// Sum of DPS values (for mean calculation).
    pub sum_dps: f32,
    /// Sum of squared DPS values (for std dev calculation).
    pub sum_sq_dps: f32,
    /// Minimum DPS observed.
    pub min_dps: f32,
    /// Maximum DPS observed.
    pub max_dps: f32,
    /// Total casts across all iterations.
    pub total_casts: u64,
    /// Damage by spell index.
    pub spell_damage: Vec<f32>,
    /// Casts by spell index.
    pub spell_casts: Vec<u64>,
}

impl BatchAccumulator {
    /// Creates a new empty accumulator.
    #[must_use]
    pub fn new() -> Self {
        Self {
            iterations: 0,
            sum_dps: 0.0,
            sum_sq_dps: 0.0,
            min_dps: f32::MAX,
            max_dps: f32::MIN,
            total_casts: 0,
            spell_damage: Vec::new(),
            spell_casts: Vec::new(),
        }
    }

    /// Adds a simulation result to the accumulator.
    #[inline]
    #[allow(clippy::cast_lossless)]
    pub fn add(&mut self, result: &SimResult, spell_damage: &[f32], spell_casts: &[u32]) {
        self.iterations += 1;
        self.sum_dps += result.dps;
        self.sum_sq_dps += result.dps * result.dps;
        self.min_dps = self.min_dps.min(result.dps);
        self.max_dps = self.max_dps.max(result.dps);
        self.total_casts += result.casts as u64;

        // Initialize vectors on first add
        if self.spell_damage.is_empty() {
            self.spell_damage.resize(spell_damage.len(), 0.0);
            self.spell_casts.resize(spell_casts.len(), 0);
        }

        // Direct index accumulation - no search
        for (i, &dmg) in spell_damage.iter().enumerate() {
            self.spell_damage[i] += dmg;
            self.spell_casts[i] += spell_casts[i] as u64;
        }
    }

    /// Computes final statistics and returns the batch result.
    #[must_use]
    #[allow(clippy::cast_precision_loss)]
    pub fn finalize(self, duration: f32, spell_ids: &[u32]) -> BatchResult {
        let n = self.iterations as f32;
        let mean_dps = self.sum_dps / n;
        let variance = (self.sum_sq_dps / n) - (mean_dps * mean_dps);
        let std_dps = variance.sqrt();

        let total_damage: f32 = self.spell_damage.iter().sum();

        let spell_breakdown: Vec<_> = self
            .spell_damage
            .iter()
            .zip(self.spell_casts.iter())
            .zip(spell_ids.iter())
            .filter(|((dmg, _), _)| **dmg > 0.0)
            .map(|((damage, casts), spell_id)| {
                let avg_damage = damage / n;
                let dps_contribution = avg_damage / duration;
                SpellBreakdown {
                    spell_id: *spell_id,
                    total_damage: *damage,
                    casts: *casts,
                    dps_contribution,
                    pct_of_total: if total_damage > 0.0 {
                        damage / total_damage * 100.0
                    } else {
                        0.0
                    },
                }
            })
            .collect();

        BatchResult {
            iterations: self.iterations,
            mean_dps,
            std_dps,
            min_dps: self.min_dps,
            max_dps: self.max_dps,
            total_casts: self.total_casts,
            spell_breakdown,
        }
    }
}

impl Default for BatchAccumulator {
    fn default() -> Self {
        Self::new()
    }
}
