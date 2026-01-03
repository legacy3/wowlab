//! Simulation result types.

use serde::Serialize;

/// A single logged action from the simulation.
#[derive(Debug, Clone, Serialize)]
pub struct ActionLogEntry {
    /// Time in seconds since combat start.
    pub time: f32,
    /// Type of action.
    pub action: ActionType,
    /// Spell/aura name (if applicable).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Spell/aura ID (if applicable).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u32>,
    /// Damage dealt (if applicable).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub damage: Option<f32>,
    /// Current resource after action.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource: Option<f32>,
    /// GCD incurred (if applicable).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gcd: Option<f32>,
    /// Extra info (aura stacks, remaining duration, etc).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra: Option<String>,
}

/// Type of action in the log.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    /// Spell cast.
    Cast,
    /// Damage dealt (spell, dot tick, auto attack).
    Damage,
    /// Aura applied.
    AuraApply,
    /// Aura refreshed.
    AuraRefresh,
    /// Aura expired.
    AuraExpire,
    /// Resource gained.
    ResourceGain,
    /// Combat start.
    CombatStart,
    /// Combat end.
    CombatEnd,
}

/// Detailed report from a single simulation run.
#[derive(Debug, Clone, Serialize)]
pub struct SimReport {
    /// Spec name.
    pub spec: String,
    /// Fight duration in seconds.
    pub duration: f32,
    /// Final DPS.
    pub dps: f32,
    /// Total damage dealt.
    pub total_damage: f32,
    /// Total casts.
    pub total_casts: u32,
    /// Chronological action log.
    pub actions: Vec<ActionLogEntry>,
    /// Spell breakdown summary.
    pub spell_breakdown: Vec<SpellBreakdown>,
}

/// Action log accumulator for a single simulation.
#[derive(Debug, Clone, Default)]
pub struct ActionLog {
    /// Whether logging is enabled.
    pub enabled: bool,
    /// Logged entries.
    pub entries: Vec<ActionLogEntry>,
    /// Spell names by index.
    pub spell_names: Vec<String>,
    /// Aura names by index.
    pub aura_names: Vec<String>,
}

impl ActionLog {
    /// Create a new disabled action log.
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a new enabled action log with spell/aura names.
    pub fn with_names(spell_names: Vec<String>, aura_names: Vec<String>) -> Self {
        Self {
            enabled: true,
            entries: Vec::with_capacity(1024),
            spell_names,
            aura_names,
        }
    }

    /// Log a spell cast.
    #[inline]
    pub fn log_cast(
        &mut self,
        time_ms: u32,
        spell_idx: usize,
        spell_id: u32,
        damage: f32,
        resource: f32,
        gcd_ms: u32,
    ) {
        if !self.enabled {
            return;
        }
        let name = self.spell_names.get(spell_idx).cloned();
        self.entries.push(ActionLogEntry {
            time: time_ms as f32 / 1000.0,
            action: ActionType::Cast,
            name,
            id: Some(spell_id),
            damage: if damage > 0.0 { Some(damage) } else { None },
            resource: Some(resource),
            gcd: if gcd_ms > 0 {
                Some(gcd_ms as f32 / 1000.0)
            } else {
                None
            },
            extra: None,
        });
    }

    /// Log an aura application.
    #[inline]
    pub fn log_aura_apply(&mut self, time_ms: u32, aura_idx: usize, aura_id: u32, stacks: u8, is_refresh: bool) {
        if !self.enabled {
            return;
        }
        let name = self.aura_names.get(aura_idx).cloned();
        self.entries.push(ActionLogEntry {
            time: time_ms as f32 / 1000.0,
            action: if is_refresh {
                ActionType::AuraRefresh
            } else {
                ActionType::AuraApply
            },
            name,
            id: Some(aura_id),
            damage: None,
            resource: None,
            gcd: None,
            extra: if stacks > 1 {
                Some(format!("{} stacks", stacks))
            } else {
                None
            },
        });
    }

    /// Log a DoT tick.
    #[inline]
    pub fn log_dot_tick(&mut self, time_ms: u32, aura_idx: usize, aura_id: u32, damage: f32) {
        if !self.enabled {
            return;
        }
        let name = self.aura_names.get(aura_idx).cloned();
        self.entries.push(ActionLogEntry {
            time: time_ms as f32 / 1000.0,
            action: ActionType::Damage,
            name,
            id: Some(aura_id),
            damage: Some(damage),
            resource: None,
            gcd: None,
            extra: Some("tick".to_string()),
        });
    }

    /// Log combat start.
    #[inline]
    pub fn log_combat_start(&mut self) {
        if !self.enabled {
            return;
        }
        self.entries.push(ActionLogEntry {
            time: 0.0,
            action: ActionType::CombatStart,
            name: None,
            id: None,
            damage: None,
            resource: None,
            gcd: None,
            extra: None,
        });
    }

    /// Log combat end.
    #[inline]
    pub fn log_combat_end(&mut self, time_ms: u32, total_damage: f32, dps: f32) {
        if !self.enabled {
            return;
        }
        self.entries.push(ActionLogEntry {
            time: time_ms as f32 / 1000.0,
            action: ActionType::CombatEnd,
            name: None,
            id: None,
            damage: Some(total_damage),
            resource: None,
            gcd: None,
            extra: Some(format!("{:.1} DPS", dps)),
        });
    }
}

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

impl BatchAccumulator {
    /// Merges another accumulator into this one.
    pub fn merge(&mut self, other: &Self) {
        if other.iterations == 0 {
            return;
        }
        self.iterations += other.iterations;
        self.sum_dps += other.sum_dps;
        self.sum_sq_dps += other.sum_sq_dps;
        self.min_dps = self.min_dps.min(other.min_dps);
        self.max_dps = self.max_dps.max(other.max_dps);
        self.total_casts += other.total_casts;

        // Merge spell data
        if self.spell_damage.is_empty() {
            self.spell_damage = other.spell_damage.clone();
            self.spell_casts = other.spell_casts.clone();
        } else {
            for (i, &dmg) in other.spell_damage.iter().enumerate() {
                self.spell_damage[i] += dmg;
                self.spell_casts[i] += other.spell_casts[i];
            }
        }
    }
}

impl Default for BatchAccumulator {
    fn default() -> Self {
        Self::new()
    }
}
