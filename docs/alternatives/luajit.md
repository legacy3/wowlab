# LuaJIT / mlua as an Alternative to Rhai

This document analyzes LuaJIT (via the `mlua` crate) as an alternative to Rhai for rotation scripting in the WoW simulation engine.

## Executive Summary

**Recommendation:** LuaJIT via mlua is a strong candidate for replacing Rhai, offering:

- **10-50x faster execution** for hot paths due to JIT compilation
- **WoW addon compatibility** (Lua is WoW's native scripting language)
- **Mature ecosystem** with decades of optimization
- **Zero-overhead FFI** for Lua-to-Rust calls when JIT-compiled

**Trade-offs:**

- More complex memory management (GC tuning required)
- Larger dependency footprint
- Callback overhead (Rust-to-Lua calls are expensive)
- Platform restrictions for JIT (no WASM JIT support)

---

## 1. LuaJIT Performance Characteristics

### 1.1 JIT Compilation

LuaJIT is a Just-In-Time compiler that compiles Lua bytecode to native machine code at runtime. In benchmarks, LuaJIT approaches native C performance:

| Implementation | Relative Speed |
|----------------|----------------|
| C (optimized)  | 1.0x           |
| LuaJIT 2.1     | 1.0-1.3x       |
| Lua 5.4        | 4-5x slower    |
| Rhai           | 10-50x slower  |

From the [DNS benchmark](https://github.com/DNS/benchmark-language), LuaJIT 2.1 completed a numerical benchmark in 0.81 seconds compared to C's 0.78 seconds. This near-native performance comes from:

1. **Trace compilation**: Hot loops are identified and compiled to machine code
2. **Type specialization**: The JIT infers types and generates specialized code
3. **Inlining**: Function calls within traces are inlined
4. **Allocation sinking**: Temporary allocations are eliminated

### 1.2 Where LuaJIT Excels

LuaJIT is particularly strong in areas relevant to rotation scripting:

- **Floating-point math**: Near-native performance for damage calculations
- **Loops and conditionals**: Priority list iteration compiles efficiently
- **Table access**: Field lookups are optimized
- **FFI calls**: Zero overhead when calling C/Rust functions

### 1.3 Where LuaJIT Struggles

- **Callback-heavy code**: Rust-to-Lua calls have significant overhead
- **String operations**: Heavy string manipulation can trigger GC
- **Unpredictable branches**: JIT traces abort on polymorphic code
- **Memory pressure**: GC pauses can cause latency spikes

---

## 2. mlua Crate for Rust Integration

The [`mlua`](https://github.com/mlua-rs/mlua) crate provides high-level Rust bindings to Lua 5.1-5.4, LuaJIT, and Luau. It's the recommended choice for Rust-Lua integration.

### 2.1 Features

```toml
# Cargo.toml
[dependencies]
mlua = { version = "0.10", features = ["luajit", "vendored", "serialize"] }
```

Key features:
- `luajit` - Use LuaJIT 2.1 backend
- `vendored` - Build LuaJIT from source (recommended)
- `serialize` - Serde integration for data exchange
- `async` - Async/await support via coroutines
- `send` - Make Lua state Send (for thread pools)

### 2.2 Basic Usage

```rust
use mlua::prelude::*;

fn main() -> LuaResult<()> {
    let lua = Lua::new();

    // Execute Lua code
    lua.load("print('Hello from Lua!')").exec()?;

    // Expose Rust function to Lua
    let double = lua.create_function(|_, x: i32| Ok(x * 2))?;
    lua.globals().set("double", double)?;

    // Call Lua function from Rust
    let result: i32 = lua.load("return double(21)").eval()?;
    assert_eq!(result, 42);

    Ok(())
}
```

### 2.3 Safety Model

mlua wraps all Lua C API calls in `lua_pcall` to catch errors and prevent longjmp across Rust stack frames. This provides safety at the cost of some overhead:

```rust
// Safe by default - all errors are caught
let lua = Lua::new();

// For advanced use cases requiring C module loading
let lua = unsafe { Lua::unsafe_new() };
```

---

## 3. Exposing Game State to Lua Efficiently

This is the critical section for rotation scripting performance.

### 3.1 Strategy Comparison

| Approach | Overhead | Use Case |
|----------|----------|----------|
| FFI structs | Zero (JIT) | Read-only game state |
| UserData | Low | Mutable game state with methods |
| Tables | Medium | Complex nested data |
| Globals | High | Avoid for hot paths |

### 3.2 FFI Approach (Fastest)

LuaJIT's FFI allows direct memory access with zero overhead when JIT-compiled:

```lua
-- rotation.lua
local ffi = require("ffi")

ffi.cdef[[
    typedef struct {
        double focus;
        double focus_max;
        double health_pct;
        double gcd_remaining;
        bool in_combat;
    } GameState;

    typedef struct {
        double remaining;
        int charges;
        int max_charges;
    } CooldownState;

    typedef struct {
        double remaining;
        int stacks;
        bool active;
    } AuraState;
]]

-- These are pointers to Rust-allocated memory
local state = ffi.cast("GameState*", state_ptr)
local cooldowns = ffi.cast("CooldownState*", cooldown_ptr)
local auras = ffi.cast("AuraState*", aura_ptr)

-- Direct memory access - zero overhead when JIT'd
if cooldowns[KILL_COMMAND].remaining <= 0 and state.focus >= 30 then
    return CAST_KILL_COMMAND
end
```

Rust side:

```rust
use std::ffi::c_void;

#[repr(C)]
pub struct GameState {
    pub focus: f64,
    pub focus_max: f64,
    pub health_pct: f64,
    pub gcd_remaining: f64,
    pub in_combat: bool,
}

#[repr(C)]
pub struct CooldownState {
    pub remaining: f64,
    pub charges: i32,
    pub max_charges: i32,
}

// Pass pointer to Lua
fn setup_lua_state(lua: &Lua, state: &GameState) -> LuaResult<()> {
    let ptr = state as *const GameState as usize;
    lua.globals().set("state_ptr", ptr)?;
    Ok(())
}
```

**Performance:** When the JIT compiles this code, field access becomes a single memory load - identical to C.

### 3.3 UserData Approach (Safer, Slightly Slower)

For mutable state or when FFI complexity is undesirable:

```rust
use mlua::{UserData, UserDataMethods};

struct GameStateUserData {
    inner: Arc<RwLock<SimState>>,
}

impl UserData for GameStateUserData {
    fn add_methods<M: UserDataMethods<Self>>(methods: &mut M) {
        // Read-only accessors (fast)
        methods.add_method("focus", |_, this, ()| {
            Ok(this.inner.read().power.focus)
        });

        methods.add_method("health_pct", |_, this, ()| {
            Ok(this.inner.read().target.health_pct)
        });

        // Cooldown check
        methods.add_method("cooldown_ready", |_, this, spell: String| {
            let state = this.inner.read();
            Ok(state.cooldowns.get(&spell).map_or(false, |cd| cd.remaining <= 0.0))
        });
    }
}
```

```lua
-- Lua side
if state:cooldown_ready("kill_command") and state:focus() >= 30 then
    return "cast:kill_command"
end
```

**Performance:** Each method call crosses the Lua-Rust boundary (~50-100ns). Cache results when possible.

### 3.4 Hybrid Approach (Recommended)

Combine FFI for hot read-only data with UserData for complex operations:

```rust
// Update FFI buffer before each tick
fn update_ffi_state(ffi_state: &mut GameState, sim: &SimState) {
    ffi_state.focus = sim.power.focus;
    ffi_state.focus_max = sim.power.focus_max;
    ffi_state.health_pct = sim.target.health_pct;
    ffi_state.gcd_remaining = sim.gcd_remaining;
    ffi_state.in_combat = sim.in_combat;

    // Update cooldown array
    for (i, cd) in sim.cooldowns.iter().enumerate() {
        ffi_cooldowns[i] = CooldownState {
            remaining: cd.remaining,
            charges: cd.charges as i32,
            max_charges: cd.max_charges as i32,
        };
    }
}
```

---

## 4. FFI Overhead Considerations

### 4.1 Lua-to-Rust Calls (Fast)

When Lua calls Rust functions via FFI, the JIT can inline these calls with near-zero overhead:

```lua
-- Zero overhead when JIT'd
local result = ffi.C.get_cooldown_remaining(spell_id)
```

**Critical optimization:** Cache the namespace, not individual functions:

```lua
-- GOOD: Cache namespace
local C = ffi.C
local remaining = C.get_cooldown_remaining(spell_id)

-- BAD: Cache individual functions (prevents JIT optimization)
local get_cd = ffi.C.get_cooldown_remaining  -- Creates indirect call
```

### 4.2 Rust-to-Lua Calls (Slow)

Calling Lua functions from Rust has significant overhead:

```rust
// ~500-1000ns per call - AVOID in hot paths
let result: bool = lua.scope(|scope| {
    let check_fn = lua.globals().get::<Function>("should_cast")?;
    check_fn.call(spell_id)
})?;
```

**Mitigation strategies:**

1. **Batch calls**: Pass all state at once, get all decisions back
2. **Invert control**: Let Lua drive the rotation, call Rust only for actions
3. **Use FFI callbacks**: Define callbacks in C calling convention

### 4.3 Data Marshalling

Avoid unnecessary data conversion:

```rust
// SLOW: Converts Rust Vec to Lua table
let auras: Vec<AuraInfo> = get_active_auras();
lua.globals().set("auras", lua.to_value(&auras)?)?;

// FAST: Use FFI buffer
update_ffi_aura_buffer(&mut aura_buffer, &sim.auras);
```

---

## 5. Memory Management and GC Concerns

### 5.1 LuaJIT GC Characteristics

LuaJIT uses an incremental garbage collector with configurable behavior:

```lua
-- GC tuning for game loops
collectgarbage("setpause", 100)      -- Start GC at 100% memory growth
collectgarbage("setstepmul", 200)    -- GC speed multiplier
```

### 5.2 GC Tuning for Simulations

For high-frequency rotation evaluation:

```lua
-- Option 1: Incremental GC per tick
collectgarbage("step", 1)  -- Small step each tick

-- Option 2: Manual GC between iterations
collectgarbage("stop")      -- Disable auto GC
-- ... run iteration ...
collectgarbage("collect")   -- Full GC between iterations
```

### 5.3 Reducing GC Pressure

**Avoid allocations in hot paths:**

```lua
-- BAD: Creates new table every call
local function get_action()
    local result = { action = "cast", spell = "kill_command" }
    return result
end

-- GOOD: Return primitives or reuse tables
local result_table = { action = "", spell = "" }
local function get_action()
    result_table.action = "cast"
    result_table.spell = "kill_command"
    return result_table
end

-- BEST: Return encoded integer
local function get_action()
    return CAST_KILL_COMMAND  -- Pre-defined constant
end
```

**Use FFI structs instead of tables:**

```lua
local ffi = require("ffi")
ffi.cdef[[ typedef struct { int action; int spell; } ActionResult; ]]

-- Allocated outside GC
local result = ffi.new("ActionResult")
```

### 5.4 Memory Limits

mlua supports setting memory limits:

```rust
let lua = Lua::new();
lua.set_memory_limit(1024 * 1024)?;  // 1MB limit
```

---

## 6. Performance Comparison: Rhai vs LuaJIT

Based on the current implementation and benchmarks:

### 6.1 Current Rhai Performance

From `/Users/user/Source/wowlab/docs/rhai-scripting.md`:

| Operation | Time |
|-----------|------|
| `optimize_partial()` | ~12 us |
| `optimize_from_partial()` | ~2 us |
| Cached evaluation | ~0.05 us |
| Plain Rhai eval | ~1.6 us |

With 80-90% cache hit rate, effective per-tick cost: **~0.2-0.4 us**

### 6.2 Expected LuaJIT Performance

| Operation | Time | Notes |
|-----------|------|-------|
| JIT-compiled rotation | 0.01-0.05 us | After warmup |
| Cold start (interpret) | 0.1-0.3 us | First few calls |
| Method call overhead | 0.05-0.1 us | Per Rust call |
| FFI field access | ~0 | JIT eliminates |

**Expected improvement: 5-20x faster** for rotation evaluation.

### 6.3 When LuaJIT Wins

- Long-running simulations (JIT warmup amortized)
- Complex rotations with many conditionals
- Floating-point heavy calculations
- When script logic rarely changes

### 6.4 When Rhai Might Be Acceptable

- Short simulations (JIT warmup cost dominates)
- Very simple rotations
- When type safety is critical
- WASM deployment (no LuaJIT JIT support)

---

## 7. WoW Addon Compatibility

### 7.1 Language Compatibility

WoW uses Lua 5.1 with custom extensions. LuaJIT is 100% compatible with Lua 5.1:

```lua
-- WoW addon syntax works directly
if UnitHealth("target") / UnitHealthMax("target") < 0.2 then
    CastSpellByName("Execute")
end
```

### 7.2 Potential for Addon Import

With LuaJIT, you could theoretically:

1. **Parse existing WeakAuras**: Extract rotation logic from WA exports
2. **Import SimC APL**: Translate SimulationCraft APL to Lua
3. **Run addon code**: Execute (sandboxed) WoW addon rotation helpers

Example adapter:

```lua
-- Shim WoW API for simulation
function UnitHealth(unit)
    if unit == "target" then return state.target_health end
    if unit == "player" then return state.player_health end
end

function GetSpellCooldown(spell)
    return cooldowns[spell].start, cooldowns[spell].duration
end

-- Now WoW addon code can run (sandboxed)
```

### 7.3 Limitations

- WoW uses a modified Lua 5.1 with some restricted functions
- Some WoW APIs are async (events) which don't map to simulation
- Frame-based UI code is irrelevant for rotation logic

---

## 8. Implementation Complexity and Migration Path

### 8.1 Cargo.toml Changes

```toml
[dependencies]
# Remove rhai
# rhai = { version = "1", features = ["sync", "internals"] }

# Add mlua with LuaJIT
mlua = { version = "0.10", features = ["luajit", "vendored", "serialize", "send"] }
```

### 8.2 Migration Strategy

#### Phase 1: Parallel Implementation

Keep Rhai, add LuaJIT as optional backend:

```rust
pub enum ScriptBackend {
    Rhai(RhaiRotation),
    Lua(LuaRotation),
}

impl ScriptBackend {
    pub fn next_action(&self, state: &SimState) -> Action {
        match self {
            Self::Rhai(r) => r.next_action(state),
            Self::Lua(l) => l.next_action(state),
        }
    }
}
```

#### Phase 2: Script Translation

Create a transpiler or write Lua equivalents:

```lua
-- rotations/bm_hunter.lua

local KILL_COMMAND = 1
local BARBED_SHOT = 2
local COBRA_SHOT = 3
local BESTIAL_WRATH = 4

local function rotation(state, cooldowns, auras)
    -- Cooldowns
    if cooldowns[BESTIAL_WRATH].remaining <= 0 then
        return { action = "cast", spell = "bestial_wrath" }
    end

    if cooldowns[KILL_COMMAND].remaining <= 0 and state.focus >= 30 then
        return { action = "cast", spell = "kill_command" }
    end

    if cooldowns[BARBED_SHOT].charges > 0 then
        return { action = "cast", spell = "barbed_shot" }
    end

    if state.focus >= 35 then
        return { action = "cast", spell = "cobra_shot" }
    end

    return { action = "wait_gcd" }
end

return rotation
```

#### Phase 3: FFI Optimization

Replace table-based state with FFI:

```lua
local ffi = require("ffi")
ffi.cdef[[
    // Match Rust struct layout exactly
    typedef struct {
        double focus;
        double focus_max;
        // ...
    } SimState;
]]

local function rotation(state_ptr, cooldown_ptr, aura_ptr)
    local state = ffi.cast("SimState*", state_ptr)
    -- ...
end
```

### 8.3 Rust Integration Code

```rust
use mlua::prelude::*;
use std::sync::Arc;
use parking_lot::RwLock;

pub struct LuaRotation {
    lua: Lua,
    rotation_fn: LuaRegistryKey,
    state_buffer: Box<GameState>,
    cooldown_buffer: Box<[CooldownState; MAX_COOLDOWNS]>,
}

impl LuaRotation {
    pub fn new(script: &str) -> LuaResult<Self> {
        let lua = Lua::new();

        // Load and compile script
        let chunk = lua.load(script);
        let rotation_fn: Function = chunk.eval()?;
        let key = lua.create_registry_value(rotation_fn)?;

        Ok(Self {
            lua,
            rotation_fn: key,
            state_buffer: Box::new(GameState::default()),
            cooldown_buffer: Box::new([CooldownState::default(); MAX_COOLDOWNS]),
        })
    }

    pub fn next_action(&mut self, sim: &SimState) -> LuaResult<Action> {
        // Update FFI buffers
        update_ffi_state(&mut self.state_buffer, sim);
        update_ffi_cooldowns(&mut self.cooldown_buffer, sim);

        // Call Lua rotation function
        let rotation_fn: Function = self.lua.registry_value(&self.rotation_fn)?;

        let state_ptr = self.state_buffer.as_ref() as *const _ as usize;
        let cd_ptr = self.cooldown_buffer.as_ref() as *const _ as usize;

        let result: LuaTable = rotation_fn.call((state_ptr, cd_ptr))?;

        // Parse result
        let action: String = result.get("action")?;
        match action.as_str() {
            "cast" => {
                let spell: String = result.get("spell")?;
                Ok(Action::Cast(spell))
            }
            "wait_gcd" => Ok(Action::WaitGcd),
            "wait" => {
                let duration: f64 = result.get("duration")?;
                Ok(Action::Wait(duration))
            }
            _ => Ok(Action::None),
        }
    }
}
```

### 8.4 Effort Estimate

| Task | Complexity | Notes |
|------|------------|-------|
| Add mlua dependency | Low | Feature flags, vendored build |
| Create LuaRotation struct | Medium | Mirror RhaiRotation API |
| FFI state definition | Medium | Match Rust struct layouts |
| Translate scripts | Low-Medium | Mechanical translation |
| Performance tuning | Medium | GC tuning, FFI optimization |
| Testing & validation | Medium | Ensure identical behavior |

**Total estimate:** 2-4 weeks for a production-ready implementation.

---

## 9. Alternatives to Consider

### 9.1 Luau (Roblox's Lua)

mlua also supports Luau, which offers:

- Type annotations (gradual typing)
- Improved performance in some cases
- Native code generation (newer feature)
- No JIT, but AOT compilation option

```toml
mlua = { version = "0.10", features = ["luau", "vendored"] }
```

### 9.2 WASM-based Solutions

For web deployment where LuaJIT's JIT doesn't work:

- **Luau in WASM**: Interpreter-only, but still faster than Rhai
- **Custom bytecode VM**: See `bytecode-vm.md` for a purpose-built solution

### 9.3 Keep Rhai with Deeper Optimization

If migration cost is prohibitive:

- Pre-compile rotation to decision tree
- Generate Rust code from rotation script
- Use memoization more aggressively

---

## 10. Conclusion

LuaJIT via mlua is a compelling alternative to Rhai for rotation scripting:

**Pros:**
- 5-20x faster execution after JIT warmup
- Battle-tested in game engines worldwide
- WoW addon compatibility opens ecosystem opportunities
- FFI enables zero-overhead state access
- Mature tooling and debugging support

**Cons:**
- GC tuning required to avoid latency spikes
- Callback overhead requires architectural consideration
- No JIT in WASM (falls back to interpreter)
- Larger dependency and complexity

**Recommendation:** Proceed with a phased migration, starting with a parallel implementation to validate performance claims. The FFI-based state access pattern is critical for achieving maximum performance.

---

## References

- [LuaJIT Official Site](https://luajit.org/)
- [mlua GitHub Repository](https://github.com/mlua-rs/mlua)
- [mlua Documentation](https://docs.rs/mlua)
- [LuaJIT FFI Tutorial](https://luajit.org/ext_ffi_tutorial.html)
- [LuaJIT Performance](https://luajit.org/performance.html)
- [Wren Performance Comparison](https://wren.io/performance.html)
- [DNS Language Benchmarks](https://github.com/DNS/benchmark-language)
- [Jipok Lua Benchmarks](https://github.com/Jipok/Lua-Benchmarks)
