# Custom Bytecode VM for Rotation Scripting

Analysis of using a custom bytecode interpreter as an alternative to Rhai for rotation scripting in the WoW simulation engine.

## Executive Summary

A custom bytecode VM designed specifically for rotation logic can achieve **10-100x faster execution** than Rhai while maintaining scriptability. The key insight is that rotation scripts have extremely constrained requirements - they read state, perform comparisons, and return an action. This narrow scope allows for a minimal, cache-efficient VM that eliminates interpreter overhead.

**Recommendation**: A register-based VM with 15-20 specialized opcodes can achieve **sub-100ns evaluation** (vs ~2-8us with optimized Rhai), making it viable for millions of iterations per second.

## Current State: Rhai Performance

From `crates/engine/src/rotation/mod.rs`:

| Operation | Cost | Frequency |
|-----------|------|-----------|
| `optimize_partial()` | ~12 us | On talent change |
| `optimize_from_partial()` | ~2 us | On state change |
| `evaluate_optimized()` | ~0.05 us | Every tick (cache hit) |
| Cache miss re-optimization | ~8 us | ~10-20% of ticks |
| Plain Rhai eval | ~1.6 us | Every tick |

**Problem**: Even with aggressive AST optimization and caching:
- Cache misses cost ~8us each
- 10-20% miss rate = 0.8-1.6us average overhead per tick
- At 1M iterations, this adds 0.8-1.6 seconds of pure scripting overhead
- Rhai's Dynamic type boxing adds memory allocation pressure

## Bytecode VM Design for Rotation Logic

### Requirements Analysis

Rotation scripts need:
1. **Read state**: cooldowns, resources, aura stacks, health percentages
2. **Comparisons**: `>=`, `<=`, `<`, `>`, `==`, `!=` (mostly numeric)
3. **Boolean logic**: `&&`, `||`, `!`
4. **Conditionals**: if/else chains (priority lists)
5. **Output**: Return an action (cast spell, wait, pool)

Rotation scripts do NOT need:
- Loops (rotations are single-pass priority lists)
- String manipulation
- Object allocation
- Function definitions
- Complex data structures
- Closures

### Instruction Set Design

A minimal rotation VM needs approximately 15-20 opcodes:

```rust
/// Bytecode instructions for rotation VM
///
/// Encoding: 1 byte opcode + variable operands
/// Most instructions fit in 4 bytes total for cache efficiency
#[repr(u8)]
pub enum OpCode {
    // === State Loading (1 byte opcode + 2 byte slot index) ===
    LoadFloat,      // Load f64 from state slot -> accumulator
    LoadBool,       // Load bool from state slot -> accumulator
    LoadInt,        // Load i64 from state slot -> accumulator

    // === Register Operations ===
    StoreReg,       // Store accumulator -> register[idx]
    LoadReg,        // Load register[idx] -> accumulator

    // === Immediate Values (opcode + inline value) ===
    ImmFloat,       // Load immediate f64 -> accumulator
    ImmInt,         // Load immediate i64 -> accumulator
    ImmBool,        // Load immediate bool -> accumulator

    // === Comparisons (compare accumulator with register, result in flags) ===
    CmpLt,          // accumulator < register[idx]
    CmpLe,          // accumulator <= register[idx]
    CmpGt,          // accumulator > register[idx]
    CmpGe,          // accumulator >= register[idx]
    CmpEq,          // accumulator == register[idx]
    CmpNe,          // accumulator != register[idx]

    // === Boolean Operations ===
    And,            // flags = flags && accumulator
    Or,             // flags = flags || accumulator
    Not,            // flags = !flags

    // === Control Flow ===
    JumpIfFalse,    // if !flags, jump to offset
    Jump,           // unconditional jump to offset

    // === Actions (terminal - execution stops) ===
    Cast,           // Return Action::Cast(spell_id)
    Wait,           // Return Action::Wait(duration)
    WaitGcd,        // Return Action::WaitGcd
    Pool,           // Return Action::Pool(spell_id, duration)

    // === Special ===
    Halt,           // End execution (return None)
}
```

### Bytecode Format

