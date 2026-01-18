//! Flat types for global DBC tables (classes, colors, strings)

use serde::{Deserialize, Serialize};

/// Flat class data structure for database storage
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassDataFlat {
    pub id: i32,
    pub name: String,
    pub filename: String,
    pub icon_file_id: i32,
    pub file_name: String, // Resolved icon filename from manifest_interface_data
    pub color: String,     // Hex color string e.g., "#C41E3A"
    pub spell_class_set: i32,
    pub primary_stat_priority: i32,
    pub roles_mask: i32,
}

impl Default for ClassDataFlat {
    fn default() -> Self {
        Self {
            id: 0,
            name: String::new(),
            filename: String::new(),
            icon_file_id: 0,
            file_name: "inv_misc_questionmark".to_string(),
            color: "#FFFFFF".to_string(),
            spell_class_set: 0,
            primary_stat_priority: 0,
            roles_mask: 0,
        }
    }
}

/// Flat global color structure for database storage
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalColorFlat {
    pub id: i32,
    pub name: String,
    pub color: String, // Hex color string e.g., "#FFFFFF"
}

impl Default for GlobalColorFlat {
    fn default() -> Self {
        Self {
            id: 0,
            name: String::new(),
            color: "#FFFFFF".to_string(),
        }
    }
}

/// Flat global string structure for database storage
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalStringFlat {
    pub id: i32,
    pub tag: String,
    pub value: String,
    pub flags: i32,
}

// =============================================================================
// Color Conversion Helpers
// =============================================================================

/// Convert RGB components (0-255) to hex color string
pub fn rgb_to_hex(r: i32, g: i32, b: i32) -> String {
    format!(
        "#{:02X}{:02X}{:02X}",
        r.clamp(0, 255),
        g.clamp(0, 255),
        b.clamp(0, 255)
    )
}

/// Convert signed ARGB integer to hex color string (strips alpha)
pub fn argb_to_hex(color: i32) -> String {
    // Color is stored as signed 32-bit ARGB
    // Convert to unsigned, extract RGB components
    let unsigned = color as u32;
    let r = (unsigned >> 16) & 0xFF;
    let g = (unsigned >> 8) & 0xFF;
    let b = unsigned & 0xFF;
    format!("#{:02X}{:02X}{:02X}", r, g, b)
}
