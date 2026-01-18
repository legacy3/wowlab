//! Spell transformation - converts raw DBC data into SpellDataFlat

use crate::dbc::DbcData;
use crate::errors::TransformError;
use crate::flat::{EmpowerStage, KnowledgeSource, LearnSpell, SpellDataFlat};

/// Knowledge context for determining how a spell was learned
pub struct SpellKnowledgeContext {
    pub class_id: Option<i32>,
    pub class_spell_ids: Option<std::collections::HashSet<i32>>,
    pub spec_id: Option<i32>,
    pub talent_spell_id_to_trait_definition_id: Option<std::collections::HashMap<i32, i32>>,
}

/// Transform a spell ID into flat spell data
pub fn transform_spell(
    dbc: &DbcData,
    spell_id: i32,
    context: Option<&SpellKnowledgeContext>,
) -> Result<SpellDataFlat, TransformError> {
    // Check spell exists
    let name_row = dbc
        .spell_name
        .get(&spell_id)
        .ok_or(TransformError::SpellNotFound { spell_id })?;

    let spell_row = dbc.spell.get(&spell_id);
    let misc = dbc.spell_misc.get(&spell_id);
    let effects = dbc
        .spell_effect
        .get(&spell_id)
        .map(|v| v.as_slice())
        .unwrap_or(&[]);
    let categories = dbc.spell_categories.get(&spell_id);

    // Extract attributes
    let attributes: Vec<i32> = misc
        .map(|m| {
            vec![
                m.Attributes_0,
                m.Attributes_1,
                m.Attributes_2,
                m.Attributes_3,
                m.Attributes_4,
                m.Attributes_5,
                m.Attributes_6,
                m.Attributes_7,
                m.Attributes_8,
                m.Attributes_9,
                m.Attributes_10,
                m.Attributes_11,
                m.Attributes_12,
                m.Attributes_13,
                m.Attributes_14,
                m.Attributes_15,
            ]
        })
        .unwrap_or_default();

    // Extract range
    let (range_min_0, range_min_1, range_max_0, range_max_1) = misc
        .and_then(|m| dbc.spell_range.get(&m.RangeIndex))
        .map(|r| (r.RangeMin_0, r.RangeMin_1, r.RangeMax_0, r.RangeMax_1))
        .unwrap_or((0.0, 0.0, 0.0, 0.0));

    // Extract radius from effects
    let (radius_min, radius_max) = effects
        .iter()
        .find_map(|e| {
            let idx = if e.EffectRadiusIndex_0 > 0 {
                e.EffectRadiusIndex_0
            } else if e.EffectRadiusIndex_1 > 0 {
                e.EffectRadiusIndex_1
            } else {
                return None;
            };
            dbc.spell_radius
                .get(&idx)
                .map(|r| (r.RadiusMin, r.RadiusMax))
        })
        .unwrap_or((0.0, 0.0));

    // Extract cooldown
    let cooldown = dbc.spell_cooldowns.get(&spell_id);
    let recovery_time = cooldown.map(|c| c.RecoveryTime).unwrap_or(0);
    let start_recovery_time = cooldown.map(|c| c.StartRecoveryTime).unwrap_or(1500);

    // Extract cast time
    let cast_time = misc
        .and_then(|m| dbc.spell_cast_times.get(&m.CastingTimeIndex))
        .map(|ct| ct.Base)
        .unwrap_or(0);

    // Extract duration
    let (duration, max_duration) = misc
        .and_then(|m| dbc.spell_duration.get(&m.DurationIndex))
        .map(|d| (d.Duration, d.MaxDuration))
        .unwrap_or((0, 0));

    // Extract charges
    let (max_charges, charge_recovery_time) = categories
        .filter(|c| c.ChargeCategory > 0)
        .and_then(|c| dbc.spell_category.get(&c.ChargeCategory))
        .map(|cat| (cat.MaxCharges, cat.ChargeRecoveryTime))
        .unwrap_or((0, 0));

    // Extract power
    let power = dbc
        .spell_power
        .get(&spell_id)
        .and_then(|powers| powers.first());
    let power_type = power.map(|p| p.PowerType).unwrap_or(-1);
    let power_cost = power.map(|p| p.ManaCost).unwrap_or(0);
    let power_cost_pct = power.map(|p| p.PowerCostPct).unwrap_or(0.0);

    // Extract mana cost from drain effect
    let mana_cost = effects
        .iter()
        .find(|e| e.Effect == 8 && e.EffectMiscValue_0 == 0) // PowerDrain + Mana
        .map(|e| e.EffectBasePointsF.abs() as i32)
        .unwrap_or(0);

    // Extract class options
    let class_options = dbc.spell_class_options.get(&spell_id);
    let spell_class_set = class_options.map(|c| c.SpellClassSet).unwrap_or(0);
    let spell_class_mask_1 = class_options.map(|c| c.SpellClassMask_0).unwrap_or(0);
    let spell_class_mask_2 = class_options.map(|c| c.SpellClassMask_1).unwrap_or(0);
    let spell_class_mask_3 = class_options.map(|c| c.SpellClassMask_2).unwrap_or(0);
    let spell_class_mask_4 = class_options.map(|c| c.SpellClassMask_3).unwrap_or(0);

    // Extract target restrictions
    let target_restrictions = dbc.spell_target_restrictions.get(&spell_id);
    let cone_degrees = target_restrictions.map(|t| t.ConeDegrees).unwrap_or(0.0);

    // Extract aura restrictions
    let aura = dbc.spell_aura_restrictions.get(&spell_id);
    let caster_aura_spell = aura.map(|a| a.CasterAuraSpell).unwrap_or(0);
    let caster_aura_state = aura.map(|a| a.CasterAuraState).unwrap_or(0);
    let exclude_caster_aura_spell = aura.map(|a| a.ExcludeCasterAuraSpell).unwrap_or(0);
    let exclude_caster_aura_state = aura.map(|a| a.ExcludeCasterAuraState).unwrap_or(0);
    let exclude_target_aura_spell = aura.map(|a| a.ExcludeTargetAuraSpell).unwrap_or(0);
    let exclude_target_aura_state = aura.map(|a| a.ExcludeTargetAuraState).unwrap_or(0);
    let target_aura_spell = aura.map(|a| a.TargetAuraSpell).unwrap_or(0);
    let target_aura_state = aura.map(|a| a.TargetAuraState).unwrap_or(0);

    // Extract levels
    let levels = dbc
        .spell_levels
        .get(&spell_id)
        .and_then(|lvls| lvls.first());
    let base_level = levels.map(|l| l.BaseLevel).unwrap_or(0);
    let max_level = levels.map(|l| l.MaxLevel).unwrap_or(0);
    let spell_level = levels.map(|l| l.SpellLevel).unwrap_or(0);
    let max_passive_aura_level = levels.map(|l| l.MaxPassiveAuraLevel).unwrap_or(0);

    // Extract learn spells
    let learn_spells: Vec<LearnSpell> = dbc
        .spell_learn_spell
        .get(&spell_id)
        .map(|v| {
            v.iter()
                .map(|ls| LearnSpell {
                    learn_spell_id: ls.LearnSpellID,
                    overrides_spell_id: ls.OverridesSpellID,
                })
                .collect()
        })
        .unwrap_or_default();

    // Extract replacement
    let replacement_spell_id = dbc
        .spell_replacement
        .get(&spell_id)
        .map(|r| r.ReplacementSpellID)
        .unwrap_or(0);

    // Extract shapeshift
    let shapeshift = dbc.spell_shapeshift.get(&spell_id);
    let shapeshift_exclude_0 = shapeshift.map(|s| s.ShapeshiftExclude_0).unwrap_or(0);
    let shapeshift_exclude_1 = shapeshift.map(|s| s.ShapeshiftExclude_1).unwrap_or(0);
    let shapeshift_mask_0 = shapeshift.map(|s| s.ShapeshiftMask_0).unwrap_or(0);
    let shapeshift_mask_1 = shapeshift.map(|s| s.ShapeshiftMask_1).unwrap_or(0);
    let stance_bar_order = shapeshift.map(|s| s.StanceBarOrder).unwrap_or(0);

    // Extract totems
    let totems = dbc.spell_totems.get(&spell_id).and_then(|t| t.first());
    let totem_0 = totems.map(|t| t.Totem_0).unwrap_or(0);
    let totem_1 = totems.map(|t| t.Totem_1).unwrap_or(0);
    let required_totem_category_0 = totems.map(|t| t.RequiredTotemCategoryID_0).unwrap_or(0);
    let required_totem_category_1 = totems.map(|t| t.RequiredTotemCategoryID_1).unwrap_or(0);

    // Extract empower stages
    let (can_empower, empower_stages) = dbc
        .spell_empower
        .get(&spell_id)
        .map(|empower| {
            let stages: Vec<EmpowerStage> = dbc
                .spell_empower_stage
                .get(&empower.ID)
                .map(|stages| {
                    let mut sorted: Vec<_> = stages
                        .iter()
                        .map(|s| EmpowerStage {
                            stage: s.Stage,
                            duration_ms: s.DurationMs,
                        })
                        .collect();
                    sorted.sort_by_key(|s| s.stage);
                    sorted
                })
                .unwrap_or_default();
            (true, stages)
        })
        .unwrap_or((false, Vec::new()));

    // Extract scaling coefficients
    let (effect_bonus_coefficient, bonus_coefficient_from_ap) = effects
        .iter()
        .find(|e| e.Effect == 2 || e.Effect == 10) // SchoolDamage or Heal
        .map(|e| (e.EffectBonusCoefficient, e.BonusCoefficientFromAP))
        .unwrap_or((0.0, 0.0));

    // Extract triggers and implicit targets
    let effect_trigger_spell: Vec<i32> = effects
        .iter()
        .map(|e| e.EffectTriggerSpell)
        .filter(|&t| t != 0)
        .collect();

    let implicit_target: Vec<i32> = effects
        .iter()
        .flat_map(|e| [e.ImplicitTarget_0, e.ImplicitTarget_1])
        .filter(|&t| t != 0)
        .collect();

    // Extract interrupts
    let interrupts = dbc.spell_interrupts.get(&spell_id);
    let interrupt_flags = interrupts.map(|i| i.InterruptFlags).unwrap_or(0);
    let interrupt_aura_0 = interrupts.map(|i| i.AuraInterruptFlags_0).unwrap_or(0);
    let interrupt_aura_1 = interrupts.map(|i| i.AuraInterruptFlags_1).unwrap_or(0);
    let interrupt_channel_0 = interrupts.map(|i| i.ChannelInterruptFlags_0).unwrap_or(0);
    let interrupt_channel_1 = interrupts.map(|i| i.ChannelInterruptFlags_1).unwrap_or(0);

    // Extract description variables
    let description_variables = dbc
        .spell_x_description_variables
        .get(&spell_id)
        .and_then(|xvars| xvars.first())
        .and_then(|xvar| {
            dbc.spell_description_variables
                .get(&xvar.SpellDescriptionVariablesID)
        })
        .map(|dv| dv.Variables.clone())
        .unwrap_or_default();

    // Resolve icon file name
    let icon_file_data_id = misc.map(|m| m.SpellIconFileDataID).unwrap_or(0);
    let file_name = if icon_file_data_id > 0 {
        dbc.manifest_interface_data
            .get(&icon_file_data_id)
            .map(|m| m.FileName.to_lowercase().replace(".blp", ""))
            .unwrap_or_else(|| "inv_misc_questionmark".to_string())
    } else {
        "inv_misc_questionmark".to_string()
    };

    // Determine if passive
    let is_passive = cast_time == 0 && !effects.is_empty() && effects.iter().all(|e| e.Effect == 6);

    // Determine knowledge source
    let knowledge_source = context
        .map(|ctx| {
            // Check talent source
            if let Some(ref talent_map) = ctx.talent_spell_id_to_trait_definition_id {
                if let Some(&trait_def_id) = talent_map.get(&spell_id) {
                    return KnowledgeSource::Talent {
                        trait_definition_id: trait_def_id,
                    };
                }
            }
            // Check class source
            if let (Some(class_id), Some(ref class_spells)) = (ctx.class_id, &ctx.class_spell_ids) {
                if class_spells.contains(&spell_id) {
                    return KnowledgeSource::Class { class_id };
                }
            }
            // Check spec source
            if let Some(spec_id) = ctx.spec_id {
                return KnowledgeSource::Spec { spec_id };
            }
            KnowledgeSource::Unknown
        })
        .unwrap_or(KnowledgeSource::Unknown);

    Ok(SpellDataFlat {
        id: spell_id,
        name: name_row.Name_lang.clone().unwrap_or_default(),
        description: spell_row
            .and_then(|s| s.Description_lang.clone())
            .unwrap_or_default(),
        aura_description: spell_row
            .and_then(|s| s.AuraDescription_lang.clone())
            .unwrap_or_default(),
        description_variables,
        file_name,
        is_passive,
        knowledge_source,
        cast_time,
        recovery_time,
        start_recovery_time,
        mana_cost,
        power_cost,
        power_cost_pct,
        power_type,
        charge_recovery_time,
        max_charges,
        range_max_0,
        range_max_1,
        range_min_0,
        range_min_1,
        cone_degrees,
        radius_max,
        radius_min,
        defense_type: categories.map(|c| c.DefenseType).unwrap_or(0),
        school_mask: misc.map(|m| m.SchoolMask).unwrap_or(0),
        bonus_coefficient_from_ap,
        effect_bonus_coefficient,
        interrupt_aura_0,
        interrupt_aura_1,
        interrupt_channel_0,
        interrupt_channel_1,
        interrupt_flags,
        duration,
        max_duration,
        can_empower,
        empower_stages,
        dispel_type: categories.map(|c| c.DispelType).unwrap_or(0),
        facing_caster_flags: 0,
        speed: misc.map(|m| m.Speed).unwrap_or(0.0),
        spell_class_mask_1,
        spell_class_mask_2,
        spell_class_mask_3,
        spell_class_mask_4,
        spell_class_set,
        base_level,
        max_level,
        max_passive_aura_level,
        spell_level,
        caster_aura_spell,
        caster_aura_state,
        exclude_caster_aura_spell,
        exclude_caster_aura_state,
        exclude_target_aura_spell,
        exclude_target_aura_state,
        target_aura_spell,
        target_aura_state,
        replacement_spell_id,
        shapeshift_exclude_0,
        shapeshift_exclude_1,
        shapeshift_mask_0,
        shapeshift_mask_1,
        stance_bar_order,
        required_totem_category_0,
        required_totem_category_1,
        totem_0,
        totem_1,
        attributes,
        effect_trigger_spell,
        implicit_target,
        learn_spells,
    })
}