```
Instruction Format (variable length, optimized for common cases):

1-byte instructions:
  [opcode]                    - WaitGcd, Halt, Not

2-byte instructions:
  [opcode][reg_idx]           - StoreReg, LoadReg, And, Or

3-byte instructions:
  [opcode][slot_hi][slot_lo]  - LoadFloat, LoadBool, LoadInt

4-byte instructions:
  [opcode][reg][off_hi][off_lo] - CmpXX, JumpIfFalse, Jump

5-byte instructions:
  [opcode][spell_id x 4]      - Cast (with 4-byte spell ID)

9-byte instructions:
  [opcode][f64 x 8]           - ImmFloat (inline constant)
```

### Register vs Stack-Based VM Tradeoffs

#### Stack-Based (like JVM, Python, Lua 5.0)

```
Pros:
- Simpler code generation (push/pop naturally maps to expression trees)
- No register allocation needed
- Compact bytecode (operands implicit on stack)

Cons:
- More memory traffic (constant push/pop)
- Harder to optimize (values live briefly, lots of copies)
- Stack manipulation overhead (dup, swap, rot)

Example (check focus >= 30.0):
  LOAD_FLOAT power_focus      ; push focus value
  PUSH_CONST 30.0             ; push threshold
  CMP_GE                      ; pop both, push result
  JUMP_IF_FALSE offset        ; pop result, conditional jump
```

#### Register-Based (like Lua 5.1+, Dalvik, our recommendation)

```
Pros:
- Fewer instructions (operands in registers, not shuffled)
- Better cache utilization (registers in hot memory)
- Easier optimization (values persist, can reuse)
- Natural fit for SSA/expression evaluation

Cons:
- Slightly more complex code generation
- Bytecode slightly larger (explicit register operands)
- Need register allocation (trivial for our use case)

Example (check focus >= 30.0):
  LOAD_FLOAT r0, power_focus  ; r0 = focus value
  IMM_FLOAT r1, 30.0          ; r1 = 30.0
  CMP_GE r0, r1               ; flags = r0 >= r1
  JUMP_IF_FALSE offset        ; conditional jump
```

**Recommendation: Register-based** because:
1. Rotation scripts are expression-heavy, not statement-heavy
2. Register reuse is common (same state value used multiple times)
3. 8-16 registers easily fits in L1 cache
4. Simpler runtime (no stack pointer management)

### VM Runtime Structure

```rust
/// Compiled rotation bytecode
pub struct RotationBytecode {
    /// Raw bytecode bytes
    code: Vec<u8>,
    /// Constant pool for f64 values (used when > 8 byte inline not worth it)
    constants: Vec<f64>,
    /// Spell ID -> name mapping for action output
    spell_names: Vec<String>,
    /// Number of state slots this rotation reads
    state_slots: u16,
}

/// VM execution state - designed for cache efficiency
#[repr(C, align(64))]  // Cache line aligned
pub struct RotationVM {
    /// General purpose registers (f64 for numeric, reinterpreted for bool/int)
    registers: [f64; 16],
    /// Accumulator register (primary working value)
    accumulator: f64,
    /// Boolean flags register (comparison results)
    flags: bool,
    /// Instruction pointer
    ip: usize,
}

/// Game state view - passed by reference, not copied
pub struct StateView<'a> {
    /// Flat array of state values, indexed by slot
    slots: &'a [f64],
    /// Boolean slots stored as f64 (0.0 = false, 1.0 = true)
}

impl RotationVM {
    /// Execute bytecode against state, returning action
    ///
    /// This is the hot path - must be as fast as possible
    #[inline(always)]
    pub fn execute(&mut self, bytecode: &RotationBytecode, state: &StateView) -> Action {
        self.ip = 0;

        loop {
            // Safety: bounds checked during compilation
            let opcode = unsafe { *bytecode.code.get_unchecked(self.ip) };
            self.ip += 1;

            match opcode {
                op::LOAD_FLOAT => {
                    let slot = self.read_u16(bytecode);
                    self.accumulator = state.slots[slot as usize];
                }
                op::IMM_FLOAT => {
                    self.accumulator = self.read_f64(bytecode);
                }
                op::STORE_REG => {
                    let idx = self.read_u8(bytecode);
                    self.registers[idx as usize] = self.accumulator;
                }
                op::CMP_GE => {
                    let idx = self.read_u8(bytecode);
                    self.flags = self.accumulator >= self.registers[idx as usize];
                }
                op::JUMP_IF_FALSE => {
                    let offset = self.read_i16(bytecode);
                    if !self.flags {
                        self.ip = (self.ip as i32 + offset as i32) as usize;
                    }
                }
                op::CAST => {
                    let spell_id = self.read_u32(bytecode);
                    return Action::Cast(spell_id);
                }
                op::WAIT_GCD => {
                    return Action::WaitGcd;
                }
                op::HALT => {
                    return Action::None;
                }
                // ... other opcodes
                _ => unreachable!(),
            }
        }
    }

    #[inline(always)]
    fn read_u8(&mut self, bytecode: &RotationBytecode) -> u8 {
        let val = unsafe { *bytecode.code.get_unchecked(self.ip) };
        self.ip += 1;
        val
    }

    #[inline(always)]
    fn read_u16(&mut self, bytecode: &RotationBytecode) -> u16 {
        let bytes = unsafe {
            bytecode.code.get_unchecked(self.ip..self.ip + 2)
        };
        self.ip += 2;
        u16::from_le_bytes([bytes[0], bytes[1]])
    }

    #[inline(always)]
    fn read_f64(&mut self, bytecode: &RotationBytecode) -> f64 {
        let bytes = unsafe {
            bytecode.code.get_unchecked(self.ip..self.ip + 8)
        };
        self.ip += 8;
        f64::from_le_bytes(bytes.try_into().unwrap())
    }
}
```

