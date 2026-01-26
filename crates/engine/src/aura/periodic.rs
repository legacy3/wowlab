use crate::combat::ActionState;
use wowlab_common::types::{AuraIdx, SimTime};
use serde::{Deserialize, Serialize};

/// Defines periodic effect behavior
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct PeriodicEffect {
    /// Aura this periodic belongs to
    pub aura_id: AuraIdx,
    /// Tick interval
    pub interval: SimTime,
    /// Base tick damage/heal coefficient
    pub coefficient: f32,
    /// Scales with haste (changes interval)
    pub haste_scales_interval: bool,
    /// Scales with haste (adds ticks)
    pub haste_adds_ticks: bool,
    /// Spell power coefficient for scaling
    pub sp_coefficient: f32,
    /// Attack power coefficient for scaling
    pub ap_coefficient: f32,
}

impl PeriodicEffect {
    pub fn new(aura_id: AuraIdx, interval: SimTime) -> Self {
        Self {
            aura_id,
            interval,
            coefficient: 1.0,
            haste_scales_interval: true,
            haste_adds_ticks: false,
            sp_coefficient: 0.0,
            ap_coefficient: 0.0,
        }
    }

    pub fn with_coefficient(mut self, coef: f32) -> Self {
        self.coefficient = coef;
        self
    }

    pub fn with_sp_scaling(mut self, coef: f32) -> Self {
        self.sp_coefficient = coef;
        self
    }

    pub fn with_ap_scaling(mut self, coef: f32) -> Self {
        self.ap_coefficient = coef;
        self
    }

    /// Calculate effective interval with haste
    pub fn effective_interval(&self, haste: f32) -> SimTime {
        if self.haste_scales_interval {
            let ms = (self.interval.as_millis() as f32 / haste) as u32;
            SimTime::from_millis(ms.max(1))
        } else {
            self.interval
        }
    }

    /// Calculate total ticks for a duration
    pub fn total_ticks(&self, duration: SimTime, haste: f32) -> u8 {
        let effective = self.effective_interval(haste);
        let base_ticks = (duration.as_millis() / effective.as_millis()) as u8;

        if self.haste_adds_ticks {
            // Haste adds ticks instead of reducing interval
            ((base_ticks as f32) * haste) as u8
        } else {
            base_ticks
        }
    }

    /// Calculate tick damage
    pub fn tick_damage(&self, snapshot: &ActionState) -> f32 {
        let base = if self.sp_coefficient > 0.0 {
            snapshot.spell_power * self.sp_coefficient
        } else if self.ap_coefficient > 0.0 {
            snapshot.attack_power * self.ap_coefficient
        } else {
            0.0
        };

        base * self.coefficient
    }
}
