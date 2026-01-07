# TOML Declarative DSL for Rotation Scripting

A declarative TOML-based DSL for rotation scripting that compiles to the JIT-optimized rotation system. This approach leverages the existing TOML infrastructure used for tuning files while providing a structured, type-safe way to define rotations.

## Target Structure

The DSL compiles to this Rust representation:

```rust
pub enum JitCondition {
    CooldownReady(u8),
    ChargesGe(u8, u8),
    FocusGe(f32),
    AuraActive(u8),
    AuraRemainingLe(u8, f32),
    TargetHealthLt(f32),
    And(Box<JitCondition>, Box<JitCondition>),
    Or(Box<JitCondition>, Box<JitCondition>),
    Not(Box<JitCondition>),
    True,
}

pub struct JitEntry {
    pub condition: JitCondition,
    pub spell_id: u8,
}
```

---

## TOML Syntax Specification

### Rotation Header

```toml
[rotation]
name = "bm_hunter_st"
spec = "beast_mastery"
description = "Beast Mastery Hunter single target rotation"
version = "1.0"
```

### Action Entries

Actions use `[[action]]` array tables, evaluated in priority order (first match wins):

```toml
[[action]]
spell = "bestial_wrath"
condition = "cooldown.ready"
```

### Condition Syntax

#### Simple Conditions (String Form)

For simple conditions, use a string:

```toml
condition = "cooldown.ready"
condition = "true"
```

#### Parameterized Conditions (Table Form)

For conditions with parameters, use inline tables:

```toml
condition = { focus_ge = 30 }
condition = { charges_ge = [1] }  # spell's own charges
condition = { aura_active = "frenzy" }
condition = { aura_remaining_le = ["frenzy", 2.0] }
condition = { target_health_lt = 0.20 }
```

#### Composite Conditions

Use `all` (AND) and `any` (OR) for compound conditions:

```toml
# AND: all conditions must be true
condition = { all = ["cooldown.ready", { focus_ge = 30 }] }

# OR: any condition must be true
condition = { any = [{ charges_ge = [2] }, { aura_remaining_le = ["frenzy", 2.0] }] }

# NOT: negate a condition
condition = { not = { aura_active = "frenzy" } }

# Nested composition
condition = { all = [
    "cooldown.ready",
    { any = [
        { charges_ge = [2] },
        { not = { aura_active = "frenzy" } }
    ]}
]}
```

### Complete Condition Reference

| Condition | String Form | Table Form | JitCondition Variant |
|-----------|-------------|------------|---------------------|
| Cooldown ready | `"cooldown.ready"` | - | `CooldownReady(spell_id)` |
| Charges >= N | - | `{ charges_ge = [N] }` | `ChargesGe(spell_id, N)` |
| Focus >= N | - | `{ focus_ge = N }` | `FocusGe(N)` |
| Aura active | - | `{ aura_active = "name" }` | `AuraActive(aura_id)` |
| Aura remaining <= N | - | `{ aura_remaining_le = ["name", N] }` | `AuraRemainingLe(aura_id, N)` |
| Target health < N | - | `{ target_health_lt = N }` | `TargetHealthLt(N)` |
| Always true | `"true"` | - | `True` |
| AND | - | `{ all = [...] }` | `And(Box, Box)` |
| OR | - | `{ any = [...] }` | `Or(Box, Box)` |
| NOT | - | `{ not = {...} }` | `Not(Box)` |

---

## Complete BM Hunter Rotation Example