## Compiling Rotation Scripts to Bytecode

### Compilation Pipeline

```
Source Script (Rhai-like syntax)
        │
        ▼
┌───────────────────┐
│  1. Lexer/Parser  │  Parse to AST
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  2. Type Check    │  Verify types, resolve state slots
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  3. IR Generation │  Convert to SSA-like intermediate repr
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  4. Optimization  │  Constant folding, dead code elimination
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  5. Code Gen      │  Emit bytecode, allocate registers
└───────────────────┘
        │
        ▼
    Bytecode
```

### Example Compilation

Source (MM Hunter rotation snippet):
```rhai
if $cooldown.aimed_shot.ready() && $power.focus >= 35.0 {
    cast($spell.aimed_shot)
} else if $power.focus < 70.0 {
    cast($spell.steady_shot)
}
```

After parsing and slot resolution:
```
State slots:
  0: cooldown_aimed_shot_ready (bool, encoded as f64)
  1: power_focus (f64)

Spell IDs:
  0: aimed_shot
  1: steady_shot
```

Intermediate representation:
```
block_entry:
  %0 = load_float slot[0]          ; cooldown ready (as 0.0/1.0)
  %1 = cmp_ne %0, 0.0              ; convert to bool
  br_false %1, block_else1

  %2 = load_float slot[1]          ; power_focus
  %3 = cmp_ge %2, 35.0
  br_false %3, block_else1

  ret cast(0)                       ; aimed_shot

block_else1:
  %4 = load_float slot[1]          ; power_focus (could reuse %2)
  %5 = cmp_lt %4, 70.0
  br_false %5, block_end

  ret cast(1)                       ; steady_shot

block_end:
  ret wait_gcd
```

Generated bytecode (register allocated, optimized):
```
; Check cooldown ready
00: LOAD_FLOAT r0, 0        ; r0 = cooldown_aimed_shot_ready
03: IMM_FLOAT r1, 0.0       ; r1 = 0.0
0C: CMP_NE r0, r1           ; flags = r0 != 0.0
0E: JUMP_IF_FALSE +20       ; if !ready, skip to else1

; Check focus >= 35
12: LOAD_FLOAT r0, 1        ; r0 = power_focus
15: IMM_FLOAT r1, 35.0
1E: CMP_GE r0, r1           ; flags = focus >= 35.0
20: JUMP_IF_FALSE +6        ; if insufficient focus, skip

; Cast aimed shot
24: CAST 0                  ; return Cast(aimed_shot)

; Else: check focus < 70
28: LOAD_FLOAT r0, 1        ; r0 = power_focus (already loaded, could optimize)
2B: IMM_FLOAT r1, 70.0
34: CMP_LT r0, r1           ; flags = focus < 70.0
36: JUMP_IF_FALSE +6        ; if focus >= 70, skip

; Cast steady shot
3A: CAST 1                  ; return Cast(steady_shot)

; Default
3E: WAIT_GCD                ; return WaitGcd

Total: 63 bytes
```

