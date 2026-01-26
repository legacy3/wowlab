use super::*;
use crate::core::FastRng;
use crate::stats::StatCache;
use wowlab_common::types::*;

#[test]
fn action_state_snapshot() {
    let mut cache = StatCache::with_spec(SpecId::BeastMastery);
    cache.primary.agility = 5000.0;
    cache.ratings.crit = 500.0;
    cache.update(2.0);

    let mut state = ActionState::new();
    state.snapshot(&cache, SnapshotFlags::ATTACK_POWER | SnapshotFlags::CRIT);

    assert!(state.attack_power > 0.0);
    assert!(state.crit_chance > 0.0);
    assert_eq!(state.haste, 0.0); // Not snapshotted
}

#[test]
fn damage_multipliers_stacking() {
    let mut mult = DamageMultipliers::new();
    mult.action = 1.1;
    mult.player = 1.2;
    mult.versatility = 0.1;

    let total = mult.total_da(false);
    // 1.1 * 1.0 * 1.0 * 1.2 * 1.0 * 1.1 * 1.0 = 1.452
    assert!((total - 1.452).abs() < 0.01);
}

#[test]
fn damage_multipliers_crit() {
    let mult = DamageMultipliers::new();

    let no_crit = mult.total_da(false);
    let with_crit = mult.total_da(true);

    assert!((with_crit / no_crit - 2.0).abs() < 0.01); // 2x crit
}

#[test]
fn damage_pipeline_basic() {
    let mut rng = FastRng::new(42);
    let mult = DamageMultipliers::new();

    let result = DamagePipeline::calculate(
        1000.0, // base
        1.0,    // ap coeff
        0.0,    // sp coeff
        5000.0, // ap
        0.0,    // sp
        &mult,
        0.0, // crit chance (guaranteed no crit)
        DamageSchool::Physical,
        0.0, // no armor
        &mut rng,
    );

    // 1000 + 5000 = 6000
    assert!((result.final_amount - 6000.0).abs() < 1.0);
}

#[test]
fn damage_pipeline_armor() {
    let mut rng = FastRng::new(42);
    let mult = DamageMultipliers::new();

    let no_armor = DamagePipeline::calculate(
        1000.0,
        0.0,
        0.0,
        0.0,
        0.0,
        &mult,
        0.0,
        DamageSchool::Physical,
        0.0,
        &mut rng,
    );

    let with_armor = DamagePipeline::calculate(
        1000.0,
        0.0,
        0.0,
        0.0,
        0.0,
        &mult,
        0.0,
        DamageSchool::Physical,
        5000.0,
        &mut rng,
    );

    assert!(with_armor.final_amount < no_armor.final_amount);
}

#[test]
fn cooldown_basic() {
    let mut cd = Cooldown::new(10.0);
    let now = SimTime::ZERO;

    assert!(cd.is_ready(now));

    cd.start(now, 1.0);
    assert!(!cd.is_ready(now));
    assert!(cd.is_ready(SimTime::from_secs(10)));
}

#[test]
fn cooldown_hasted() {
    let mut cd = Cooldown::new(10.0).hasted();

    cd.start(SimTime::ZERO, 2.0); // 100% haste
                                  // Should be ready at 5 seconds instead of 10
    assert!(!cd.is_ready(SimTime::from_secs(4)));
    assert!(cd.is_ready(SimTime::from_secs(5)));
}

#[test]
fn cooldown_reduce() {
    let mut cd = Cooldown::new(10.0);
    cd.start(SimTime::ZERO, 1.0);

    cd.reduce(SimTime::from_secs(3));
    // Ready at 7 now
    assert!(!cd.is_ready(SimTime::from_secs(6)));
    assert!(cd.is_ready(SimTime::from_secs(7)));
}

#[test]
fn charged_cooldown_basic() {
    let mut cd = ChargedCooldown::new(2, 12.0);

    assert!(cd.has_charge());
    assert_eq!(cd.current_charges, 2);

    cd.spend(SimTime::ZERO, 1.0);
    assert_eq!(cd.current_charges, 1);
    assert!(cd.has_charge());

    cd.spend(SimTime::ZERO, 1.0);
    assert_eq!(cd.current_charges, 0);
    assert!(!cd.has_charge());
}

#[test]
fn charged_cooldown_recharge() {
    let mut cd = ChargedCooldown::new(2, 12.0);

    cd.spend(SimTime::ZERO, 1.0);
    cd.spend(SimTime::ZERO, 1.0);
    assert_eq!(cd.current_charges, 0);

    // After 12 seconds, should have 1 charge
    let recharged = cd.check_recharge(SimTime::from_secs(12), 1.0);
    assert!(recharged);
    assert_eq!(cd.current_charges, 1);
}

#[test]
fn charged_cooldown_fractional() {
    let mut cd = ChargedCooldown::new(2, 12.0);
    cd.spend(SimTime::ZERO, 1.0);

    // At 6 seconds, should be 1.5 charges
    let frac = cd.charges_fractional(SimTime::from_secs(6));
    assert!((frac - 1.5).abs() < 0.1);
}
