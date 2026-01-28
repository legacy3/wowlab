use super::*;
use wowlab_common::types::*;

#[allow(unused_imports)]
use crate::combat::ActionState;

#[test]
fn aura_instance_basic() {
    let now = SimTime::ZERO;
    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags::default(),
    );

    assert!(aura.is_active(now));
    assert_eq!(aura.stacks, 1);
    assert_eq!(aura.remaining(now).as_secs_f32(), 10.0);
}

#[test]
fn aura_instance_expiry() {
    let now = SimTime::ZERO;
    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags::default(),
    );

    assert!(aura.is_active(SimTime::from_secs(5)));
    assert!(aura.is_active(SimTime::from_secs(9)));
    assert!(!aura.is_active(SimTime::from_secs(10)));
    assert!(!aura.is_active(SimTime::from_secs(15)));
}

#[test]
fn aura_instance_stacks() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags::default(),
    )
    .with_stacks(3);

    assert_eq!(aura.stacks, 1);
    assert!(aura.add_stack());
    assert_eq!(aura.stacks, 2);
    assert!(aura.add_stack());
    assert_eq!(aura.stacks, 3);
    assert!(!aura.add_stack()); // At max
    assert_eq!(aura.stacks, 3);
}

#[test]
fn aura_pandemic_refresh() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags {
            can_pandemic: true,
            refreshable: true,
            ..Default::default()
        },
    );

    // Refresh at 7 seconds (3 sec remaining, 30% of 10 = 3)
    let refresh_time = SimTime::from_secs(7);
    aura.refresh(refresh_time);

    // Should be 10 (base) + 3 (carryover) = 13 seconds from refresh
    let expected = refresh_time + SimTime::from_secs(13);
    assert_eq!(aura.expires_at, expected);
}

#[test]
fn aura_pandemic_cap() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags {
            can_pandemic: true,
            refreshable: true,
            ..Default::default()
        },
    );

    // Refresh immediately (10 sec remaining, but cap at 30% = 3)
    aura.refresh(now);

    // Should be 10 (base) + 3 (capped carryover) = 13 seconds
    let expected = now + SimTime::from_secs(13);
    assert_eq!(aura.expires_at, expected);
}

#[test]
fn target_auras_basic() {
    let now = SimTime::ZERO;
    let mut tracker = TargetAuras::new();

    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags {
            refreshable: true,
            ..Default::default()
        },
    );

    tracker.apply(aura, now);

    assert!(tracker.has(AuraIdx(1), now));
    assert!(!tracker.has(AuraIdx(2), now));
    assert_eq!(tracker.stacks(AuraIdx(1), now), 1);
}

#[test]
fn target_auras_refresh() {
    let now = SimTime::ZERO;
    let mut tracker = TargetAuras::new();

    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags {
            refreshable: true,
            ..Default::default()
        },
    )
    .with_stacks(5);

    tracker.apply(aura.clone(), now);
    tracker.apply(aura, now); // Refresh

    assert_eq!(tracker.stacks(AuraIdx(1), now), 2);
}

#[test]
fn target_auras_cleanup() {
    let now = SimTime::ZERO;
    let mut tracker = TargetAuras::new();

    tracker.apply(
        AuraInstance::new(
            AuraIdx(1),
            TargetIdx(0),
            SimTime::from_secs(5),
            now,
            AuraFlags::default(),
        ),
        now,
    );

    tracker.apply(
        AuraInstance::new(
            AuraIdx(2),
            TargetIdx(0),
            SimTime::from_secs(15),
            now,
            AuraFlags::default(),
        ),
        now,
    );

    let later = SimTime::from_secs(10);
    tracker.cleanup(later);

    assert!(!tracker.has(AuraIdx(1), later)); // Expired
    assert!(tracker.has(AuraIdx(2), later)); // Still active
}

#[test]
fn aura_tracker_multi_target() {
    let now = SimTime::ZERO;
    let mut tracker = AuraTracker::new().with_targets(3);

    // Apply debuff to target 0
    tracker.target_mut(TargetIdx(0)).unwrap().apply(
        AuraInstance::new(
            AuraIdx(1),
            TargetIdx(0),
            SimTime::from_secs(10),
            now,
            AuraFlags {
                is_debuff: true,
                ..Default::default()
            },
        ),
        now,
    );

    // Apply same debuff to target 2
    tracker.target_mut(TargetIdx(2)).unwrap().apply(
        AuraInstance::new(
            AuraIdx(1),
            TargetIdx(2),
            SimTime::from_secs(10),
            now,
            AuraFlags {
                is_debuff: true,
                ..Default::default()
            },
        ),
        now,
    );

    assert!(tracker.on_any_target(AuraIdx(1), now));
    assert_eq!(tracker.targets_with_aura(AuraIdx(1), now), 2);
}

#[test]
fn periodic_tick_calculation() {
    let effect = PeriodicEffect::new(AuraIdx(1), SimTime::from_secs(3)).with_coefficient(1.0);

    // Base: 10 seconds / 3 second interval = 3 ticks
    assert_eq!(effect.total_ticks(SimTime::from_secs(10), 1.0), 3);

    // With haste (interval reduced)
    let hasted_interval = effect.effective_interval(1.5);
    assert_eq!(hasted_interval.as_millis(), 2000); // 3000 / 1.5 = 2000
}

#[test]
fn periodic_with_haste_ticks() {
    let mut effect = PeriodicEffect::new(AuraIdx(1), SimTime::from_secs(3));
    effect.haste_scales_interval = false;
    effect.haste_adds_ticks = true;

    // Base: 3 ticks, with 50% haste: 4 ticks
    assert_eq!(effect.total_ticks(SimTime::from_secs(10), 1.0), 3);
    assert_eq!(effect.total_ticks(SimTime::from_secs(10), 1.5), 4);
}

#[test]
fn aura_instance_periodic() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(12),
        now,
        AuraFlags {
            is_periodic: true,
            ..Default::default()
        },
    )
    .with_periodic(SimTime::from_secs(3), now);

    assert_eq!(aura.remaining_ticks, 4);
    assert_eq!(aura.next_tick, Some(SimTime::from_secs(3)));

    // Process a tick
    assert!(aura.tick());
    assert_eq!(aura.remaining_ticks, 3);
    assert_eq!(aura.next_tick, Some(SimTime::from_secs(6)));
}
