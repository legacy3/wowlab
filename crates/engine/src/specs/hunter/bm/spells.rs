//! BM Hunter spell definitions with declarative effects.
//!
//! Each spell defines its behavior inline - costs, damage, and effects.

use crate::spec::{SpellBuilder, SpellDef, SpellTarget, SpellEffect, EffectCondition};
use crate::types::{ResourceType, DamageSchool, PetKind};
use super::constants::*;

/// Get all BM Hunter spell definitions.
pub fn spell_definitions() -> Vec<SpellDef> {
    vec![
        // Core abilities
        kill_command(),
        cobra_shot(),
        barbed_shot(),
        bestial_wrath(),
        multi_shot(),
        kill_shot(),
        // Major cooldowns
        call_of_the_wild(),
        bloodshed(),
        dire_beast(),
        murder_of_crows(),
        // Talent spells
        explosive_shot(),
        // Pet abilities
        pet_stomp(),
        pet_basic_attack(),
        kill_cleave(),
        dire_beast_attack(),
        // Hero talent spells - Pack Leader
        howl_of_the_pack_leader(),
        boar_charge(),
        // Hero talent spells - Dark Ranger
        black_arrow(),
        // Hero talent spells - Sentinel
        sentinel_tick(),
        lunar_storm_initial(),
        lunar_storm_periodic(),
        symphonic_arsenal_damage(),
        // Tier set spells
        harmonize_barbed_shot(),
        stampede_damage(),
    ]
}

// ============================================================================
// Core Abilities
// ============================================================================

fn kill_command() -> SpellDef {
    SpellBuilder::new(KILL_COMMAND, "Kill Command")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(7.5)
        .cost(ResourceType::Focus, KILL_COMMAND_COST)
        .physical_damage(2.0)
        .pet_ability()
        // Animal Companion: Pet mirrors the cast at 65% damage
        .with_talent("animal_companion", SpellEffect::PetMirrorCast { damage_pct: 0.65 })
        // Kill Cleave: Cleave during Beast Cleave
        .on_cast_if(
            EffectCondition::And(vec![
                EffectCondition::TalentEnabled("kill_cleave".to_string()),
                EffectCondition::BuffActive(BEAST_CLEAVE),
            ]),
            SpellEffect::Cleave { damage_pct: KILL_CLEAVE_DAMAGE, max_targets: 5 },
        )
        // Wild Instincts: Apply debuff during Call of the Wild
        .on_cast_if(
            EffectCondition::And(vec![
                EffectCondition::TalentEnabled("wild_instincts".to_string()),
                EffectCondition::BuffActive(CALL_OF_THE_WILD_BUFF),
            ]),
            SpellEffect::ApplyDebuff { aura: WILD_INSTINCTS, stacks: 1 },
        )
        .build()
}

fn cobra_shot() -> SpellDef {
    SpellBuilder::new(COBRA_SHOT, "Cobra Shot")
        .school(DamageSchool::Nature)
        .instant()
        .cost(ResourceType::Focus, COBRA_SHOT_COST)
        .spell_damage(DamageSchool::Nature, 0.4)
        // Cobra Shot reduces Kill Command cooldown
        .reduces_cooldown(KILL_COMMAND, COBRA_SHOT_CDR)
        // Serpentine Rhythm: Build stacks on cast (consumed for damage)
        .with_talent("serpentine_rhythm", SpellEffect::ApplyBuff { aura: SERPENTINE_RHYTHM, stacks: 1 })
        .build()
}

fn barbed_shot() -> SpellDef {
    SpellBuilder::new(BARBED_SHOT, "Barbed Shot")
        .school(DamageSchool::Physical)
        .instant()
        .charges(BARBED_SHOT_CHARGES, BARBED_SHOT_RECHARGE)
        .physical_damage(0.3)
        // Apply DoT to target
        .apply_aura(BARBED_SHOT_DOT)
        // Apply/refresh Frenzy on pet (buff on player in sim)
        .applies_buff(FRENZY)
        // Focus regeneration from Frenzy
        .gain(ResourceType::Focus, 5.0)
        .build()
}

