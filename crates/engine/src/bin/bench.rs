use engine::config::{
    AuraDef, AuraEffect, DamageFormula, PetConfig, PlayerConfig, ResourceConfig, ResourceCost,
    ResourceType, SimConfig, SpecId, SpellDef, SpellEffect, Stats, TargetConfig,
};
use engine::script::RotationScript;
use engine::sim::{run_batch, run_simulation, SimState};
use engine::util::FastRng;
use std::time::Instant;

/// Simple priority rotation in WAT: iterate spells, return first ready one
const ROTATION_WAT: &str = r#"
(module
  (import "env" "spell_count" (func $spell_count (result i32)))
  (import "env" "spell_ready" (func $spell_ready (param i32) (result i32)))

  (func (export "get_next_action") (result i32)
    (local $i i32)
    (local $count i32)

    ;; Get spell count
    (local.set $count (call $spell_count))

    ;; Loop through spells
    (block $done
      (loop $loop
        ;; Check bounds
        (br_if $done (i32.ge_u (local.get $i) (local.get $count)))

        ;; If spell ready, return index
        (if (call $spell_ready (local.get $i))
          (then (return (local.get $i)))
        )

        ;; Increment and continue
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )

    ;; No spell ready, return -1
    (i32.const -1)
  )
)
"#;

fn create_bm_hunter_config() -> SimConfig {
    SimConfig {
        player: PlayerConfig {
            name: "BenchHunter".to_string(),
            spec: SpecId::BeastMastery,
            stats: Stats {
                agility: 10000.0,
                stamina: 8000.0,
                crit_pct: 25.0,
                haste_pct: 20.0,
                mastery_pct: 30.0,
                versatility_pct: 5.0,
                ..Default::default()
            },
            resources: ResourceConfig {
                resource_type: ResourceType::Focus,
                max: 100.0,
                regen_per_second: 10.0,
                initial: 100.0,
            },
            // Ranged weapon (bow) - 3.0 second base speed
            weapon_speed: 3.0,
            weapon_damage: (500.0, 700.0),
        },
        pet: Some(PetConfig {
            name: "Hati".to_string(),
            stats: Stats {
                agility: 5000.0,
                strength: 1000.0,
                crit_pct: 20.0,
                haste_pct: 15.0,
                ..Default::default()
            },
            spells: vec![],
            attack_speed: 2.0,
            attack_damage: (300.0, 400.0),
        }),
        spells: vec![
            // Kill Command
            SpellDef {
                id: 34026,
                name: "Kill Command".to_string(),
                cooldown: 7.5,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 30.0,
                },
                damage: DamageFormula {
                    base_min: 1000.0,
                    base_max: 1200.0,
                    ap_coefficient: 0.6,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Barbed Shot - applies a DoT
            SpellDef {
                id: 217200,
                name: "Barbed Shot".to_string(),
                cooldown: 12.0,
                charges: 2,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula {
                    base_min: 500.0,
                    base_max: 600.0,
                    ap_coefficient: 0.3,
                    ..Default::default()
                },
                effects: vec![
                    SpellEffect::ApplyAura {
                        aura_id: 217200,
                        duration: 8.0,
                    }, // Barbed Shot bleed
                ],
                is_gcd: true,
                is_harmful: true,
            },
            // Cobra Shot
            SpellDef {
                id: 193455,
                name: "Cobra Shot".to_string(),
                cooldown: 0.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 35.0,
                },
                damage: DamageFormula {
                    base_min: 800.0,
                    base_max: 900.0,
                    ap_coefficient: 0.4,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Bestial Wrath - applies buff
            SpellDef {
                id: 19574,
                name: "Bestial Wrath".to_string(),
                cooldown: 90.0,
                charges: 0,
                gcd: 0.0, // off-GCD
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula::default(),
                effects: vec![SpellEffect::ApplyAura {
                    aura_id: 19574,
                    duration: 15.0,
                }],
                is_gcd: false,
                is_harmful: false,
            },
            // Serpent Sting - applies DoT
            SpellDef {
                id: 271788,
                name: "Serpent Sting".to_string(),
                cooldown: 0.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 10.0,
                },
                damage: DamageFormula {
                    base_min: 100.0,
                    base_max: 120.0,
                    ap_coefficient: 0.1,
                    ..Default::default()
                },
                effects: vec![SpellEffect::ApplyAura {
                    aura_id: 271788,
                    duration: 18.0,
                }],
                is_gcd: true,
                is_harmful: true,
            },
            // Multi-Shot
            SpellDef {
                id: 2643,
                name: "Multi-Shot".to_string(),
                cooldown: 0.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 40.0,
                },
                damage: DamageFormula {
                    base_min: 400.0,
                    base_max: 500.0,
                    ap_coefficient: 0.25,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Dire Beast
            SpellDef {
                id: 120679,
                name: "Dire Beast".to_string(),
                cooldown: 20.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula {
                    base_min: 600.0,
                    base_max: 800.0,
                    ap_coefficient: 0.4,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // A Murder of Crows
            SpellDef {
                id: 131894,
                name: "A Murder of Crows".to_string(),
                cooldown: 60.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 30.0,
                },
                damage: DamageFormula {
                    base_min: 300.0,
                    base_max: 400.0,
                    ap_coefficient: 0.2,
                    ..Default::default()
                },
                effects: vec![SpellEffect::ApplyAura {
                    aura_id: 131894,
                    duration: 15.0,
                }],
                is_gcd: true,
                is_harmful: true,
            },
            // Aspect of the Wild
            SpellDef {
                id: 193530,
                name: "Aspect of the Wild".to_string(),
                cooldown: 120.0,
                charges: 0,
                gcd: 0.0,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula::default(),
                effects: vec![SpellEffect::ApplyAura {
                    aura_id: 193530,
                    duration: 20.0,
                }],
                is_gcd: false,
                is_harmful: false,
            },
            // Bloodshed
            SpellDef {
                id: 321530,
                name: "Bloodshed".to_string(),
                cooldown: 60.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula {
                    base_min: 1500.0,
                    base_max: 1800.0,
                    ap_coefficient: 0.8,
                    ..Default::default()
                },
                effects: vec![SpellEffect::ApplyAura {
                    aura_id: 321530,
                    duration: 18.0,
                }],
                is_gcd: true,
                is_harmful: true,
            },
            // Stampede
            SpellDef {
                id: 201430,
                name: "Stampede".to_string(),
                cooldown: 120.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula {
                    base_min: 2000.0,
                    base_max: 2500.0,
                    ap_coefficient: 1.0,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Chimaera Shot
            SpellDef {
                id: 53209,
                name: "Chimaera Shot".to_string(),
                cooldown: 15.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 20.0,
                },
                damage: DamageFormula {
                    base_min: 700.0,
                    base_max: 850.0,
                    ap_coefficient: 0.35,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Wailing Arrow
            SpellDef {
                id: 392060,
                name: "Wailing Arrow".to_string(),
                cooldown: 60.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 2.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 15.0,
                },
                damage: DamageFormula {
                    base_min: 1200.0,
                    base_max: 1400.0,
                    ap_coefficient: 0.7,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Explosive Shot
            SpellDef {
                id: 212431,
                name: "Explosive Shot".to_string(),
                cooldown: 30.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost {
                    resource_type: ResourceType::Focus,
                    amount: 20.0,
                },
                damage: DamageFormula {
                    base_min: 900.0,
                    base_max: 1100.0,
                    ap_coefficient: 0.5,
                    ..Default::default()
                },
                effects: vec![],
                is_gcd: true,
                is_harmful: true,
            },
            // Death Chakram
            SpellDef {
                id: 375891,
                name: "Death Chakram".to_string(),
                cooldown: 45.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula {
                    base_min: 800.0,
                    base_max: 1000.0,
                    ap_coefficient: 0.45,
                    ..Default::default()
                },
                effects: vec![SpellEffect::Energize {
                    resource_type: ResourceType::Focus,
                    amount: 10.0,
                }],
                is_gcd: true,
                is_harmful: true,
            },
            // Steel Trap
            SpellDef {
                id: 162488,
                name: "Steel Trap".to_string(),
                cooldown: 30.0,
                charges: 0,
                gcd: 1.5,
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula {
                    base_min: 500.0,
                    base_max: 600.0,
                    ap_coefficient: 0.25,
                    ..Default::default()
                },
                effects: vec![SpellEffect::ApplyAura {
                    aura_id: 162487,
                    duration: 20.0,
                }],
                is_gcd: true,
                is_harmful: true,
            },
        ],
        auras: vec![
            // Barbed Shot bleed - 8 sec duration, ticks every 2 sec (4 ticks)
            AuraDef {
                id: 217200,
                name: "Barbed Shot".to_string(),
                duration: 8.0,
                max_stacks: 1,
                effects: vec![AuraEffect::PeriodicDamage {
                    amount: 200.0,
                    coefficient: 0.15,
                }],
                pandemic: false,
                tick_interval: 2.0,
            },
            // Serpent Sting - 18 sec duration, ticks every 3 sec (6 ticks)
            AuraDef {
                id: 271788,
                name: "Serpent Sting".to_string(),
                duration: 18.0,
                max_stacks: 1,
                effects: vec![AuraEffect::PeriodicDamage {
                    amount: 150.0,
                    coefficient: 0.1,
                }],
                pandemic: true,
                tick_interval: 3.0,
            },
            // Bestial Wrath buff - damage increase
            AuraDef {
                id: 19574,
                name: "Bestial Wrath".to_string(),
                duration: 15.0,
                max_stacks: 1,
                effects: vec![AuraEffect::DamageDone {
                    percent: 25.0,
                    school: None,
                }],
                pandemic: false,
                tick_interval: 0.0,
            },
            // A Murder of Crows - periodic damage
            AuraDef {
                id: 131894,
                name: "A Murder of Crows".to_string(),
                duration: 15.0,
                max_stacks: 1,
                effects: vec![AuraEffect::PeriodicDamage {
                    amount: 250.0,
                    coefficient: 0.12,
                }],
                pandemic: false,
                tick_interval: 1.0,
            },
            // Aspect of the Wild buff - crit increase
            AuraDef {
                id: 193530,
                name: "Aspect of the Wild".to_string(),
                duration: 20.0,
                max_stacks: 1,
                effects: vec![AuraEffect::DamageDone {
                    percent: 10.0,
                    school: None,
                }],
                pandemic: false,
                tick_interval: 0.0,
            },
            // Bloodshed - bleed DoT
            AuraDef {
                id: 321530,
                name: "Bloodshed".to_string(),
                duration: 18.0,
                max_stacks: 1,
                effects: vec![AuraEffect::PeriodicDamage {
                    amount: 300.0,
                    coefficient: 0.2,
                }],
                pandemic: false,
                tick_interval: 2.0,
            },
            // Steel Trap - bleed DoT
            AuraDef {
                id: 162487,
                name: "Steel Trap".to_string(),
                duration: 20.0,
                max_stacks: 1,
                effects: vec![AuraEffect::PeriodicDamage {
                    amount: 180.0,
                    coefficient: 0.08,
                }],
                pandemic: false,
                tick_interval: 2.0,
            },
        ],
        duration: 300.0, // 5 minute fight (realistic boss fight)
        target: TargetConfig {
            level_diff: 3,
            max_health: 10_000_000.0,
            armor: 0.0,
        },
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let iterations: u32 = args
        .get(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(1_000_000);
    let duration: f32 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(300.0);

    println!("=== Engine Benchmark ===\n");

    let mut config = create_bm_hunter_config();
    config.duration = duration;
    config.finalize(); // Precompute derived stats
    let mut state = SimState::new(&config);
    let mut rng = FastRng::new(12345);

    // Compile WAT to WASM and create rotation script
    let wasm_bytes = wat::parse_str(ROTATION_WAT).expect("Failed to parse WAT");
    let mut rotation = RotationScript::new(&wasm_bytes, &config).expect("Failed to create rotation script");

    // Single sim
    rng.reseed(0);
    let result = run_simulation(&mut state, &config, &mut rng, &mut rotation);
    println!(
        "Single {}s sim: {} casts, {:.0} DPS",
        config.duration, result.casts, result.dps
    );

    #[cfg(feature = "meta_events")]
    {
        let batches = state.events.batches_processed;
        let events = state.events.events_processed;
        let avg_batch = events as f32 / batches as f32;
        println!(
            "Batches: {} (avg {:.2} events/batch, max {})",
            batches, avg_batch, state.events.max_batch_size
        );
    }

    // Warmup
    let _ = run_batch(&mut state, &config, &mut rng, &mut rotation, 1000, 0);

    // Main benchmark
    let warmup_iters = iterations.min(100_000);
    let start = Instant::now();
    let result = run_batch(&mut state, &config, &mut rng, &mut rotation, warmup_iters, 0);
    let elapsed = start.elapsed();
    let sims_per_sec = warmup_iters as f64 / elapsed.as_secs_f64();
    println!(
        "{:>10} sims: {:>8.2?} ({:.2}M sims/sec, avg DPS: {:.0})",
        warmup_iters,
        elapsed,
        sims_per_sec / 1_000_000.0,
        result.mean_dps
    );

    // Full benchmark
    println!("\n--- Full Benchmark ---");
    let start = Instant::now();
    let result = run_batch(&mut state, &config, &mut rng, &mut rotation, iterations, 0);
    let elapsed = start.elapsed();
    let sims_per_sec = iterations as f64 / elapsed.as_secs_f64();
    println!("Time: {:?}", elapsed);
    println!("Throughput: {:.2}M sims/sec", sims_per_sec / 1_000_000.0);
    println!("Avg DPS: {:.0}", result.mean_dps);
}
