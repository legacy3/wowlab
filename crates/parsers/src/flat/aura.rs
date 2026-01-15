//! AuraDataFlat - Flat representation of aura/buff/debuff data

use serde::{Deserialize, Serialize};

use super::{PeriodicType, RefreshBehavior};

/// Flat aura data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuraDataFlat {
    pub spell_id: i32,
    pub base_duration_ms: i32,
    pub max_duration_ms: i32,
    pub max_stacks: i32,
    pub periodic_type: Option<PeriodicType>,
    pub tick_period_ms: i32,
    pub refresh_behavior: RefreshBehavior,
    pub duration_hasted: bool,
    pub hasted_ticks: bool,
    pub pandemic_refresh: bool,
    pub rolling_periodic: bool,
    pub tick_may_crit: bool,
    pub tick_on_application: bool,
}

impl Default for AuraDataFlat {
    fn default() -> Self {
        Self {
            spell_id: 0,
            base_duration_ms: 0,
            max_duration_ms: 0,
            max_stacks: 1,
            periodic_type: None,
            tick_period_ms: 0,
            refresh_behavior: RefreshBehavior::Duration,
            duration_hasted: false,
            hasted_ticks: false,
            pandemic_refresh: false,
            rolling_periodic: false,
            tick_may_crit: false,
            tick_on_application: false,
        }
    }
}
