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

#[test]
fn damage_flags() {
    let flags = DamageFlags::CRIT | DamageFlags::PERIODIC;
    assert!(flags.contains(DamageFlags::CRIT));
    assert!(flags.contains(DamageFlags::PERIODIC));
    assert!(!flags.contains(DamageFlags::PET));
}
