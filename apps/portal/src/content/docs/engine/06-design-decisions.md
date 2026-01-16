---
title: Design Decisions
description: Why the engine is built the way it is
updatedAt: 2026-01-16
---

# Design Decisions

The engine optimizes for simulation speed above all else. This document explains the key technical decisions and why alternatives were rejected.

## Primary constraint: speed

Combat simulation requires millions of iterations to produce statistically meaningful results. A 5-minute fight at 1000 iterations means simulating 83+ hours of combat. Speed isn't a nice-to-have—it determines whether users wait seconds or minutes for results.

Every architectural decision flows from this constraint.

## Why a DSL instead of a scripting language

**Rejected alternatives:**

- Lua
- JavaScript (QuickJS, Boa)
- Rhai
- Python (RustPython)

All embedded scripting languages were tested extensively. Even after dozens of optimization passes, the overhead was unacceptable.

**The problem:** Scripting languages require:

- Runtime type checking on every operation
- Dynamic dispatch for function calls
- Garbage collection pauses
- Interpreter loop overhead

In a tight simulation loop that evaluates rotations millions of times, these costs compound. A 100ns overhead per evaluation becomes 100 seconds over a billion evaluations.

**The solution:** A purpose-built DSL with:

- Static types resolved at compile time
- Direct memory access via byte buffer
- No runtime allocation
- No interpreter—compiles to native code

The DSL is intentionally limited. It can't do everything Lua can. But it evaluates in ~3ns instead of ~500ns.

## Why JIT compilation (Cranelift)

**Rejected alternatives:**

- Interpreted AST walking
- Bytecode VM
- AOT compilation

**Interpreted AST:** Too slow. Tree traversal and pattern matching on every evaluation adds overhead that dominates small expressions.

**Bytecode VM:** Better than AST walking, but still requires a dispatch loop. Each opcode fetch-decode-execute cycle costs ~5-10ns. A rotation with 50 conditions means 250-500ns per evaluation.

**AOT compilation:** Would require shipping precompiled binaries for every rotation, or running a compiler on the user's machine at install time. Neither is practical.

**JIT compilation** hits the sweet spot:

- Compiles rotation JSON to native machine code at runtime
- Zero per-evaluation overhead—just function pointer calls
- Cranelift compiles in milliseconds, fast enough for interactive use
- Generated code is cache-friendly and branch-predictor-friendly

The cost is complexity. JIT requires careful memory management and platform-specific code generation. But the 100x+ speedup over interpreted approaches justifies it.

## Why Rust

**Rejected alternatives:**

- TypeScript/JavaScript
- C++
- Go

**TypeScript:** The first several iterations were TypeScript. Performance ceiling was too low—even with careful optimization, V8's JIT couldn't match native code for this workload. The simulation loop is too tight for JS's object model.

**C++:** Would work performance-wise, but memory safety concerns and build complexity made it unappealing. Simulation bugs should produce wrong numbers, not segfaults or security vulnerabilities.

**Go:** GC pauses are problematic for batch simulations. A pause during iteration N affects the timing of iteration N+1, introducing noise into results.

**Rust** provides:

- C-level performance without GC
- Memory safety via the borrow checker
- Excellent WASM compilation (for portal type sharing)
- Cranelift is written in Rust, making integration natural
- Rayon for trivial parallelization of batch runs

## Why simulations don't run in browsers

**Constraint:** Browsers cannot JIT-compile arbitrary code.

WebAssembly is ahead-of-time compiled. You can run WASM in a browser, but you can't generate new WASM at runtime and execute it. This is a fundamental security boundary—browsers don't let websites generate and run machine code.

The engine needs JIT to achieve acceptable performance. Without JIT, rotation evaluation would be 100x slower, making interactive simulation impractical.

**Solution:** Run simulations on local nodes where JIT is possible. The portal uses WASM for type sharing and rotation validation only.

## Trade-offs we didn't make

Several "obvious" simplifications were rejected because they'd hurt performance:

**Dynamic rotation loading:** Rotations could be interpreted at runtime instead of compiled. This would simplify the codebase significantly. Rejected—100x slowdown.

**Garbage-collected language:** Would eliminate memory management complexity. Rejected—GC pauses introduce result variance and reduce throughput.

**Generic event system:** Events could carry dynamic payloads instead of typed variants. Rejected—dynamic dispatch overhead in the hot loop.

**HashMap for aura lookup:** Would simplify AuraTracker. Rejected—SmallVec with linear scan is faster for typical aura counts (<20).

**String-based spell IDs:** Would be more readable than numeric indices. Rejected—string hashing and comparison in the hot loop.

## Trade-offs we did make

Not everything optimizes for speed:

**Module leak in JIT:** Compiled modules are leaked rather than freed. This simplifies lifetime management at the cost of memory growth if many rotations are compiled. Acceptable for typical usage patterns.

**Static talent configuration:** Talents are baked into compiled rotations. Changing talents requires recompilation. This enables compile-time optimization but reduces flexibility.

**Limited expression language:** The DSL can't express arbitrary logic. Complex conditions require workarounds. This keeps the compiler simple and generated code fast.

## Summary

| Decision       | Alternative     | Why rejected            |
| -------------- | --------------- | ----------------------- |
| DSL            | Lua, Rhai, JS   | 100x+ slower            |
| JIT            | Interpreter, VM | 10-100x slower          |
| Rust           | TypeScript, Go  | Performance ceiling, GC |
| Local nodes    | Browser WASM    | No JIT in browsers      |
| Typed indices  | Strings         | Hash overhead           |
| SmallVec auras | HashMap         | Slower for small N      |

The engine is the result of iterative refinement. Each decision was tested against alternatives. What remains is the minimal architecture that achieves the required performance.
