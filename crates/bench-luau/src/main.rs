use mlua::{Lua, Function, Result};
use std::time::Instant;

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

const ROTATION_LUA: &str = r#"
function rotation(focus, frenzy_stacks, frenzy_remaining, kill_command_charges, barbed_shot_charges)
    if barbed_shot_charges > 0 and frenzy_remaining < 2.0 and frenzy_stacks > 0 then
        return 217200
    elseif kill_command_charges > 0 and focus >= 30.0 then
        return 34026
    elseif barbed_shot_charges > 0 then
        return 217200
    elseif focus >= 35.0 then
        return 193455
    end
    return 0
end
"#;

const ITERATIONS: u64 = 1_000_000_000;
const BATCH_SIZE: usize = 100_000;

fn main() -> Result<()> {
    println!("=== Luau vs Rust Rotation Benchmark ===");
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

    let lua = Lua::new();
    lua.sandbox(true)?;
    lua.set_compiler(mlua::Compiler::new().set_optimization_level(2));

    lua.load(ROTATION_LUA).exec()?;
    let rotation_func: Function = lua.globals().get("rotation")?;

    // Warmup Luau JIT
    for state in states.iter().take(1_000_000) {
        std::hint::black_box(rotation_func.call::<i32>((
            state.focus,
            state.frenzy_stacks,
            state.frenzy_remaining,
            state.kill_command_charges,
            state.barbed_shot_charges,
        ))?);
    }

    // Benchmark Rust
    let start = Instant::now();
    for _ in 0..(ITERATIONS as usize / BATCH_SIZE) {
        for state in &states {
            std::hint::black_box(rust_rotation(state));
        }
    }
    let rust_time = start.elapsed();

    // Benchmark Luau
    let start = Instant::now();
    for _ in 0..(ITERATIONS as usize / BATCH_SIZE) {
        for state in &states {
            std::hint::black_box(rotation_func.call::<i32>((
                state.focus,
                state.frenzy_stacks,
                state.frenzy_remaining,
                state.kill_command_charges,
                state.barbed_shot_charges,
            ))?);
        }
    }
    let luau_time = start.elapsed();

    println!("Rust:  {:?}", rust_time);
    println!("Luau:  {:?}", luau_time);
    println!("Ratio: {:.1}x slower", luau_time.as_secs_f64() / rust_time.as_secs_f64());

    Ok(())
}
