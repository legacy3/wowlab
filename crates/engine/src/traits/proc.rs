//! Proc system for runtime trigger tracking.

use serde::Deserialize;

/// Events that can trigger proc effects.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcTrigger {
    /// Any spell cast.
    OnSpellCast,
    /// Specific spell cast.
    OnSpellCastId { spell_id: u32 },
    /// Any spell hit.
    OnSpellHit,
    /// Specific spell hit.
    OnSpellHitId { spell_id: u32 },
    /// Any spell crit.
    OnSpellCrit,
    /// Specific spell crit.
    OnSpellCritId { spell_id: u32 },
    /// Player auto-attack hit.
    OnAutoAttackHit,
    /// Player auto-attack crit.
    OnAutoAttackCrit,
    /// Pet attack hit.
    OnPetAttackHit,
    /// Pet attack crit.
    OnPetAttackCrit,
    /// Damage taken.
    OnDamageTaken,
    /// On kill (execute range).
    OnKill,
    /// On aura application.
    OnAuraApply { aura_id: u32 },
    /// On aura expiration.
    OnAuraExpire { aura_id: u32 },
}

impl ProcTrigger {
    /// Check if this trigger matches an event.
    ///
    /// A generic trigger (e.g., OnSpellCast) matches any specific trigger
    /// of the same type (e.g., OnSpellCastId { spell_id: 123 }).
    #[inline]
    pub fn matches(&self, event: &ProcTrigger) -> bool {
        match (self, event) {
            // Exact match
            (a, b) if a == b => true,

            // Generic spell cast matches specific spell cast
            (ProcTrigger::OnSpellCast, ProcTrigger::OnSpellCastId { .. }) => true,
            (ProcTrigger::OnSpellCast, ProcTrigger::OnSpellCast) => true,

            // Generic spell hit matches specific spell hit
            (ProcTrigger::OnSpellHit, ProcTrigger::OnSpellHitId { .. }) => true,
            (ProcTrigger::OnSpellHit, ProcTrigger::OnSpellHit) => true,

            // Generic spell crit matches specific spell crit
            (ProcTrigger::OnSpellCrit, ProcTrigger::OnSpellCritId { .. }) => true,
            (ProcTrigger::OnSpellCrit, ProcTrigger::OnSpellCrit) => true,

            _ => false,
        }
    }
}

/// What happens when a proc triggers.
#[derive(Debug, Clone)]
pub enum ProcEffect {
    /// Reset a spell's cooldown entirely.
    ResetCooldown { spell_id: u32 },

    /// Reduce a spell's remaining cooldown.
    ReduceCooldown { spell_id: u32, amount_ms: u32 },

    /// Grant a charge of a spell.
    GrantCharge { spell_id: u32 },

    /// Apply an aura.
    ApplyAura { aura_id: u32 },

    /// Remove an aura.
    RemoveAura { aura_id: u32 },

    /// Trigger another spell (instant cast).
    TriggerSpell { spell_id: u32 },

    /// Grant resource.
    Energize { amount: f32 },

    /// Deal damage (proc damage, scaled).
    Damage { base: f32, ap_coeff: f32 },
}

/// Sentinel value indicating proc has never triggered.
const NEVER_TRIGGERED: u32 = u32::MAX;

/// A runtime proc instance with state.
#[derive(Debug, Clone)]
pub struct ActiveProc {
    /// What triggers this proc.
    pub trigger: ProcTrigger,
    /// What happens when it procs.
    pub effect: ProcEffect,
    /// Proc chance (0.0-1.0).
    pub chance: f32,
    /// Internal cooldown in milliseconds.
    pub icd_ms: u32,
    /// Last time this proc triggered (NEVER_TRIGGERED if never).
    pub last_proc_time: u32,
    /// Source trait ID (for debugging).
    pub source_trait_id: u32,
}

impl ActiveProc {
    /// Create a new active proc.
    pub fn new(
        trigger: ProcTrigger,
        effect: ProcEffect,
        chance: f32,
        icd_ms: u32,
        source_trait_id: u32,
    ) -> Self {
        Self {
            trigger,
            effect,
            chance,
            icd_ms,
            last_proc_time: NEVER_TRIGGERED,
            source_trait_id,
        }
    }

    /// Check if this proc is off ICD.
    ///
    /// A proc is ready if:
    /// - It has never triggered, OR
    /// - The ICD has elapsed
    #[inline]
    pub fn is_ready(&self, current_time: u32) -> bool {
        // Never triggered = always ready
        if self.last_proc_time == NEVER_TRIGGERED {
            return true;
        }
        current_time >= self.last_proc_time + self.icd_ms
    }
}

