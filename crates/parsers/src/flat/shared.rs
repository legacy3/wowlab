//! Shared types used across multiple flat structures

use serde::{Deserialize, Serialize};

/// How a spell was learned (for knowledge tracking)
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(tag = "source", rename_all = "camelCase")]
pub enum KnowledgeSource {
    #[serde(rename = "talent")]
    Talent {
        #[serde(rename = "traitDefinitionId")]
        trait_definition_id: i32,
    },
    #[serde(rename = "spec")]
    Spec {
        #[serde(rename = "specId")]
        spec_id: i32,
    },
    #[serde(rename = "class")]
    Class {
        #[serde(rename = "classId")]
        class_id: i32,
    },
    #[serde(rename = "unknown")]
    #[default]
    Unknown,
}

/// Type of periodic effect (damage/heal over time)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PeriodicType {
    Damage,
    Heal,
    Leech,
    Energize,
    TriggerSpell,
}

/// How an aura's duration refreshes when reapplied
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RefreshBehavior {
    Pandemic,
    #[default]
    Duration,
}
