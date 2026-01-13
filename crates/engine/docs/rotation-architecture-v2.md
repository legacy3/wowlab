# Rotation System Architecture v2

## Overview

A name-based JIT compilation system for WoW rotation logic. Human-readable JSON definitions compile to native code via Cranelift, with automatic context building. Inspired by SimulationCraft's APL system but with a JSON-first approach.

## Design Goals

1. **Readable rotations** - JSON uses spell/aura names, not slot indices
2. **Minimal spec boilerplate** - Specs only define name→ID mappings
3. **Native performance** - Cranelift JIT, direct memory loads
4. **SimC compatibility** - Support core APL features (action lists, variables, expressions)
5. **Extensible** - Adding variables doesn't require code changes

---

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│  Rotation JSON  │────▶│    Parser    │────▶│ Unresolved AST│
│  (named vars)   │     │              │     │               │
└─────────────────┘     └──────────────┘     └───────┬───────┘
                                                     │
                        ┌──────────────┐             │
                        │ SpecResolver │◀────────────┤
                        │ (name → ID)  │             │
                        └──────┬───────┘             │
                               │                     ▼
                               │            ┌───────────────┐
                               └───────────▶│  Resolved AST │
                                            │ + Context     │
                                            │   Schema      │
                                            └───────┬───────┘
                                                    │
                                            ┌───────▼───────┐
                                            │   Cranelift   │
                                            │   Compiler    │
                                            └───────┬───────┘
                                                    │
