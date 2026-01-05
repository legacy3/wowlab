//! Benchmark comparing AST optimization caching vs plain Rhai evaluation.
//!
//! This benchmark demonstrates the performance characteristics of the rotation
//! compiler at each optimization phase.
//!
//! # Optimization Phases
//!
//! ## Compile Time (once)
//!
//! 1. Preprocess: `$state` lookups become flat variables, extract method calls
//! 2. Parse: Rhai compiles to unoptimized AST
//! 3. Schema: Extract all variable names from AST
//!
//! ## Static Optimization (on talent/config change)
//!
//! 4. `optimize_partial()`: Bake in talents, config to create partial AST
//!    - Eliminates talent branches that will never be taken
//!    - Only re-run when talents/config change (rarely)
//!
//! ## Dynamic Optimization (on state change)
//!
//! 5. Evaluate method calls ONCE (`spell.ready()`, `aura.stacks()`, etc.)
//! 6. `optimize_from_partial()`: Inject dynamic state to create final AST
//!    - Eliminates branches based on cooldowns, resources, buffs
//!    - Re-run when game state changes
//!
//! ## Tick Execution (every tick)
//!
//! 7. `evaluate_optimized()`: Walk minimal AST to extract Action
//!    - AST is already folded to just the action string
//!    - ~0.07 us per tick

// Benchmark code has specific style requirements for readable output
#![allow(clippy::similar_names)]
#![allow(clippy::too_many_lines)]
#![allow(clippy::cast_precision_loss)]
#![allow(clippy::uninlined_format_args)] // Aligned format strings are more readable

use poc::{GameState, PlainEvaluator, RotationCompiler};
use std::time::Instant;

/// Script using method calls (extracted and evaluated once per tick).
///
/// This script uses `$spell.X.ready()` style method calls that get extracted
/// and replaced with placeholder variables during preprocessing.
const SCRIPT_WITH_METHODS: &str = r"
    if $talent.killer_instinct.enabled && $target.health_pct < 0.2 {
        cast($spell.kill_shot)
    } else if $spell.bestial_wrath.ready() {
        cast($spell.bestial_wrath)
    } else if $talent.dire_beast.enabled && $spell.dire_beast.ready() {
        cast($spell.dire_beast)
    } else if $spell.kill_command.ready() && $power.focus >= 30.0 {
        cast($spell.kill_command)
    } else if $spell.barbed_shot.ready() && $aura.frenzy.remaining < 2.0 {
        cast($spell.barbed_shot)
    } else if $talent.chimaera_shot.enabled && $spell.chimaera_shot.ready() {
        cast($spell.chimaera_shot)
    } else if $spell.cobra_shot.ready() && $power.focus >= 35.0 {
        cast($spell.cobra_shot)
    } else {
        wait_gcd()
    }
";

/// Same script using properties only (no method extraction).
///
/// Uses `$cooldown` namespace for ready checks (flattened, not stringified).
/// This demonstrates the performance difference when no method extraction is needed.
const SCRIPT_PROPERTIES_ONLY: &str = r"
    if $talent.killer_instinct.enabled && $target.health_pct < 0.2 {
        cast($spell.kill_shot)
    } else if $cooldown.bestial_wrath.ready {
        cast($spell.bestial_wrath)
    } else if $talent.dire_beast.enabled && $cooldown.dire_beast.ready {
        cast($spell.dire_beast)
    } else if $cooldown.kill_command.ready && $power.focus >= 30.0 {
        cast($spell.kill_command)
    } else if $cooldown.barbed_shot.ready && $aura.frenzy.remaining < 2.0 {
        cast($spell.barbed_shot)
    } else if $talent.chimaera_shot.enabled && $cooldown.chimaera_shot.ready {
        cast($spell.chimaera_shot)
    } else if $cooldown.cobra_shot.ready && $power.focus >= 35.0 {
        cast($spell.cobra_shot)
    } else {
        wait_gcd()
    }
";

