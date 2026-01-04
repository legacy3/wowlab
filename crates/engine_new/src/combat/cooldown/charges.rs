use crate::types::SimTime;

/// Cooldown with charges (like Barbed Shot)
#[derive(Clone, Debug)]
pub struct ChargedCooldown {
    /// Maximum charges
    pub max_charges: u8,
    /// Current charges
    pub current_charges: u8,
    /// Recharge time per charge
    pub recharge_time: SimTime,
    /// When next charge will be ready
    pub next_charge_at: SimTime,
    /// Does haste affect recharge?
    pub hasted: bool,
}

impl ChargedCooldown {
    pub fn new(max_charges: u8, recharge_secs: f32) -> Self {
        Self {
            max_charges,
            current_charges: max_charges,
            recharge_time: SimTime::from_secs_f32(recharge_secs),
            next_charge_at: SimTime::ZERO,
            hasted: false,
        }
    }

    pub fn hasted(mut self) -> Self {
        self.hasted = true;
        self
    }

    /// Has at least one charge?
    #[inline]
    pub fn has_charge(&self) -> bool {
        self.current_charges > 0
    }

    /// Is fully charged?
    #[inline]
    pub fn is_full(&self) -> bool {
        self.current_charges >= self.max_charges
    }

    /// Spend a charge, return true if successful
    pub fn spend(&mut self, now: SimTime, haste: f32) -> bool {
        if self.current_charges == 0 {
            return false;
        }

        let was_full = self.is_full();
        self.current_charges -= 1;

        // Start recharge timer if we weren't already recharging
        if was_full {
            let recharge = if self.hasted {
                SimTime::from_secs_f32(self.recharge_time.as_secs_f32() / haste)
            } else {
                self.recharge_time
            };
            self.next_charge_at = now + recharge;
        }

        true
    }

    /// Gain a charge (e.g., from proc)
    pub fn gain_charge(&mut self, _now: SimTime, _haste: f32) {
        if self.current_charges < self.max_charges {
            self.current_charges += 1;

            // If now full, stop recharge timer
            if self.is_full() {
                self.next_charge_at = SimTime::MAX;
            }
        }
    }

    /// Check if a charge has regenerated
    pub fn check_recharge(&mut self, now: SimTime, haste: f32) -> bool {
        if self.is_full() {
            return false;
        }

        if now >= self.next_charge_at {
            self.current_charges += 1;

            // Schedule next recharge if not full
            if !self.is_full() {
                let recharge = if self.hasted {
                    SimTime::from_secs_f32(self.recharge_time.as_secs_f32() / haste)
                } else {
                    self.recharge_time
                };
                self.next_charge_at = now + recharge;
            } else {
                self.next_charge_at = SimTime::MAX;
            }

            return true;
        }

        false
    }

    /// Time until next charge (0 if has charge)
    pub fn time_until_charge(&self, now: SimTime) -> SimTime {
        if self.has_charge() {
            SimTime::ZERO
        } else {
            self.next_charge_at.saturating_sub(now)
        }
    }

    /// Fractional charges (for UI/conditions)
    pub fn charges_fractional(&self, now: SimTime) -> f32 {
        let base = self.current_charges as f32;
        if self.is_full() {
            return base;
        }

        let elapsed = now.saturating_sub(
            self.next_charge_at.saturating_sub(self.recharge_time)
        );
        let progress = elapsed.as_secs_f32() / self.recharge_time.as_secs_f32();

        base + progress.clamp(0.0, 1.0)
    }
}
