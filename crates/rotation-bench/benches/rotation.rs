//! Benchmarks comparing rotation evaluation approaches

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use rand::SeedableRng;
use rand::rngs::StdRng;

use rotation_bench::{
    GameState,
    rhai_baseline::RhaiRotation,
    bytecode_vm::BytecodeRotation,
    native_enum::{NativeRotation, bm_hunter_inline},
    decision_tree::DecisionTree,
    lookup_table::LookupTable,
    cranelift_jit::JitRotation,
};

/// Generate test states with fixed seed for reproducibility
fn generate_states(count: usize) -> Vec<GameState> {
    let mut rng = StdRng::seed_from_u64(42);
    (0..count).map(|_| GameState::random(&mut rng)).collect()
}

fn benchmark_single_evaluation(c: &mut Criterion) {
    let mut group = c.benchmark_group("single_evaluation");

    let state = GameState::new();

    // Rhai baseline
    let rhai = RhaiRotation::new();
    group.bench_function("rhai", |b| {
        b.iter(|| rhai.evaluate(black_box(&state)))
    });

    // Bytecode VM
    let bytecode = BytecodeRotation::bm_hunter();
    group.bench_function("bytecode_vm", |b| {
        b.iter(|| bytecode.evaluate(black_box(&state)))
    });

    // Native enum dispatch
    let native = NativeRotation::bm_hunter();
    group.bench_function("native_enum", |b| {
        b.iter(|| native.evaluate(black_box(&state)))
    });

    // Hand-optimized inline
    group.bench_function("native_inline", |b| {
        b.iter(|| bm_hunter_inline(black_box(&state)))
    });

    // Decision tree
    let tree = DecisionTree::bm_hunter();
    group.bench_function("decision_tree", |b| {
        b.iter(|| tree.evaluate(black_box(&state)))
    });

    // Lookup table
    let lut = LookupTable::bm_hunter();
    group.bench_function("lookup_table", |b| {
        b.iter(|| lut.evaluate(black_box(&state)))
    });

    // Cranelift JIT
    let jit = JitRotation::bm_hunter().expect("Failed to compile JIT");
    group.bench_function("cranelift_jit", |b| {
        b.iter(|| jit.evaluate(black_box(&state)))
    });

    // Cranelift JIT raw function pointer (bypass Action conversion)
    let jit_func = jit.get_func();
    group.bench_function("cranelift_jit_raw", |b| {
        b.iter(|| jit_func(black_box(&state as *const GameState)))
    });

    group.finish();
}

fn benchmark_random_states(c: &mut Criterion) {
    let mut group = c.benchmark_group("random_states");

    let states = generate_states(1000);

    // Rhai baseline
    let rhai = RhaiRotation::new();
    group.bench_function("rhai", |b| {
        b.iter(|| {
            for state in &states {
                black_box(rhai.evaluate(black_box(state)));
            }
        })
    });

    // Bytecode VM
    let bytecode = BytecodeRotation::bm_hunter();
    group.bench_function("bytecode_vm", |b| {
        b.iter(|| {
            for state in &states {
                black_box(bytecode.evaluate(black_box(state)));
            }
        })
    });

    // Native enum dispatch
    let native = NativeRotation::bm_hunter();
    group.bench_function("native_enum", |b| {
        b.iter(|| {
            for state in &states {
                black_box(native.evaluate(black_box(state)));
            }
        })
    });

    // Hand-optimized inline
    group.bench_function("native_inline", |b| {
        b.iter(|| {
            for state in &states {
                black_box(bm_hunter_inline(black_box(state)));
            }
        })
    });

    // Decision tree
    let tree = DecisionTree::bm_hunter();
    group.bench_function("decision_tree", |b| {
        b.iter(|| {
            for state in &states {
                black_box(tree.evaluate(black_box(state)));
            }
        })
    });

    // Lookup table
    let lut = LookupTable::bm_hunter();
    group.bench_function("lookup_table", |b| {
        b.iter(|| {
            for state in &states {
                black_box(lut.evaluate(black_box(state)));
            }
        })
    });

    // Cranelift JIT
    let jit = JitRotation::bm_hunter().expect("Failed to compile JIT");
    group.bench_function("cranelift_jit", |b| {
        b.iter(|| {
            for state in &states {
                black_box(jit.evaluate(black_box(state)));
            }
        })
    });

    group.finish();
}

fn benchmark_throughput(c: &mut Criterion) {
    let mut group = c.benchmark_group("throughput");

    // Test different batch sizes
    for size in [100, 1000, 10000].iter() {
        let states = generate_states(*size);

        // Bytecode VM
        let bytecode = BytecodeRotation::bm_hunter();
        group.bench_with_input(
            BenchmarkId::new("bytecode_vm", size),
            size,
            |b, _| {
                b.iter(|| {
                    for state in &states {
                        black_box(bytecode.evaluate(black_box(state)));
                    }
                })
            },
        );

        // Native inline
        group.bench_with_input(
            BenchmarkId::new("native_inline", size),
            size,
            |b, _| {
                b.iter(|| {
                    for state in &states {
                        black_box(bm_hunter_inline(black_box(state)));
                    }
                })
            },
        );

        // Lookup table
        let lut = LookupTable::bm_hunter();
        group.bench_with_input(
            BenchmarkId::new("lookup_table", size),
            size,
            |b, _| {
                b.iter(|| {
                    for state in &states {
                        black_box(lut.evaluate(black_box(state)));
                    }
                })
            },
        );
    }

    group.finish();
}

fn benchmark_simulation_scenario(c: &mut Criterion) {
    // Simulate a 5-minute fight with ~200 decisions
    let mut group = c.benchmark_group("simulation_5min");
    group.sample_size(50);

    let iterations = 200; // ~200 GCDs in 5 minutes
    let states = generate_states(iterations);

    // Rhai (full simulation)
    let rhai = RhaiRotation::new();
    group.bench_function("rhai", |b| {
        b.iter(|| {
            let mut total = 0u64;
            for state in &states {
                if let rotation_bench::Action::Cast(spell) = rhai.evaluate(state) {
                    total += spell.0 as u64;
                }
            }
            total
        })
    });

    // Native inline (full simulation)
    group.bench_function("native_inline", |b| {
        b.iter(|| {
            let mut total = 0u64;
            for state in &states {
                if let rotation_bench::Action::Cast(spell) = bm_hunter_inline(state) {
                    total += spell.0 as u64;
                }
            }
            total
        })
    });

    // Lookup table (full simulation)
    let lut = LookupTable::bm_hunter();
    group.bench_function("lookup_table", |b| {
        b.iter(|| {
            let mut total = 0u64;
            for state in &states {
                if let rotation_bench::Action::Cast(spell) = lut.evaluate(state) {
                    total += spell.0 as u64;
                }
            }
            total
        })
    });

    group.finish();
}

criterion_group!(
    benches,
    benchmark_single_evaluation,
    benchmark_random_states,
    benchmark_throughput,
    benchmark_simulation_scenario,
);

criterion_main!(benches);
