//! Aura transformation - converts raw DBC data into AuraDataFlat

use crate::dbc::DbcData;
use crate::errors::TransformError;
use crate::flat::{AuraDataFlat, PeriodicType, RefreshBehavior};

/// Attribute flag bits for aura behavior
const ATTR_DURATION_HASTED: i32 = 0x00400000; // Attribute_8 bit 22
const ATTR_HASTED_TICKS: i32 = 0x00100000; // Attribute_5 bit 20
const ATTR_TICK_MAY_CRIT: i32 = 0x00040000; // Attribute_5 bit 18
const ATTR_TICK_ON_APPLICATION: i32 = 0x00200000; // Attribute_5 bit 21
const ATTR_PANDEMIC_REFRESH: i32 = 0x00000200; // Attribute_11 bit 9
const ATTR_ROLLING_PERIODIC: i32 = 0x00000400; // Attribute_11 bit 10

/// Spell effect types
const EFFECT_APPLY_AURA: i32 = 6;

/// Aura types for periodic effects
const AURA_PERIODIC_DAMAGE: i32 = 3;
const AURA_PERIODIC_HEAL: i32 = 8;
const AURA_PERIODIC_LEECH: i32 = 9;
const AURA_PERIODIC_ENERGIZE: i32 = 21;
const AURA_PERIODIC_TRIGGER_SPELL: i32 = 23;

/// Extracted aura flags from spell attributes
struct AuraFlags {
    duration_hasted: bool,
    hasted_ticks: bool,
    tick_may_crit: bool,
    tick_on_application: bool,
    pandemic_refresh: bool,
    rolling_periodic: bool,
}

/// Extracted periodic info from spell effects
struct PeriodicInfo {
    periodic_type: Option<PeriodicType>,
    tick_period_ms: i32,
}

fn extract_aura_flags(attributes: &[i32]) -> AuraFlags {
    let get = |idx: usize| attributes.get(idx).copied().unwrap_or(0);

    AuraFlags {
        duration_hasted: (get(8) & ATTR_DURATION_HASTED) != 0,
        hasted_ticks: (get(5) & ATTR_HASTED_TICKS) != 0,
        tick_may_crit: (get(5) & ATTR_TICK_MAY_CRIT) != 0,
        tick_on_application: (get(5) & ATTR_TICK_ON_APPLICATION) != 0,
        pandemic_refresh: (get(11) & ATTR_PANDEMIC_REFRESH) != 0,
        rolling_periodic: (get(11) & ATTR_ROLLING_PERIODIC) != 0,
    }
}

fn extract_periodic_info(dbc: &DbcData, spell_id: i32) -> PeriodicInfo {
    let effects = dbc
        .spell_effect
        .get(&spell_id)
        .map(|v| v.as_slice())
        .unwrap_or(&[]);

    // Find the first periodic aura effect
    for effect in effects {
        if effect.Effect != EFFECT_APPLY_AURA {
            continue;
        }

        let periodic_type = match effect.EffectAura {
            AURA_PERIODIC_DAMAGE => Some(PeriodicType::Damage),
            AURA_PERIODIC_HEAL => Some(PeriodicType::Heal),
            AURA_PERIODIC_LEECH => Some(PeriodicType::Leech),
            AURA_PERIODIC_ENERGIZE => Some(PeriodicType::Energize),
            AURA_PERIODIC_TRIGGER_SPELL => Some(PeriodicType::TriggerSpell),
            _ => None,
        };

        if periodic_type.is_some() {
            return PeriodicInfo {
                periodic_type,
                tick_period_ms: effect.EffectAuraPeriod,
            };
        }
    }

    PeriodicInfo {
        periodic_type: None,
        tick_period_ms: 0,
    }
}

fn determine_refresh_behavior(pandemic_refresh: bool, tick_period_ms: i32) -> RefreshBehavior {
    if pandemic_refresh || tick_period_ms > 0 {
        RefreshBehavior::Pandemic
    } else {
        RefreshBehavior::Duration
    }
}

/// Transform a spell ID into flat aura data
pub fn transform_aura(dbc: &DbcData, spell_id: i32) -> Result<AuraDataFlat, TransformError> {
    // Check spell exists
    let _name_row = dbc
        .spell_name
        .get(&spell_id)
        .ok_or(TransformError::SpellNotFound { spell_id })?;

    let misc = dbc.spell_misc.get(&spell_id);
    let aura_options = dbc.spell_aura_options.get(&spell_id);

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

    // Extract duration
    let (base_duration_ms, max_duration_ms) = misc
        .and_then(|m| dbc.spell_duration.get(&m.DurationIndex))
        .map(|d| (d.Duration, d.MaxDuration))
        .unwrap_or((0, 0));

    // Extract max stacks
    let max_stacks = aura_options.map(|ao| ao.CumulativeAura).unwrap_or(1).max(1);

    // Extract periodic info
    let periodic_info = extract_periodic_info(dbc, spell_id);

    // Extract aura flags
    let aura_flags = extract_aura_flags(&attributes);

    // Determine refresh behavior
    let refresh_behavior =
        determine_refresh_behavior(aura_flags.pandemic_refresh, periodic_info.tick_period_ms);

    Ok(AuraDataFlat {
        spell_id,
        base_duration_ms,
        max_duration_ms,
        max_stacks,
        periodic_type: periodic_info.periodic_type,
        tick_period_ms: periodic_info.tick_period_ms,
        refresh_behavior,
        duration_hasted: aura_flags.duration_hasted,
        hasted_ticks: aura_flags.hasted_ticks,
        pandemic_refresh: aura_flags.pandemic_refresh,
        rolling_periodic: aura_flags.rolling_periodic,
        tick_may_crit: aura_flags.tick_may_crit,
        tick_on_application: aura_flags.tick_on_application,
    })
}

/// Transform all spells that have aura effects
pub fn transform_all_auras(dbc: &DbcData) -> Vec<AuraDataFlat> {
    // Only transform spells that have aura options or periodic effects
    dbc.spell_name
        .keys()
        .filter(|&&spell_id| {
            // Check if spell has aura options or periodic effects
            let has_aura_options = dbc.spell_aura_options.contains_key(&spell_id);
            let has_periodic = dbc
                .spell_effect
                .get(&spell_id)
                .map(|effects| {
                    effects.iter().any(|e| {
                        e.Effect == EFFECT_APPLY_AURA
                            && matches!(
                                e.EffectAura,
                                AURA_PERIODIC_DAMAGE
                                    | AURA_PERIODIC_HEAL
                                    | AURA_PERIODIC_LEECH
                                    | AURA_PERIODIC_ENERGIZE
                                    | AURA_PERIODIC_TRIGGER_SPELL
                            )
                    })
                })
                .unwrap_or(false);
            has_aura_options || has_periodic
        })
        .filter_map(|&spell_id| transform_aura(dbc, spell_id).ok())
        .collect()
}
