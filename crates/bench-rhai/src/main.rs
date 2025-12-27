use rhai::{Engine, Scope, OptimizationLevel};
use std::time::{Duration, Instant};

#[derive(Clone)]
struct SimState {
    focus: f32,
    frenzy_stacks: i32,
    frenzy_remaining: f32,
    kill_command_charges: i32,
    barbed_shot_charges: i32,
}

impl SimState {
    fn randomize(&mut self, seed: u64) {
        let mut x = seed;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.focus = 30.0 + (x % 90) as f32;
        self.frenzy_stacks = (x % 4) as i32;
        self.frenzy_remaining = (x % 8) as f32;
        self.kill_command_charges = (x % 3) as i32;
        self.barbed_shot_charges = (x % 3) as i32;
    }
}

#[inline(always)]
fn rust_rotation(state: &SimState) -> i32 {
    if state.barbed_shot_charges > 0 && state.frenzy_remaining < 2.0 && state.frenzy_stacks > 0 {
        return 217200;
    }
    if state.kill_command_charges > 0 && state.focus >= 30.0 {
        return 34026;
    }
    if state.barbed_shot_charges > 0 {
        return 217200;
    }
    if state.focus >= 35.0 {
        return 193455;
    }
    0
}

fn main() {
    println!("=== Rhai vs Rust Rotation Benchmark ===\n");

    let mut engine = Engine::new();
    engine.set_optimization_level(OptimizationLevel::Full);

    let ast = engine.compile_expression(r#"
        if barbed_shot_charges > 0 && frenzy_remaining < 2.0 && frenzy_stacks > 0 { 217200 }
        else if kill_command_charges > 0 && focus >= 30.0 { 34026 }
        else if barbed_shot_charges > 0 { 217200 }
        else if focus >= 35.0 { 193455 }
        else { 0 }
    "#).unwrap();

    let mut scope = Scope::new();
    scope.push("focus", 80.0_f32);
    scope.push("frenzy_stacks", 2_i32);
    scope.push("frenzy_remaining", 5.0_f32);
    scope.push("kill_command_charges", 2_i32);
    scope.push("barbed_shot_charges", 1_i32);

    let mut state = SimState {
        focus: 80.0,
        frenzy_stacks: 2,
        frenzy_remaining: 5.0,
        kill_command_charges: 2,
        barbed_shot_charges: 1,
    };

    // Warmup
    for i in 0..100_000 {
        state.randomize(i);
        rust_rotation(&state);
        scope.set_value("focus", state.focus);
        scope.set_value("frenzy_stacks", state.frenzy_stacks);
        scope.set_value("frenzy_remaining", state.frenzy_remaining);
        scope.set_value("kill_command_charges", state.kill_command_charges);
        scope.set_value("barbed_shot_charges", state.barbed_shot_charges);
        let _: i32 = engine.eval_ast_with_scope(&mut scope, &ast).unwrap();
    }

    // Benchmark Rust
    let mut seed: u64 = 0;
    let start = Instant::now();
    let end = start + Duration::from_secs(5);
    let mut rust_iters: u64 = 0;
    while Instant::now() < end {
        for _ in 0..10000 {
            seed = seed.wrapping_add(1);
            state.randomize(seed);
            std::hint::black_box(rust_rotation(&state));
            rust_iters += 1;
        }
    }
    let rust_time = start.elapsed();
    let rust_throughput = rust_iters as f64 / rust_time.as_secs_f64();

    // Benchmark Rhai
    seed = 0;
    let start = Instant::now();
    let end = start + Duration::from_secs(5);
    let mut rhai_iters: u64 = 0;
    while Instant::now() < end {
        for _ in 0..10000 {
            seed = seed.wrapping_add(1);
            state.randomize(seed);
            scope.set_value("focus", state.focus);
            scope.set_value("frenzy_stacks", state.frenzy_stacks);
            scope.set_value("frenzy_remaining", state.frenzy_remaining);
            scope.set_value("kill_command_charges", state.kill_command_charges);
            scope.set_value("barbed_shot_charges", state.barbed_shot_charges);
            std::hint::black_box(engine.eval_ast_with_scope::<i32>(&mut scope, &ast).unwrap());
            rhai_iters += 1;
        }
    }
    let rhai_time = start.elapsed();
    let rhai_throughput = rhai_iters as f64 / rhai_time.as_secs_f64();

    println!("Rust:  {:.2}M iter/sec", rust_throughput / 1_000_000.0);
    println!("Rhai:  {:.2}M iter/sec", rhai_throughput / 1_000_000.0);
    println!("Ratio: {:.1}x slower", rust_throughput / rhai_throughput);
}
