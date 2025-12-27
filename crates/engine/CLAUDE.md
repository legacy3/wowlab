# crates/engine

Rust simulation core compiled to WebAssembly. This is the hot loop - zero allocations, pure computation.

## Building

```bash
# Dev build (faster compile, debug symbols)
cargo build

# WASM build (outputs to packages/wowlab-engine/wasm/)
wasm-pack build --target web --out-dir ../../packages/wowlab-engine/wasm

# Run tests
cargo test
```

## Structure

```
src/
  lib.rs          # Entry point, WASM exports, core types
```

## Key Types

- `SimConfig` - Configuration from JS (spells, resources, duration)
- `Simulator` - Main WASM export, holds state between runs
- `SimResult` / `BatchResult` - Results returned to JS
- `FastRng` - Xorshift RNG for deterministic sims

## WASM Interface

```rust
#[wasm_bindgen]
impl Simulator {
    pub fn new(config_json: &str) -> Simulator;
    pub fn run(&mut self, seed: u64) -> JsValue;
    pub fn run_batch(&mut self, iterations: u32, base_seed: u64) -> JsValue;
}
```

## Design Principles

- No allocations in hot loop (pre-allocate everything)
- Mutable state (no immutable data structures)
- Simple match-based rotation evaluation
- Batch runs reuse same memory