fn bestial_wrath() -> SpellDef {
    SpellBuilder::new(BESTIAL_WRATH, "Bestial Wrath")
        .instant()
        .no_gcd()
        .cooldown(BESTIAL_WRATH_COOLDOWN)
        .apply_aura(BESTIAL_WRATH_BUFF)
        // Thundering Hooves: Cast Explosive Shot
        .with_talent("thundering_hooves", SpellEffect::TriggerSpell { spell: EXPLOSIVE_SHOT })
        // Piercing Fangs: Apply crit buff
        .with_talent("piercing_fangs", SpellEffect::ApplyBuff { aura: PIERCING_FANGS, stacks: 1 })
        .build()
}

fn multi_shot() -> SpellDef {
    SpellBuilder::new(MULTI_SHOT, "Multi-Shot")
        .school(DamageSchool::Physical)
        .instant()
        .cost(ResourceType::Focus, 40.0)
        .target(SpellTarget::AllEnemies)
        .physical_damage(0.5)
        // Applies Beast Cleave
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
        // Only usable when target < 20% health (checked in rotation)
        .build()
}

// ============================================================================
// Major Cooldowns
// ============================================================================

fn call_of_the_wild() -> SpellDef {
    SpellBuilder::new(CALL_OF_THE_WILD, "Call of the Wild")
        .instant()
        .no_gcd()
        .cooldown(CALL_OF_THE_WILD_COOLDOWN)
        .apply_aura(CALL_OF_THE_WILD_BUFF)
        // Bloody Frenzy: Beast Cleave active during CotW
        .with_talent("bloody_frenzy", SpellEffect::ApplyBuff { aura: BEAST_CLEAVE, stacks: 1 })
        .build()
}

fn bloodshed() -> SpellDef {
    SpellBuilder::new(BLOODSHED, "Bloodshed")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(BLOODSHED_COOLDOWN)
        .applies_debuff(BLOODSHED_DEBUFF)
        .pet_ability()
        .build()
}

fn dire_beast() -> SpellDef {
    SpellBuilder::new(DIRE_BEAST, "Dire Beast")
        .instant()
        .cooldown(DIRE_BEAST_COOLDOWN)
        // Summon a guardian pet
        .summons_pet(PetKind::Guardian, DIRE_BEAST_DURATION, "Dire Beast")
        // Dire Frenzy: Extend duration
        .with_talent("dire_frenzy", SpellEffect::ExtendAura {
            aura: FRENZY,
            amount: DIRE_FRENZY_EXTENSION,
        })
        .build()
}

fn murder_of_crows() -> SpellDef {
    SpellBuilder::new(MURDER_OF_CROWS, "A Murder of Crows")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(MURDER_OF_CROWS_COOLDOWN)
        .cost(ResourceType::Focus, 30.0)
        .applies_debuff(MURDER_OF_CROWS_DEBUFF)
        .build()
}

// ============================================================================
// Talent Spells
// ============================================================================

fn explosive_shot() -> SpellDef {
    SpellBuilder::new(EXPLOSIVE_SHOT, "Explosive Shot")
        .school(DamageSchool::Fire)
        .instant()
        .cooldown(30.0)
        .cost(ResourceType::Focus, 20.0)
        .target(SpellTarget::AllEnemies)
        .spell_damage(DamageSchool::Fire, 1.5)
        .build()
}

// ============================================================================
// Pet Abilities
// ============================================================================

fn pet_stomp() -> SpellDef {
    SpellBuilder::new(PET_STOMP, "Stomp")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(10.0)
        .target(SpellTarget::AllEnemies)
        .physical_damage(STOMP_AP_COEF)
        .pet_ability()
        .background()
        .build()
}

fn pet_basic_attack() -> SpellDef {
    SpellBuilder::new(PET_BASIC_ATTACK, "Claw")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(3.0)
        .physical_damage(0.333)
        .pet_ability()
        .background()
        .build()
}

