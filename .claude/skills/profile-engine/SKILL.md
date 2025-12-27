---
name: profile-engine
description: Profile the Rust simulation engine to identify performance bottlenecks. Use when optimizing engine performance or investigating slow code paths.
allowed-tools: Read, Bash, Edit, Grep, Glob
---

# Profile Engine

Profile the Rust simulation engine using samply to identify hot paths.

## Prerequisites

```bash
cargo install samply
```

## Cargo.toml Settings for Profiling

In `crates/bench-engine/Cargo.toml`:

```toml
[profile.release]
debug = "line-tables-only"  # Debug symbols for profiling
lto = false                  # Disable LTO for better stack traces
codegen-units = 16           # Less cross-crate inlining
```

## Profiling Commands

### 1. Build with frame pointers

```bash
cd /Users/user/Source/wowlab/crates/bench-engine
RUSTFLAGS="-C force-frame-pointers=yes" cargo build --release
```

### 2. Run samply

```bash
samply record --rate 4000 ./target/release/bench-engine
```

Opens Firefox Profiler in browser with:

- Call Tree (hierarchical view)
- Flame Graph (visual hot paths)
- Stack Chart (timeline)

## Reading the Profile

- **Self time**: Time in function itself (optimization target)
- **Total time**: Time including children
- High self time = hot path to optimize

## Current Hot Paths

1. `run_batch` / `run_simulation` - main loop
2. `handle_gcd_ready` - GCD event handler
3. `evaluate_rotation` - spell availability check
4. `cast_spell` - spell execution
5. `EventQueue::push/pop` - heap operations

## Baseline Performance

- 300s fights, 16M iterations
- ~0.26M sims/sec (optimized build)
- ~0.22M sims/sec (profiling build)
- ~60s for 16M sims single-threaded

## After Optimizing

Restore production settings:

```toml
[profile.release]
lto = true
codegen-units = 1
panic = "abort"
```

## Sources

- [Rust Performance Book](https://nnethercote.github.io/perf-book/profiling.html)
- [samply](https://github.com/mstange/samply)
- [cargo-flamegraph](https://github.com/flamegraph-rs/flamegraph)
