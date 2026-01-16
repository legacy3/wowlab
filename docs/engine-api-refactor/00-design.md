# Rotation Condition API Design

JSON-serialized conditions evaluated by the Rust engine. Frontend (React) builds these, engine evaluates them.

## Format

Every condition is a JSON object with `type` discriminator. Serde tagged enum with **snake_case**.

```json
{"type": "resource_deficit", "resource": "focus"}
{"type": "cooldown_ready", "spell": "kill_command"}
{"type": "aura_active", "aura": "bestial_wrath", "on": "player"}
```

## Design Principles

1. **Explicit over implicit** - No defaults that hide behavior
2. **One way to do things** - No aliases
3. **Typed** - Bool returns bool, number returns number
4. **Validated at parse time** - Unknown spells/auras error immediately
5. **snake_case everywhere** - Idiomatic for Rust, clear in JSON

## Categories

| Category | Prefix       | Example                                |
| -------- | ------------ | -------------------------------------- |
| Resource | `resource_*` | `resource_current`, `resource_deficit` |
| Cooldown | `cooldown_*` | `cooldown_ready`, `cooldown_remaining` |
| Aura     | `aura_*`     | `aura_active`, `aura_stacks`           |
| Combat   | `combat_*`   | `combat_time`, `combat_remaining`      |
| Target   | `target_*`   | `target_health_percent`                |
| Enemy    | `enemy_*`    | `enemy_count`                          |
| Player   | `player_*`   | `player_health_percent`                |
| Spell    | `spell_*`    | `spell_cost`, `spell_cast_time`        |
| Talent   | `talent_*`   | `talent_enabled`                       |
| GCD      | `gcd_*`      | `gcd_remaining`                        |

## Serde Config

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    // ...
}
```

## String Identifier Validation

All string identifiers (spell names, aura names, resource types, talent names) are validated at parse time.

### Rules

1. **Case insensitive** - `"Kill_Command"`, `"kill_command"`, `"KILL_COMMAND"` all normalize to `kill_command`
2. **Normalized to snake_case** - Spaces and hyphens converted to underscores, consecutive underscores collapsed
3. **Registry lookup** - Identifiers must exist in the game data database
4. **Parse-time failure** - Invalid identifiers produce immediate errors, not runtime failures

### Registry Location

Valid identifiers are loaded from the game data database:

- Spells: `spell_data` table
- Auras: `spell_data` table (auras are spells)
- Resources: Hardcoded enum (`mana`, `rage`, `energy`, `focus`, `runic_power`, etc.)
- Talents: `talent_data` table

### Error Format

```
ParseError: Unknown spell "kill_comand" at path ".spell"
  Hint: Did you mean "kill_command"?
```

### Validation Flow

```
Input JSON
    ↓
Serde deserialize to Expr
    ↓
Validation pass (check all identifiers against registry)
    ↓
Success: Validated Expr
    or
Failure: ParseError with path and suggestion
```

## Evaluator Context

Expressions are evaluated against game state via `EvalContext`.

### EvalContext Struct

```rust
pub struct EvalContext<'a> {
    pub state: &'a SimState,
    pub spell_db: &'a SpellDatabase,
}
```

### Properties

1. **Read-only access** - Context provides immutable reference to game state
2. **Pure evaluation** - Expressions have no side effects; they only read state
3. **Deterministic** - Same state + same expression = same result, always
4. **No allocations** - Evaluation should not allocate; returns primitives

### State Access Pattern

```rust
impl Expr {
    pub fn eval(&self, ctx: &EvalContext) -> Value {
        match self {
            Expr::ResourceCurrent { resource } => {
                Value::Number(ctx.state.player.resources.get(resource))
            }
            Expr::AuraActive { aura, on } => {
                Value::Bool(ctx.state.get_unit(on).auras.has(aura))
            }
            // ...
        }
    }
}
```

## Error Handling

### Parse-Time Errors

Most errors occur at parse time and prevent invalid rotations from running:

| Error             | Cause                       | Example                                  |
| ----------------- | --------------------------- | ---------------------------------------- |
| `UnknownSpell`    | Spell name not in database  | `"spell": "kill_comand"`                 |
| `UnknownAura`     | Aura name not in database   | `"aura": "bestial_wrath_typo"`           |
| `UnknownResource` | Invalid resource type       | `"resource": "manna"`                    |
| `UnknownTalent`   | Talent name not in database | `"talent": "fake_talent"`                |
| `TypeMismatch`    | Wrong value type            | `"stacks": "five"` (expected number)     |
| `MissingField`    | Required field absent       | `{"type": "aura_active"}` (missing aura) |

### Runtime Errors

Runtime errors are minimized by parse-time validation. The few that can occur:

| Error        | Cause                    | Handling                           |
| ------------ | ------------------------ | ---------------------------------- |
| Missing unit | Target doesn't exist     | Returns default value (0 or false) |
| Missing aura | Aura not present on unit | Returns 0 stacks / false active    |

### Error Propagation

```rust
pub enum ParseError {
    UnknownIdentifier { kind: &'static str, name: String, suggestion: Option<String> },
    TypeMismatch { expected: &'static str, found: &'static str, path: String },
    MissingField { field: &'static str, path: String },
}
```

Errors include JSON path for debugging: `".conditions[2].spell"`.

## Numeric Edge Cases

### Division

Division by zero returns `0.0`, not infinity or NaN:

```rust
fn safe_div(a: f64, b: f64) -> f64 {
    if b == 0.0 { 0.0 } else { a / b }
}
```

### Float Comparison

Float comparisons use epsilon tolerance of `1e-6`:

```rust
const EPSILON: f64 = 1e-6;

fn float_eq(a: f64, b: f64) -> bool {
    (a - b).abs() < EPSILON
}

fn float_lte(a: f64, b: f64) -> bool {
    a < b + EPSILON
}
```

### Percentages

All percentages use 0-100 scale, never 0-1:

| Condition               | Returns             |
| ----------------------- | ------------------- |
| `player_health_percent` | `75.0` (not `0.75`) |
| `target_health_percent` | `30.0` (not `0.30`) |
| `resource_percent`      | `50.0` (not `0.50`) |

### Time Values

All time values are in seconds as `f64`:

| Condition        | Example Return |
| ---------------- | -------------- |
| `cooldown_remaining`   | `8.5` seconds  |
| `aura_remaining` | `12.3` seconds |
| `gcd_remaining`  | `0.7` seconds  |
| `combat_time`    | `45.2` seconds |

## Relationship to Existing Code

### Replaces ast.rs

This design **replaces** the existing `crates/engine/src/rotation/ast.rs`. The current AST has grown organically and has inconsistencies this design fixes.

### Migration Strategy

Migration is incremental:

1. **Phase 1**: Implement new `Expr` enum alongside existing `Condition`
2. **Phase 2**: Add conversion layer `Condition -> Expr`
3. **Phase 3**: Update rotation parser to emit `Expr` directly
4. **Phase 4**: Remove old `Condition` type

### Backwards Compatibility

During migration, existing rotations continue to work via the conversion layer. New rotations should use the new format.
