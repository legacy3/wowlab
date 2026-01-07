# Code Generation / Compile-Time DSL for Rotation Scripting

## Executive Summary

This document analyzes code generation and compile-time DSL approaches as alternatives to Rhai for rotation scripting in the wowlab simulation engine. The current Rhai implementation, despite heavy optimization (AST caching, two-pass optimization, method call extraction), still incurs approximately 2-8 microseconds per state change for re-optimization. For simulations running millions of iterations, this overhead is significant.

**Recommendation**: A hybrid approach combining a declarative macro DSL for rotation definitions with optional runtime script loading via a simplified bytecode interpreter offers the best balance of performance, iteration speed, and maintainability.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [DSL Syntax Design](#dsl-syntax-design)
3. [Compile-Time Code Generation Approaches](#compile-time-code-generation-approaches)
4. [Generating Rust Code from Rotations](#generating-rust-code-from-rotations)
5. [Tradeoffs: Compile Time vs Runtime Flexibility](#tradeoffs-compile-time-vs-runtime-flexibility)
6. [How SimulationCraft Handles This](#how-simulationcraft-handles-this)
7. [Hot-Reloading Considerations](#hot-reloading-considerations)
8. [Implementation Complexity Estimate](#implementation-complexity-estimate)
9. [Recommended Approach](#recommended-approach)

---

## Current State Analysis

### Current Rhai Performance

The existing Rhai-based rotation system has been heavily optimized:

| Operation | Cost | When |
|-----------|------|------|
| `optimize_partial()` | ~12 microseconds | On talent/config change |
| `optimize_from_partial()` | ~2 microseconds | On state change |
| `evaluate_optimized()` | ~0.05 microseconds | Every tick |
| Plain Rhai eval | ~1.6 microseconds | Every tick |
| Cache hit | ~0.1 microseconds | When state unchanged |

**Current optimizations implemented:**
- Script preprocessing transforms `$state` lookups into flat variables
- Method calls extracted and evaluated once per tick
- Two-pass optimization (static talents baked in, dynamic state at runtime)
- Result caching based on method call hash (80-90% cache hit rate)
- Rhai's AST optimizer for constant folding and dead branch elimination

### Why Rhai Is Still Too Slow

Even with aggressive caching, problems remain:

1. **Cache misses are expensive**: Each state change that affects rotation decisions requires ~8 microseconds for re-optimization
2. **Interpreter overhead**: Even cached evaluation has dispatch overhead
3. **Memory allocation**: Rhai's Dynamic type requires heap allocation
4. **No inlining**: Function call boundaries prevent LLVM optimization

For a 5-minute simulation at ~100 iterations/second running 10,000 iterations, rotation evaluation can consume 10-20% of total CPU time.

### Theoretical Minimum

Native Rust code for the same rotation logic executes in approximately **5-20 nanoseconds** - a 100-400x improvement over Rhai's optimized path.

---

## DSL Syntax Design

### Goals

1. **Readable**: Should look similar to existing Rhai scripts
2. **Type-safe**: Catch errors at compile time
3. **Performant**: Generate optimal native code
4. **Expressive**: Support complex conditions without being Turing-complete

### Option A: Declarative Macro DSL

```rust
// In specs/hunter/bm/rotation.rs
use crate::rotation_dsl;

rotation_dsl! {
    name: bm_hunter_st;

    // Priority 1: Major cooldown
    action bestial_wrath {
        spell: BestialWrath,
        condition: cooldown.ready,
    }

    // Priority 2: Core rotational ability
    action kill_command {
        spell: KillCommand,
        condition: cooldown.ready && focus >= 30.0,
    }

    // Priority 3: Barbed Shot management
    action barbed_shot {
        spell: BarbedShot,
        condition: charges.has_charge,
    }

    // Priority 4: Filler
    action cobra_shot {
        spell: CobraShot,
        condition: focus >= 35.0,
    }

    // Priority 5: Wait for resources
    action wait_gcd {
        wait: gcd,
    }
}

// Usage in handler:
impl SpecHandler for BmHunter {
    fn next_action(&self, state: &SimState) -> Action {
        bm_hunter_st::evaluate(state)
    }
}
```

### Option B: Attribute Macro on Functions

```rust
#[rotation("bm_hunter_st")]
fn bm_hunter_rotation(ctx: &RotationContext) -> Action {
    // Bestial Wrath on cooldown
    if ctx.cooldown_ready(BESTIAL_WRATH) {
        return cast!(BESTIAL_WRATH);
    }

    // Kill Command on cooldown with focus
    if ctx.cooldown_ready(KILL_COMMAND) && ctx.focus() >= 30.0 {
        return cast!(KILL_COMMAND);
    }

    // Barbed Shot if charges available
    if ctx.has_charge(BARBED_SHOT) {
        return cast!(BARBED_SHOT);
    }

    // Cobra Shot as filler
    if ctx.focus() >= 35.0 {
        return cast!(COBRA_SHOT);
    }

    // Wait for GCD
    wait_gcd!()
}
```

### Option C: External File with build.rs Compilation

```toml
# rotations/bm_hunter_st.toml
[rotation]
name = "bm_hunter_st"
spec = "beast_mastery"

[[action]]
spell = "bestial_wrath"
condition = "cooldown.ready"

[[action]]
spell = "kill_command"
condition = "cooldown.ready && focus >= 30"

[[action]]
spell = "barbed_shot"
condition = "charges.has_charge"

[[action]]
spell = "cobra_shot"
condition = "focus >= 35"

[[action]]
wait = "gcd"
```

### Recommended Syntax: Hybrid Macro DSL

The declarative macro approach (Option A) offers the best balance:

```rust
rotation! {
    name: mm_hunter_st;

    // Use Trueshot on cooldown (major CD)
    if cooldown(Trueshot).ready {
        cast(Trueshot)
    }

    // Aimed Shot on cooldown (primary damage)
    if cooldown(AimedShot).ready && focus >= 35.0 {
        cast(AimedShot)
    }

    // Rapid Fire on cooldown
    if cooldown(RapidFire).ready {
        cast(RapidFire)
    }

    // Arcane Shot to consume Precise Shots
    if aura(PreciseShots).active && focus >= 20.0 {
        cast(ArcaneShot)
    }

    // Kill Shot in execute range
    if target.health_pct < 0.20 && cooldown(KillShot).ready && focus >= 10.0 {
        cast(KillShot)
    }

    // Steady Shot to generate Focus
    if focus < 70.0 {
        cast(SteadyShot)
    }

    // Arcane Shot as filler
    if focus >= 60.0 {
        cast(ArcaneShot)
    }

    // Default
    else {
        cast(SteadyShot)
    }
}
```

**Key features:**
- Familiar if/else syntax (mirrors Rhai scripts)
- Type-checked spell names (constants, not strings)
- Compile-time validation of conditions
- No runtime parsing or interpretation

---

## Compile-Time Code Generation Approaches

### Approach 1: Declarative Macros (`macro_rules!`)

**Pros:**
- No additional dependencies
- Fast compilation
- IDE support (with limitations)
- Hygienic - doesn't pollute namespace

**Cons:**
- Limited expressiveness (pattern matching only)
- Complex macros are hard to debug
- Error messages can be cryptic

**Example implementation:**

```rust
#[macro_export]
macro_rules! rotation {
    (
        name: $name:ident;
        $(
            if $cond:expr {
                cast($spell:expr)
            }
        )*
        $(
            else {
                $default:expr
            }
        )?
    ) => {
        pub mod $name {
            use super::*;

            #[inline(always)]
            pub fn evaluate(state: &SimState) -> Action {
                $(
                    if $cond.evaluate(state) {
                        return Action::Cast($spell);
                    }
                )*
                $(
                    return $default;
                )?
                Action::WaitGcd
            }
        }
    };
}

// Condition building blocks
pub struct CooldownReady(SpellIdx);
impl CooldownReady {
    #[inline(always)]
    fn evaluate(&self, state: &SimState) -> bool {
        state.player.cooldown(self.0)
            .map(|cd| cd.is_ready(state.now()))
            .unwrap_or(true)
    }
}

// Usage
fn cooldown(spell: SpellIdx) -> CooldownChecker {
    CooldownChecker(spell)
}

struct CooldownChecker(SpellIdx);
impl CooldownChecker {
    fn ready(self) -> CooldownReady {
        CooldownReady(self.0)
    }
}
```

### Approach 2: Procedural Macros (`proc-macro`)

**Pros:**
- Full power of Rust for transformation
- Can parse arbitrary syntax
- Better error messages
- Can generate arbitrary code

**Cons:**
- Separate crate required
- Slower compilation
- More complex to implement
- Debugging is harder

**Example implementation:**

```rust
// In crates/engine-macros/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn rotation(attr: TokenStream, item: TokenStream) -> TokenStream {
    let name = parse_macro_input!(attr as syn::Ident);
    let input = parse_macro_input!(item as ItemFn);

    // Parse the function body and transform conditions
    let conditions = extract_conditions(&input.block);

    // Generate optimized match tree
    let generated = generate_decision_tree(&conditions);

    let expanded = quote! {
        pub mod #name {
            use super::*;

            #[inline(always)]
            pub fn evaluate(state: &SimState) -> Action {
                #generated
            }
        }
    };

    expanded.into()
}
```

### Approach 3: build.rs Code Generation

**Pros:**
- Can read external files (TOML, YAML, etc.)
- Full Rust available for transformation
- Can integrate with external tools
- Generated code is visible for debugging

**Cons:**
- Regenerates on every build (unless careful with rerun-if-changed)
- No IDE integration for generated code
- Harder to debug macro expansion

**Example implementation:**

```rust
// build.rs
use std::fs;
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=rotations/");

    let rotations_dir = Path::new("rotations");
    let out_dir = std::env::var("OUT_DIR").unwrap();

    let mut generated = String::new();
    generated.push_str("// Auto-generated rotation code\n\n");

    for entry in fs::read_dir(rotations_dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();

        if path.extension().map(|e| e == "toml").unwrap_or(false) {
            let rotation = parse_rotation_toml(&path);
            generated.push_str(&generate_rotation_code(&rotation));
        }
    }

    let dest_path = Path::new(&out_dir).join("rotations.rs");
    fs::write(&dest_path, generated).unwrap();
}

fn generate_rotation_code(rotation: &Rotation) -> String {
    let mut code = format!("pub mod {} {{\n", rotation.name);
    code.push_str("    use super::*;\n\n");
    code.push_str("    #[inline(always)]\n");
    code.push_str("    pub fn evaluate(state: &SimState) -> Action {\n");

    for action in &rotation.actions {
        if let Some(condition) = &action.condition {
            code.push_str(&format!(
                "        if {} {{ return Action::Cast({}); }}\n",
                compile_condition(condition),
                action.spell
            ));
        }
    }

    code.push_str("        Action::WaitGcd\n");
    code.push_str("    }\n");
    code.push_str("}\n\n");
    code
}
```

---

## Generating Rust Code from Rotations

### Expression Compilation

The key challenge is compiling condition expressions into efficient Rust code. Here's a complete expression compiler:

```rust
// Expression AST
#[derive(Debug, Clone)]
pub enum Expr {
    // Literals
    Float(f64),
    Bool(bool),

    // State access
    Focus,
    TargetHealthPct,
    CooldownReady(SpellIdx),
    CooldownRemaining(SpellIdx),
    HasCharge(SpellIdx),
    ChargeCount(SpellIdx),
    AuraActive(AuraIdx),
    AuraStacks(AuraIdx),
    AuraRemaining(AuraIdx),
    TalentEnabled(TalentIdx),

    // Operators
    And(Box<Expr>, Box<Expr>),
    Or(Box<Expr>, Box<Expr>),
    Not(Box<Expr>),
    Lt(Box<Expr>, Box<Expr>),
    Le(Box<Expr>, Box<Expr>),
    Gt(Box<Expr>, Box<Expr>),
    Ge(Box<Expr>, Box<Expr>),
    Eq(Box<Expr>, Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

impl Expr {
    /// Compile expression to Rust code string
    pub fn to_rust_code(&self) -> String {
        match self {
            Expr::Float(v) => format!("{}_f64", v),
            Expr::Bool(v) => format!("{}", v),

            Expr::Focus => "state.player.focus()".to_string(),
            Expr::TargetHealthPct => "state.target_health_pct()".to_string(),

            Expr::CooldownReady(spell) => format!(
                "state.player.cooldown({:?}).map(|cd| cd.is_ready(state.now())).unwrap_or(true)",
                spell
            ),
            Expr::CooldownRemaining(spell) => format!(
                "state.player.cooldown({:?}).map(|cd| cd.remaining(state.now())).unwrap_or(0.0)",
                spell
            ),

            Expr::HasCharge(spell) => format!(
                "state.player.cooldown({:?}).map(|cd| cd.has_charge()).unwrap_or(true)",
                spell
            ),

            Expr::AuraActive(aura) => format!(
                "state.player.aura({:?}).map(|a| a.is_active(state.now())).unwrap_or(false)",
                aura
            ),
            Expr::AuraStacks(aura) => format!(
                "state.player.aura({:?}).map(|a| a.stacks()).unwrap_or(0)",
                aura
            ),

            Expr::TalentEnabled(talent) => format!(
                "state.player.has_talent({:?})",
                talent
            ),

            Expr::And(l, r) => format!("({} && {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Or(l, r) => format!("({} || {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Not(e) => format!("(!{})", e.to_rust_code()),

            Expr::Lt(l, r) => format!("({} < {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Le(l, r) => format!("({} <= {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Gt(l, r) => format!("({} > {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Ge(l, r) => format!("({} >= {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Eq(l, r) => format!("({} == {})", l.to_rust_code(), r.to_rust_code()),

            Expr::Add(l, r) => format!("({} + {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Sub(l, r) => format!("({} - {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Mul(l, r) => format!("({} * {})", l.to_rust_code(), r.to_rust_code()),
            Expr::Div(l, r) => format!("({} / {})", l.to_rust_code(), r.to_rust_code()),
        }
    }
}

/// Compile a full rotation to Rust code
pub fn compile_rotation(rotation: &RotationDef) -> String {
    let mut code = String::new();

    code.push_str(&format!("pub mod {} {{\n", rotation.name));
    code.push_str("    use super::*;\n\n");

    // Generate inline evaluate function
    code.push_str("    #[inline(always)]\n");
    code.push_str("    pub fn evaluate(state: &SimState) -> Action {\n");

    for action in &rotation.actions {
        match action {
            RotationAction::Cast { spell, condition } => {
                if let Some(cond) = condition {
                    code.push_str(&format!(
                        "        if {} {{\n            return Action::Cast({:?});\n        }}\n",
                        cond.to_rust_code(),
                        spell
                    ));
                } else {
                    code.push_str(&format!(
                        "        return Action::Cast({:?});\n",
                        spell
                    ));
                }
            }
            RotationAction::Wait { seconds } => {
                code.push_str(&format!(
                    "        return Action::Wait(SimTime::from_secs_f64({}));\n",
                    seconds
                ));
            }
            RotationAction::WaitGcd => {
                code.push_str("        return Action::WaitGcd;\n");
            }
        }
    }

    code.push_str("        Action::WaitGcd\n");
    code.push_str("    }\n");
    code.push_str("}\n");

    code
}
```

### Generated Code Example

Input rotation:
```toml
[[action]]
spell = "bestial_wrath"
condition = "cooldown.ready"

[[action]]
spell = "kill_command"
condition = "cooldown.ready && focus >= 30"
```

Generated Rust:
```rust
pub mod bm_hunter_st {
    use super::*;

    #[inline(always)]
    pub fn evaluate(state: &SimState) -> Action {
        if state.player.cooldown(BESTIAL_WRATH)
            .map(|cd| cd.is_ready(state.now()))
            .unwrap_or(true)
        {
            return Action::Cast(BESTIAL_WRATH);
        }
        if (state.player.cooldown(KILL_COMMAND)
            .map(|cd| cd.is_ready(state.now()))
            .unwrap_or(true)
            && (state.player.focus() >= 30_f64))
        {
            return Action::Cast(KILL_COMMAND);
        }
        Action::WaitGcd
    }
}
```

### Optimization: Decision Trees

For complex rotations, a decision tree can reduce redundant checks:

```rust
/// Convert linear priority list to optimized decision tree
fn optimize_to_decision_tree(actions: &[RotationAction]) -> DecisionNode {
    // Extract common subexpressions
    let common_checks = find_common_subexpressions(actions);

    // Build tree structure
    let mut root = DecisionNode::Leaf(Action::WaitGcd);

    for action in actions.iter().rev() {
        if let Some(cond) = &action.condition {
            root = DecisionNode::Branch {
                condition: cond.clone(),
                if_true: Box::new(DecisionNode::Leaf(action.result.clone())),
                if_false: Box::new(root),
            };
        }
    }

    // Optimize: merge common branches
    root = merge_common_branches(root);

    root
}

enum DecisionNode {
    Leaf(Action),
    Branch {
        condition: Expr,
        if_true: Box<DecisionNode>,
        if_false: Box<DecisionNode>,
    },
}
```

---

## Tradeoffs: Compile Time vs Runtime Flexibility

### Comparison Matrix

| Aspect | Rhai (Current) | Macro DSL | build.rs | Hybrid |
|--------|----------------|-----------|----------|--------|
| **Performance** | ~2-8 microseconds | ~5-20 nanoseconds | ~5-20 nanoseconds | ~5-20 nanoseconds (compiled) |
| **Iteration speed** | Instant | Recompile required | Recompile required | Instant for runtime mode |
| **Type safety** | Runtime errors | Compile-time | Compile-time | Both |
| **Expressiveness** | Full Turing-complete | Limited | Full | Both |
| **User-editable** | Yes (text files) | No | Yes (TOML files) | Yes |
| **IDE support** | Limited | Good | Limited | Good |
| **Error messages** | Runtime | Compile-time | Generated file | Both |
| **Hot reload** | Supported | Not possible | Not possible | Possible via runtime mode |

### When to Use Each

**Pure Compile-Time (Macro DSL):**
- Production simulations where performance is critical
- Well-tested, stable rotations
- Batch processing scenarios

**Runtime Scripting (Rhai):**
- Development and iteration
- User-customizable rotations
- Quick experimentation

**build.rs Generation:**
- Importing rotations from external sources (SimC APL files)
- Generating multiple variants automatically
- Maintaining parity with upstream sources

### The Flexibility Problem

The core tension:

1. **Theorycrafters need fast iteration**: Testing rotation changes should take seconds, not minutes of recompilation
2. **Production needs performance**: Running millions of iterations requires nanosecond-level efficiency
3. **Users need customization**: Players want to modify rotations without compiling Rust

---

## How SimulationCraft Handles This

SimulationCraft uses a C++ implementation with these key characteristics:

### Expression Compilation

SimC compiles APL expressions into expression trees at profile load time:

```cpp
// From SimC wiki on Action List Conditional Expressions
// All expressions evaluate to double-precision floating-point numbers
// Operators perform floating-point arithmetic

// Example APL line:
// actions+=/aimed_shot,if=buff.precise_shots.up&focus>=35

// Internally becomes:
struct action_t {
    expr_t* if_expr;  // Compiled expression tree
    // ...
};
```

Key insights from SimC's approach:

1. **Priority-based, not Turing-complete**: APLs are strictly priority lists evaluated top-to-bottom
2. **Expression compilation**: Conditions are parsed once and compiled to expression trees
3. **No runtime interpretation**: Expression evaluation is direct function calls
4. **Boolean short-circuiting**: Conditions use lazy evaluation
5. **Pre-computed constants**: Spell data and coefficients are resolved at load time

### SimC APL Format

```
# BM Hunter single target
actions.precombat=flask
actions.precombat+=/food
actions.precombat+=/snapshot_stats

actions=auto_shot
actions+=/call_action_list,name=cds
actions+=/call_action_list,name=st

actions.cds=bestial_wrath
actions.cds+=/call_of_the_wild

actions.st=barbed_shot,if=pet.main.buff.frenzy.remains<=gcd
actions.st+=/kill_command
actions.st+=/cobra_shot,if=focus>50
```

This is then compiled into C++ expression trees at runtime (not interpreted each evaluation).

### Performance Comparison

SimC achieves roughly **1-5 microseconds per action decision** through:
- Pre-compiled expression trees
- Direct virtual function calls (not interpretation)
- Efficient state caching
- Profile-guided optimization in release builds

Our target with code generation: **5-20 nanoseconds** (100x faster than SimC).

---

## Hot-Reloading Considerations

### The Challenge

Rust's static compilation model conflicts with hot-reloading requirements:
- Memory layouts are fixed at compile time
- No runtime code modification
- ABI stability not guaranteed

### Potential Solutions

#### Solution 1: Dynamic Library Loading

```rust
// main.rs (never recompiled)
fn main() {
    let lib = load_rotation_library("target/debug/librotations.so");

    loop {
        if file_changed("rotations/") {
            lib = reload_rotation_library("target/debug/librotations.so");
        }

        let action = lib.evaluate(state);
        // ...
    }
}

// rotations_lib.rs (recompiled on change)
#[no_mangle]
pub extern "C" fn evaluate_rotation(state: *const SimState) -> Action {
    rotation::bm_hunter_st::evaluate(unsafe { &*state })
}
```

**Pros:**
- True native code performance
- Changes take effect in ~2-3 seconds (incremental compile)

**Cons:**
- Complex setup
- Potential ABI issues
- State must be passed through C ABI

#### Solution 2: Dual-Mode Operation

```rust
pub enum RotationMode {
    Compiled(fn(&SimState) -> Action),
    Interpreted(RhaiRotation),
}

impl RotationMode {
    pub fn evaluate(&self, state: &SimState) -> Action {
        match self {
            RotationMode::Compiled(f) => f(state),
            RotationMode::Interpreted(r) => r.evaluate(state),
        }
    }
}

// Development mode: use Rhai
let rotation = RotationMode::Interpreted(load_rhai("rotations/bm.rhai")?);

// Production mode: use compiled
let rotation = RotationMode::Compiled(bm_hunter_st::evaluate);
```

**Pros:**
- Best of both worlds
- Easy switching
- No ABI concerns

**Cons:**
- Two implementations to maintain
- Must ensure parity

#### Solution 3: Custom Bytecode VM

Instead of Rhai, implement a minimal bytecode VM optimized for rotation logic:

```rust
pub struct RotationVM {
    bytecode: Vec<Opcode>,
    constants: Vec<f64>,
}

#[derive(Clone, Copy)]
pub enum Opcode {
    // Stack operations
    PushConst(u16),      // Push constant[idx] to stack

    // State access (push result to stack)
    LoadFocus,
    LoadCooldownReady(SpellIdx),
    LoadAuraActive(AuraIdx),
    LoadTargetHealthPct,

    // Comparisons (pop 2, push bool)
    CmpLt,
    CmpGe,

    // Logic (pop 2 or 1, push bool)
    And,
    Or,
    Not,

    // Control flow
    JumpIfFalse(u16),    // Jump if top of stack is false

    // Actions (terminate with result)
    Cast(SpellIdx),
    WaitGcd,
}

impl RotationVM {
    #[inline]
    pub fn evaluate(&self, state: &SimState) -> Action {
        let mut stack = [0.0_f64; 16];
        let mut sp = 0;
        let mut ip = 0;

        loop {
            match self.bytecode[ip] {
                Opcode::PushConst(idx) => {
                    stack[sp] = self.constants[idx as usize];
                    sp += 1;
                }
                Opcode::LoadFocus => {
                    stack[sp] = state.player.focus() as f64;
                    sp += 1;
                }
                Opcode::LoadCooldownReady(spell) => {
                    stack[sp] = if state.player.cooldown_ready(spell) { 1.0 } else { 0.0 };
                    sp += 1;
                }
                Opcode::CmpGe => {
                    sp -= 2;
                    stack[sp] = if stack[sp] >= stack[sp + 1] { 1.0 } else { 0.0 };
                    sp += 1;
                }
                Opcode::And => {
                    sp -= 2;
                    stack[sp] = if stack[sp] != 0.0 && stack[sp + 1] != 0.0 { 1.0 } else { 0.0 };
                    sp += 1;
                }
                Opcode::JumpIfFalse(target) => {
                    sp -= 1;
                    if stack[sp] == 0.0 {
                        ip = target as usize;
                        continue;
                    }
                }
                Opcode::Cast(spell) => return Action::Cast(spell),
                Opcode::WaitGcd => return Action::WaitGcd,
                _ => {}
            }
            ip += 1;
        }
    }
}
```

**Expected performance:** ~50-100 nanoseconds (20-40x faster than Rhai).

**Pros:**
- Hot-reloadable (just swap bytecode)
- Much faster than Rhai
- Minimal memory allocation
- Can load from file at runtime

**Cons:**
- Still slower than native (10-20x)
- Custom VM to maintain
- No ecosystem

---

## Implementation Complexity Estimate

### Option 1: Declarative Macro DSL

**Effort:** 2-3 weeks

| Task | Estimate |
|------|----------|
| Design macro syntax | 2-3 days |
| Implement `rotation!` macro | 3-4 days |
| Condition type system | 2-3 days |
| Migrate BM Hunter rotation | 1-2 days |
| Testing and refinement | 3-4 days |

**Files changed:**
- New: `src/macros/rotation.rs`
- New: `src/rotation/compiled.rs`
- Modified: `src/specs/hunter/bm/rotation.rs`
- Modified: `src/rotation/mod.rs`

### Option 2: Procedural Macro

**Effort:** 3-4 weeks

| Task | Estimate |
|------|----------|
| New crate setup (`engine-macros`) | 1 day |
| Expression parser | 3-4 days |
| Code generator | 3-4 days |
| Error reporting | 2-3 days |
| Integration | 2-3 days |
| Testing | 3-4 days |

**Files changed:**
- New crate: `crates/engine-macros/`
- Modified: `crates/engine/Cargo.toml`
- Modified: `src/rotation/mod.rs`

### Option 3: build.rs with TOML

**Effort:** 2-3 weeks

| Task | Estimate |
|------|----------|
| TOML schema design | 1-2 days |
| Parser implementation | 2-3 days |
| Code generator | 3-4 days |
| build.rs integration | 1-2 days |
| Migration tooling (Rhai -> TOML) | 2-3 days |
| Testing | 2-3 days |

**Files changed:**
- New: `build.rs`
- New: `src/rotation/codegen.rs`
- New: `rotations/*.toml`
- Modified: `src/lib.rs` (include generated code)

### Option 4: Hybrid (Recommended)

**Effort:** 4-5 weeks

| Task | Estimate |
|------|----------|
| Declarative macro (simplified) | 1 week |
| Bytecode VM (minimal) | 1 week |
| Rotation compiler (Rhai/TOML -> bytecode) | 1 week |
| Integration and mode switching | 3-4 days |
| Testing and optimization | 1 week |

---

## Recommended Approach

### Phase 1: Declarative Macro for Critical Rotations (Week 1-2)

Implement a `rotation!` macro that generates native Rust code:

```rust
// Usage
rotation! {
    pub fn bm_hunter_st(state: &SimState) -> Action {
        if cooldown_ready!(state, BESTIAL_WRATH) {
            cast!(BESTIAL_WRATH)
        }
        if cooldown_ready!(state, KILL_COMMAND) && state.focus() >= 30.0 {
            cast!(KILL_COMMAND)
        }
        // ...
        wait_gcd!()
    }
}
```

This provides **immediate 100x speedup** for production simulations.

### Phase 2: Bytecode VM for Development (Week 3-4)

Implement a minimal bytecode VM that can:
1. Load rotation definitions from files
2. Execute at ~50-100ns per decision
3. Hot-reload on file change

### Phase 3: Unified Tooling (Week 5)

Create tooling to:
1. Convert Rhai scripts to macro syntax
2. Convert macro syntax to bytecode
3. Validate rotation equivalence

### Final Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Rotation Definition                          │
│                      (Rhai / TOML / Macro DSL)                       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│      Development Mode           │  │       Production Mode            │
│                                 │  │                                 │
│  ┌───────────────────────────┐  │  │  ┌───────────────────────────┐  │
│  │    Bytecode Compiler      │  │  │  │    Macro Expansion        │  │
│  │    (runtime, ~100ns)      │  │  │  │    (compile-time)         │  │
│  └───────────────────────────┘  │  │  └───────────────────────────┘  │
│               │                 │  │               │                 │
│               ▼                 │  │               ▼                 │
│  ┌───────────────────────────┐  │  │  ┌───────────────────────────┐  │
│  │    Bytecode VM            │  │  │  │    Native Rust Code       │  │
│  │    Hot-reloadable         │  │  │  │    Inlined & optimized    │  │
│  │    ~50-100 ns/eval        │  │  │  │    ~5-20 ns/eval          │  │
│  └───────────────────────────┘  │  │  └───────────────────────────┘  │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

### Expected Results

| Metric | Current (Rhai) | After Implementation |
|--------|----------------|----------------------|
| Development iteration | Instant | Instant (bytecode) |
| Production performance | 2-8 microseconds | 5-20 nanoseconds |
| Speedup | 1x | 100-400x |
| Memory usage | Higher (Dynamic) | Lower (stack-only) |
| Type safety | Runtime | Compile-time |

---

## Appendix: Reference Implementations

### Similar Projects

1. **Bevy ECS**: Uses proc macros extensively for component/system definitions
2. **Diesel ORM**: DSL for SQL queries compiled to Rust
3. **Serde**: Proc macros for serialization code generation
4. **Pest/nom**: Parser combinators that generate efficient parsers

### Resources

- [Rust By Example: DSLs](https://doc.rust-lang.org/rust-by-example/macros/dsl.html)
- [The Little Book of Rust Macros](https://danielkeep.github.io/tlborm/book/)
- [Procedural Macros Workshop](https://github.com/dtolnay/proc-macro-workshop)
- [SimulationCraft Wiki: Action Lists](https://github.com/simulationcraft/simc/wiki/ActionLists)
- [Hot Reloading Rust](https://robert.kra.hn/posts/hot-reloading-rust/)
