//! Transform functions for global DBC tables

use crate::dbc::DbcData;
use crate::errors::TransformError;
use crate::flat::{argb_to_hex, rgb_to_hex, ClassDataFlat, GlobalColorFlat, GlobalStringFlat};

/// Resolve icon file ID to file name via manifest_interface_data
fn resolve_icon_file_name(dbc: &DbcData, icon_file_id: i32) -> String {
    if icon_file_id > 0 {
        dbc.manifest_interface_data
            .get(&icon_file_id)
            .map(|m| m.FileName.to_lowercase().replace(".blp", ""))
            .unwrap_or_else(|| "inv_misc_questionmark".to_string())
    } else {
        "inv_misc_questionmark".to_string()
    }
}

/// Transform a single class by ID
pub fn transform_class(dbc: &DbcData, class_id: i32) -> Result<ClassDataFlat, TransformError> {
    let class = dbc
        .chr_classes
        .get(&class_id)
        .ok_or(TransformError::ClassNotFound { class_id })?;

    // Convert RGB components to hex color
    let color = rgb_to_hex(
        class.ClassColorR.unwrap_or(255),
        class.ClassColorG.unwrap_or(255),
        class.ClassColorB.unwrap_or(255),
    );

    // Resolve icon file name
    let file_name = resolve_icon_file_name(dbc, class.IconFileDataID);

    Ok(ClassDataFlat {
        id: class.ID,
        name: class.Name_lang.clone().unwrap_or_default(),
        filename: class.Filename.clone().unwrap_or_default(),
        icon_file_id: class.IconFileDataID,
        file_name,
        color,
        spell_class_set: class.SpellClassSet,
        primary_stat_priority: class.PrimaryStatPriority,
        roles_mask: class.RolesMask,
    })
}

/// Transform all classes in the database
pub fn transform_all_classes(dbc: &DbcData) -> Vec<ClassDataFlat> {
    dbc.chr_classes
        .keys()
        .filter_map(|&class_id| {
            transform_class(dbc, class_id)
                .inspect_err(|e| tracing::warn!(class_id, error = %e, "Failed to transform class"))
                .ok()
        })
        .collect()
}

/// Transform a single global color by ID
pub fn transform_global_color(
    dbc: &DbcData,
    color_id: i32,
) -> Result<GlobalColorFlat, TransformError> {
    let row = dbc
        .global_color
        .get(&color_id)
        .ok_or(TransformError::GlobalColorNotFound { color_id })?;

    Ok(GlobalColorFlat {
        id: row.ID,
        name: row.LuaConstantName.clone(),
        color: argb_to_hex(row.Color),
    })
}

/// Transform all global colors in the database
pub fn transform_all_global_colors(dbc: &DbcData) -> Vec<GlobalColorFlat> {
    dbc.global_color
        .keys()
        .filter_map(|&color_id| {
            transform_global_color(dbc, color_id)
                .inspect_err(
                    |e| tracing::warn!(color_id, error = %e, "Failed to transform global color"),
                )
                .ok()
        })
        .collect()
}

/// Transform a single global string by ID
pub fn transform_global_string(
    dbc: &DbcData,
    string_id: i32,
) -> Result<GlobalStringFlat, TransformError> {
    let row = dbc
        .global_strings
        .get(&string_id)
        .ok_or(TransformError::GlobalStringNotFound { string_id })?;

    Ok(GlobalStringFlat {
        id: row.ID,
        tag: row.BaseTag.clone(),
        value: row.TagText_lang.clone().unwrap_or_default(),
        flags: row.Flags,
    })
}

/// Transform all global strings in the database
pub fn transform_all_global_strings(dbc: &DbcData) -> Vec<GlobalStringFlat> {
    dbc.global_strings
        .keys()
        .filter_map(|&string_id| {
            transform_global_string(dbc, string_id)
                .inspect_err(
                    |e| tracing::warn!(string_id, error = %e, "Failed to transform global string"),
                )
                .ok()
        })
        .collect()
}