```toml
# Beast Mastery Hunter - Single Target
# Priority-based rotation for optimal DPS

[rotation]
name = "bm_hunter_st"
spec = "beast_mastery"
description = "Single target priority list for Beast Mastery Hunter"
version = "1.0"

# Spell ID mappings (referenced by name below)
[spells]
kill_shot = 53351
call_of_the_wild = 359844
bestial_wrath = 19574
bloodshed = 321530
barbed_shot = 217200
kill_command = 34026
dire_beast = 120679
cobra_shot = 193455

[auras]
bestial_wrath = 19574
frenzy = 272790
beast_cleave = 268877

# ============================================================================
# Priority 1: Execute Phase
# ============================================================================

[[action]]
spell = "kill_shot"
comment = "Kill Shot in execute range"
condition = { all = ["cooldown.ready", { target_health_lt = 0.20 }] }

# ============================================================================
# Priority 2: Major Cooldowns
# ============================================================================

[[action]]
spell = "call_of_the_wild"
comment = "Call of the Wild on cooldown"
condition = "cooldown.ready"

[[action]]
spell = "bestial_wrath"
comment = "Bestial Wrath on cooldown"
condition = "cooldown.ready"

[[action]]
spell = "bloodshed"
comment = "Bloodshed during Bestial Wrath"
condition = { all = ["cooldown.ready", { aura_active = "bestial_wrath" }] }

# ============================================================================
# Priority 3: Barbed Shot Management
# ============================================================================

[[action]]
spell = "barbed_shot"
comment = "Barbed Shot to maintain Frenzy stacks (refresh before expiry)"
condition = { all = [
    { charges_ge = [1] },
    { any = [
        { aura_remaining_le = ["frenzy", 2.0] },
        { not = { aura_active = "frenzy" } }
    ]}
]}

[[action]]
spell = "barbed_shot"
comment = "Barbed Shot at 2 charges to avoid capping"
condition = { charges_ge = [2] }

# ============================================================================
# Priority 4: Core Rotational Abilities
# ============================================================================

[[action]]
spell = "kill_command"
comment = "Kill Command on cooldown with focus"
condition = { all = ["cooldown.ready", { focus_ge = 30 }] }

[[action]]
spell = "dire_beast"
comment = "Dire Beast on cooldown"
condition = "cooldown.ready"

# ============================================================================
# Priority 5: Filler
# ============================================================================

[[action]]
spell = "cobra_shot"
comment = "Cobra Shot as filler when focus is high or Kill Command on cooldown"
condition = { any = [
    { focus_ge = 80 },
    { all = [{ focus_ge = 50 }, { not = "cooldown.ready" }] }
]}

# ============================================================================
# Fallback: Wait for GCD
# ============================================================================

[[action]]
spell = "wait_gcd"
comment = "Wait for resources or cooldowns"
condition = "true"
```

---

## Complete MM Hunter Rotation Example

```toml
# Marksmanship Hunter - Single Target
# Priority-based rotation for optimal DPS

[rotation]
name = "mm_hunter_st"
spec = "marksmanship"
description = "Single target priority list for Marksmanship Hunter"
version = "1.0"

# Spell ID mappings
[spells]
kill_shot = 53351
trueshot = 288613
aimed_shot = 19434
rapid_fire = 257044
arcane_shot = 185358
steady_shot = 56641
chimaera_shot = 342049
volley = 260243

[auras]
trueshot = 288613
precise_shots = 260242
lock_and_load = 194594
trick_shots = 257622

# ============================================================================
# Priority 1: Execute Phase
# ============================================================================

[[action]]
spell = "kill_shot"
comment = "Kill Shot in execute range"
condition = { all = ["cooldown.ready", { target_health_lt = 0.20 }] }

# ============================================================================
# Priority 2: Major Cooldowns
# ============================================================================

[[action]]
spell = "trueshot"
comment = "Trueshot on cooldown"
condition = "cooldown.ready"

[[action]]
spell = "volley"
comment = "Volley on cooldown"
condition = "cooldown.ready"

# ============================================================================
# Priority 3: Core Rotational Abilities
# ============================================================================

[[action]]
spell = "aimed_shot"
comment = "Aimed Shot on cooldown with sufficient focus"
condition = { all = ["cooldown.ready", { focus_ge = 35 }] }

[[action]]
spell = "rapid_fire"
comment = "Rapid Fire on cooldown"
condition = "cooldown.ready"

[[action]]
spell = "chimaera_shot"
comment = "Chimaera Shot to spend focus"
condition = { all = ["cooldown.ready", { focus_ge = 40 }] }

# ============================================================================
# Priority 4: Precise Shots Consumption
# ============================================================================

[[action]]
spell = "arcane_shot"
comment = "Arcane Shot to consume Precise Shots"
condition = { all = [{ aura_active = "precise_shots" }, { focus_ge = 20 }] }

# ============================================================================
# Priority 5: Focus Management
# ============================================================================

[[action]]
spell = "steady_shot"
comment = "Steady Shot to regenerate focus when low"
condition = { not = { focus_ge = 50 } }

[[action]]
spell = "arcane_shot"
comment = "Arcane Shot as high-focus filler"
condition = { focus_ge = 70 }

# ============================================================================
# Fallback
# ============================================================================

[[action]]
spell = "steady_shot"
comment = "Steady Shot as default filler"
condition = "true"
```

