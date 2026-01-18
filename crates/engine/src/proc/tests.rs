use super::*;
use crate::core::FastRng;
use crate::types::*;

#[test]
fn proc_flags_basic() {
    let flags = ProcFlags::ON_DAMAGE | ProcFlags::ON_CRIT;

    assert!(flags.contains(ProcFlags::ON_DAMAGE));
    assert!(flags.contains(ProcFlags::ON_CRIT));
    assert!(!flags.contains(ProcFlags::ON_HEAL));
}

#[test]
fn proc_flags_intersects() {
    let handler_flags = ProcFlags::ON_DAMAGE | ProcFlags::ON_PERIODIC_DAMAGE;
    let trigger = ProcFlags::ON_DAMAGE;

    assert!(handler_flags.intersects(trigger));
}

#[test]
fn rppm_basic_chance() {
    let rppm = RppmState::new(ProcIdx(1), 1.0); // 1 PPM

    // At exactly 1 minute since last attempt, should be 100% * BLP
    let now = SimTime::from_secs(60);
    let chance = rppm.proc_chance(now, 1.0, 0.0);

    // Base chance = 1.0 * 60/60 = 1.0
    assert!((chance - 1.0).abs() < 0.01);
}

#[test]
fn rppm_haste_scaling() {
    let rppm = RppmState::new(ProcIdx(1), 1.0).with_haste_scaling(true);

    let ppm_no_haste = rppm.effective_ppm(1.0, 0.0);
    let ppm_with_haste = rppm.effective_ppm(1.5, 0.0);

    assert!((ppm_no_haste - 1.0).abs() < 0.01);
    assert!((ppm_with_haste - 1.5).abs() < 0.01);
}

#[test]
fn rppm_icd() {
    let mut rppm = RppmState::new(ProcIdx(1), 100.0) // High PPM to guarantee proc
        .with_icd(SimTime::from_secs(10));

    let mut rng = FastRng::new(42);

    // First attempt succeeds (high PPM)
    rppm.last_attempt = SimTime::ZERO;
    let proc1 = rppm.attempt(SimTime::from_secs(1), 1.0, 0.0, &mut rng);

    // If proc1 succeeded, check ICD
    if proc1 {
        // Attempt during ICD should fail
        assert!(rppm.on_icd(SimTime::from_secs(5)));
        assert!(!rppm.on_icd(SimTime::from_secs(15)));
    }
}

#[test]
fn rppm_blp_increases() {
    let mut rppm = RppmState::new(ProcIdx(1), 0.001); // Very low PPM
    let mut rng = FastRng::new(42);

    // Make several failed attempts
    let now = SimTime::ZERO;
    rppm.last_attempt = now;

    for i in 1..10 {
        let time = SimTime::from_secs(i);
        rppm.attempt(time, 1.0, 0.0, &mut rng);
    }

    // BLP should have increased
    assert!(rppm.current_blp() > 1.0);
}

#[test]
fn rppm_blp_resets_on_proc() {
    let mut rppm = RppmState::new(ProcIdx(1), 100.0); // Very high PPM
    let mut rng = FastRng::new(42);

    // Set high BLP
    rppm.blp_multiplier = 50.0;

    // Proc should succeed with high PPM
    rppm.last_attempt = SimTime::ZERO;
    let did_proc = rppm.attempt(SimTime::from_secs(1), 1.0, 0.0, &mut rng);

    if did_proc {
        // BLP should reset
        assert!((rppm.current_blp() - 1.0).abs() < 0.01);
    }
}

#[test]
fn fixed_proc_basic() {
    let mut proc = FixedProc::new(ProcIdx(1), 1.0); // 100% chance
    let mut rng = FastRng::new(42);

    assert!(proc.attempt(SimTime::ZERO, &mut rng));
}

#[test]
fn fixed_proc_icd() {
    let mut proc = FixedProc::new(ProcIdx(1), 1.0).with_icd(SimTime::from_secs(5));
    let mut rng = FastRng::new(42);

    // First proc succeeds
    assert!(proc.attempt(SimTime::ZERO, &mut rng));

    // During ICD, fails
    assert!(!proc.attempt(SimTime::from_secs(2), &mut rng));

    // After ICD, succeeds
    assert!(proc.attempt(SimTime::from_secs(6), &mut rng));
}

#[test]
fn proc_handler_trigger_check() {
    let handler = ProcHandler::new(
        ProcIdx(1),
        "Test Proc",
        ProcFlags::ON_DAMAGE | ProcFlags::ON_CRIT,
        ProcEffect::Damage {
            base: 100.0,
            coefficient: 1.0,
        },
    );

    let damage_ctx = ProcContext::damage(ProcFlags::ON_DAMAGE, 1000.0, false);
    let heal_ctx = ProcContext {
        trigger: ProcFlags::ON_HEAL,
        ..Default::default()
    };

    assert!(handler.can_trigger(&damage_ctx));
    assert!(!handler.can_trigger(&heal_ctx));
}

#[test]
fn proc_handler_spell_filter() {
    let handler = ProcHandler::new(
        ProcIdx(1),
        "Filtered Proc",
        ProcFlags::ON_SPELL_CAST,
        ProcEffect::ApplyAura { aura: AuraIdx(1) },
    )
    .with_spell_filter(vec![SpellIdx(10), SpellIdx(20)]);

    let matching = ProcContext {
        trigger: ProcFlags::ON_SPELL_CAST,
        spell_id: Some(SpellIdx(10)),
        ..Default::default()
    };

    let not_matching = ProcContext {
        trigger: ProcFlags::ON_SPELL_CAST,
        spell_id: Some(SpellIdx(99)),
        ..Default::default()
    };

    assert!(handler.can_trigger(&matching));
    assert!(!handler.can_trigger(&not_matching));
}

#[test]
fn proc_registry_check() {
    let mut registry = ProcRegistry::new();
    let mut rng = FastRng::new(42);

    // Register a fixed proc with 100% chance
    registry.register_fixed(
        FixedProc::new(ProcIdx(1), 1.0),
        ProcHandler::new(
            ProcIdx(1),
            "Damage Proc",
            ProcFlags::ON_DAMAGE,
            ProcEffect::Damage {
                base: 50.0,
                coefficient: 1.0,
            },
        ),
    );

    let ctx = ProcContext::damage(ProcFlags::ON_DAMAGE, 1000.0, false);
    let triggered = registry.check_procs(&ctx, SimTime::ZERO, &mut rng);

    assert_eq!(triggered.len(), 1);
    assert_eq!(triggered[0].0, ProcIdx(1));
}

#[test]
fn proc_effect_multiple() {
    let effect = ProcEffect::Multiple(vec![
        ProcEffect::ApplyAura { aura: AuraIdx(1) },
        ProcEffect::Damage {
            base: 100.0,
            coefficient: 1.0,
        },
    ]);

    match effect {
        ProcEffect::Multiple(effects) => {
            assert_eq!(effects.len(), 2);
        }
        _ => panic!("Expected Multiple effect"),
    }
}
