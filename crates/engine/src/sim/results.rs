use serde::Serialize;

/// Results from a single simulation run
#[derive(Debug, Clone, Default, Serialize)]
pub struct SimResult {
    pub damage: f64,
    pub dps: f64,
    pub casts: u32,
}

/// Aggregated results from a batch of simulations
#[derive(Debug, Clone, Default, Serialize)]
pub struct BatchResult {
    pub iterations: u32,
    pub mean_dps: f64,
    pub std_dps: f64,
    pub min_dps: f64,
    pub max_dps: f64,
    pub total_casts: u64,

    /// Damage breakdown by spell
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub spell_breakdown: Vec<SpellBreakdown>,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct SpellBreakdown {
    pub spell_id: u32,
    pub total_damage: f64,
    pub casts: u64,
    pub dps_contribution: f64,
    pub pct_of_total: f32,
}

/// Accumulator for batch statistics
pub struct BatchAccumulator {
    pub iterations: u32,
    pub sum_dps: f64,
    pub sum_sq_dps: f64,
    pub min_dps: f64,
    pub max_dps: f64,
    pub total_casts: u64,
    pub spell_totals: Vec<(u32, f64, u64)>, // (spell_id, damage, casts)
}

impl BatchAccumulator {
    pub fn new() -> Self {
        Self {
            iterations: 0,
            sum_dps: 0.0,
            sum_sq_dps: 0.0,
            min_dps: f64::MAX,
            max_dps: f64::MIN,
            total_casts: 0,
            spell_totals: Vec::new(),
        }
    }

    pub fn add(&mut self, result: &SimResult, spell_damage: &[(u32, f64, u32)]) {
        self.iterations += 1;
        self.sum_dps += result.dps;
        self.sum_sq_dps += result.dps * result.dps;
        self.min_dps = self.min_dps.min(result.dps);
        self.max_dps = self.max_dps.max(result.dps);
        self.total_casts += result.casts as u64;

        // Accumulate spell breakdown
        for (spell_id, damage, casts) in spell_damage {
            if let Some((_, total, count)) = self
                .spell_totals
                .iter_mut()
                .find(|(id, _, _)| *id == *spell_id)
            {
                *total += damage;
                *count += *casts as u64;
            } else {
                self.spell_totals.push((*spell_id, *damage, *casts as u64));
            }
        }
    }

    pub fn finalize(self, duration: f32) -> BatchResult {
        let n = self.iterations as f64;
        let mean_dps = self.sum_dps / n;
        let variance = (self.sum_sq_dps / n) - (mean_dps * mean_dps);
        let std_dps = variance.sqrt();

        let total_damage: f64 = self.spell_totals.iter().map(|(_, d, _)| d).sum();

        let spell_breakdown: Vec<_> = self
            .spell_totals
            .iter()
            .map(|(spell_id, damage, casts)| {
                let avg_damage = damage / n;
                let dps_contribution = avg_damage / duration as f64;
                SpellBreakdown {
                    spell_id: *spell_id,
                    total_damage: *damage,
                    casts: *casts,
                    dps_contribution,
                    pct_of_total: if total_damage > 0.0 {
                        (damage / total_damage * 100.0) as f32
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