/// Maximum number of active procs (reasonable limit).
const MAX_PROCS: usize = 32;

/// Runtime proc tracker.
///
/// Tracks all active procs and checks triggers efficiently.
pub struct ProcTracker {
    /// Active procs.
    procs: Vec<ActiveProc>,
}

impl Default for ProcTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl ProcTracker {
    /// Create a new empty proc tracker.
    pub fn new() -> Self {
        Self {
            procs: Vec::with_capacity(MAX_PROCS),
        }
    }

    /// Add a proc to track.
    pub fn add(&mut self, proc: ActiveProc) {
        if self.procs.len() < MAX_PROCS {
            self.procs.push(proc);
        }
    }

    /// Clear all procs.
    pub fn clear(&mut self) {
        self.procs.clear();
    }

    /// Reset ICD timers (for new simulation).
    pub fn reset(&mut self) {
        for proc in &mut self.procs {
            proc.last_proc_time = NEVER_TRIGGERED;
        }
    }

    /// Check procs for a trigger event.
    ///
    /// Returns effects that triggered (caller applies them).
    /// Uses provided RNG value (0.0-1.0) for proc chance.
    #[inline]
    pub fn check_procs(
        &mut self,
        trigger: ProcTrigger,
        current_time: u32,
        rng_value: f32,
    ) -> Vec<ProcEffect> {
        let mut triggered = Vec::new();

        for proc in &mut self.procs {
            // Check trigger match
            if !proc.trigger.matches(&trigger) {
                continue;
            }

            // Check ICD
            if !proc.is_ready(current_time) {
                continue;
            }

            // Roll chance (use single RNG value, offset by index for variety)
            if rng_value < proc.chance {
                proc.last_proc_time = current_time;
                triggered.push(proc.effect.clone());
            }
        }

        triggered
    }

    /// Check procs with individual RNG rolls.
    ///
    /// More accurate but requires multiple RNG calls.
    #[inline]
    pub fn check_procs_multi<F>(
        &mut self,
        trigger: ProcTrigger,
        current_time: u32,
        mut rng_fn: F,
    ) -> Vec<ProcEffect>
    where
        F: FnMut() -> f32,
    {
        let mut triggered = Vec::new();

        for proc in &mut self.procs {
            if !proc.trigger.matches(&trigger) {
                continue;
            }

            if !proc.is_ready(current_time) {
                continue;
            }

            if rng_fn() < proc.chance {
                proc.last_proc_time = current_time;
                triggered.push(proc.effect.clone());
            }
        }

        triggered
    }

    /// Number of active procs.
    pub fn len(&self) -> usize {
        self.procs.len()
    }

    /// Check if empty.
    pub fn is_empty(&self) -> bool {
        self.procs.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proc_trigger_match() {
        let generic = ProcTrigger::OnSpellCast;
        let specific = ProcTrigger::OnSpellCastId { spell_id: 12345 };

        assert!(generic.matches(&specific));
        assert!(specific.matches(&specific));
        assert!(!specific.matches(&generic));
    }

    #[test]
    fn test_proc_icd() {
        let mut proc = ActiveProc::new(
            ProcTrigger::OnSpellCast,
            ProcEffect::ResetCooldown { spell_id: 100 },
            1.0, // 100% chance
            500, // 500ms ICD
            1,
        );

        assert!(proc.is_ready(0));
        proc.last_proc_time = 100;
        assert!(!proc.is_ready(500)); // 500 < 100 + 500
        assert!(proc.is_ready(600));  // 600 >= 100 + 500
    }

    #[test]
    fn test_proc_tracker() {
        let mut tracker = ProcTracker::new();

        tracker.add(ActiveProc::new(
            ProcTrigger::OnSpellCrit,
            ProcEffect::ResetCooldown { spell_id: 217200 }, // Barbed Shot
            0.20, // 20% chance
            500,  // 500ms ICD
            1,
        ));

        // With 100% RNG (0.0), should trigger
        let effects = tracker.check_procs(
            ProcTrigger::OnSpellCritId { spell_id: 34026 },
            0,
            0.0,
        );
        assert_eq!(effects.len(), 1);

        // ICD should prevent immediate re-trigger
        let effects = tracker.check_procs(
            ProcTrigger::OnSpellCritId { spell_id: 34026 },
            100,
            0.0,
        );
        assert_eq!(effects.len(), 0);

        // After ICD, should trigger again
        let effects = tracker.check_procs(
            ProcTrigger::OnSpellCritId { spell_id: 34026 },
            600,
            0.0,
        );
        assert_eq!(effects.len(), 1);
    }
}
