//! Benchmark: Native Rust vs datalogic-rs v3 vs v4
//!
//! Run with: cargo bench -p bench-jsonlogic

use criterion::{black_box, criterion_group, criterion_main, Criterion};

use bench_jsonlogic::{jsonlogic_exprs, native, GameState};

/// Benchmark native Rust evaluation
fn bench_native(c: &mut Criterion) {
    let state = GameState::sample();

    let mut group = c.benchmark_group("native");

    group.bench_function("simple", |b| {
        b.iter(|| native::simple_condition(black_box(&state)))
    });

    group.bench_function("medium", |b| {
        b.iter(|| native::medium_condition(black_box(&state)))
    });

    group.bench_function("complex", |b| {
        b.iter(|| native::complex_condition(black_box(&state)))
    });

    group.bench_function("rotation", |b| {
        b.iter(|| native::rotation_check(black_box(&state)))
    });

    group.finish();
}

/// Benchmark datalogic-rs v4 (serde_json based)
fn bench_v4(c: &mut Criterion) {
    use datalogic_v4::DataLogic;

    let state = GameState::sample();
    let state_json = serde_json::to_value(&state).unwrap();

    let engine = DataLogic::new();

    // Pre-compile all expressions
    let simple_compiled = engine.compile(&jsonlogic_exprs::simple()).unwrap();
    let medium_compiled = engine.compile(&jsonlogic_exprs::medium()).unwrap();
    let complex_compiled = engine.compile(&jsonlogic_exprs::complex()).unwrap();
    let rotation_compiled = engine.compile(&jsonlogic_exprs::rotation()).unwrap();

    let mut group = c.benchmark_group("v4");

    // Benchmark with pre-serialized state (best case) - using evaluate_owned with clone
    group.bench_function("simple_preserialized", |b| {
        b.iter(|| {
            engine.evaluate_owned(&simple_compiled, black_box(state_json.clone()))
        })
    });

    group.bench_function("medium_preserialized", |b| {
        b.iter(|| {
            engine.evaluate_owned(&medium_compiled, black_box(state_json.clone()))
        })
    });

    group.bench_function("complex_preserialized", |b| {
        b.iter(|| {
            engine.evaluate_owned(&complex_compiled, black_box(state_json.clone()))
        })
    });

    group.bench_function("rotation_preserialized", |b| {
        b.iter(|| {
            engine.evaluate_owned(&rotation_compiled, black_box(state_json.clone()))
        })
    });

    // Benchmark including serialization (realistic case)
    group.bench_function("simple_with_serialize", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            engine.evaluate_owned(&simple_compiled, json)
        })
    });

    group.bench_function("rotation_with_serialize", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            engine.evaluate_owned(&rotation_compiled, json)
        })
    });

    group.finish();
}

/// Benchmark datalogic-rs v3 (arena-based)
fn bench_v3(c: &mut Criterion) {
    use datalogic_v3::DataLogic;

    let state = GameState::sample();
    let state_json = serde_json::to_value(&state).unwrap();

    let logic = DataLogic::new();

    let mut group = c.benchmark_group("v3");

    // v3 evaluates directly from JSON (parses each time)
    let simple_expr = jsonlogic_exprs::simple();
    let medium_expr = jsonlogic_exprs::medium();
    let complex_expr = jsonlogic_exprs::complex();
    let rotation_expr = jsonlogic_exprs::rotation();

    group.bench_function("simple_preserialized", |b| {
        b.iter(|| logic.evaluate_json(black_box(&simple_expr), black_box(&state_json)))
    });

    group.bench_function("medium_preserialized", |b| {
        b.iter(|| logic.evaluate_json(black_box(&medium_expr), black_box(&state_json)))
    });

    group.bench_function("complex_preserialized", |b| {
        b.iter(|| logic.evaluate_json(black_box(&complex_expr), black_box(&state_json)))
    });

    group.bench_function("rotation_preserialized", |b| {
        b.iter(|| logic.evaluate_json(black_box(&rotation_expr), black_box(&state_json)))
    });

    // Benchmark including serialization
    group.bench_function("simple_with_serialize", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            logic.evaluate_json(&simple_expr, &json)
        })
    });

    group.bench_function("rotation_with_serialize", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            logic.evaluate_json(&rotation_expr, &json)
        })
    });

    group.finish();
}

/// Benchmark just the serialization overhead
fn bench_serialization(c: &mut Criterion) {
    let state = GameState::sample();

    c.bench_function("serialize_state", |b| {
        b.iter(|| serde_json::to_value(black_box(&state)))
    });
}

/// Compare all three at rotation complexity
fn bench_comparison(c: &mut Criterion) {
    use datalogic_v3::DataLogic as DataLogicV3;
    use datalogic_v4::DataLogic as DataLogicV4;

    let state = GameState::sample();
    let state_json = serde_json::to_value(&state).unwrap();

    let v3 = DataLogicV3::new();
    let v4 = DataLogicV4::new();

    let rotation_expr = jsonlogic_exprs::rotation();
    let rotation_v4 = v4.compile(&rotation_expr).unwrap();

    let mut group = c.benchmark_group("comparison_rotation");

    group.bench_function("native", |b| {
        b.iter(|| native::rotation_check(black_box(&state)))
    });

    group.bench_function("v3_preserialized", |b| {
        b.iter(|| v3.evaluate_json(black_box(&rotation_expr), black_box(&state_json)))
    });

    group.bench_function("v4_preserialized", |b| {
        b.iter(|| {
            v4.evaluate_owned(&rotation_v4, black_box(state_json.clone()))
        })
    });

    group.bench_function("v4_with_serialize", |b| {
        b.iter(|| {
            let json = serde_json::to_value(black_box(&state)).unwrap();
            v4.evaluate_owned(&rotation_v4, json)
        })
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_native,
    bench_v4,
    bench_v3,
    bench_serialization,
    bench_comparison,
);
criterion_main!(benches);