### Compiler Implementation Sketch

```rust
/// Rotation script compiler
pub struct RotationCompiler {
    /// State slot allocator
    slots: SlotAllocator,
    /// Spell name -> ID mapping
    spells: SpellRegistry,
}

impl RotationCompiler {
    pub fn compile(&mut self, source: &str) -> Result<RotationBytecode, CompileError> {
        // 1. Parse
        let ast = self.parse(source)?;

        // 2. Type check and resolve state references
        let typed_ast = self.type_check(ast)?;

        // 3. Generate IR
        let ir = self.generate_ir(typed_ast);

        // 4. Optimize IR
        let optimized = self.optimize(ir);

        // 5. Generate bytecode
        let bytecode = self.codegen(optimized);

        Ok(bytecode)
    }

    fn codegen(&self, ir: IR) -> RotationBytecode {
        let mut emitter = BytecodeEmitter::new();
        let mut register_alloc = RegisterAllocator::new(16);

        for block in ir.blocks {
            emitter.mark_label(block.label);

            for inst in block.instructions {
                match inst {
                    IRInst::LoadFloat { dst, slot } => {
                        let reg = register_alloc.allocate(dst);
                        emitter.emit_load_float(reg, slot);
                    }
                    IRInst::ImmFloat { dst, value } => {
                        let reg = register_alloc.allocate(dst);
                        emitter.emit_imm_float(reg, value);
                    }
                    IRInst::CmpGe { lhs, rhs } => {
                        let lhs_reg = register_alloc.get(lhs);
                        let rhs_reg = register_alloc.get(rhs);
                        emitter.emit_cmp_ge(lhs_reg, rhs_reg);
                    }
                    IRInst::BranchFalse { target } => {
                        emitter.emit_jump_if_false(target);
                    }
                    IRInst::Cast { spell_id } => {
                        emitter.emit_cast(spell_id);
                    }
                    // ... etc
                }
            }
        }

        emitter.resolve_labels();
        emitter.into_bytecode()
    }
}
```

## Performance Expectations

### Theoretical Analysis

| Component | Rhai (current) | Bytecode VM |
|-----------|---------------|-------------|
| Dispatch overhead | ~10-50 cycles (indirect call) | ~3-5 cycles (switch dispatch) |
| Value boxing | Every operation | Zero (native types) |
| Memory allocations | Per-evaluation | Zero (pre-allocated) |
| Cache behavior | Poor (scattered AST) | Excellent (linear bytecode) |
| Branch prediction | Poor (dynamic dispatch) | Good (tight loop) |

### Expected Performance

Based on analysis of similar VMs (Lua 5.x, mruby, game engine scripting):

| Metric | Rhai (optimized) | Bytecode VM | Speedup |
|--------|-----------------|-------------|---------|
| Simple condition | ~0.05 us (cache hit) | ~10-20 ns | 2-5x |
| Cache miss | ~8 us | ~20-50 ns | 160-400x |
| Full rotation (12 conditions) | ~0.5-2 us | ~50-100 ns | 10-40x |
| Memory per evaluation | ~500+ bytes | ~128 bytes | 4x less |

### Benchmark Estimate

For a 5-minute sim with 200 iterations at ~300 ticks/sim:

```
Current (Rhai):
- 200 * 300 * 5 = 300,000 rotation evaluations
- At ~1us average (with cache): 300ms total
- At ~8us (cache miss heavy): 2.4s total

With Bytecode VM:
- 300,000 * 50ns = 15ms total
- 20x faster rotation evaluation
```

## Comparison with Existing Solutions

### Lua Bytecode (PUC-Rio Lua, LuaJIT)

**Lua 5.4 approach:**
- Register-based VM
- 32-bit instructions (fixed width)
- ~50 opcodes covering full language
- Performance: ~100-500ns per opcode

