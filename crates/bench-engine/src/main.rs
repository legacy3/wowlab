use engine::config::{
    PlayerConfig, ResourceConfig, ResourceType, SimConfig, SpecId, SpellDef, Stats, TargetConfig,
    DamageFormula, ResourceCost,
};
use engine::rotation::RotationAction;
use engine::sim::{run_batch, SimState};
use engine::util::FastRng;
use std::time::Instant;

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
        },
        pet: None,
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
            // Barbed Shot
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
                effects: vec![],
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
            // Bestial Wrath
            SpellDef {
                id: 19574,
                name: "Bestial Wrath".to_string(),
                cooldown: 90.0,
                charges: 0,
                gcd: 0.0, // off-GCD
                cast_time: 0.0,
                cost: ResourceCost::default(),
                damage: DamageFormula::default(),
                effects: vec![],
                is_gcd: false,
                is_harmful: false,
            },
        ],
        auras: vec![],
        rotation: vec![
            RotationAction::Cast { spell_id: 34026 },
            RotationAction::Cast { spell_id: 217200 },
            RotationAction::Cast { spell_id: 193455 },
        ],
        duration: 300.0, // 5 minute fight
        target: TargetConfig {
            level_diff: 3,
            max_health: 10_000_000.0,
            armor: 0.0,
        },
    }
}

fn main() {
    println!("=== Engine Benchmark ===\n");

    let config = create_bm_hunter_config();
    let mut state = SimState::new(&config);
    let mut rng = FastRng::new(12345);

    // Warmup
    println!("Warming up...");
    let _ = run_batch(&mut state, &config, &mut rng, 1000, 0);

    // Benchmark different iteration counts
    for &iterations in &[1_000u32, 10_000, 100_000, 1_000_000] {
        let start = Instant::now();
        let result = run_batch(&mut state, &config, &mut rng, iterations, 0);
        let elapsed = start.elapsed();

        let sims_per_sec = iterations as f64 / elapsed.as_secs_f64();
        println!(
            "{:>10} sims: {:>8.2?} ({:.2}M sims/sec, avg DPS: {:.0})",
            iterations,
            elapsed,
            sims_per_sec / 1_000_000.0,
            result.mean_dps
        );
    }

    println!("\n--- Scaling to Raidbots level ---");

    // 16M combinations benchmark
    let iterations = 16_000_000u32;
    println!("\nRunning {} iterations (top gear scale)...", iterations);

    let start = Instant::now();
    let result = run_batch(&mut state, &config, &mut rng, iterations, 0);
    let elapsed = start.elapsed();

    let sims_per_sec = iterations as f64 / elapsed.as_secs_f64();
    println!("Time: {:?}", elapsed);
    println!("Throughput: {:.2}M sims/sec", sims_per_sec / 1_000_000.0);
    println!("Avg DPS: {:.0}", result.mean_dps);
}