---

## Mapping TOML to JitCondition

### Parsing Flow

```
TOML String/Table
       │
       ▼
  TomlCondition (serde)
       │
       ▼
  JitCondition (runtime)
```

### Mapping Table

| TOML Form | JitCondition |
|-----------|-------------|
| `"cooldown.ready"` | `CooldownReady(spell_id)` - spell_id from current action |
| `"true"` | `True` |
| `{ focus_ge = 30 }` | `FocusGe(30.0)` |
| `{ charges_ge = [2] }` | `ChargesGe(spell_id, 2)` - spell_id from current action |
| `{ aura_active = "frenzy" }` | `AuraActive(lookup("frenzy"))` |
| `{ aura_remaining_le = ["frenzy", 2.0] }` | `AuraRemainingLe(lookup("frenzy"), 2.0)` |
| `{ target_health_lt = 0.20 }` | `TargetHealthLt(0.20)` |
| `{ all = [a, b] }` | `And(Box::new(a), Box::new(b))` |
| `{ any = [a, b] }` | `Or(Box::new(a), Box::new(b))` |
| `{ not = x }` | `Not(Box::new(x))` |

### Multi-way AND/OR Reduction

TOML `all` and `any` with more than 2 elements are reduced to nested binary operations:

```toml
{ all = [a, b, c, d] }
```

Becomes:

```rust
And(
    Box::new(And(
        Box::new(And(a, b)),
        c
    )),
    d
)
```

---

## Serde Deserialization Structs

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Root rotation file structure
#[derive(Debug, Deserialize, Serialize)]
pub struct RotationFile {
    pub rotation: RotationMeta,
    #[serde(default)]
    pub spells: HashMap<String, u8>,
    #[serde(default)]
    pub auras: HashMap<String, u8>,
    #[serde(rename = "action")]
    pub actions: Vec<ActionEntry>,
}

/// Rotation metadata
#[derive(Debug, Deserialize, Serialize)]
pub struct RotationMeta {
    pub name: String,
    pub spec: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
}

/// Single action in the priority list
#[derive(Debug, Deserialize, Serialize)]
pub struct ActionEntry {
    pub spell: String,
    pub condition: TomlCondition,
    #[serde(default)]
    pub comment: Option<String>,
}

/// Condition that can be a string or structured table
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(untagged)]
pub enum TomlCondition {
    /// Simple string conditions: "cooldown.ready", "true"
    Simple(String),
    /// Structured conditions
    Structured(StructuredCondition),
}

/// Structured condition variants
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum StructuredCondition {
    /// focus >= value
    FocusGe(f32),
    /// spell charges >= [count]
    ChargesGe(Vec<u8>),
    /// aura is active
    AuraActive(String),
    /// aura remaining time <= [aura_name, seconds]
    AuraRemainingLe(Vec<TomlValue>),
    /// target health < percent
    TargetHealthLt(f32),
    /// All conditions must be true (AND)
    All(Vec<TomlCondition>),
    /// Any condition must be true (OR)
    Any(Vec<TomlCondition>),
    /// Negate a condition
    Not(Box<TomlCondition>),
}

/// Helper for mixed-type arrays in TOML
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(untagged)]
pub enum TomlValue {
    String(String),
    Float(f64),
    Int(i64),
}

impl TomlValue {
    pub fn as_string(&self) -> Option<&str> {
        match self {
            TomlValue::String(s) => Some(s),
            _ => None,
        }
    }

    pub fn as_f32(&self) -> Option<f32> {
        match self {
            TomlValue::Float(f) => Some(*f as f32),
            TomlValue::Int(i) => Some(*i as f32),
            _ => None,
        }
    }
}
```

---

## Compiler Implementation

```rust
use std::collections::HashMap;

/// Compilation context for resolving names to IDs
pub struct CompileContext {
    pub spells: HashMap<String, u8>,
    pub auras: HashMap<String, u8>,
    pub current_spell_id: u8,
}

/// Error type for compilation failures
#[derive(Debug)]
pub enum CompileError {
    UnknownSpell(String),
    UnknownAura(String),
    InvalidCondition(String),
    MissingParameter(String),
}

