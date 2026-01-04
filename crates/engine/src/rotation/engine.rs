//! Predictive rotation engine with condition gating.
//!
//! Uses Rhai AST analysis to extract conditions and predict when they become true,
//! allowing the engine to skip evaluation of conditions that are guaranteed false.

use crate::config::SimConfig;
use crate::sim::SimState;

use super::compiler::{RotationCompiler, RotationError};
use super::condition::{ConditionStatus, Rule};

/// Statistics about rotation condition states and evaluation performance.
#[derive(Debug, Clone, Default)]
pub struct RotationStats {
    /// Number of rules currently disabled (waiting for wake time).
    pub disabled: usize,
    /// Number of rules being actively watched.
    pub watching: usize,
    /// Number of rules with true conditions.
    pub active: usize,
    /// Total condition evaluations performed.
    pub evaluations: u64,
    /// Evaluations skipped due to predictive gating.
    pub skipped: u64,
}

impl RotationStats {
    /// Returns the percentage of rules currently disabled.
    #[must_use]
    pub fn skip_rate(&self) -> f32 {
        let total = self.disabled + self.watching + self.active;
        if total == 0 {
            0.0
        } else {
            #[allow(clippy::cast_precision_loss)]
            let rate = self.disabled as f32 / total as f32 * 100.0;
            rate
        }
    }

    /// Returns the percentage of evaluations saved by predictive gating.
    #[must_use]
    pub fn eval_savings(&self) -> f32 {
        let total = self.evaluations + self.skipped;
        if total == 0 {
            0.0
        } else {
            #[allow(clippy::cast_precision_loss)]
            let savings = self.skipped as f32 / total as f32 * 100.0;
            savings
        }
    }
}

/// Predictive rotation with condition gating.
///
/// Parses Rhai scripts at compile time and extracts spell priority rules.
/// During simulation, uses predictive gating to skip conditions that
/// can't possibly be true yet.
pub struct PredictiveRotation {
    /// Rotation rules in priority order.
    rules: Vec<Rule>,
    /// Fight duration in ms (for condition evaluation).
    duration_ms: u32,
    /// Total condition evaluations performed.
    evaluations: u64,
    /// Evaluations skipped due to predictive gating.
    skipped: u64,
}

impl PredictiveRotation {
    /// Compiles a rotation script into an executable rotation.
    ///
    /// # Errors
    ///
    /// Returns an error if the script fails to parse or references unknown spells/auras.
    #[allow(clippy::cast_possible_truncation)]
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

    /// Resets state between simulations.
    #[inline(always)]
    pub fn reset(&mut self) {
        for rule in &mut self.rules {
            rule.status = ConditionStatus::Watching;
            rule.enable_at = 0;
        }
    }

    /// Returns the next spell to cast based on rotation priorities.
    ///
    /// Evaluates conditions in priority order, skipping disabled conditions.
    /// Returns `None` if no spell is currently castable.
    #[inline(always)]
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
                // Check if spell is actually castable
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

    /// Checks if a spell can be cast (resources, cooldown, GCD).
    #[inline(always)]
    fn can_cast_spell(state: &SimState, spell_idx: u8) -> bool {
        let idx = spell_idx as usize;
        let spell_state = &state.player.spell_states[idx];

        // Check GCD first (common rejection)
        if state.player.gcd_ready > state.time {
            return false;
        }

        // Check cooldown/charges (max_charges is duplicated in SpellState)
        if spell_state.max_charges > 0 {
            if spell_state.charges == 0 {
                return false;
            }
        } else if spell_state.cooldown_ready > state.time {
            return false;
        }

        // Check resources (only load spell_runtime if we pass other checks)
        let spell_rt = &state.spell_runtime[idx];
        state.player.resources.current() >= spell_rt.cost_amount
    }

    /// Returns the number of rotation rules.
    #[must_use]
    pub fn rule_count(&self) -> usize {
        self.rules.len()
    }

    /// Returns the number of conditions (same as rule count).
    #[must_use]
    pub fn condition_count(&self) -> usize {
        self.rules.len()
    }

    /// Returns current statistics about condition states.
    #[must_use]
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

    /// Resets evaluation counters for fresh benchmark runs.
    pub fn reset_stats(&mut self) {
        self.evaluations = 0;
        self.skipped = 0;
    }
}
