use super::*;

#[test]
fn sim_time_arithmetic() {
    let a = SimTime::from_secs(5);
    let b = SimTime::from_millis(2500);
    assert_eq!((a + b).as_millis(), 7500);
    assert_eq!((a - b).as_millis(), 2500);
    assert_eq!(a.as_secs_f32(), 5.0);
}

#[test]
fn sim_time_saturating() {
    let a = SimTime::from_secs(1);
    let b = SimTime::from_secs(5);
    assert_eq!(a.saturating_sub(b), SimTime::ZERO);
}

#[test]
fn spec_class_mapping() {
    assert_eq!(SpecId::BeastMastery.class(), ClassId::Hunter);
    assert_eq!(SpecId::Fury.class(), ClassId::Warrior);
    assert_eq!(SpecId::Shadow.class(), ClassId::Priest);
    assert_eq!(SpecId::Havoc.class(), ClassId::DemonHunter);
}

#[test]
fn spec_primary_resource() {
    assert_eq!(SpecId::BeastMastery.primary_resource(), ResourceType::Focus);
    assert_eq!(SpecId::Fury.primary_resource(), ResourceType::Rage);
    assert_eq!(SpecId::Assassination.primary_resource(), ResourceType::Energy);
    assert_eq!(SpecId::Shadow.primary_resource(), ResourceType::Mana);
}

#[test]
fn resource_properties() {
    assert_eq!(ResourceType::Focus.base_max(), 100);
    assert_eq!(ResourceType::ComboPoints.base_max(), 5);
    assert!(ResourceType::Energy.has_passive_regen());
    assert!(!ResourceType::Rage.has_passive_regen());
}

#[test]
fn damage_school_types() {
    assert!(DamageSchool::Physical.is_physical());
    assert!(!DamageSchool::Physical.is_magic());
    assert!(DamageSchool::Fire.is_magic());
    assert!(!DamageSchool::Fire.is_physical());
}

#[test]
fn hit_result_checks() {
    assert!(HitResult::Hit.is_hit());
    assert!(HitResult::Crit.is_hit());
    assert!(HitResult::Crit.is_crit());
    assert!(!HitResult::Miss.is_hit());
}

#[test]
fn snapshot_flags_combinations() {
    let flags = SnapshotFlags::DOT_PHYSICAL;
    assert!(flags.contains(SnapshotFlags::ATTACK_POWER));
    assert!(flags.contains(SnapshotFlags::PERSISTENT_MULT));
    assert!(!flags.contains(SnapshotFlags::SPELL_POWER));
    assert!(!flags.contains(SnapshotFlags::HASTE));
}

#[test]
fn idx_defaults() {
    assert_eq!(UnitIdx::PLAYER.0, 0);
    assert_eq!(TargetIdx::PRIMARY.0, 0);
    assert_eq!(SpellIdx::default().0, 0);
}

// =============================================================================
// Comprehensive NewType Wrapper Tests
// =============================================================================

#[test]
fn spell_idx_operations() {
    let spell = SpellIdx::from_raw(12345);
    assert_eq!(spell.as_u32(), 12345);
    assert_eq!(spell.as_usize(), 12345);
    assert!(spell.is_valid());

    let invalid = SpellIdx::from_raw(0);
    assert!(!invalid.is_valid());

    // From/Into conversions
    let spell2: SpellIdx = 999u32.into();
    assert_eq!(u32::from(spell2), 999);

    // try_from_usize
    assert!(SpellIdx::try_from_usize(100).is_some());
}

#[test]
fn aura_idx_operations() {
    let aura = AuraIdx::from_raw(54321);
    assert_eq!(aura.as_u32(), 54321);
    assert!(aura.is_valid());

    let invalid = AuraIdx::default();
    assert!(!invalid.is_valid());

    // Debug formatting
    let debug = format!("{:?}", aura);
    assert!(debug.contains("54321"));
}

#[test]
fn unit_idx_operations() {
    assert!(UnitIdx::PLAYER.is_player());
    assert!(!UnitIdx::from_raw(1).is_player());

    // try_from_usize bounds
    assert!(UnitIdx::try_from_usize(0).is_some());
    assert!(UnitIdx::try_from_usize(65535).is_some());

    // saturating conversion
    let saturated = UnitIdx::from_usize_saturating(100000);
    assert_eq!(saturated.as_usize(), UnitIdx::MAX);

    // iteration
    let units: Vec<_> = UnitIdx::iter(3).collect();
    assert_eq!(units.len(), 3);
    assert_eq!(units[0].as_u16(), 0);
    assert_eq!(units[2].as_u16(), 2);
}

