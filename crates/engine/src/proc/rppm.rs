use crate::core::FastRng;
use wowlab_common::types::{ProcIdx, SimTime};

/// RPPM (Real Procs Per Minute) state with Bad Luck Protection
#[derive(Clone, Debug)]
pub struct RppmState {
    /// Proc identifier
    pub proc_id: ProcIdx,
    /// Base procs per minute
    pub base_ppm: f32,
    /// Last successful proc time
    pub(crate) last_proc: SimTime,
    /// Last attempt time (for BLP calculation)
    pub(crate) last_attempt: SimTime,
    /// Accumulated BLP multiplier
    pub(crate) blp_multiplier: f32,
    /// Whether this RPPM scales with haste
    pub haste_scaling: bool,
    /// Whether this RPPM scales with crit
    pub crit_scaling: bool,
    /// Internal cooldown (if any)
    pub icd: Option<SimTime>,
}

impl RppmState {
    pub fn new(proc_id: ProcIdx, base_ppm: f32) -> Self {
        Self {
            proc_id,
            base_ppm,
            last_proc: SimTime::ZERO,
            last_attempt: SimTime::ZERO,
            blp_multiplier: 1.0,
            haste_scaling: true,
            crit_scaling: false,
            icd: None,
        }
    }

    pub fn with_haste_scaling(mut self, scales: bool) -> Self {
        self.haste_scaling = scales;
        self
    }

    pub fn with_crit_scaling(mut self, scales: bool) -> Self {
        self.crit_scaling = scales;
        self
    }

    pub fn with_icd(mut self, icd: SimTime) -> Self {
        self.icd = Some(icd);
        self
    }

    /// Reset state for new simulation
    pub fn reset(&mut self) {
        self.last_proc = SimTime::ZERO;
        self.last_attempt = SimTime::ZERO;
        self.blp_multiplier = 1.0;
    }

    /// Check if on internal cooldown
    pub fn on_icd(&self, now: SimTime) -> bool {
        if let Some(icd) = self.icd {
            now < self.last_proc + icd
        } else {
            false
        }
    }

    /// Calculate effective PPM with scaling
    pub fn effective_ppm(&self, haste: f32, crit: f32) -> f32 {
        let mut ppm = self.base_ppm;

        if self.haste_scaling {
            ppm *= haste;
        }

        if self.crit_scaling {
            ppm *= 1.0 + crit;
        }

        ppm
    }

    /// Calculate proc chance for this attempt
    ///
    /// Formula: PPM * (time_since_last / 60) * BLP
    /// BLP increases based on time since last proc
    pub fn proc_chance(&self, now: SimTime, haste: f32, crit: f32) -> f32 {
        let ppm = self.effective_ppm(haste, crit);

        // Time since last attempt (minimum 100ms to avoid division issues)
        let time_since_attempt = (now - self.last_attempt).as_secs_f32().max(0.1);

        // Base chance: PPM * time / 60
        let base_chance = ppm * time_since_attempt / 60.0;

        // Apply BLP multiplier
        let chance = base_chance * self.blp_multiplier;

        // Cap at 100%
        chance.min(1.0)
    }

    /// Attempt to proc, returns true if successful
    pub fn attempt(&mut self, now: SimTime, haste: f32, crit: f32, rng: &mut FastRng) -> bool {
        // Check ICD
        if self.on_icd(now) {
            return false;
        }

        let chance = self.proc_chance(now, haste, crit);
        let rolled = rng.next_f32();

        // Update last attempt time
        let time_since = now - self.last_attempt;
        self.last_attempt = now;

        if rolled < chance {
            // Proc succeeded
            self.last_proc = now;
            self.blp_multiplier = 1.0; // Reset BLP
            true
        } else {
            // Proc failed, increase BLP
            // BLP formula: multiplier increases based on time since last proc
            self.update_blp(time_since);
            false
        }
    }

    /// Update Bad Luck Protection multiplier
    fn update_blp(&mut self, time_since_attempt: SimTime) {
        // BLP formula varies by proc type, this is a common implementation:
        // Multiplier increases by (1 + time * 3) for each failed attempt
        let time_factor = time_since_attempt.as_secs_f32();
        let increase = 1.0 + time_factor * 3.0;

        // BLP multiplier stacks multiplicatively, capped at ~100x
        self.blp_multiplier = (self.blp_multiplier * increase).min(100.0);
    }

    /// Get current BLP multiplier (for debugging/display)
    pub fn current_blp(&self) -> f32 {
        self.blp_multiplier
    }

    /// Time since last proc
    pub fn time_since_proc(&self, now: SimTime) -> SimTime {
        now - self.last_proc
    }
}

/// Simple fixed-chance proc
#[derive(Clone, Debug)]
pub struct FixedProc {
    pub proc_id: ProcIdx,
    pub chance: f32,
    pub icd: Option<SimTime>,
    /// Last proc time (None = never procced)
    last_proc: Option<SimTime>,
}

impl FixedProc {
    pub fn new(proc_id: ProcIdx, chance: f32) -> Self {
        Self {
            proc_id,
            chance,
            icd: None,
            last_proc: None,
        }
    }

    pub fn with_icd(mut self, icd: SimTime) -> Self {
        self.icd = Some(icd);
        self
    }

    pub fn reset(&mut self) {
        self.last_proc = None;
    }

    pub fn on_icd(&self, now: SimTime) -> bool {
        match (self.icd, self.last_proc) {
            (Some(icd), Some(last)) => now < last + icd,
            _ => false,
        }
    }

    pub fn attempt(&mut self, now: SimTime, rng: &mut FastRng) -> bool {
        if self.on_icd(now) {
            return false;
        }

        if rng.roll(self.chance) {
            self.last_proc = Some(now);
            true
        } else {
            false
        }
    }
}
