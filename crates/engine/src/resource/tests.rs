use super::*;
use wowlab_types::*;

#[test]
fn resource_pool_basic() {
    let mut pool = ResourcePool::new(ResourceType::Focus);
    assert_eq!(pool.max, 100.0);
    assert_eq!(pool.current, 100.0);

    pool.spend(30.0);
    assert_eq!(pool.current, 70.0);

    pool.gain(50.0);
    assert_eq!(pool.current, 100.0); // Capped at max
}

#[test]
fn resource_pool_empty() {
    let pool = ResourcePool::new_empty(ResourceType::Rage);
    assert_eq!(pool.current, 0.0);
    assert_eq!(pool.max, 100.0);
}

#[test]
fn resource_pool_can_afford() {
    let mut pool = ResourcePool::new(ResourceType::Energy);
    pool.set(50.0);

    assert!(pool.can_afford(50.0));
    assert!(pool.can_afford(30.0));
    assert!(!pool.can_afford(60.0));
}

#[test]
fn resource_pool_spend_fail() {
    let mut pool = ResourcePool::new_empty(ResourceType::Focus);
    pool.gain(20.0);

    assert!(!pool.spend(30.0)); // Can't afford
    assert_eq!(pool.current, 20.0); // Unchanged
}

#[test]
fn unit_resources_lookup() {
    let resources = UnitResources::new()
        .with_primary(ResourceType::Focus)
        .with_secondary(ResourceType::ComboPoints);

    assert!(resources.get(ResourceType::Focus).is_some());
    assert!(resources.get(ResourceType::ComboPoints).is_some());
    assert!(resources.get(ResourceType::Rage).is_none());
}

#[test]
fn regen_calculation() {
    let amount = ResourceRegen::calculate(
        ResourceType::Energy,
        SimTime::from_secs(1),
        1.0, // No haste
    );
    assert!((amount - 10.0).abs() < 0.01); // 10 energy per second base

    let hasted = ResourceRegen::calculate(
        ResourceType::Energy,
        SimTime::from_secs(1),
        1.3, // 30% haste
    );
    assert!((hasted - 13.0).abs() < 0.01);
}

#[test]
fn regen_time_to_reach() {
    let mut pool = ResourcePool::new_empty(ResourceType::Energy);
    pool.gain(50.0);

    let time = ResourceRegen::time_to_reach(&pool, 70.0, 1.0);
    assert!(time.is_some());
    assert!((time.unwrap().as_secs_f32() - 2.0).abs() < 0.01); // 20 / 10 = 2 seconds
}

#[test]
fn regen_no_regen_resource() {
    let time =
        ResourceRegen::time_to_reach(&ResourcePool::new_empty(ResourceType::Rage), 50.0, 1.0);
    assert!(time.is_none()); // Rage doesn't regen passively
}

#[test]
fn runes_basic() {
    let mut runes = RuneState::new();
    let now = SimTime::ZERO;

    assert_eq!(runes.ready_count(now), 6);
    assert!(runes.can_spend(3, now));

    runes.spend(2, now, SimTime::from_secs(10));
    assert_eq!(runes.ready_count(now), 4);
}

#[test]
fn runes_recharge() {
    let mut runes = RuneState::new();
    let now = SimTime::ZERO;

    runes.spend(2, now, SimTime::from_secs(10));

    // After 10 seconds, all should be ready
    let later = SimTime::from_secs(10);
    assert_eq!(runes.ready_count(later), 6);
}

#[test]
fn runes_time_until_ready() {
    let mut runes = RuneState::new();
    let now = SimTime::ZERO;

    runes.spend(6, now, SimTime::from_secs(10)); // Spend all

    let time = runes.time_until_ready(3, now);
    // Need to wait for 3rd rune to recharge
    assert!(time.as_secs_f32() > 0.0);
}
