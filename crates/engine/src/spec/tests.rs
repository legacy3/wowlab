use super::*;
use crate::types::*;

#[test]
fn spell_builder_basic() {
    let spell = SpellBuilder::new(SpellIdx(1), "Fireball")
        .school(DamageSchool::Fire)
        .cast_time(2500)
        .cooldown(0.0)
        .spell_damage(DamageSchool::Fire, 1.5)
        .build();

    assert_eq!(spell.id, SpellIdx(1));
    assert_eq!(spell.name, "Fireball");
    assert_eq!(spell.school, DamageSchool::Fire);
    assert!(!spell.is_instant());
}

#[test]
fn spell_cast_time_haste() {
    let spell = SpellBuilder::new(SpellIdx(1), "Cast")
        .cast_time(2000)
        .build();

    // Base cast time
    let base = spell.cast_time(1.0);
    assert_eq!(base.as_millis(), 2000);

    // With 30% haste
    let hasted = spell.cast_time(1.3);
    assert!(hasted.as_millis() < 2000);
    assert!(hasted.as_millis() > 1500);
}

#[test]
fn spell_gcd_floor() {
    let spell = SpellBuilder::new(SpellIdx(1), "Fast").instant().build();

    // GCD should be floored at 750ms even with massive haste
    let gcd = spell.gcd_duration(3.0);
    assert_eq!(gcd.as_millis(), 750);
}

#[test]
fn spell_no_gcd() {
    let spell = SpellBuilder::new(SpellIdx(1), "OffGCD").no_gcd().build();

    let gcd = spell.gcd_duration(1.0);
    assert_eq!(gcd, SimTime::ZERO);
}

#[test]
fn spell_charges() {
    let spell = SpellBuilder::new(SpellIdx(1), "Charged")
        .charges(2, 15.0)
        .build();

    assert_eq!(spell.charges, 2);
    assert_eq!(spell.charge_time.as_secs_f32(), 15.0);
}

#[test]
fn spell_costs() {
    let spell = SpellBuilder::new(SpellIdx(1), "Costed")
        .cost(ResourceType::Focus, 35.0)
        .gain(ResourceType::ComboPoints, 1.0)
        .build();

    assert_eq!(spell.costs.len(), 1);
    assert_eq!(spell.costs[0].resource, ResourceType::Focus);
    assert_eq!(spell.costs[0].amount, 35.0);

    assert_eq!(spell.gains.len(), 1);
}

#[test]
fn aura_builder_buff() {
    let aura = AuraBuilder::buff(AuraIdx(1), "Power", 20.0)
        .damage_multiplier(1.1)
        .stacks(3)
        .build();

    assert_eq!(aura.id, AuraIdx(1));
    assert_eq!(aura.max_stacks, 3);
    assert!(!aura.flags.is_debuff);
    assert_eq!(aura.effects.len(), 1);
}

#[test]
fn aura_builder_dot() {
    let aura = AuraBuilder::dot(AuraIdx(1), "Bleed", 18.0, 3.0)
        .periodic_damage(3.0, 0.4)
        .build();

    assert!(aura.flags.is_debuff);
    assert!(aura.flags.is_periodic);
    assert!(aura.flags.can_pandemic);
    assert!(aura.flags.snapshots);
    assert!(aura.periodic.is_some());
}

#[test]
fn cast_context_basic() {
    let ctx = CastContext::new(SpellIdx(1), TargetIdx(0), SimTime::ZERO)
        .with_cast_time(SimTime::from_secs(2));

    assert_eq!(ctx.start_time, SimTime::ZERO);
    assert_eq!(ctx.complete_time, SimTime::from_secs(2));
    assert_eq!(ctx.duration().as_secs_f32(), 2.0);
}

#[test]
fn cast_result_variants() {
    let success = CastResult::Success(CastContext::new(SpellIdx(1), TargetIdx(0), SimTime::ZERO));
    assert!(success.is_success());

    let on_cd = CastResult::OnCooldown {
        remaining: SimTime::from_secs(5),
    };
    assert!(!on_cd.is_success());
}

#[test]
fn damage_effect_default() {
    let effect = DamageEffect::default();

    assert_eq!(effect.school, DamageSchool::Physical);
    assert!(effect.can_crit);
    assert!(effect.is_direct);
}

#[test]
fn spell_target_variants() {
    let cleave = SpellTarget::Cleave { max_targets: 3 };
    let ground = SpellTarget::Ground { radius: 8.0 };

    assert!(matches!(cleave, SpellTarget::Cleave { max_targets: 3 }));
    assert!(matches!(ground, SpellTarget::Ground { radius: _ }));
}
