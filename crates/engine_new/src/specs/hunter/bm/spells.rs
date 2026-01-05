use crate::spec::{SpellBuilder, SpellDef, SpellTarget};
use crate::types::{ResourceType, DamageSchool};
use super::constants::*;

/// Get all BM Hunter spell definitions
pub fn spell_definitions() -> Vec<SpellDef> {
    vec![
        kill_command(),
        cobra_shot(),
        barbed_shot(),
        bestial_wrath(),
        multi_shot(),
        kill_shot(),
    ]
}

fn kill_command() -> SpellDef {
    SpellBuilder::new(KILL_COMMAND, "Kill Command")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(7.5)
        .cost(ResourceType::Focus, KILL_COMMAND_COST)
        .physical_damage(2.0) // AP coefficient
        .pet_ability()
        .build()
}

fn cobra_shot() -> SpellDef {
    SpellBuilder::new(COBRA_SHOT, "Cobra Shot")
        .school(DamageSchool::Nature)
        .instant()
        .cost(ResourceType::Focus, COBRA_SHOT_COST)
        .spell_damage(DamageSchool::Nature, 0.4)
        .build()
}

fn barbed_shot() -> SpellDef {
    SpellBuilder::new(BARBED_SHOT, "Barbed Shot")
        .school(DamageSchool::Physical)
        .instant()
        .charges(BARBED_SHOT_CHARGES, BARBED_SHOT_RECHARGE)
        .gain(ResourceType::Focus, 5.0) // Focus regen from Frenzy
        .physical_damage(0.3)
        .apply_aura(BARBED_SHOT_DOT)
        .apply_aura(FRENZY)
        .build()
}

fn bestial_wrath() -> SpellDef {
    SpellBuilder::new(BESTIAL_WRATH, "Bestial Wrath")
        .instant()
        .no_gcd()
        .cooldown(BESTIAL_WRATH_COOLDOWN)
        .apply_aura(BESTIAL_WRATH_BUFF)
        .build()
}

fn multi_shot() -> SpellDef {
    SpellBuilder::new(MULTI_SHOT, "Multi-Shot")
        .school(DamageSchool::Physical)
        .instant()
        .cost(ResourceType::Focus, 40.0)
        .target(SpellTarget::AllEnemies)
        .physical_damage(0.5)
        .apply_aura(BEAST_CLEAVE)
        .build()
}

fn kill_shot() -> SpellDef {
    SpellBuilder::new(KILL_SHOT, "Kill Shot")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(10.0)
        .cost(ResourceType::Focus, 10.0)
        .physical_damage(4.0)
        // Note: Only usable when target < 20% health
        // This would be checked in the handler
        .build()
}