┌─────────────────┐     ┌──────────────┐     ┌──────▼────────┐
│    SimState     │────▶│Context Build │────▶│  Native Code  │────▶ Action
│                 │     │ (automatic)  │     │               │
└─────────────────┘     └──────────────┘     └───────────────┘
```

---

## Rotation JSON Format

### Complete Example

```json
{
  "name": "BM Hunter Single Target",
  "variables": {
    "sync_active": {
      "and": [
        "buff.call_of_the_wild.up",
        "buff.bestial_wrath.up"
      ]
    },
    "sync_ready": {
      "and": [
        "cooldown.call_of_the_wild.ready",
        "cooldown.bestial_wrath.ready"
      ]
    },
    "frenzy_needs_refresh": {
      "<": ["buff.frenzy.remains", 2.0]
    }
  },
  "lists": {
    "precombat": [
      { "spell": "summon_pet" }
    ],
    "cooldowns": [
      {
        "spell": "call_of_the_wild",
        "when": "sync_ready"
      },
      {
        "spell": "bestial_wrath",
        "when": {
          "or": [
            "sync_ready",
            { ">": ["cooldown.call_of_the_wild.remains", 30] }
          ]
        }
      },
      {
        "spell": "bloodshed",
        "when": "buff.bestial_wrath.up"
      }
    ],
    "st": [
      {
        "spell": "kill_shot",
        "when": { "<": ["target.health.pct", 20] }
      },
      {
        "spell": "kill_command",
        "when": { ">=": ["focus", 30] }
      },
      {
        "spell": "barbed_shot",
        "when": {
          "or": [
            "frenzy_needs_refresh",
            { ">=": ["cooldown.barbed_shot.charges", 2] }
          ]
        }
      },
      {
        "spell": "cobra_shot",
        "when": { ">=": ["focus", 50] }
      }
    ],
    "cleave": [
      {
        "spell": "multi_shot",
        "when": { "<": ["buff.beast_cleave.remains", 0.5] }
      },
      { "call_list": "st" }
    ]
  },
  "actions": [
    { "call_list": "precombat", "when": { "<=": ["time", 0] } },
    { "call_list": "cooldowns" },
    { "call_list": "cleave", "when": { ">=": ["active_enemies", 2] } },
    { "call_list": "st" }
  ]
}
```

---

## Action Types

### Spell Cast

```json
{ "spell": "kill_command" }
{ "spell": "kill_command", "when": { ">=": ["focus", 30] } }
```

### Call Action List

Calls a sub-list. If no action is found, continues to next action in caller.

```json
{ "call_list": "cooldowns" }
{ "call_list": "cleave", "when": { ">=": ["active_enemies", 2] } }
```

### Run Action List

Calls a sub-list. If no action is found, does NOT continue (hard switch).

```json
{ "run_list": "execute_phase", "when": { "<": ["target.health.pct", 20] } }
```

### Variable Set

Sets a runtime variable (evaluated each tick).

```json
{ "set_var": "pooling", "value": { "<": ["cooldown.bestial_wrath.remains", 3] } }
```

### Variable Operation

Modifies a runtime variable with an operation.

```json
{ "var_op": "damage_count", "op": "add", "value": 1 }
{ "var_op": "min_focus", "op": "min", "value": "focus" }
```

Operations: `set`, `add`, `sub`, `mul`, `div`, `min`, `max`, `reset`

### Wait

Pauses action processing (returns "wait" action).

```json
{ "wait": 0.5 }
{ "wait_until": "cooldown.bestial_wrath.ready" }
```

### Pool Resource

Waits until enough resources for next action.

```json
{ "pool_resource": true, "extra_amount": 20 }
```

---

## Expression Language

### Comparison Operators

| Operator | JSON Key | Example |
|----------|----------|---------|
| `>=` | `">="` | `{ ">=": ["focus", 30] }` |
| `>` | `">"` | `{ ">": ["buff.frenzy.stacks", 2] }` |
| `<=` | `"<="` | `{ "<=": ["target.health.pct", 20] }` |
| `<` | `"<"` | `{ "<": ["cooldown.kill_command.remains", 1] }` |
| `==` | `"=="` | `{ "==": ["buff.frenzy.stacks", 3] }` |
| `!=` | `"!="` | `{ "!=": ["target.count", 1] }` |

### Logical Operators

| Operator | JSON Key | Example |
|----------|----------|---------|
| AND | `"and"` | `{ "and": ["buff.a.up", "buff.b.up"] }` |
| OR | `"or"` | `{ "or": ["buff.a.up", "buff.b.up"] }` |
| NOT | `"not"` | `{ "not": "buff.a.up" }` |

### Arithmetic Operators

| Operator | JSON Key | Example |
|----------|----------|---------|
| Add | `"+"` | `{ "+": ["focus", 10] }` |
| Subtract | `"-"` | `{ "-": ["focus.max", "focus"] }` |
| Multiply | `"*"` | `{ "*": ["buff.stacks", 0.1] }` |
| Divide | `"/"` | `{ "/": ["focus", "focus.max"] }` |
| Modulo | `"%"` | `{ "%": ["time", 30] }` |

### Special Operators

| Operator | JSON Key | Description | Example |
|----------|----------|-------------|---------|
| Min | `"min"` | Returns smaller value | `{ "min": ["focus", 50] }` |
| Max | `"max"` | Returns larger value | `{ "max": ["focus", 30] }` |
| Abs | `"abs"` | Absolute value | `{ "abs": { "-": ["a", "b"] } }` |
| Floor | `"floor"` | Round down | `{ "floor": { "/": ["focus", 30] } }` |
| Ceil | `"ceil"` | Round up | `{ "ceil": { "/": ["focus", 30] } }` |

### Expression Nesting

Expressions can be arbitrarily nested:

```json
{
  "and": [
    { ">=": ["focus", { "-": ["focus.max", 20] }] },
    { "or": [
      "cooldown.kill_command.ready",
      { "<": ["cooldown.kill_command.remains", "gcd.remains"] }
    ]}
  ]
}
```

### Shorthand: Boolean Variables

Boolean variables can be used directly as conditions:

```json
{ "spell": "bestial_wrath", "when": "cooldown.bestial_wrath.ready" }
```

Is equivalent to:

```json
{ "spell": "bestial_wrath", "when": { "==": ["cooldown.bestial_wrath.ready", true] } }
```

### Shorthand: User Variables

User-defined variables (from `variables` block) can be referenced by name:

```json
{
  "variables": {
    "sync_ready": { "and": ["cooldown.a.ready", "cooldown.b.ready"] }
  },
  "actions": [
    { "spell": "big_cooldown", "when": "sync_ready" }
  ]
}
```

---

## Variable Paths

### Resources

```
focus                       # Current value
focus.max                   # Maximum capacity
focus.deficit               # max - current
focus.pct                   # (current / max) * 100
focus.regen                 # Regeneration per second