fn main() {
    println!("=== Rotation Compiler Benchmark ===\n");

    // Compile both versions
    let with_methods = RotationCompiler::compile(SCRIPT_WITH_METHODS).unwrap();
    let props_only = RotationCompiler::compile(SCRIPT_PROPERTIES_ONLY).unwrap();
    let plain = PlainEvaluator::compile(SCRIPT_PROPERTIES_ONLY).unwrap();

    // Show extracted method calls
    println!("--- Method Call Extraction ---\n");
    let methods = with_methods.schema().method_calls();
    println!("  Extracted {} method calls:", methods.len());
    for call in methods {
        println!(
            "    {} ← ${}.{}.{}()",
            call.var, call.namespace, call.path.join("."), call.method
        );
    }

    println!("\n  Properties version: {} variables", props_only.schema().len());
    println!("  Methods version:    {} variables ({} props + {} method vars)",
        with_methods.schema().len(),
        with_methods.schema().len() - methods.len(),
        methods.len()
    );

    // Build test states
    let states_props = build_states_props(&props_only);
    let states_methods = build_states_methods(&with_methods);

    // =========================================================================
    println!("\n--- Optimization Phases (timing) ---\n");

    let state_props = &states_props[1].1; // Kill Command scenario
    let state_methods = &states_methods[1].1;

    // Phase 1: Full optimize (no two-pass)
    let full_opt_props = time_us(1000, || drop(props_only.optimize(state_props)));
    let full_opt_methods = time_us(1000, || drop(with_methods.optimize(state_methods)));

    println!("  1. Full optimize() [on every state change]:");
    println!("       Properties only: {:>7.2} μs", full_opt_props);
    println!("       With methods:    {:>7.2} μs", full_opt_methods);

    // Phase 2: Two-pass optimization
    let static_state_props = build_static_state(&props_only);
    let static_state_methods = build_static_state(&with_methods);

    let partial_props = time_us(1000, || drop(props_only.optimize_partial(&static_state_props)));
    let partial_methods = time_us(1000, || drop(with_methods.optimize_partial(&static_state_methods)));

    println!("\n  2. optimize_partial() [on talent/config change]:");
    println!("       Properties only: {:>7.2} μs", partial_props);
    println!("       With methods:    {:>7.2} μs", partial_methods);

    let partial_ast_props = props_only.optimize_partial(&static_state_props);
    let partial_ast_methods = with_methods.optimize_partial(&static_state_methods);

    let from_partial_props = time_us(1000, || {
        drop(props_only.optimize_from_partial(&partial_ast_props, state_props));
    });
    let from_partial_methods = time_us(1000, || {
        drop(with_methods.optimize_from_partial(&partial_ast_methods, state_methods));
    });

    println!("\n  3. optimize_from_partial() [on dynamic state change]:");
    println!("       Properties only: {:>7.2} μs", from_partial_props);
    println!("       With methods:    {:>7.2} μs", from_partial_methods);

    // Phase 3: Walk optimized AST
    let optimized_props = props_only.optimize(state_props);
    let optimized_methods = with_methods.optimize(state_methods);

    let walk_props = time_us(1000, || drop(props_only.evaluate_optimized(&optimized_props)));
    let walk_methods = time_us(1000, || drop(with_methods.evaluate_optimized(&optimized_methods)));

    println!("\n  4. evaluate_optimized() [every tick]:");
    println!("       Properties only: {:>7.2} μs", walk_props);
    println!("       With methods:    {:>7.2} μs", walk_methods);

    // Plain Rhai baseline
    let plain_us = time_us(1000, || drop(plain.evaluate(state_props)));
    println!("\n  5. Plain Rhai eval:   {:>7.2} μs", plain_us);

    // =========================================================================
    println!("\n--- Correctness ---\n");
    for ((name, sp), (_, sm)) in states_props.iter().zip(states_methods.iter()) {
        let rp = props_only.evaluate(sp);
        let rm = with_methods.evaluate(sm);
        let ok = rp == rm;
        println!("  {:20} {} {:?}", name, if ok { "✓" } else { "✗" }, rp);
    }

    // =========================================================================
    println!("\n--- Scenario: Typical Simulation ---\n");
    println!("  Assumptions:");
    println!("    - Talents change: never (baked at start)");
    println!("    - Dynamic state changes: every ~10 ticks");
    println!("    - Ticks per second: 1000");

    let n = states_props.len();

    // Two-pass approach: partial once, then optimize_from_partial on state change
    let two_pass_props = bench(
        || {
            for (_, s) in &states_props {
                let o = props_only.optimize_from_partial(&partial_ast_props, s);
                for _ in 0..10 {
                    drop(props_only.evaluate_optimized(&o));
                }
            }
        },
        n * 10,
    );

    let two_pass_methods = bench(
        || {
            for (_, s) in &states_methods {
                let o = with_methods.optimize_from_partial(&partial_ast_methods, s);
                for _ in 0..10 {
                    drop(with_methods.evaluate_optimized(&o));
                }
            }
        },
        n * 10,
    );

    let plain_bench = bench(
        || {
            for (_, s) in &states_props {
                drop(plain.evaluate(s));
            }
        },
        n,
    );

    println!("\n  Results (10 ticks per state change):");
    println!("    Plain Rhai:         {:>7.2} μs/tick", plain_bench);
    println!("    Two-pass (props):   {:>7.2} μs/tick", two_pass_props);
    println!("    Two-pass (methods): {:>7.2} μs/tick", two_pass_methods);
    println!("\n    Speedup vs plain:   {:.1}x", plain_bench / two_pass_methods);

    // Break-even analysis
    println!("\n--- Break-even Analysis ---\n");
    let optimize_cost = from_partial_methods;
    let walk_cost = walk_methods;
    let plain_cost = plain_us;

    if plain_cost > walk_cost {
        let break_even = optimize_cost / (plain_cost - walk_cost);
        println!("  optimize_from_partial: {:>6.2} μs", optimize_cost);
        println!("  evaluate_optimized:    {:>6.2} μs", walk_cost);
        println!("  plain Rhai:            {:>6.2} μs", plain_cost);
        println!("  savings per tick:      {:>6.2} μs", plain_cost - walk_cost);
        println!("\n  Break-even: {:.1} ticks per state change", break_even);
    }
}