#[test]
fn target_idx_operations() {
    assert!(TargetIdx::PRIMARY.is_primary());
    assert!(!TargetIdx::from_raw(1).is_primary());

    // iteration
    let targets: Vec<_> = TargetIdx::iter(5).collect();
    assert_eq!(targets.len(), 5);
    assert!(targets[0].is_primary());

    // Debug formatting shows PRIMARY
    let debug = format!("{:?}", TargetIdx::PRIMARY);
    assert!(debug.contains("PRIMARY"));
}

#[test]
fn pet_idx_operations() {
    assert!(PetIdx::PRIMARY.is_primary());

    // to_unit_idx: pets start at 1
    let pet0 = PetIdx::from_raw(0);
    assert_eq!(pet0.to_unit_idx().as_u16(), 1);

    let pet5 = PetIdx::from_raw(5);
    assert_eq!(pet5.to_unit_idx().as_u16(), 6);

    // bounds check
    assert!(PetIdx::try_from_usize(255).is_some());
    assert!(PetIdx::try_from_usize(256).is_none());
}

#[test]
fn enemy_idx_operations() {
    assert!(EnemyIdx::PRIMARY.is_primary());

    // to_target_idx: 1:1 mapping
    let enemy = EnemyIdx::from_raw(3);
    assert_eq!(enemy.to_target_idx().as_u16(), 3);

    // iteration
    let enemies: Vec<_> = EnemyIdx::iter(4).collect();
    assert_eq!(enemies.len(), 4);
}

#[test]
fn snapshot_idx_operations() {
    let invalid = SnapshotIdx::INVALID;
    assert!(!invalid.is_valid());

    let snap = SnapshotIdx::from_raw(1);
    assert!(snap.is_valid());

    // next() for incrementing
    let next = snap.next();
    assert_eq!(next.as_u32(), 2);

    // Debug shows INVALID
    let debug = format!("{:?}", SnapshotIdx::INVALID);
    assert!(debug.contains("INVALID"));
}

#[test]
fn resource_idx_operations() {
    // Constants match expected values
    assert_eq!(ResourceIdx::MANA.as_u8(), 0);
    assert_eq!(ResourceIdx::FOCUS.as_u8(), 2);
    assert_eq!(ResourceIdx::ENERGY.as_u8(), 3);

    // bounds check
    assert!(ResourceIdx::try_from_usize(31).is_some());
    assert!(ResourceIdx::try_from_usize(32).is_none());
}

#[test]
fn proc_idx_operations() {
    let proc = ProcIdx::from_raw(42);
    assert_eq!(proc.as_u32(), 42);
    assert_eq!(proc.as_usize(), 42);

    // From/Into
    let proc2: ProcIdx = 100u32.into();
    assert_eq!(u32::from(proc2), 100);
}

#[test]
fn idx_hash_and_equality() {
    use std::collections::HashSet;

    let mut set = HashSet::new();
    set.insert(SpellIdx::from_raw(100));
    set.insert(SpellIdx::from_raw(200));
    set.insert(SpellIdx::from_raw(100)); // duplicate

    assert_eq!(set.len(), 2);
    assert!(set.contains(&SpellIdx::from_raw(100)));
}

#[test]
fn idx_ordering() {
    let a = SpellIdx::from_raw(10);
    let b = SpellIdx::from_raw(20);
    let c = SpellIdx::from_raw(10);

    assert!(a < b);
    assert!(a <= c);
    assert!(b > a);
    assert_eq!(a, c);
}

#[test]
fn idx_display() {
    let spell = SpellIdx::from_raw(12345);
    assert_eq!(format!("{}", spell), "12345");

    let target = TargetIdx::from_raw(5);
    assert_eq!(format!("{}", target), "5");
}

#[test]
fn damage_flags() {
    let flags = DamageFlags::CRIT | DamageFlags::PERIODIC;
    assert!(flags.contains(DamageFlags::CRIT));
    assert!(flags.contains(DamageFlags::PERIODIC));
    assert!(!flags.contains(DamageFlags::PET));
}