# Aliases for other classes
energy, mana, rage, runic_power, holy_power, soul_shards,
combo_points, chi, maelstrom, insanity, astral_power,
arcane_charges, essence, fury
```

### Time

```
time                        # Seconds into combat
fight_remains               # Estimated remaining duration
gcd.remains                 # GCD time remaining
gcd.max                     # Hasted GCD duration
```

### Target

```
target.health.pct           # Health percentage (0-100)
target.time_to_die          # Estimated TTD in seconds
target.distance             # Yards to target
active_enemies              # Number of enemies
target.count                # Alias for active_enemies
```

### Cooldowns

```
cooldown.<spell>.ready      # bool: off cooldown
cooldown.<spell>.up         # Alias for .ready
cooldown.<spell>.remains    # Seconds until ready
cooldown.<spell>.duration   # Base cooldown duration
cooldown.<spell>.charges    # Current charges
cooldown.<spell>.max_charges
cooldown.<spell>.full_recharge_time
```

### Buffs

```
buff.<name>.up              # bool: active
buff.<name>.active          # Alias for .up
buff.<name>.down            # bool: not active
buff.<name>.remains         # Seconds remaining
buff.<name>.stacks          # Current stacks
buff.<name>.max_stacks
buff.<name>.duration        # Total duration when applied
buff.<name>.react           # Stacks (with reaction time)
```

### Debuffs

```
debuff.<name>.up
debuff.<name>.remains
debuff.<name>.stacks
```

### DoTs (Damage over Time)

```
dot.<name>.ticking          # bool: DoT is active
dot.<name>.remains          # Time remaining
dot.<name>.refreshable      # bool: < 30% pandemic window
dot.<name>.ticks_remain     # Ticks remaining
dot.<name>.pmultiplier      # Snapshot multiplier
```

### Pet

```
pet.active                  # bool: pet is alive
pet.remains                 # Temp pet duration remaining
pet.buff.<name>.up          # Pet buff active
```

### Talents

```
talent.<name>.enabled       # bool (constant-folded at compile time)
```

### Trinkets

```
trinket.1.ready
trinket.1.cooldown.remains
trinket.2.ready
equipped.<item_name>        # bool
```

### Spell Properties

```
spell.<name>.cast_time      # Cast time in seconds
spell.<name>.cost           # Resource cost
spell.<name>.cooldown       # Base cooldown
```

---

## Spec Implementation

Each spec provides a `SpecResolver` that maps names to game IDs:

```rust
// specs/hunter/bm/mod.rs

pub fn spec_resolver() -> SpecResolver {
    SpecResolver::new("beast_mastery")
        // Resource type
        .resource(ResourceType::Focus)

        // Spells: name → spell_id
        .spell("kill_command", 34026)
        .spell("cobra_shot", 193455)
        .spell("barbed_shot", 217200)
        .spell("bestial_wrath", 19574)
        .spell("call_of_the_wild", 359844)
        .spell("dire_beast", 120679)
        .spell("bloodshed", 321530)
        .spell("kill_shot", 53351)
        .spell("multi_shot", 2643)

        // Auras: name → aura_id
        .aura("bestial_wrath", 19574)
        .aura("frenzy", 272790)
        .aura("beast_cleave", 118455)
        .aura("thrill_of_the_hunt", 257946)
        .aura("call_of_the_wild", 359844)

        // DoTs (debuffs applied by player)
        .dot("barbed_shot", 217200)
        .dot("serpent_sting", 271788)

        // Charged cooldowns: name, spell_id, max_charges
        .charged_cooldown("barbed_shot", 217200, 2)

        // Talents: name → talent_id (for constant folding)
        .talent("killer_instinct", 273887)
        .talent("animal_companion", 267116)
}
```

That's it. No manual `build_context()`, no slot indices, no ContextBuilder trait.

---

## Compiler Pipeline

### 1. Parser (`parser.rs`)

Parses JSON into unresolved AST:

```rust
pub struct UnresolvedRotation {
    pub name: String,
    pub variables: HashMap<String, UnresolvedExpr>,
    pub lists: HashMap<String, Vec<UnresolvedAction>>,
    pub actions: Vec<UnresolvedAction>,
}

