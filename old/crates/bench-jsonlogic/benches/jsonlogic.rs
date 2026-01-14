//! Benchmark: Fair comparison of rotation evaluation approaches
//!
//! Run with: cargo bench -p bench-jsonlogic
//!
//! Two benchmark scenarios:
//! 1. **pure_eval**: Data already in engine's optimal format, measures raw evaluation speed
//! 2. **end_to_end**: Starting from native GameState, includes all conversion costs

use criterion::{black_box, criterion_group, criterion_main, Criterion};

use bench_jsonlogic::{cranelift_jit, jsonlogic_exprs, native, rhai_scripts, wasmtime_eval, GameState};

/// Benchmark 1: Pure Evaluation
///
/// All engines have pre-compiled logic and data in their optimal format.
/// Measures the minimum possible evaluation cost for each approach.
///
/// Fair comparison rules:
/// - Native: direct function call
/// - Cranelift JIT: pre-compiled to native code, pass primitives directly
/// - Wasmtime: pre-instantiated module, pass primitives directly
/// - JsonLogic v3: pre-compiled expr, pre-serialized JSON, pass by reference
/// - JsonLogic v4: pre-compiled expr, pre-serialized JSON, pass by reference (if possible) or clone
/// - Rhai: pre-compiled AST, must build scope (Rhai requires fresh scope per eval)
fn bench_pure_eval(c: &mut Criterion) {
    use datalogic_v3::DataLogic as DataLogicV3;
    use datalogic_v4::DataLogic as DataLogicV4;
    use wasmtime::*;

    let state = GameState::sample();
    let state_json = serde_json::to_value(&state).unwrap();

    // Pre-compile everything
    let v3 = DataLogicV3::new();
    let v4 = DataLogicV4::new();
    let rotation_expr = jsonlogic_exprs::rotation();
    let rotation_v4_compiled = v4.compile(&rotation_expr).unwrap();

    let rhai_engine = rhai_scripts::create_engine();
    let rotation_ast = rhai_scripts::compile(&rhai_engine, rhai_scripts::ROTATION);

    let wasm_engine = wasmtime_eval::create_engine();
    let rotation_module = wasmtime_eval::compile_wat(&wasm_engine, wasmtime_eval::ROTATION_WAT);
    let mut wasm_store = wasmtime_eval::create_store(&wasm_engine);
    let rotation_instance = Instance::new(&mut wasm_store, &rotation_module, &[]).unwrap();
    let rotation_wasm_func = rotation_instance
        .get_typed_func::<(f64, i32, i32, i32, i32, i32), i32>(&mut wasm_store, "rotation")
        .unwrap();

    // Cranelift JIT - compile rotation AST to native code
    let cranelift_rotation = cranelift_jit::JitRotation::compile(&cranelift_jit::sample_rotation());

    // Pre-extract primitives (fairest comparison for wasmtime/cranelift)
    let args = (
        state.resource.current,
        state.cooldowns.bestial_wrath_ready as i32,
        state.cooldowns.barbed_shot_charges as i32,
        state.buffs.frenzy_stacks as i32,
        state.buffs.bestial_wrath_active as i32,
        state.cooldowns.kill_command_ready as i32,
    );

    let mut group = c.benchmark_group("pure_eval");

    // Native: direct function call
    group.bench_function("native", |b| {
        b.iter(|| native::rotation_check(black_box(&state)))
    });

    // Cranelift JIT: pre-compiled native code, primitives pre-extracted
    group.bench_function("cranelift_jit", |b| {
        b.iter(|| {
            cranelift_rotation.call(
                black_box(args.0),
                black_box(args.1),
                black_box(args.2),
                black_box(args.3),
                black_box(args.4),
                black_box(args.5),
            )
        })
    });

    // Wasmtime: pre-instantiated, primitives pre-extracted
    group.bench_function("wasmtime", |b| {
        b.iter(|| rotation_wasm_func.call(&mut wasm_store, black_box(args)))
    });

    // JsonLogic v3: pass references (no clone)
    group.bench_function("jsonlogic_v3", |b| {
        b.iter(|| v3.evaluate_json(black_box(&rotation_expr), black_box(&state_json)))
    });

    // JsonLogic v4: unfortunately requires clone (API limitation)
    group.bench_function("jsonlogic_v4_with_clone", |b| {
        b.iter(|| v4.evaluate_owned(&rotation_v4_compiled, black_box(state_json.clone())))
    });

    // Rhai: must build scope each time (API requirement)
    group.bench_function("rhai_with_scope_build", |b| {
        b.iter(|| {
            let mut scope = rhai_scripts::build_scope(black_box(&state));
            rhai_engine.eval_ast_with_scope::<i64>(&mut scope, &rotation_ast)
        })
    });

    group.finish();
}

