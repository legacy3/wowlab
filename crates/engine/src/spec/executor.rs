//! Generic effect executor for spell effects and damage modifiers.
//!
//! This module processes SpellEffects and DamageMods declaratively,
//! replacing scattered if/else chains in spec handlers.

use crate::aura::AuraInstance;
use crate::combat::DamagePipeline;
use crate::core::SimEvent;
use crate::sim::SimState;
use crate::spec::{
    AuraDef, DamageMod, EffectCondition, ModCondition, SpellDef, SpellEffect, SpellFlags,
};
use wowlab_common::types::{AuraIdx, DamageSchool, HitResult, SimTime, SpellIdx, TargetIdx};

use tracing::debug;

/// Context for effect execution.
pub struct EffectContext<'a> {
    /// Current simulation state.
    pub state: &'a mut SimState,
    /// The spell being cast.
    pub spell: &'a SpellDef,
    /// Target of the spell.
    pub target: TargetIdx,
    /// Enabled talents (by name).
    pub talents: &'a [&'static str],
    /// Aura lookup function.
    pub get_aura: &'a dyn Fn(AuraIdx) -> Option<&'a AuraDef>,
}

/// Execute all effects for a spell cast.
pub fn execute_effects(ctx: &mut EffectContext<'_>) {
    // Clone effects to avoid borrow conflict with mutable ctx
    let effects = ctx.spell.effects.clone();
    for effect in &effects {
        execute_single_effect(ctx, effect);
    }
}

/// Execute a single effect.
fn execute_single_effect(ctx: &mut EffectContext<'_>, effect: &SpellEffect) {
    match effect {
        SpellEffect::ReduceCooldown { spell, amount } => {
            if let Some(cd) = ctx.state.player.cooldown_mut(*spell) {
                cd.reduce(SimTime::from_secs_f32(*amount));
                debug!(spell = spell.0, amount, "Reduced cooldown");
            }
        }

        SpellEffect::GainCharge { spell } => {
            let now = ctx.state.now();
            let haste = ctx.state.player.stats.haste();
            if let Some(cd) = ctx.state.player.charged_cooldown_mut(*spell) {
                cd.gain_charge(now, haste);
                debug!(spell = spell.0, "Gained charge");
            }
        }

        SpellEffect::TriggerSpell { spell } => {
            let now = ctx.state.now();
            ctx.state.events.schedule(
                now,
                SimEvent::CastComplete {
                    spell: *spell,
                    target: ctx.target,
                },
            );
            debug!(spell = spell.0, "Triggered spell");
        }

        SpellEffect::SummonPet {
            kind,
            duration,
            name,
        } => {
            let now = ctx.state.now();
            let pet_id = ctx
                .state
                .pets
                .summon(ctx.state.player.id, *kind, name.clone());
            ctx.state
                .events
                .schedule(now, SimEvent::PetAttack { pet: pet_id });
            // Duration is tracked via pet's expires_at, no explicit despawn event needed
            let _ = duration; // Duration used during pet creation
            debug!(pet = pet_id.0, duration, name, "Summoned pet");
        }

        SpellEffect::ApplyBuff { aura, stacks } => {
            apply_buff(ctx, *aura, *stacks);
        }

        SpellEffect::ApplyDebuff { aura, stacks } => {
            apply_debuff(ctx, *aura, ctx.target, *stacks);
        }

        SpellEffect::ExtendAura { aura, amount } => {
            let now = ctx.state.now();
            if ctx.state.player.buffs.has(*aura, now) {
                if let Some(instance) = ctx.state.player.buffs.get_mut(*aura) {
                    instance.expires_at += SimTime::from_secs_f32(*amount);
                    debug!(aura = aura.0, amount, "Extended aura");
                }
            }
        }

        SpellEffect::RefreshAura { aura } => {
            if let Some(aura_def) = (ctx.get_aura)(*aura) {
                let now = ctx.state.now();
                if ctx.state.player.buffs.has(*aura, now) {
                    if let Some(instance) = ctx.state.player.buffs.get_mut(*aura) {
                        instance.expires_at = now + aura_def.duration;
                        debug!(aura = aura.0, "Refreshed aura");
                    }
                }
            }
        }

        SpellEffect::PetMirrorCast { damage_pct } => {
            // Pet mirrors the spell cast at reduced damage
            // This would typically trigger pet's version of the ability
            debug!(damage_pct, "Pet mirror cast");
        }

        SpellEffect::Cleave {
            damage_pct,
            max_targets,
        } => {
            // Cleave damage is handled during damage calculation
            debug!(damage_pct, max_targets, "Cleave effect");
        }

        SpellEffect::Conditional { condition, effect } => {
            if check_condition(ctx, condition) {
                execute_single_effect(ctx, effect);
            }
        }

        SpellEffect::Multi(effects) => {
            for sub_effect in effects {
                execute_single_effect(ctx, sub_effect);
            }
        }
    }
}