impl RotationFile {
    /// Compile TOML rotation to JIT entries
    pub fn compile(&self) -> Result<Vec<JitEntry>, CompileError> {
        let mut entries = Vec::new();

        for action in &self.actions {
            // Skip wait_gcd (handled as fallback)
            if action.spell == "wait_gcd" {
                continue;
            }

            // Resolve spell name to ID
            let spell_id = self.spells.get(&action.spell)
                .copied()
                .ok_or_else(|| CompileError::UnknownSpell(action.spell.clone()))?;

            // Build compilation context
            let ctx = CompileContext {
                spells: self.spells.clone(),
                auras: self.auras.clone(),
                current_spell_id: spell_id,
            };

            // Compile condition
            let condition = action.condition.compile(&ctx)?;

            entries.push(JitEntry {
                condition,
                spell_id,
            });
        }

        Ok(entries)
    }
}

impl TomlCondition {
    /// Compile TOML condition to JitCondition
    pub fn compile(&self, ctx: &CompileContext) -> Result<JitCondition, CompileError> {
        match self {
            TomlCondition::Simple(s) => compile_simple(s, ctx),
            TomlCondition::Structured(s) => s.compile(ctx),
        }
    }
}

fn compile_simple(s: &str, ctx: &CompileContext) -> Result<JitCondition, CompileError> {
    match s {
        "cooldown.ready" => Ok(JitCondition::CooldownReady(ctx.current_spell_id)),
        "true" => Ok(JitCondition::True),
        _ => Err(CompileError::InvalidCondition(s.to_string())),
    }
}

impl StructuredCondition {
    pub fn compile(&self, ctx: &CompileContext) -> Result<JitCondition, CompileError> {
        match self {
            StructuredCondition::FocusGe(val) => {
                Ok(JitCondition::FocusGe(*val))
            }

            StructuredCondition::ChargesGe(params) => {
                let count = params.get(0).copied().unwrap_or(1);
                Ok(JitCondition::ChargesGe(ctx.current_spell_id, count))
            }

            StructuredCondition::AuraActive(name) => {
                let aura_id = ctx.auras.get(name)
                    .copied()
                    .ok_or_else(|| CompileError::UnknownAura(name.clone()))?;
                Ok(JitCondition::AuraActive(aura_id))
            }

            StructuredCondition::AuraRemainingLe(params) => {
                let name = params.get(0)
                    .and_then(|v| v.as_string())
                    .ok_or_else(|| CompileError::MissingParameter("aura name".into()))?;
                let seconds = params.get(1)
                    .and_then(|v| v.as_f32())
                    .ok_or_else(|| CompileError::MissingParameter("seconds".into()))?;
                let aura_id = ctx.auras.get(name)
                    .copied()
                    .ok_or_else(|| CompileError::UnknownAura(name.to_string()))?;
                Ok(JitCondition::AuraRemainingLe(aura_id, seconds))
            }

            StructuredCondition::TargetHealthLt(val) => {
                Ok(JitCondition::TargetHealthLt(*val))
            }

            StructuredCondition::All(conditions) => {
                compile_all(conditions, ctx)
            }

            StructuredCondition::Any(conditions) => {
                compile_any(conditions, ctx)
            }

            StructuredCondition::Not(inner) => {
                let compiled = inner.compile(ctx)?;
                Ok(JitCondition::Not(Box::new(compiled)))
            }
        }
    }
}

/// Compile AND condition (reduces list to binary tree)
fn compile_all(conditions: &[TomlCondition], ctx: &CompileContext) -> Result<JitCondition, CompileError> {
    if conditions.is_empty() {
        return Ok(JitCondition::True);
    }
    if conditions.len() == 1 {
        return conditions[0].compile(ctx);
    }

    let mut iter = conditions.iter();
    let first = iter.next().unwrap().compile(ctx)?;

    iter.try_fold(first, |acc, cond| {
        let compiled = cond.compile(ctx)?;
        Ok(JitCondition::And(Box::new(acc), Box::new(compiled)))
    })
}

/// Compile OR condition (reduces list to binary tree)
fn compile_any(conditions: &[TomlCondition], ctx: &CompileContext) -> Result<JitCondition, CompileError> {
    if conditions.is_empty() {
        return Ok(JitCondition::True);
    }
    if conditions.len() == 1 {
        return conditions[0].compile(ctx);
    }

    let mut iter = conditions.iter();
    let first = iter.next().unwrap().compile(ctx)?;

    iter.try_fold(first, |acc, cond| {
        let compiled = cond.compile(ctx)?;
        Ok(JitCondition::Or(Box::new(acc), Box::new(compiled)))
    })
}
```

---

## Loading and Using Rotations

```rust
use std::path::Path;

