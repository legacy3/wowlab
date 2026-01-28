use super::constants::*;
use crate::spec::{SpellBuilder, SpellDef, SpellTarget};
use wowlab_common::types::{DamageSchool, ResourceType};

/// Get all MM Hunter spell definitions
pub fn spell_definitions() -> Vec<SpellDef> {
    vec![
        aimed_shot(),
        rapid_fire(),
        steady_shot(),
        arcane_shot(),
        kill_shot(),
        trueshot(),
        multi_shot(),
    ]
}

fn aimed_shot() -> SpellDef {
    SpellBuilder::new(AIMED_SHOT, "Aimed Shot")
        .school(DamageSchool::Physical)
        .cast_time(AIMED_SHOT_CAST_TIME)
        .cooldown(AIMED_SHOT_COOLDOWN)
        .cost(ResourceType::Focus, AIMED_SHOT_COST)
        .physical_damage(AIMED_SHOT_AP_COEF)
        .apply_aura(PRECISE_SHOTS)
        .build()
}

fn rapid_fire() -> SpellDef {
    SpellBuilder::new(RAPID_FIRE, "Rapid Fire")
        .school(DamageSchool::Physical)
        .channel(RAPID_FIRE_DURATION, RAPID_FIRE_TICKS)
        .cooldown(RAPID_FIRE_COOLDOWN)
        .physical_damage(RAPID_FIRE_AP_COEF) // Per tick
        .build()
}

fn steady_shot() -> SpellDef {
    SpellBuilder::new(STEADY_SHOT, "Steady Shot")
        .school(DamageSchool::Physical)
        .cast_time(STEADY_SHOT_CAST_TIME)
        .gain(ResourceType::Focus, STEADY_SHOT_FOCUS_GAIN)
        .physical_damage(STEADY_SHOT_AP_COEF)
        .build()
}

fn arcane_shot() -> SpellDef {
    SpellBuilder::new(ARCANE_SHOT, "Arcane Shot")
        .school(DamageSchool::Arcane)
        .instant()
        .cost(ResourceType::Focus, ARCANE_SHOT_COST)
        .spell_damage(DamageSchool::Arcane, ARCANE_SHOT_AP_COEF)
        .build()
}

fn kill_shot() -> SpellDef {
    SpellBuilder::new(KILL_SHOT, "Kill Shot")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(10.0)
        .cost(ResourceType::Focus, 10.0)
        .physical_damage(4.0)
        // Note: Only usable when target < 20% health (checked in handler)
        .build()
}

fn trueshot() -> SpellDef {
    SpellBuilder::new(TRUESHOT, "Trueshot")
        .instant()
        .no_gcd()
        .cooldown(TRUESHOT_COOLDOWN)
        .apply_aura(TRUESHOT_BUFF)
        .build()
}

fn multi_shot() -> SpellDef {
    SpellBuilder::new(MULTI_SHOT, "Multi-Shot")
        .school(DamageSchool::Physical)
        .instant()
        .cost(ResourceType::Focus, MULTI_SHOT_COST)
        .target(SpellTarget::AllEnemies)
        .physical_damage(MULTI_SHOT_AP_COEF)
        .apply_aura(TRICK_SHOTS)
        .build()
}