**LuaJIT approach:**
- Trace-based JIT compilation
- Native code generation for hot paths
- Performance: ~1-10ns per opcode (JIT compiled)

**Relevance**: Lua is overkill for rotations. We need ~15 opcodes, not 50+. LuaJIT's JIT adds complexity we don't need since rotations don't have loops.

### WebAssembly (WASM)

**WASM approach:**
- Stack-based bytecode (for portability)
- Designed for compilation from C/C++/Rust
- Complex instruction set (~200+ opcodes)
- Requires runtime (wasmer, wasmtime)

**Performance**: ~50-200ns overhead for function call into WASM module

**Relevance**: WASM is designed for sandboxed general-purpose code. It's portable but carries significant overhead for our simple use case. However, WASM could be a target if we want browser execution.

### Game Engine VMs

**Unity's IL2CPP:**
- Compiles C# IL to C++
- Not an interpreter - full native compilation
- Startup cost, but native performance

**Unreal Blueprint VM:**
- Custom bytecode for visual scripting
- Optimized for game logic patterns
- ~200ns per node evaluation

**SimC (WoW sim reference):**
- Action priority list interpreted
- Text-based, not bytecode
- ~1-10us per action evaluation

**Relevance**: Game engines optimize for different tradeoffs (hot-reload, debugging). Our single-purpose VM can be much simpler and faster.

## Memory Layout and Cache Efficiency

### Bytecode Layout

```
┌─────────────────────────────────────────────┐
│ RotationBytecode (cache-friendly layout)    │
├─────────────────────────────────────────────┤
│ code: Vec<u8>                               │
│ ┌─────────────────────────────────────────┐ │
│ │ [op][op][op][op]... (64-256 bytes typ.) │ │ ← Hot, fits in L1
│ └─────────────────────────────────────────┘ │
│ constants: Vec<f64>                         │
│ ┌─────────────────────────────────────────┐ │
│ │ [f64][f64]... (0-16 values typical)     │ │ ← Rarely accessed
│ └─────────────────────────────────────────┘ │
│ spell_names: Vec<String>                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Spell ID -> name for output only        │ │ ← Cold, only on action
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### State Layout

```
┌─────────────────────────────────────────────┐
│ StateView (64-byte aligned)                 │
├─────────────────────────────────────────────┤
│ slots: &[f64]                               │
│ ┌─────────────────────────────────────────┐ │
│ │ [cooldown_ready][focus][health]...      │ │
│ │ All values as f64 for uniform access    │ │
│ │ Bool: 0.0/1.0, Int: cast to f64         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Typical size: 20-40 slots = 160-320 bytes   │
│ Fits in L1 cache (32KB typical)             │
└─────────────────────────────────────────────┘
```

### VM State Layout

```
┌─────────────────────────────────────────────┐
│ RotationVM (single cache line = 64 bytes)   │
├─────────────────────────────────────────────┤
│ registers[0..7]: 64 bytes                   │ ← Cache line 1
├─────────────────────────────────────────────┤
│ registers[8..15]: 64 bytes                  │ ← Cache line 2
│ accumulator: 8 bytes                        │
│ flags: 1 byte + padding                     │
│ ip: 8 bytes                                 │
└─────────────────────────────────────────────┘

Total: ~144 bytes, 3 cache lines worst case
```

### Cache Analysis

```
Execution Pattern (per tick):

1. Load bytecode pointer          ; 1 cache miss (first time only)
2. Load state pointer             ; 1 cache miss (first time only)
3. Execute opcodes:
   - Read opcode                  ; L1 hit (sequential)
   - Read state slot              ; L1 hit (small state)
   - Read/write register          ; L1 hit (VM state hot)
4. Return action                  ; No allocation