/// Benchmark 2: End-to-End from Native Struct
///
/// Starting from a native Rust GameState struct, measure the full cost
/// of converting data and evaluating. This is the realistic scenario.
fn bench_end_to_end(c: &mut Criterion) {
    use datalogic_v3::DataLogic as DataLogicV3;
    use datalogic_v4::DataLogic as DataLogicV4;
    use wasmtime::*;

    let state = GameState::sample();

    // Pre-compile everything (compilation is one-time cost)
    let v3 = DataLogicV3::new();
    let v4 = DataLogicV4::new();
    let rotation_expr = jsonlogic_exprs::rotation();
    let rotation_v4_compiled = v4.compile(&rotation_expr).unwrap();

    let rhai_engine = rhai_scripts::create_engine();
    let rotation_ast = rhai_scripts::compile(&rhai_engine, rhai_scripts::ROTATION);

    let wasm_engine = wasmtime_eval::create_engine();
    let rotation_module = wasmtime_eval::compile_wat(&wasm_engine, wasmtime_eval::ROTATION_WAT);
    let mut wasm_store = wasmtime_eval::create_store(&wasm_engine);
    let rotation_instance = Instance::new(&mut wasm_store, &rotation_module, &[]).unwrap();
    let rotation_wasm_func = rotation_instance
        .get_typed_func::<(f64, i32, i32, i32, i32, i32), i32>(&mut wasm_store, "rotation")
        .unwrap();

    // Cranelift JIT
    let cranelift_rotation = cranelift_jit::JitRotation::compile(&cranelift_jit::sample_rotation());

    let mut group = c.benchmark_group("end_to_end");

    // Native: direct function call (no conversion needed)
    group.bench_function("native", |b| {
        b.iter(|| native::rotation_check(black_box(&state)))
    });

    // Cranelift JIT: extract primitives from struct + call native code
    group.bench_function("cranelift_jit", |b| {
        b.iter(|| cranelift_rotation.evaluate(black_box(&state)))
    });

    // Wasmtime: extract primitives from struct + call
    group.bench_function("wasmtime", |b| {
        b.iter(|| {
            let args = (
                black_box(&state).resource.current,
                black_box(&state).cooldowns.bestial_wrath_ready as i32,
                black_box(&state).cooldowns.barbed_shot_charges as i32,
                black_box(&state).buffs.frenzy_stacks as i32,
                black_box(&state).buffs.bestial_wrath_active as i32,
                black_box(&state).cooldowns.kill_command_ready as i32,
            );
            rotation_wasm_func.call(&mut wasm_store, args)
        })
    });

    // JsonLogic v3: serialize struct to JSON + evaluate
    group.bench_function("jsonlogic_v3", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            v3.evaluate_json(&rotation_expr, &json)
        })
    });

    // JsonLogic v4: serialize struct to JSON + evaluate
    group.bench_function("jsonlogic_v4", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            v4.evaluate_owned(&rotation_v4_compiled, json)
        })
    });

    // Rhai: build scope from struct + evaluate
    group.bench_function("rhai", |b| {
        b.iter(|| {
            let mut scope = rhai_scripts::build_scope(black_box(&state));
            rhai_engine.eval_ast_with_scope::<i64>(&mut scope, &rotation_ast)
        })
    });

    group.finish();
}

/// Benchmark 3: Compilation/Setup Costs (one-time)
///
/// How expensive is it to compile/parse the logic? This is typically
/// done once at startup, but important to know.
fn bench_compile(c: &mut Criterion) {
    use datalogic_v3::DataLogic as DataLogicV3;
    use datalogic_v4::DataLogic as DataLogicV4;

    let v3 = DataLogicV3::new();
    let v4 = DataLogicV4::new();
    let rotation_expr = jsonlogic_exprs::rotation();

    let rhai_engine = rhai_scripts::create_engine();

    let wasm_engine = wasmtime_eval::create_engine();

    let rotation_ast = cranelift_jit::sample_rotation();

    let mut group = c.benchmark_group("compile");

    // JsonLogic v4 compilation
    group.bench_function("jsonlogic_v4", |b| {
        b.iter(|| v4.compile(black_box(&rotation_expr)))
    });

    // JsonLogic v3 doesn't have explicit compilation - it parses each time
    // So we measure a single evaluation as the "parse" cost
    group.bench_function("jsonlogic_v3_parse", |b| {
        let state_json = serde_json::to_value(&GameState::sample()).unwrap();
        b.iter(|| v3.evaluate_json(black_box(&rotation_expr), black_box(&state_json)))
    });

    // Rhai compilation
    group.bench_function("rhai", |b| {
        b.iter(|| rhai_engine.compile(black_box(rhai_scripts::ROTATION)))
    });

    // Cranelift JIT compilation (AST -> native code)
    group.bench_function("cranelift_jit", |b| {
        b.iter(|| cranelift_jit::JitRotation::compile(black_box(&rotation_ast)))
    });

    // Wasmtime WAT compilation
    group.bench_function("wasmtime_wat", |b| {
        b.iter(|| wasmtime_eval::compile_wat(&wasm_engine, black_box(wasmtime_eval::ROTATION_WAT)))
    });

    group.finish();
}

/// Benchmark 4: Overhead Breakdown
///
/// Measure individual overhead components to understand where time goes.
fn bench_overhead(c: &mut Criterion) {
    let state = GameState::sample();
    let state_json = serde_json::to_value(&state).unwrap();

    let mut group = c.benchmark_group("overhead");

    // JSON serialization cost
    group.bench_function("json_serialize", |b| {
        b.iter(|| serde_json::to_value(black_box(&state)))
    });

    // JSON clone cost (what v4 pays per eval)
    group.bench_function("json_clone", |b| {
        b.iter(|| black_box(&state_json).clone())
    });

    // Rhai scope building cost
    group.bench_function("rhai_scope_build", |b| {
        b.iter(|| rhai_scripts::build_scope(black_box(&state)))
    });

    // Wasmtime primitive extraction (basically free)
    group.bench_function("wasm_extract_args", |b| {
        b.iter(|| {
            (
                black_box(&state).resource.current,
                black_box(&state).cooldowns.bestial_wrath_ready as i32,
                black_box(&state).cooldowns.barbed_shot_charges as i32,
                black_box(&state).buffs.frenzy_stacks as i32,
                black_box(&state).buffs.bestial_wrath_active as i32,
                black_box(&state).cooldowns.kill_command_ready as i32,
            )
        })
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_pure_eval,
    bench_end_to_end,
    bench_compile,
    bench_overhead,
);
criterion_main!(benches);
