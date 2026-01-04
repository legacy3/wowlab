# Issue 14: Validation Gaps in Parallel Paths

## Category

Error Handling

## Severity

Medium

## Location

`src/sim/engine.rs:340-342, 403-407`

## Description

The parallel simulation path recompiles rotations per-thread without proper error handling, and validation that happens in single-threaded mode may be bypassed.

## Current Code

```rust
// engine.rs:340-342
pub fn run_batch_parallel(config: &SimConfig, iterations: u32) -> BatchResults {
    (0..iterations)
        .into_par_iter()
        .map(|_| {
            let rotation = PredictiveRotation::compile(rotation_script, config)
                .expect("rotation already validated");  // PANICS PER THREAD!

            run_single_iteration(config, &rotation)
        })
        .collect()
}
```

## Problems

1. **Per-thread panic** - If rotation compilation fails, each thread panics independently
2. **Validation assumed** - Comment says "already validated" but where?
3. **No pre-validation** - `run_batch_parallel` doesn't check before spawning threads
4. **Poor UX** - User sees multiple panic messages, unclear cause

## Current Flow

```
run_batch_parallel(config, 1000)
    └── rayon::par_iter()
        ├── Thread 1: compile() → .expect() → PANIC
        ├── Thread 2: compile() → .expect() → PANIC
        ├── Thread 3: compile() → .expect() → PANIC
        └── ... (many panics)
```

## Desired Flow

```
run_batch_parallel(config, 1000)
    └── validate_once() → Error returned to caller
        └── rayon::par_iter()
            ├── Thread 1: use pre-validated rotation
            ├── Thread 2: use pre-validated rotation
            └── ...
```

## Proposed Fix

### 1. Pre-validate Before Parallelization

```rust
impl Simulator {
    pub fn run_batch_parallel(
        &self,
        config: &SimConfig,
        iterations: u32,
    ) -> Result<BatchResults, EngineError> {
        // Validate rotation ONCE before going parallel
        let rotation_script = config.rotation_script.as_str();
        let _ = PredictiveRotation::compile(rotation_script, config)
            .map_err(|e| EngineError::RotationError(e))?;

        // Now safe to compile per-thread (will succeed)
        let results: Vec<SimResult> = (0..iterations)
            .into_par_iter()
            .map(|_| {
                // This won't fail since we pre-validated
                let rotation = PredictiveRotation::compile(rotation_script, config)
                    .expect("pre-validated");

                Self::run_single_iteration(config, &rotation)
            })
            .collect();

        Ok(BatchResults::from_iterations(results))
    }
}
```

### 2. Share Compiled Rotation (Better Performance)

```rust
impl Simulator {
    pub fn run_batch_parallel(
        &self,
        config: &SimConfig,
        iterations: u32,
    ) -> Result<BatchResults, EngineError> {
        // Compile once, share across threads
        let rotation = Arc::new(
            PredictiveRotation::compile(&config.rotation_script, config)
                .map_err(EngineError::RotationError)?
        );

        let results: Vec<SimResult> = (0..iterations)
            .into_par_iter()
            .map(|_| {
                // Clone Arc, not the rotation itself
                let rotation = Arc::clone(&rotation);
                Self::run_single_iteration(config, &rotation)
            })
            .collect();

        Ok(BatchResults::from_iterations(results))
    }
}
```

### 3. Handle Thread Panics Gracefully

```rust
use std::panic::{self, AssertUnwindSafe};

impl Simulator {
    pub fn run_batch_parallel(
        &self,
        config: &SimConfig,
        iterations: u32,
    ) -> Result<BatchResults, EngineError> {
        // Pre-validate
        let rotation = PredictiveRotation::compile(&config.rotation_script, config)
            .map_err(EngineError::RotationError)?;

        let results: Vec<Result<SimResult, String>> = (0..iterations)
            .into_par_iter()
            .map(|i| {
                // Catch panics per-iteration
                panic::catch_unwind(AssertUnwindSafe(|| {
                    Self::run_single_iteration(config, &rotation)
                }))
                .map_err(|e| format!("iteration {} panicked: {:?}", i, e))
            })
            .collect();

        // Check for any failures
        let mut successes = Vec::with_capacity(results.len());
        let mut failures = Vec::new();

        for result in results {
            match result {
                Ok(sim_result) => successes.push(sim_result),
                Err(msg) => failures.push(msg),
            }
        }

        if !failures.is_empty() {
            return Err(EngineError::PartialFailure {
                succeeded: successes.len(),
                failed: failures.len(),
                first_error: failures.into_iter().next().unwrap(),
            });
        }

        Ok(BatchResults::from_iterations(successes))
    }
}
```

### 4. Add EngineError Variant

```rust
#[derive(Debug, Error)]
pub enum EngineError {
    // ... existing variants

    #[error("{failed} of {total} simulations failed, first error: {first_error}")]
    PartialFailure {
        succeeded: usize,
        failed: usize,
        first_error: String,
    },
}
```

## Thread-Local Rotation Alternative

If rotation must be mutable per-thread:

```rust
use std::cell::RefCell;

thread_local! {
    static ROTATION: RefCell<Option<PredictiveRotation>> = RefCell::new(None);
}

impl Simulator {
    pub fn run_batch_parallel(
        &self,
        config: &SimConfig,
        iterations: u32,
    ) -> Result<BatchResults, EngineError> {
        // Pre-validate
        let _ = PredictiveRotation::compile(&config.rotation_script, config)
            .map_err(EngineError::RotationError)?;

        let results: Vec<SimResult> = (0..iterations)
            .into_par_iter()
            .map(|_| {
                ROTATION.with(|r| {
                    let mut rotation = r.borrow_mut();
                    if rotation.is_none() {
                        // Compile once per thread
                        *rotation = Some(
                            PredictiveRotation::compile(&config.rotation_script, config)
                                .expect("pre-validated")
                        );
                    }

                    Self::run_single_iteration(config, rotation.as_ref().unwrap())
                })
            })
            .collect();

        Ok(BatchResults::from_iterations(results))
    }
}
```

## Impact

- Fail-fast on invalid rotation
- Clear single error message
- No per-thread panics
- Better parallel performance with shared rotation

## Effort

Low-Medium (3-5 hours)

## Tests Required

- Test invalid rotation returns error before parallel
- Test all iterations run with valid rotation
- Test panic in one iteration doesn't crash others
- Benchmark shared vs per-thread rotation
