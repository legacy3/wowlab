use std::time::Instant;
use wasmtime::*;

#[derive(Clone, Copy)]
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

const ITERATIONS: u64 = 1_000_000_000;
const BATCH_SIZE: usize = 100_000;

fn main() -> anyhow::Result<()> {
    println!("=== Wasmtime vs Rust Rotation Benchmark ===");
    println!("Iterations: {}B\n", ITERATIONS / 1_000_000_000);

    // Pre-generate states (reused in cycles)
    let mut states: Vec<SimState> = Vec::with_capacity(BATCH_SIZE);
    let mut state = SimState {
        focus: 80.0,
        frenzy_stacks: 2,
        frenzy_remaining: 5.0,
        kill_command_charges: 2,
        barbed_shot_charges: 1,
    };
    for i in 0..BATCH_SIZE as u64 {
        state.randomize(i);
        states.push(state);
    }

    // Load WASM module
    let wasm_bytes = include_bytes!(
        "../../rotation-wasm/target/wasm32-unknown-unknown/release/rotation_wasm.wasm"
    );

    let engine = Engine::default();
    let module = Module::new(&engine, wasm_bytes)?;
    let mut store = Store::new(&engine, ());
    let instance = Instance::new(&mut store, &module, &[])?;

    let rotation_wasm =
        instance.get_typed_func::<(f32, i32, f32, i32, i32), i32>(&mut store, "rotation")?;

    // Warmup wasmtime
    for state in states.iter().take(1_000_000) {
        std::hint::black_box(rotation_wasm.call(
            &mut store,
            (
                state.focus,
                state.frenzy_stacks,
                state.frenzy_remaining,
                state.kill_command_charges,
                state.barbed_shot_charges,
            ),
        )?);
    }

    // Benchmark Rust
    let start = Instant::now();
    for _ in 0..(ITERATIONS as usize / BATCH_SIZE) {
        for state in &states {
            std::hint::black_box(rust_rotation(state));
        }
    }
    let rust_time = start.elapsed();

    // Benchmark Wasmtime
    let start = Instant::now();
    for _ in 0..(ITERATIONS as usize / BATCH_SIZE) {
        for state in &states {
            std::hint::black_box(rotation_wasm.call(
                &mut store,
                (
                    state.focus,
                    state.frenzy_stacks,
                    state.frenzy_remaining,
                    state.kill_command_charges,
                    state.barbed_shot_charges,
                ),
            )?);
        }
    }
    let wasm_time = start.elapsed();

    println!("Rust:     {:?}", rust_time);
    println!("Wasmtime: {:?}", wasm_time);
    println!(
        "Ratio:    {:.1}x slower",
        wasm_time.as_secs_f64() / rust_time.as_secs_f64()
    );

    Ok(())
}
