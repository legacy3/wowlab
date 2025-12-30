//! Predictive rotation engine with condition gating.
//!
//! Uses Rhai AST analysis to extract conditions and predict when they become true,
//! allowing the engine to skip evaluation of conditions that are guaranteed false.

use crate::config::SimConfig;
use crate::sim::SimState;

use super::compiler::{RotationCompiler, RotationError};
use super::condition::{ConditionStatus, Rule};

/// Statistics about rotation condition states and evaluation counts.
#[derive(Debug, Clone, Default)]
pub struct RotationStats {
    pub disabled: usize,
    pub watching: usize,
    pub active: usize,
    /// Total condition evaluations performed
    pub evaluations: u64,
    /// Evaluations skipped due to predictive gating
    pub skipped: u64,
}

impl RotationStats {
    /// Calculate skip rate (percentage of conditions being skipped).
    pub fn skip_rate(&self) -> f32 {
        let total = self.disabled + self.watching + self.active;
        if total == 0 {
            0.0
        } else {
            (self.disabled as f32 / total as f32) * 100.0
        }
    }

    /// Calculate evaluation savings from predictive gating.
    pub fn eval_savings(&self) -> f32 {
        let total = self.evaluations + self.skipped;
        if total == 0 {
            0.0
        } else {
            (self.skipped as f32 / total as f32) * 100.0
        }
    }
}

/// Predictive rotation with condition gating.
///
/// Parses Rhai scripts at compile time and extracts:
/// - Spell priority rules with conditions
/// - Wake-up times for disabled conditions
pub struct PredictiveRotation {
    /// Rotation rules in priority order
    rules: Vec<Rule>,
    /// Fight duration in ms (for condition evaluation)
    duration_ms: u32,
    /// Total condition evaluations performed
    evaluations: u64,
    /// Evaluations skipped due to predictive gating
    skipped: u64,
}

impl PredictiveRotation {
    /// Compile a rotation script.
    pub fn compile(script: &str, config: &SimConfig) -> Result<Self, RotationError> {
        let compiler = RotationCompiler::new(config);
        let rules = compiler.compile(script)?;

        Ok(Self {
            rules,
            duration_ms: (config.duration * 1000.0) as u32,
            evaluations: 0,
            skipped: 0,
        })
    }

    /// Reset state between simulations.
    pub fn reset(&mut self) {
        for rule in &mut self.rules {
            rule.status = ConditionStatus::Watching;
            rule.enable_at = 0;
        }
    }

    /// Get the next spell to cast.
    ///
    /// Evaluates conditions in priority order, skipping disabled conditions.
    /// Returns the spell index to cast, or None if no spell is available.
    pub fn get_next_action(&mut self, state: &SimState) -> Option<u8> {
        let current_time = state.time;
        let duration_ms = self.duration_ms;

        for rule in &mut self.rules {
            // Re-enable disabled conditions when their wake time is reached
            if rule.status == ConditionStatus::Disabled && current_time >= rule.enable_at {
                rule.status = ConditionStatus::Watching;
            }

            // Skip disabled conditions
            if rule.status == ConditionStatus::Disabled {
                self.skipped += 1;
                continue;
            }

            // Evaluate the condition
            self.evaluations += 1;
            let (result, wake_time) = rule.condition.evaluate(state, duration_ms);

            if result {
                // Check if spell is actually castable (has resources, not on CD, etc.)
                if Self::can_cast_spell(state, rule.spell_idx) {
                    rule.status = ConditionStatus::Active;
                    return Some(rule.spell_idx);
                }
            }

            // Update status based on result and wake time
            if !result {
                if let Some(wake_at) = wake_time {
                    // We know when this condition will become true
                    rule.status = ConditionStatus::Disabled;
                    rule.enable_at = wake_at;
                } else {
                    // Can't predict - keep watching
                    rule.status = ConditionStatus::Watching;
                }
            }
        }

        None
    }

    /// Check if a spell can be cast (resources, cooldown, GCD).
    fn can_cast_spell(state: &SimState, spell_idx: u8) -> bool {
        let idx = spell_idx as usize;
        let spell_state = &state.player.spell_states[idx];
        let spell_rt = &state.spell_runtime[idx];

        // Check GCD
        if state.player.gcd_ready > state.time {
            return false;
        }

        // Check cooldown/charges
        if spell_rt.max_charges > 0 {
            if spell_state.charges == 0 {
                return false;
            }
        } else if spell_state.cooldown_ready > state.time {
            return false;
        }

        // Check resources
        if state.player.resources.current < spell_rt.cost_amount {
            return false;
        }

        true
    }

    /// Get number of rules.
    pub fn rule_count(&self) -> usize {
        self.rules.len()
    }

    /// Get number of conditions (same as rules in this implementation).
    pub fn condition_count(&self) -> usize {
        self.rules.len()
    }

    /// Get current statistics about condition states.
    pub fn stats(&self) -> RotationStats {
        let mut stats = RotationStats::default();

        for rule in &self.rules {
            match rule.status {
                ConditionStatus::Disabled => stats.disabled += 1,
                ConditionStatus::Watching => stats.watching += 1,
                ConditionStatus::Active => stats.active += 1,
            }
        }

        stats.evaluations = self.evaluations;
        stats.skipped = self.skipped;

        stats
    }

    /// Reset evaluation counters (for fresh benchmark runs).
    pub fn reset_stats(&mut self) {
        self.evaluations = 0;
        self.skipped = 0;
    }
}
