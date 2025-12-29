use serde::Serialize;

/// Results from a single simulation run
#[derive(Debug, Clone, Default, Serialize)]
pub struct SimResult {
    pub damage: f32,
    pub dps: f32,
    pub casts: u32,
}

/// Aggregated results from a batch of simulations
#[derive(Debug, Clone, Default, Serialize)]
pub struct BatchResult {
    pub iterations: u32,
    pub mean_dps: f32,
    pub std_dps: f32,
    pub min_dps: f32,
    pub max_dps: f32,
    pub total_casts: u64,

    /// Damage breakdown by spell
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub spell_breakdown: Vec<SpellBreakdown>,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct SpellBreakdown {
    pub spell_id: u32,
    pub total_damage: f32,
    pub casts: u64,
    pub dps_contribution: f32,
    pub pct_of_total: f32,
}

/// Accumulator for batch statistics (index-based, no linear search)
pub struct BatchAccumulator {
    pub iterations: u32,
    pub sum_dps: f32,
    pub sum_sq_dps: f32,
    pub min_dps: f32,
    pub max_dps: f32,
    pub total_casts: u64,
    /// Indexed by spell position
    pub spell_damage: Vec<f32>,
    pub spell_casts: Vec<u64>,
}

impl BatchAccumulator {
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

    #[inline]
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
