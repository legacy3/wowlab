use super::*;
use wowlab_types::{PetKind, SimTime, SpecId, TargetIdx, UnitIdx};

#[test]
fn player_basic() {
    let player = Player::new(SpecId::BeastMastery);
    assert_eq!(player.id, UnitIdx(0));
    assert_eq!(player.spec, SpecId::BeastMastery);
}

#[test]
fn player_gcd() {
    let mut player = Player::new(SpecId::BeastMastery);
    let now = SimTime::ZERO;

    assert!(!player.on_gcd(now));
    assert!(player.can_cast(now));

    player.start_gcd(SimTime::from_millis(1500), now);

    assert!(player.on_gcd(now));
    assert!(!player.can_cast(now));
    assert!(!player.on_gcd(SimTime::from_millis(1500)));
}

#[test]
fn player_casting() {
    let mut player = Player::new(SpecId::BeastMastery);
    let now = SimTime::ZERO;

    player.start_cast(SimTime::from_secs(2), now);

    assert!(player.is_casting(now));
    assert!(!player.can_cast(now));
    assert!(!player.is_casting(SimTime::from_secs(3)));
}

#[test]
fn player_auto_attack() {
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.ratings.haste = 0.0; // No haste
    player.stats.update(2.0); // Update to compute haste multiplier

    let base_speed = SimTime::from_millis(2600); // 2.6s base
    let speed = player.auto_attack_speed(base_speed);

    assert_eq!(speed.as_millis(), 2600);

    // With 30% haste
    player.stats.ratings.haste = 1050.0; // ~30% at level 80
    player.stats.invalidate();
    player.stats.update(2.0); // Update to compute haste multiplier
    let hasted_speed = player.auto_attack_speed(base_speed);

    assert!(hasted_speed.as_millis() < 2600);
}

#[test]
fn player_builder() {
    let player = PlayerBuilder::new(SpecId::BeastMastery)
        .with_dual_wield()
        .build();

    assert!(player.next_auto_oh.is_some());
}

#[test]
fn pet_basic() {
    let pet = Pet::new(UnitIdx(1), UnitIdx(0), PetKind::Permanent, "Wolf");

    assert_eq!(pet.id, UnitIdx(1));
    assert_eq!(pet.owner, UnitIdx(0));
    assert!(pet.is_active);
}

#[test]
fn pet_temporary() {
    let now = SimTime::ZERO;
    let pet = Pet::temporary(
        UnitIdx(1),
        UnitIdx(0),
        "Spirit Beast",
        SimTime::from_secs(15),
        now,
    );

    assert!(pet.is_valid(now));
    assert!(pet.is_valid(SimTime::from_secs(10)));
    assert!(!pet.is_valid(SimTime::from_secs(20)));
}

#[test]
fn pet_manager_summon() {
    let mut manager = PetManager::new();

    let pet1 = manager.summon(UnitIdx(0), PetKind::Permanent, "Wolf");
    let pet2 = manager.summon(UnitIdx(0), PetKind::Guardian, "Spirit Beast");

    assert_eq!(pet1, UnitIdx(1));
    assert_eq!(pet2, UnitIdx(2));
    assert_eq!(manager.active_count(SimTime::ZERO), 2);
}

#[test]
fn pet_manager_cleanup() {
    let mut manager = PetManager::new();
    let now = SimTime::ZERO;

    manager.summon(UnitIdx(0), PetKind::Permanent, "Wolf");
    manager.summon_temporary(UnitIdx(0), "Spirit", SimTime::from_secs(5), now);

    assert_eq!(manager.active_count(now), 2);

    // After 10 seconds, temporary should be gone
    manager.cleanup(SimTime::from_secs(10));
    assert_eq!(manager.active_count(SimTime::from_secs(10)), 1);
}

#[test]
fn enemy_basic() {
    let enemy = Enemy::raid_boss(TargetIdx(0), "Ragnaros");

    assert!(enemy.is_alive());
    assert!((enemy.health_percent() - 1.0).abs() < 0.01);
}

#[test]
fn enemy_take_damage() {
    let mut enemy = Enemy::new(TargetIdx(0), "Boss");
    enemy.max_health = 1_000_000.0;
    enemy.current_health = 1_000_000.0;

    enemy.take_damage(200_000.0);

    assert!((enemy.health_percent() - 0.8).abs() < 0.01);
    assert!(enemy.is_below(0.85));
    assert!(!enemy.is_below(0.75));
}

#[test]
fn enemy_armor_mitigation() {
    let enemy = Enemy::raid_boss(TargetIdx(0), "Boss");

    let mitigation = enemy.armor_mitigation(80);

    // Should be roughly 15-25% for boss armor at level 80
    // Formula: armor / (armor + k) where k = level * 467.5 + 16593 for bosses
    assert!(mitigation > 0.15 && mitigation < 0.25);
}

#[test]
fn enemy_manager_basic() {
    let manager = EnemyManager::with_bosses(3);

    assert_eq!(manager.count(), 3);
    assert_eq!(manager.alive_count(), 3);
}

#[test]
fn enemy_manager_deaths() {
    let mut manager = EnemyManager::with_bosses(3);

    // Kill one
    if let Some(enemy) = manager.get_mut(TargetIdx(1)) {
        enemy.current_health = 0.0;
    }

    assert_eq!(manager.alive_count(), 2);
}

#[test]
fn enemy_time_to_die() {
    let mut enemy = Enemy::new(TargetIdx(0), "Boss");
    enemy.max_health = 1_000_000.0;
    enemy.current_health = 500_000.0;

    let ttd = enemy.time_to_die(10_000.0); // 10k DPS
    assert!((ttd.as_secs_f32() - 50.0).abs() < 0.1);
}