pub enum UnresolvedAction {
    Spell { name: String, when: Option<UnresolvedExpr> },
    CallList { name: String, when: Option<UnresolvedExpr> },
    RunList { name: String, when: Option<UnresolvedExpr> },
    SetVar { name: String, value: UnresolvedExpr },
    VarOp { name: String, op: VarOp, value: UnresolvedExpr },
    Wait { seconds: f64 },
    WaitUntil { condition: UnresolvedExpr },
}

pub enum UnresolvedExpr {
    // Literals
    Bool(bool),
    Number(f64),

    // Variable reference (not yet resolved)
    Var(String),

    // Logical
    And(Vec<UnresolvedExpr>),
    Or(Vec<UnresolvedExpr>),
    Not(Box<UnresolvedExpr>),

    // Comparison
    Cmp(CmpOp, Box<UnresolvedExpr>, Box<UnresolvedExpr>),

    // Arithmetic
    BinOp(BinOp, Box<UnresolvedExpr>, Box<UnresolvedExpr>),

    // Functions
    Floor(Box<UnresolvedExpr>),
    Ceil(Box<UnresolvedExpr>),
    Abs(Box<UnresolvedExpr>),
    Min(Box<UnresolvedExpr>, Box<UnresolvedExpr>),
    Max(Box<UnresolvedExpr>, Box<UnresolvedExpr>),
}
```

### 2. Resolver (`resolver.rs`)

Resolves names and builds context schema:

```rust
pub struct ResolvedRotation {
    pub name: String,
    pub lists: HashMap<String, CompiledList>,
    pub entry_list: CompiledList,
    pub schema: ContextSchema,
    pub runtime_vars: Vec<RuntimeVar>,
}

pub struct CompiledList {
    pub actions: Vec<ResolvedAction>,
}

pub struct ContextSchema {
    pub size: usize,
    pub alignment: usize,
    pub fields: Vec<ContextField>,
}

pub enum ContextField {
    PrimaryResource { offset: usize },
    PrimaryResourceMax { offset: usize },
    PrimaryResourceDeficit { offset: usize },
    Time { offset: usize },
    GcdRemains { offset: usize },
    FightRemains { offset: usize },
    TargetHealthPct { offset: usize },
    TargetTimeToDie { offset: usize },
    ActiveEnemies { offset: usize },

    CooldownReady { offset: usize, spell: SpellIdx },
    CooldownRemains { offset: usize, spell: SpellIdx },
    CooldownCharges { offset: usize, spell: SpellIdx },

    BuffActive { offset: usize, aura: AuraIdx },
    BuffStacks { offset: usize, aura: AuraIdx },
    BuffRemains { offset: usize, aura: AuraIdx },

    DebuffActive { offset: usize, aura: AuraIdx },
    DebuffRemains { offset: usize, aura: AuraIdx },

    DotTicking { offset: usize, aura: AuraIdx },
    DotRemains { offset: usize, aura: AuraIdx },
    DotRefreshable { offset: usize, aura: AuraIdx },

    PetActive { offset: usize },

    // Constant (resolved at compile time, baked into code)
    TalentEnabled { value: bool },
}
```

Resolution process:
1. Parse variable path: `cooldown.kill_command.ready`
2. Look up `kill_command` in SpecResolver → `SpellIdx(34026)`
3. Create `ContextField::CooldownReady { offset: N, spell: SpellIdx(34026) }`
4. Assign offset, increment schema size
5. Deduplicate identical fields

### 3. Compiler (`compiler.rs`)

Generates Cranelift IR for each action list:

```rust
pub struct CompiledRotation {
    /// Entry point function
    entry_func: RotationFn,

    /// Compiled sub-lists (called via function pointers)
    lists: HashMap<String, RotationFn>,

    /// Context schema for runtime population
    schema: ContextSchema,

    /// Runtime variable storage
    runtime_vars: RuntimeVarStorage,
}

type RotationFn = unsafe extern "C" fn(
    ctx: *const u8,           // Context buffer
    vars: *mut RuntimeVars,   // Runtime variables
) -> Action;

#[repr(C)]
pub struct Action {
    pub kind: ActionKind,
    pub spell_id: u32,
    pub wait_time: f32,
}