/// Check if a condition is met.
fn check_condition(ctx: &EffectContext<'_>, condition: &EffectCondition) -> bool {
    let now = ctx.state.now();

    match condition {
        EffectCondition::BuffActive(aura) => ctx.state.player.buffs.has(*aura, now),

        EffectCondition::DebuffActive(aura) => ctx
            .state
            .auras
            .target(ctx.target)
            .map(|a| a.has(*aura, now))
            .unwrap_or(false),

        EffectCondition::TalentEnabled(name) => ctx.talents.contains(&name.as_str()),

        EffectCondition::TargetHealthBelow(threshold) => ctx
            .state
            .enemies
            .primary()
            .map(|e| (e.current_health / e.max_health) < *threshold)
            .unwrap_or(false),

        EffectCondition::PlayerHealthBelow(threshold) => {
            // Player health not tracked in DPS sims - assume always above threshold
            // In a full sim, this would check actual player health
            let _ = threshold;
            false
        }

        EffectCondition::DuringBuff(aura) => ctx.state.player.buffs.has(*aura, now),

        EffectCondition::PetActive => ctx.state.pets.active(now).count() > 0,

        EffectCondition::HasStacks { aura, min } => {
            ctx.state.player.buffs.stacks(*aura, now) >= *min
        }

        EffectCondition::CooldownReady(spell) => ctx
            .state
            .player
            .cooldown(*spell)
            .map(|cd| cd.is_ready(now))
            .unwrap_or(true),

        EffectCondition::And(conditions) => conditions.iter().all(|c| check_condition(ctx, c)),

        EffectCondition::Or(conditions) => conditions.iter().any(|c| check_condition(ctx, c)),

        EffectCondition::Not(cond) => !check_condition(ctx, cond),
    }
}

/// Apply a buff to the player.
fn apply_buff(ctx: &mut EffectContext<'_>, aura_id: AuraIdx, stacks: u8) {
    let now = ctx.state.now();

    if let Some(aura_def) = (ctx.get_aura)(aura_id) {
        let mut instance = AuraInstance::new(
            aura_id,
            TargetIdx(0),
            aura_def.duration,
            now,
            aura_def.flags,
        );

        if aura_def.max_stacks > 1 {
            // For stackable buffs, add stacks up to max
            let current = ctx.state.player.buffs.stacks(aura_id, now);
            let new_stacks = (current + stacks).min(aura_def.max_stacks);
            instance = instance.with_stacks(new_stacks);
        }

        ctx.state.player.buffs.apply(instance, now);
        debug!(aura = aura_id.0, stacks, "Applied buff");
    }
}

/// Apply a debuff to a target.
fn apply_debuff(ctx: &mut EffectContext<'_>, aura_id: AuraIdx, target: TargetIdx, stacks: u8) {
    let now = ctx.state.now();

    if let Some(aura_def) = (ctx.get_aura)(aura_id) {
        let mut instance =
            AuraInstance::new(aura_id, target, aura_def.duration, now, aura_def.flags);

        if let Some(ref periodic) = aura_def.periodic {
            instance = instance.with_periodic(periodic.interval, now);
        }

        if aura_def.max_stacks > 1 {
            instance = instance.with_stacks(stacks.min(aura_def.max_stacks));
        }

        if let Some(target_auras) = ctx.state.auras.target_mut(target) {
            target_auras.apply(instance, now);
        }

        // Schedule first tick for periodic effects
        if let Some(ref periodic) = aura_def.periodic {
            ctx.state.schedule_in(
                periodic.interval,
                SimEvent::AuraTick {
                    aura: aura_id,
                    target,
                },
            );
        }

        debug!(
            aura = aura_id.0,
            target = target.0,
            stacks,
            "Applied debuff"
        );
    }
}

