use super::*;
use crate::types::*;

#[test]
fn primary_stats_access() {
    let mut stats = PrimaryStats::default();
    stats.set(Attribute::Agility, 5000.0);
    assert_eq!(stats.get(Attribute::Agility), 5000.0);

    stats.add(Attribute::Agility, 500.0);
    assert_eq!(stats.get(Attribute::Agility), 5500.0);
}

#[test]
fn ratings_access() {
    let mut ratings = Ratings::default();
    ratings.set(RatingType::Crit, 1000.0);
    assert_eq!(ratings.get(RatingType::Crit), 1000.0);
}

#[test]
fn rating_conversion() {
    let pct = rating_to_percent(180.0, RatingType::Crit);
    // At base rating, should be ~1%
    assert!(pct > 0.9 && pct < 1.1);
}

#[test]
fn rating_dr() {
    // High rating should have diminishing returns
    // Need ratings high enough to exceed 30% threshold (30 * 180 = 5400 raw rating)
    let low = rating_to_percent(5400.0, RatingType::Crit); // Exactly at threshold
    let high = rating_to_percent(10800.0, RatingType::Crit); // Would be 60% without DR

    // Without DR, high would be exactly 2x low (60% vs 30%)
    // With DR, high should be less than 2x low
    assert!(
        high < low * 2.0,
        "Expected DR to reduce high rating. Low: {}, High: {}",
        low,
        high
    );
    // But high should still be more than low
    assert!(high > low, "High rating should still give more than low");
}

#[test]
fn stat_cache_computation() {
    let mut cache = StatCache::with_spec(SpecId::BeastMastery);
    cache.primary.agility = 5000.0;
    cache.ratings.crit = 500.0;
    cache.ratings.haste = 300.0;
    cache.invalidate();
    cache.update(2.0); // BM mastery coefficient

    assert!(cache.attack_power() > 0.0);
    assert!(cache.crit_chance() > 0.05); // More than base
    assert!(cache.haste() > 1.0); // More than base
}

#[test]
fn modifier_stack() {
    let mut stack = ModifierStack::new();
    stack.add(StatModifier::DamageMult(0.10)); // +10%
    stack.add(StatModifier::DamageMult(0.05)); // +5%

    let mult = stack.damage_mult(DamageSchool::Physical);
    // 1.10 * 1.05 = 1.155
    assert!((mult - 1.155).abs() < 0.001);
}

#[test]
fn spec_coefficients() {
    let coeff = SpecCoefficients::for_spec(SpecId::BeastMastery);
    assert_eq!(coeff.mastery_coeff, 2.0);
    assert!(matches!(
        coeff.mastery_effect,
        MasteryEffect::PetAndOwnerDamage { .. }
    ));
}

#[test]
fn primary_stat_for_spec_check() {
    assert_eq!(
        primary_stat_for_spec(SpecId::BeastMastery),
        Attribute::Agility
    );
    assert_eq!(primary_stat_for_spec(SpecId::Fury), Attribute::Strength);
    assert_eq!(primary_stat_for_spec(SpecId::Fire), Attribute::Intellect);
}
