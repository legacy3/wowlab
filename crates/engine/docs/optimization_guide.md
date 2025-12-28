# Engine Optimization Guide

## Results

0.07M → 0.11M sims/sec (57% faster)

## General Rust Performance

### Data Layout

```rust
#[repr(C)]              // Predictable layout, no reordering
struct HotData {
    field1: u32,        // Hot fields first (accessed every iteration)
    field2: f32,
}

// SoA > AoS for iteration
// BAD: Vec<Spell> where Spell has 10 fields but you only need 2
// GOOD: Separate cooldowns: Vec<u32>, costs: Vec<f32>
```

### Avoid Allocations in Hot Loops

```rust
// BAD: Allocates every call
fn process() -> Vec<Result> { vec![...] }

// GOOD: Pre-allocate, reuse
struct State { results: Vec<Result> }
fn process(&mut self) { self.results.clear(); ... }
```

### Inline Aggressively

```rust
#[inline(always)]  // Force inline for small hot functions
#[inline]          // Hint for cross-crate inlining
```

### Bounds Check Elimination

```rust
// If you KNOW index is valid:
unsafe { *arr.get_unchecked(idx) }

// Or help compiler prove bounds:
for i in 0..arr.len() { arr[i]; }  // Compiler eliminates checks
```

### Prefer Stack Over Heap

```rust
// Fixed-size arrays over Vec when size known
let slots: [Option<T>; 32] = [None; 32];  // Stack
let slots: Vec<Option<T>> = vec![...];     // Heap
```

### Integer Over Float When Possible

```rust
// Time in u32 milliseconds, not f32 seconds
// Faster comparisons, no precision issues
pub time: u32,  // ms
```

## Event-Driven Simulation

### Minimize Events

```rust
// BAD: Event per tick
for tick in 0..100 { events.push(tick_time, TickEvent); }

// GOOD: Lazy evaluation
next_tick_time: u32,  // Process in bulk when needed
```

### Inline Immediate Events

```rust
// BAD: Push then pop immediately
events.push(current_time, Event);

// GOOD: Direct call
handle_event_inline(state);
```

### Bitmap for Sparse Iteration

```rust
// BAD: Check all 32 slots
for i in 0..32 { if slots[i].is_some() { ... } }

// GOOD: Bitmap + trailing_zeros
let mut mask = active_mask;
while mask != 0 {
    let idx = mask.trailing_zeros();
    mask &= mask - 1;  // Clear lowest bit
    // process idx
}
```

### Lazy Clear

```rust
// BAD: Clear entire array
self.slots.fill(None);

// GOOD: Track what's used, clear only that
for idx in used_indices { self.slots[idx] = None; }
```

## Profiling

```bash
# Build with symbols
cargo build --release  # Cargo.toml: debug = true

# Sample-based profiling
samply record ./target/release/bench-engine 100000

# Or use Instruments on macOS
```

- Flat profile = no single hotspot (good or bad)
- After inlining, look at instruction offsets not function names
- 100K+ iterations for stable measurements
- Benchmark on quiet machine, multiple runs

## Checklist

- [ ] Pre-compute at config time (ID lookups, f32→u32, derived stats)
- [ ] Hot fields grouped at struct start
- [ ] No allocations in simulation loop
- [ ] Events only for truly async things
- [ ] Lazy evaluation for periodic effects
- [ ] Bitmap iteration for sparse data
- [ ] Expected values for deterministic damage (no RNG)
- [ ] `#[inline(always)]` on small hot functions
