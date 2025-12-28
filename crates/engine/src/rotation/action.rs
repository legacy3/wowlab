use serde::Deserialize;

use super::Condition;

/// Action in the rotation priority list
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RotationAction {
    /// Cast a spell (if castable)
    Cast { spell_id: u32 },

    /// Cast a spell only if condition is met
    CastIf { spell_id: u32, condition: Condition },

    /// Wait for GCD/cast to complete (pooling)
    Wait { duration: f32 },

    /// Pool resources until condition is met
    Pool { condition: Condition },

    /// Sub-action list (for organization)
    ActionList {
        name: String,
        actions: Vec<RotationAction>,
    },

    /// Call another action list by name
    CallActionList { name: String },
}
