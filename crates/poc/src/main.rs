//! Benchmark comparing AST optimization caching vs plain Rhai evaluation.

use poc::{GameState, PlainEvaluator, RotationCompiler};
use std::time::Instant;

const SCRIPT: &str = r#"
    if $talent.killer_instinct.enabled && $target.health_pct < 0.2 {
        cast($spell.kill_shot)
    } else if spell_bestial_wrath_ready {
        cast($spell.bestial_wrath)
    } else if $talent.dire_beast.enabled && spell_dire_beast_ready {
        cast($spell.dire_beast)
    } else if spell_kill_command_ready && $power.focus >= 30.0 {
        cast($spell.kill_command)
    } else if spell_barbed_shot_ready && $aura.frenzy.remaining < 2.0 {
        cast($spell.barbed_shot)
    } else if $talent.chimaera_shot.enabled && spell_chimaera_shot_ready {
        cast($spell.chimaera_shot)
    } else if spell_cobra_shot_ready && $power.focus >= 35.0 {
        cast($spell.cobra_shot)
    } else {
        wait_gcd()
    }
"#;

fn main() {
    println!("=== Rotation Compiler Benchmark ===\n");

    let compiler = RotationCompiler::compile(SCRIPT).unwrap();
    let plain = PlainEvaluator::compile(SCRIPT).unwrap();

    println!("Schema: {} variables", compiler.schema().len());
    for key in compiler.schema().keys() {
        println!("  {}", key);
    }

    let states = build_states(&compiler);

    println!("\n--- Correctness ---\n");
    for (name, state) in &states {
        let opt = compiler.evaluate(state);
        let pln = plain.evaluate(state);
        let ok = format!("{:?}", opt) == pln;
        println!("  {:30} {} {:?}", name, if ok { "✓" } else { "✗" }, opt);
    }

    println!("\n--- Timing (1000 iter) ---\n");
    let state = &states[0].1;

    let optimize_us = time_us(1000, || drop(compiler.optimize(state)));
    let optimized = compiler.optimize(state);
    let walk_us = time_us(1000, || drop(compiler.evaluate_optimized(&optimized)));
    let plain_us = time_us(1000, || drop(plain.evaluate(state)));

    println!("  optimize():           {:>7.2} μs", optimize_us);
    println!("  evaluate_optimized(): {:>7.2} μs", walk_us);
    println!("  plain Rhai:           {:>7.2} μs", plain_us);

    println!("\n--- Scenarios ---\n");
    let n = states.len();

    let cached_10 = bench(|| {
        for (_, s) in &states {
            let o = compiler.optimize(s);
            for _ in 0..10 {
                drop(compiler.evaluate_optimized(&o));
            }
        }
    }, n * 10);

    let cached_100 = bench(|| {
        for (_, s) in &states {
            let o = compiler.optimize(s);
            for _ in 0..100 {
                drop(compiler.evaluate_optimized(&o));
            }
        }
    }, n * 100);

    let plain_bench = bench(|| {
        for (_, s) in &states {
            drop(plain.evaluate(s));
        }
    }, n);

    println!("  Plain Rhai:                   {:>7.2} μs/tick", plain_bench);
    println!("  Optimized (10 ticks/change):  {:>7.2} μs/tick", cached_10);
    println!("  Optimized (100 ticks/change): {:>7.2} μs/tick", cached_100);

    if plain_us > walk_us {
        let break_even = optimize_us / (plain_us - walk_us);
        println!("\n  Break-even: ~{:.0} ticks", break_even);
    }
    println!("  Speedup @100: {:.1}x", plain_bench / cached_100);
}

fn build_states(c: &RotationCompiler) -> Vec<(&'static str, GameState)> {
    let s = c.schema();

    let default = || {
        let mut st = c.new_state();
        for k in s.keys() {
            if let Some(slot) = s.slot(k) {
                if k.contains("enabled") || k.contains("ready") {
                    st.set_bool(slot, false);
                } else {
                    st.set_float(slot, 0.0);
                }
            }
        }
        st
    };

    vec![
        ("Bestial Wrath", {
            let mut st = default();
            if let Some(slot) = s.slot("spell_bestial_wrath_ready") {
                st.set_bool(slot, true);
            }
            st
        }),
        ("Kill Command", {
            let mut st = default();
            if let Some(slot) = s.slot("spell_kill_command_ready") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("power_focus") {
                st.set_float(slot, 50.0);
            }
            st
        }),
        ("Barbed Shot", {
            let mut st = default();
            if let Some(slot) = s.slot("spell_barbed_shot_ready") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("aura_frenzy_remaining") {
                st.set_float(slot, 1.5);
            }
            st
        }),
        ("Cobra Shot", {
            let mut st = default();
            if let Some(slot) = s.slot("spell_cobra_shot_ready") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("power_focus") {
                st.set_float(slot, 50.0);
            }
            st
        }),
        ("Nothing", default()),
    ]
}

fn time_us(n: usize, mut f: impl FnMut()) -> f64 {
    let start = Instant::now();
    for _ in 0..n {
        f();
    }
    start.elapsed().as_micros() as f64 / n as f64
}

fn bench(mut f: impl FnMut(), evals: usize) -> f64 {
    for _ in 0..100 {
        f();
    }
    let start = Instant::now();
    for _ in 0..10_000 {
        f();
    }
    start.elapsed().as_micros() as f64 / (10_000 * evals) as f64
}
