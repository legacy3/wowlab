//! SpecDataFlat - Flat representation of specialization data

use serde::{Deserialize, Serialize};

/// Flat spec data structure for database storage
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecDataFlat {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub class_id: i32,
    pub class_name: String,
    pub role: i32,
    pub order_index: i32,
    pub icon_file_id: i32,
    pub file_name: String,
    pub primary_stat_priority: i32,
    pub mastery_spell_id_0: i32,
    pub mastery_spell_id_1: i32,
}

impl Default for SpecDataFlat {
    fn default() -> Self {
        Self {
            id: 0,
            name: String::new(),
            description: String::new(),
            class_id: 0,
            class_name: String::new(),
            role: 0,
            order_index: 0,
            icon_file_id: 0,
            file_name: "inv_misc_questionmark".to_string(),
            primary_stat_priority: 0,
            mastery_spell_id_0: 0,
            mastery_spell_id_1: 0,
        }
    }
}