#[repr(u8)]
pub enum ActionKind {
    Spell = 0,
    Wait = 1,
    None = 2,
}
```

Code generation for expressions:

```rust
// Arithmetic: { "+": ["focus", 10] }
let a = compile_expr(builder, left)?;
let b = compile_expr(builder, right)?;
Ok(builder.ins().fadd(a, b))

// Comparison: { ">=": ["focus", 30] }
let a = compile_expr(builder, left)?;
let b = compile_expr(builder, right)?;
Ok(builder.ins().fcmp(FloatCC::GreaterThanOrEqual, a, b))

// Function: { "floor": expr }
let val = compile_expr(builder, inner)?;
Ok(builder.ins().floor(val))

// Short-circuit AND
let a_val = compile_expr(builder, a)?;
let check_b = builder.create_block();
let merge = builder.create_block();
builder.append_block_param(merge, types::I8);
builder.ins().brif(a_val, check_b, &[], merge, &[false_const]);
builder.switch_to_block(check_b);
let b_val = compile_expr(builder, b)?;
builder.ins().jump(merge, &[b_val]);
```

### 4. Runtime (`context.rs`)

Populates context from SimState:

```rust
impl CompiledRotation {
    pub fn evaluate(&self, state: &SimState) -> Action {
        // Stack-allocated context buffer (size known at compile time)
        let mut ctx = [0u8; 512];  // Or heap if larger

        // Populate only fields this rotation uses
        let now = state.now();
        for field in &self.schema.fields {
            field.write(&mut ctx, state, now);
        }

        // Call JIT-compiled function
        unsafe {
            (self.entry_func)(ctx.as_ptr(), self.runtime_vars.as_mut_ptr())
        }
    }
}

impl ContextField {
    fn write(&self, ctx: &mut [u8], state: &SimState, now: SimTime) {
        match self {
            Self::PrimaryResource { offset } => {
                let val = state.player.resources.primary
                    .as_ref().map(|r| r.current as f64).unwrap_or(0.0);
                write_f64(ctx, *offset, val);
            }
            Self::CooldownReady { offset, spell } => {
                let ready = state.player.cooldown(*spell)
                    .map(|cd| cd.is_ready(now)).unwrap_or(true);
                write_bool(ctx, *offset, ready);
            }
            Self::DotTicking { offset, aura } => {
                let ticking = state.enemies.primary()
                    .map(|e| e.debuffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(ctx, *offset, ticking);
            }
            Self::DotRefreshable { offset, aura } => {
                let refreshable = state.enemies.primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| a.remaining(now).as_secs_f32() < a.duration().as_secs_f32() * 0.3)
                    .unwrap_or(true);
                write_bool(ctx, *offset, refreshable);
            }
            // ... etc
        }
    }
}
```

---

## Optimizations

### Constant Folding

Talents are known at rotation compile time:

```json
{ "when": { "and": ["talent.killer_instinct.enabled", { "<": ["target.health.pct", 35] }] } }
```

If `killer_instinct` is enabled, resolves to:

```json
{ "when": { "<": ["target.health.pct", 35] } }
```

If not enabled, the entire action is removed.

### Short-Circuit Evaluation

`And`/`Or` generate proper branching (not eager evaluation):

```
// { "and": [A, B] }
if !A: goto false_block
if !B: goto false_block
result = true
goto merge
false_block:
result = false
merge:
```

### Context Field Deduplication

If `focus` is referenced 5 times, only one field is added to schema.
The resolver maintains a `HashSet<ContextField>` for deduplication.

### Inline Action Lists

Small action lists (< 5 actions) are inlined into callers instead of generating separate functions.

### Stack Allocation

Context buffer uses stack allocation for sizes <= 512 bytes:

```rust
if self.schema.size <= 512 {
    let mut ctx = [0u8; 512];
    // ...
} else {
    let mut ctx = vec![0u8; self.schema.size];
    // ...
}
```

---

## File Structure

```
crates/engine/src/rotation/
├── mod.rs              # Public API
├── parser.rs           # JSON → UnresolvedRotation
├── resolver.rs         # Name resolution + schema building
├── compiler.rs         # Cranelift IR generation
├── context.rs          # ContextField + runtime population
├── expr.rs             # Expression types and evaluation
├── action.rs           # Action types
├── spec_resolver.rs    # SpecResolver builder
└── error.rs            # Error types