Expected cache behavior:
- First iteration: 2-3 cache misses (~200 cycles)
- Subsequent iterations: 0 cache misses
- Total cycles: ~50-100 per evaluation
- At 3GHz: ~15-30ns per evaluation
```

## Implementation Complexity

### Effort Estimate

| Component | Complexity | Lines of Code | Time |
|-----------|------------|---------------|------|
| Lexer/Parser | Medium | 400-600 | 2-3 days |
| Type Checker | Low | 200-300 | 1 day |
| IR Generation | Medium | 300-400 | 1-2 days |
| IR Optimizer | Low | 200-300 | 1 day |
| Bytecode Emitter | Medium | 300-400 | 1-2 days |
| VM Interpreter | Medium | 200-300 | 1-2 days |
| State Integration | Low | 100-200 | 0.5 days |
| Testing | Medium | 500-800 | 2-3 days |
| **Total** | | **2200-3300** | **10-15 days** |

### Maintenance Considerations

**Pros:**
- Self-contained, no external dependencies
- Complete control over performance
- Can evolve with engine needs
- No Rhai version upgrade concerns

**Cons:**
- Custom language = custom tooling needs
- No existing IDE support
- Need to document syntax
- More code to maintain

### Alternative: Extend Current System

If full bytecode VM is too much, consider intermediate steps:

1. **Replace Rhai with cranelift-jit**: Compile to native code at runtime
   - Pros: Native speed, existing compiler infrastructure
   - Cons: Complex dependency, longer compile times

2. **Compile to decision tree**: Pre-evaluate all possible paths
   - Pros: Zero runtime overhead, just table lookup
   - Cons: Exponential explosion with many conditions

3. **Domain-specific macro**: Generate Rust code from rotation DSL
   - Pros: Native performance, type safety
   - Cons: Requires recompilation for rotation changes

## Recommended Implementation Approach

### Phase 1: Prototype (3-5 days)

1. Implement minimal VM with 10 opcodes
2. Hand-write bytecode for BM Hunter rotation
3. Benchmark against Rhai
4. Validate performance hypothesis

```rust
// Minimal prototype - hand-coded BM Hunter rotation
let bytecode = vec![
    // if cooldown.bestial_wrath.ready()
    op::LOAD_FLOAT, 0, 0,           // r0 = slot[0] (bestial_wrath_ready)
    op::CMP_NE, 0, 0,               // flags = r0 != 0.0
    op::JUMP_IF_FALSE, 0, 10,       // skip to next check
    op::CAST, 0, 0, 0, 0,           // return Cast(bestial_wrath)

    // if cooldown.kill_command.ready() && power.focus >= 30.0
    op::LOAD_FLOAT, 0, 1,           // r0 = slot[1] (kill_command_ready)
    op::CMP_NE, 0, 0,
    op::JUMP_IF_FALSE, 0, 20,
    op::LOAD_FLOAT, 0, 2,           // r0 = slot[2] (focus)
    op::IMM_FLOAT, /* 30.0 bytes */
    op::CMP_GE, 0, 1,
    op::JUMP_IF_FALSE, 0, 6,
    op::CAST, 1, 0, 0, 0,           // return Cast(kill_command)

    // ... etc
];
```

### Phase 2: Compiler (5-7 days)

1. Implement lexer/parser for rotation syntax
2. Type checker with state slot resolution
3. Basic code generation

### Phase 3: Optimization (3-5 days)

1. Constant folding
2. Dead code elimination
3. Register allocation optimization
4. Consider computed goto dispatch

### Phase 4: Integration (2-3 days)

1. Replace Rhai in hot path
2. Keep Rhai for complex scripts/debugging
3. Add rotation bytecode caching

## Conclusion

A custom bytecode VM for rotation scripting is a viable and potentially high-impact optimization:

- **Performance gain**: 10-100x faster than Rhai
- **Implementation cost**: 2-3 weeks of focused work
- **Maintenance**: Moderate (self-contained, well-scoped)
- **Risk**: Low (can fall back to Rhai)

The key insight is that rotations are **extremely constrained** - they're pure functions that read state and return actions. This allows for a minimal VM that eliminates all the generality (and overhead) of a full scripting language.

For a simulation running millions of iterations, the ~15-30ns evaluation time (vs ~1-8us with Rhai) translates to significant real-world speedup, potentially reducing rotation overhead from seconds to milliseconds.

### Next Steps

1. Prototype the VM core with hand-written bytecode
2. Benchmark against current Rhai implementation
3. If results are promising, build the compiler
4. Consider hybrid approach: bytecode VM for hot path, Rhai for debugging/development