/// Load rotation from TOML file
pub fn load_rotation(path: &Path) -> Result<Vec<JitEntry>, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    let rotation_file: RotationFile = toml::from_str(&content)?;
    let entries = rotation_file.compile()?;
    Ok(entries)
}

/// Example usage in simulation
pub fn example_usage() {
    let entries = load_rotation(Path::new("rotations/bm_hunter_st.toml"))
        .expect("Failed to load rotation");

    // Pass to JIT compiler
    // let compiled = jit_compile(&entries);

    // Or evaluate directly
    for entry in &entries {
        println!("Spell {}: {:?}", entry.spell_id, entry.condition);
    }
}
```

---

## Pros and Cons

### Pros

| Aspect | Benefit |
|--------|---------|
| **Familiarity** | Uses same TOML format as existing tuning files |
| **Type Safety** | Serde provides compile-time type checking |
| **Readability** | Declarative structure is self-documenting |
| **Tooling** | Existing TOML editors, linters, and formatters work |
| **Validation** | Can validate rotations before runtime |
| **Hot Reload** | File-based rotations can be reloaded without recompilation |
| **Diff-Friendly** | Clear line-by-line changes in version control |
| **Comments** | Native TOML comments and `comment` field for documentation |
| **Separation** | Rotation logic separate from Rust code |

### Cons

| Aspect | Limitation |
|--------|------------|
| **Verbosity** | More verbose than DSL-specific syntax for complex conditions |
| **Nesting** | Deeply nested conditions become hard to read |
| **Limited Expressions** | No arithmetic expressions (can't do `focus >= 30 + spell_cost`) |
| **Static Analysis** | Limited ability to optimize at parse time |
| **Learning Curve** | Users must learn TOML table/array syntax |
| **No IDE Support** | No syntax highlighting specific to rotation DSL |
| **Error Messages** | TOML parse errors may be cryptic for rotation-specific issues |
| **Two-Step Compilation** | Requires both TOML parse and condition compilation |

### When to Use TOML DSL

**Good fit:**
- Projects already using TOML for configuration
- Rotations with moderate complexity (10-30 actions)
- Need for hot-reloadable rotation files
- User-editable rotations without Rust knowledge
- Integration with external tools expecting standard formats

**Poor fit:**
- Very complex rotations with deep condition nesting
- Need for runtime-computed thresholds
- Extreme performance requirements (prefer native Rust)
- Rotations requiring custom logic not expressible in conditions

---

## File Organization

```
crates/engine/
  data/
    rotations/
      bm_hunter_st.toml
      bm_hunter_aoe.toml
      mm_hunter_st.toml
      mm_hunter_aoe.toml
    tuning/
      bm_hunter.toml
      mm_hunter.toml
  src/
    rotation/
      toml/
        mod.rs          # Public API
        types.rs        # Serde structs
        compile.rs      # TOML -> JitCondition compiler
        validate.rs     # Rotation validation
```

---

## CLI Integration

```bash
# Validate a rotation file
./target/release/engine validate-rotation -f data/rotations/bm_hunter_st.toml

# Run simulation with TOML rotation
./target/release/engine sim -s bm-hunter --rotation data/rotations/bm_hunter_st.toml

# List available rotations
./target/release/engine list-rotations

# Compare rotation performance
./target/release/engine bench-rotation -f data/rotations/bm_hunter_st.toml
```

---

## Extending the DSL

To add new condition types:

1. Add variant to `JitCondition` enum
2. Add variant to `StructuredCondition` enum with appropriate serde attributes
3. Implement compilation in `StructuredCondition::compile`
4. Update documentation

Example adding `ComboPointsGe`:

```rust
// In JitCondition
ComboPointsGe(u8),

// In StructuredCondition
#[serde(rename = "combo_points_ge")]
ComboPointsGe(u8),

// In compile
StructuredCondition::ComboPointsGe(val) => {
    Ok(JitCondition::ComboPointsGe(*val))
}
```

TOML usage:

```toml
condition = { combo_points_ge = 5 }
```