fn kill_cleave() -> SpellDef {
    SpellBuilder::new(KILL_CLEAVE, "Kill Cleave")
        .school(DamageSchool::Physical)
        .instant()
        .target(SpellTarget::AllEnemies)
        .physical_damage(KILL_CLEAVE_DAMAGE * 2.0)
        .pet_ability()
        .background()
        .build()
}

fn dire_beast_attack() -> SpellDef {
    SpellBuilder::new(DIRE_BEAST_ATTACK, "Dire Beast Attack")
        .school(DamageSchool::Physical)
        .instant()
        .physical_damage(DIRE_BEAST_AP_COEF)
        .pet_ability()
        .background()
        .build()
}

// ============================================================================
// Hero Talent Spells - Pack Leader
// ============================================================================

fn howl_of_the_pack_leader() -> SpellDef {
    SpellBuilder::new(HOWL_OF_THE_PACK_LEADER, "Howl of the Pack Leader")
        .instant()
        .no_gcd()
        .background()
        .build()
}

fn boar_charge() -> SpellDef {
    SpellBuilder::new(BOAR_CHARGE, "Boar Charge")
        .school(DamageSchool::Physical)
        .instant()
        .target(SpellTarget::AllEnemies)
        .physical_damage(0.8)
        .pet_ability()
        .background()
        .build()
}

// ============================================================================
// Hero Talent Spells - Dark Ranger
// ============================================================================

fn black_arrow() -> SpellDef {
    SpellBuilder::new(BLACK_ARROW, "Black Arrow")
        .school(DamageSchool::Shadow)
        .instant()
        .cooldown(BLACK_ARROW_COOLDOWN)
        .cost(ResourceType::Focus, 10.0)
        .apply_aura(BLACK_ARROW_DOT)
        .build()
}

// ============================================================================
// Hero Talent Spells - Sentinel
// ============================================================================

fn sentinel_tick() -> SpellDef {
    SpellBuilder::new(SENTINEL_TICK, "Sentinel")
        .school(DamageSchool::Arcane)
        .instant()
        .physical_damage(0.5)
        .background()
        .build()
}

fn lunar_storm_initial() -> SpellDef {
    SpellBuilder::new(LUNAR_STORM_INITIAL, "Lunar Storm")
        .school(DamageSchool::Arcane)
        .instant()
        .target(SpellTarget::AllEnemies)
        .spell_damage(DamageSchool::Arcane, 1.0)
        .background()
        .build()
}

fn lunar_storm_periodic() -> SpellDef {
    SpellBuilder::new(LUNAR_STORM_PERIODIC, "Lunar Storm")
        .school(DamageSchool::Arcane)
        .instant()
        .target(SpellTarget::AllEnemies)
        .spell_damage(DamageSchool::Arcane, LUNAR_STORM_AP_COEF)
        .background()
        .build()
}

fn symphonic_arsenal_damage() -> SpellDef {
    SpellBuilder::new(SYMPHONIC_ARSENAL, "Symphonic Arsenal")
        .school(DamageSchool::Arcane)
        .instant()
        .target(SpellTarget::AllEnemies)
        .spell_damage(DamageSchool::Arcane, 0.3)
        .background()
        .build()
}

// ============================================================================
// Tier Set Spells
// ============================================================================

fn harmonize_barbed_shot() -> SpellDef {
    SpellBuilder::new(HARMONIZE_BARBED_SHOT, "Harmonize Barbed Shot")
        .school(DamageSchool::Physical)
        .instant()
        .physical_damage(0.3 * (1.0 + TWW_S1_4PC_DAMAGE_BONUS))
        .background()
        .build()
}

fn stampede_damage() -> SpellDef {
    SpellBuilder::new(STAMPEDE_DAMAGE, "Stampede")
        .school(DamageSchool::Physical)
        .instant()
        .target(SpellTarget::AllEnemies)
        .physical_damage(0.5)
        .pet_ability()
        .background()
        .build()
}