/// Builds static state (talents/config only) for two-pass optimization.
///
/// This state is used to create a partial AST with talent branches eliminated.
fn build_static_state(c: &RotationCompiler) -> GameState {
    let s = c.schema();
    let mut st = c.new_state();

    // Set all talent.*.enabled to false by default
    for k in s.keys() {
        if let Some(slot) = s.slot(k) {
            if k.starts_with("talent_") && k.ends_with("_enabled") {
                st.set_bool(slot, false);
            }
        }
    }

    // Enable specific talents for testing
    if let Some(slot) = s.slot("talent_killer_instinct_enabled") {
        st.set_bool(slot, true);
    }
    if let Some(slot) = s.slot("talent_dire_beast_enabled") {
        st.set_bool(slot, true);
    }

    st
}

/// Builds test states for the properties-only version of the script.
///
/// Returns a vector of (scenario name, state) pairs for benchmarking.
fn build_states_props(c: &RotationCompiler) -> Vec<(&'static str, GameState)> {
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
        // Enable talents
        if let Some(slot) = s.slot("talent_killer_instinct_enabled") {
            st.set_bool(slot, true);
        }
        if let Some(slot) = s.slot("talent_dire_beast_enabled") {
            st.set_bool(slot, true);
        }
        // Set target health high (so kill_shot condition fails)
        if let Some(slot) = s.slot("target_health_pct") {
            st.set_float(slot, 0.8);
        }
        st
    };

    vec![
        ("Bestial Wrath", {
            let mut st = default();
            if let Some(slot) = s.slot("cooldown_bestial_wrath_ready") {
                st.set_bool(slot, true);
            }
            st
        }),
        ("Kill Command", {
            let mut st = default();
            if let Some(slot) = s.slot("cooldown_kill_command_ready") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("power_focus") {
                st.set_float(slot, 50.0);
            }
            st
        }),
        ("Barbed Shot", {
            let mut st = default();
            if let Some(slot) = s.slot("cooldown_barbed_shot_ready") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("aura_frenzy_remaining") {
                st.set_float(slot, 1.5);
            }
            st
        }),
        ("Cobra Shot", {
            let mut st = default();
            if let Some(slot) = s.slot("cooldown_cobra_shot_ready") {
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

/// Builds test states for the method-call version of the script.
///
/// Returns a vector of (scenario name, state) pairs for benchmarking.
fn build_states_methods(c: &RotationCompiler) -> Vec<(&'static str, GameState)> {
    let s = c.schema();

    let default = || {
        let mut st = c.new_state();
        for k in s.keys() {
            if let Some(slot) = s.slot(k) {
                if k.contains("enabled") || k.starts_with("__m") {
                    st.set_bool(slot, false);
                } else {
                    st.set_float(slot, 0.0);
                }
            }
        }
        // Enable talents
        if let Some(slot) = s.slot("talent_killer_instinct_enabled") {
            st.set_bool(slot, true);
        }
        if let Some(slot) = s.slot("talent_dire_beast_enabled") {
            st.set_bool(slot, true);
        }
        // Set target health high (so kill_shot condition fails)
        if let Some(slot) = s.slot("target_health_pct") {
            st.set_float(slot, 0.8);
        }
        st
    };

    // Map method call vars by spell name for convenience
    let method_var = |spell: &str| -> Option<usize> {
        for call in s.method_calls() {
            if call.path.first().map(String::as_str) == Some(spell) {
                return s.slot(&call.var);
            }
        }
        None
    };

    vec![
        ("Bestial Wrath", {
            let mut st = default();
            if let Some(slot) = method_var("bestial_wrath") {
                st.set_bool(slot, true);
            }
            st
        }),
        ("Kill Command", {
            let mut st = default();
            if let Some(slot) = method_var("kill_command") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("power_focus") {
                st.set_float(slot, 50.0);
            }
            st
        }),
        ("Barbed Shot", {
            let mut st = default();
            if let Some(slot) = method_var("barbed_shot") {
                st.set_bool(slot, true);
            }
            if let Some(slot) = s.slot("aura_frenzy_remaining") {
                st.set_float(slot, 1.5);
            }
            st
        }),
        ("Cobra Shot", {
            let mut st = default();
            if let Some(slot) = method_var("cobra_shot") {
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

/// Measures the average time in microseconds for a function over `n` iterations.
fn time_us(n: usize, mut f: impl FnMut()) -> f64 {
    let start = Instant::now();
    for _ in 0..n {
        f();
    }
    start.elapsed().as_micros() as f64 / n as f64
}

/// Runs a benchmark with warmup, returning average microseconds per evaluation.
///
/// Performs 100 warmup iterations, then 10,000 timed iterations.
fn bench(mut f: impl FnMut(), evals: usize) -> f64 {
    // Warmup
    for _ in 0..100 {
        f();
    }
    // Timed run
    let start = Instant::now();
    for _ in 0..10_000 {
        f();
    }
    start.elapsed().as_micros() as f64 / (10_000 * evals) as f64
}
