//! Spec transformation functions

use crate::dbc::DbcData;
use crate::errors::TransformError;
use crate::flat::SpecDataFlat;

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

/// Transform a single spec by ID
pub fn transform_spec(dbc: &DbcData, spec_id: i32) -> Result<SpecDataFlat, TransformError> {
    let spec = dbc
        .chr_specialization
        .get(&spec_id)
        .ok_or(TransformError::SpecNotFound { spec_id })?;

    // Get class name from chr_classes
    let class_name = spec
        .ClassID
        .and_then(|class_id| dbc.chr_classes.get(&class_id))
        .and_then(|c| c.Name_lang.clone())
        .unwrap_or_default();

    // Resolve icon file name
    let file_name = resolve_icon_file_name(dbc, spec.SpellIconFileID);

    Ok(SpecDataFlat {
        id: spec.ID,
        name: spec.Name_lang.clone().unwrap_or_default(),
        description: spec.Description_lang.clone().unwrap_or_default(),
        class_id: spec.ClassID.unwrap_or(0),
        class_name,
        role: spec.Role,
        order_index: spec.OrderIndex.unwrap_or(0),
        icon_file_id: spec.SpellIconFileID,
        file_name,
        primary_stat_priority: spec.PrimaryStatPriority,
        mastery_spell_id_0: spec.MasterySpellID_0,
        mastery_spell_id_1: spec.MasterySpellID_1,
    })
}

/// Transform all specs in the database
pub fn transform_all_specs(dbc: &DbcData) -> Vec<SpecDataFlat> {
    dbc.chr_specialization
        .keys()
        .filter_map(|&spec_id| {
            transform_spec(dbc, spec_id)
                .inspect_err(|e| tracing::warn!(spec_id, error = %e, "Failed to transform spec"))
                .ok()
        })
        .collect()
}