crates/engine/src/specs/hunter/bm/
├── mod.rs              # Exports spec_resolver()
├── handler.rs          # SpecHandler impl (unchanged)
├── spells.rs           # Spell definitions (unchanged)
├── auras.rs            # Aura definitions (unchanged)
└── constants.rs        # SpellIdx/AuraIdx constants (unchanged)
# rotation.rs is DELETED
```

---

## Migration Path

1. **Phase 1: Core infrastructure**
   - Implement parser for new JSON format
   - Implement resolver with SpecResolver
   - Implement compiler with expression support
   - Add arithmetic operators, floor/ceil

2. **Phase 2: BM Hunter migration**
   - Create BM Hunter spec_resolver()
   - Convert BM rotation to new JSON format
   - Verify benchmarks match current performance
   - Delete old rotation.rs

3. **Phase 3: Feature completion**
   - Add action list support (call_list, run_list)
   - Add runtime variables (set_var, var_op)
   - Add DoT tracking
   - Add pool_resource, wait actions

4. **Phase 4: Remaining specs**
   - Convert MM Hunter
   - Convert other specs as implemented

---

## Performance Expectations

| Operation | Time |
|-----------|------|
| Rotation compile | ~1-10ms (one-time startup) |
| Context populate | ~50-150ns (per evaluation) |
| JIT evaluation | ~10-50ns (per evaluation) |
| **Total per-tick** | **~60-200ns** |

Comparable to current slot-based system. The context population loop is fast
because it only populates fields the rotation actually uses.

---

## Comparison with SimC

| Feature | SimC APL | Our JSON | Status |
|---------|----------|----------|--------|
| Named variables | `cooldown.X.ready` | `cooldown.X.ready` | ✅ Same |
| Action lists | `call_action_list` | `call_list` | ✅ Supported |
| User variables | `variable,name=X` | `set_var` | ✅ Supported |
| Arithmetic | `+`, `-`, `*`, `%` | `"+"`, `"-"`, `"*"`, `"/"` | ✅ Supported |
| Functions | `floor()`, `ceil()` | `"floor"`, `"ceil"` | ✅ Supported |
| DoT tracking | `dot.X.ticking` | `dot.X.ticking` | ✅ Supported |
| Min/max | `<?`, `>?` | `"min"`, `"max"` | ✅ Supported |
| Sequences | `sequence` | - | ❌ Not planned |
| Target cycling | `cycle_targets=1` | - | 🔮 Future |
| Line cooldown | `line_cd=X` | - | 🔮 Future |

---

## Example: Full BM Hunter Rotation

```json
{
  "name": "BM Hunter - The War Within S1",
  "variables": {
    "sync_ready": {
      "and": [
        "cooldown.bestial_wrath.ready",
        { "or": [
          "cooldown.call_of_the_wild.ready",
          { ">": ["cooldown.call_of_the_wild.remains", 30] }
        ]}
      ]
    },
    "frenzy_needs_barbed": {
      "or": [
        { "not": "buff.frenzy.up" },
        { "<": ["buff.frenzy.remains", { "*": ["gcd.max", 2] }] }
      ]
    }
  },
  "lists": {
    "cooldowns": [
      { "spell": "call_of_the_wild", "when": "sync_ready" },
      { "spell": "bestial_wrath", "when": "sync_ready" },
      { "spell": "bloodshed", "when": "buff.bestial_wrath.up" }
    ],
    "cleave": [
      { "spell": "multi_shot", "when": { "<": ["buff.beast_cleave.remains", 0.5] } },
      { "call_list": "st" }
    ],
    "st": [
      { "spell": "barbed_shot", "when": "frenzy_needs_barbed" },
      { "spell": "kill_shot", "when": { "<": ["target.health.pct", 20] } },
      { "spell": "kill_command" },
      { "spell": "barbed_shot", "when": { ">=": ["cooldown.barbed_shot.charges", 2] } },
      { "spell": "dire_beast" },
      { "spell": "cobra_shot", "when": { ">=": ["focus", 50] } }
    ]
  },
  "actions": [
    { "call_list": "cooldowns" },
    { "call_list": "cleave", "when": { ">=": ["active_enemies", 2] } },
    { "call_list": "st" }
  ]
}
```