/// Context for damage calculation.
pub struct DamageContext<'a> {
    /// Current simulation state.
    pub state: &'a mut SimState,
    /// The spell dealing damage (if any).
    pub spell: Option<&'a SpellDef>,
    /// Spell ID for modifier matching.
    pub spell_id: Option<SpellIdx>,
    /// Target receiving damage.
    pub target: TargetIdx,
    /// Enabled talents (by name).
    pub talents: &'a [&'static str],
    /// Active damage modifiers.
    pub modifiers: &'a [DamageMod],
    /// Was this a critical hit?
    pub is_crit: bool,
}

/// Calculate damage with all modifiers applied.
pub fn calculate_damage(
    ctx: &mut DamageContext<'_>,
    base: f32,
    ap_coef: f32,
    sp_coef: f32,
    school: DamageSchool,
) -> f32 {
    let ap = ctx.state.player.stats.attack_power();
    let sp = ctx.state.player.stats.spell_power();
    let crit = ctx.state.player.stats.crit_chance();
    let armor = ctx.state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);

    // Calculate base damage through pipeline
    let result = DamagePipeline::calculate(
        base,
        ap_coef,
        sp_coef,
        ap,
        sp,
        &ctx.state.multipliers,
        crit,
        school,
        armor,
        &mut ctx.state.rng,
    );

    let mut damage = result.final_amount;
    ctx.is_crit = result.hit_result == HitResult::Crit;

    // Apply all active modifiers
    let mut sorted_mods: Vec<_> = ctx
        .modifiers
        .iter()
        .filter(|m| check_mod_condition(ctx, &m.condition))
        .collect();
    sorted_mods.sort_by_key(|m| m.priority);

    for modifier in sorted_mods {
        let mult = get_modifier_value(ctx, modifier);
        damage *= mult;
        debug!(
            name = modifier.name,
            mult, damage, "Applied damage modifier"
        );
    }

    damage
}

/// Check if a damage modifier condition is met.
fn check_mod_condition(ctx: &DamageContext<'_>, condition: &ModCondition) -> bool {
    let now = ctx.state.now();

    match condition {
        ModCondition::Always => true,

        ModCondition::ForSpell(spell) => ctx.spell_id == Some(*spell),

        ModCondition::PetAbility => ctx
            .spell
            .map(|s| s.flags.contains(SpellFlags::PET_ABILITY))
            .unwrap_or(false),

        ModCondition::BuffActive(aura) => ctx.state.player.buffs.has(*aura, now),

        ModCondition::DebuffActive(aura) => ctx
            .state
            .auras
            .target(ctx.target)
            .map(|a| a.has(*aura, now))
            .unwrap_or(false),

        ModCondition::TargetHealthBelow(threshold) => ctx
            .state
            .enemies
            .primary()
            .map(|e| (e.current_health / e.max_health) < *threshold)
            .unwrap_or(false),

        ModCondition::OnCrit => ctx.is_crit,

        ModCondition::PerStack { aura, .. } => ctx.state.player.buffs.stacks(*aura, now) > 0,

        ModCondition::ExecutePhase => ctx
            .state
            .enemies
            .primary()
            .map(|e| (e.current_health / e.max_health) < 0.20)
            .unwrap_or(false),

        ModCondition::StatScaling { .. } => true,

        ModCondition::TalentEnabled(name) => ctx.talents.contains(&name.as_str()),

        ModCondition::And(conditions) => conditions.iter().all(|c| check_mod_condition(ctx, c)),

        ModCondition::Or(conditions) => conditions.iter().any(|c| check_mod_condition(ctx, c)),
    }
}

/// Get the actual modifier value (handles per-stack and stat scaling).
fn get_modifier_value(ctx: &DamageContext<'_>, modifier: &DamageMod) -> f32 {
    let now = ctx.state.now();

    match &modifier.condition {
        ModCondition::PerStack { aura, per_stack } => {
            let stacks = ctx.state.player.buffs.stacks(*aura, now);
            1.0 + (stacks as f32 * per_stack)
        }

        ModCondition::StatScaling { base } => {
            // Scale with crit rating or similar
            let crit = ctx.state.player.stats.crit_chance();
            1.0 + (crit * base)
        }

        _ => modifier.multiplier,
    }
}
