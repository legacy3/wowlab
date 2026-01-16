# Expressions

Combining conditions with logic and math.

## Type System

Three value types:

| Type  | Rust   | Description           |
| ----- | ------ | --------------------- |
| Bool  | `bool` | Boolean true/false    |
| Int   | `i64`  | 64-bit signed integer |
| Float | `f64`  | 64-bit floating point |

**Type rules:**

- Arithmetic operations (`add`, `sub`, `mul`, `div`, `mod`) always return Float
- Int operands are promoted to Float for arithmetic
- Comparisons work on any numeric types (Int vs Float ok, both promoted to Float)
- Logic operators (`and`, `or`, `not`) require Bool operands
- Type mismatches caught at parse time where possible
- Runtime type errors should not occur with valid rotations

**Limits:**

- Maximum expression depth: 100 levels (parse-time error if exceeded)

## Literals

| Type    | Returns | Description     |
| ------- | ------- | --------------- |
| `bool`  | Bool    | Literal boolean |
| `int`   | Int     | Literal integer |
| `float` | Float   | Literal float   |

## Logic

| Type  | Returns | Description                                     |
| ----- | ------- | ----------------------------------------------- |
| `and` | Bool    | All operands true (short-circuit left to right) |
| `or`  | Bool    | Any operand true (short-circuit left to right)  |
| `not` | Bool    | Negate single Bool operand                      |

**Semantics:**

- `and`/`or` with empty operands: parse-time error (minimum 1 operand required)
- `and` with single operand: returns that operand's value
- `or` with single operand: returns that operand's value
- Short-circuit evaluation: stops at first false (`and`) or first true (`or`)

## Comparison

| Type  | Returns | Description   |
| ----- | ------- | ------------- |
| `gt`  | Bool    | left > right  |
| `gte` | Bool    | left >= right |
| `lt`  | Bool    | left < right  |
| `lte` | Bool    | left <= right |
| `eq`  | Bool    | left == right |
| `ne`  | Bool    | left != right |

Operands can be any numeric type (Int or Float). Mixed types promoted to Float for comparison.

## Arithmetic

| Type  | Returns | Description                |
| ----- | ------- | -------------------------- |
| `add` | Float   | left + right               |
| `sub` | Float   | left - right               |
| `mul` | Float   | left \* right              |
| `div` | Float   | left / right               |
| `mod` | Float   | left % right (true modulo) |

Int operands promoted to Float. All arithmetic returns Float.

**Division behavior:**

- Division by zero returns `0.0` (NOT infinity or NaN)
- Modulo by zero returns `0.0`
- This is intentional for safe rotation logic

**Modulo semantics:**

- True modulo: result has same sign as divisor
- Example: `-7 mod 3 = 2` (not -1)

## Functions

| Type    | Operands | Returns | Description    |
| ------- | -------- | ------- | -------------- |
| `floor` | 1        | Float   | Round down     |
| `ceil`  | 1        | Float   | Round up       |
| `abs`   | 1        | Float   | Absolute value |
| `min`   | 2        | Float   | Minimum of two |
| `max`   | 2        | Float   | Maximum of two |

All functions accept Int or Float operands (promoted to Float) and return Float.

## Variables

| Type  | Returns       | Description                     |
| ----- | ------------- | ------------------------------- |
| `var` | declared type | User-defined variable reference |

**Variable system:**

- Variables declared in rotation header with explicit type (Bool, Int, or Float)
- `Var { name }` returns the type declared at definition
- Referencing undefined variable: parse-time error
- Variables are rotation-scoped (persist across action lists within a rotation)
- Variables are mutable via `set_var` and `modify_var` actions (see 08-actions.md)

## JSON Examples

```json
// Literal
{"type": "bool", "value": true}
{"type": "int", "value": 50}
{"type": "float", "value": 1.5}

// Comparison
{
  "type": "gte",
  "left": {"type": "resource_current", "resource": "focus"},
  "right": {"type": "float", "value": 50}
}

// Logic
{
  "type": "and",
  "operands": [
    {"type": "cooldown_ready", "spell": "kill_command"},
    {"type": "gte",
     "left": {"type": "resource_current", "resource": "focus"},
     "right": {"type": "float", "value": 30}
    }
  ]
}

// Complex
{
  "type": "and",
  "operands": [
    {"type": "aura_active", "aura": "bestial_wrath", "on": "player"},
    {"type": "lte",
     "left": {"type": "cooldown_remaining", "spell": "kill_command"},
     "right": {"type": "gcd_remaining"}
    }
  ]
}

// Variable reference
{
  "type": "gt",
  "left": {"type": "var", "name": "pooling_threshold"},
  "right": {"type": "resource_current", "resource": "focus"}
}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    // Literals
    Bool { value: bool },
    Int { value: i64 },
    Float { value: f64 },

    // Logic
    And { operands: Vec<Expr> },
    Or { operands: Vec<Expr> },
    Not { operand: Box<Expr> },

    // Comparison
    Gt { left: Box<Expr>, right: Box<Expr> },
    Gte { left: Box<Expr>, right: Box<Expr> },
    Lt { left: Box<Expr>, right: Box<Expr> },
    Lte { left: Box<Expr>, right: Box<Expr> },
    Eq { left: Box<Expr>, right: Box<Expr> },
    Ne { left: Box<Expr>, right: Box<Expr> },

    // Arithmetic
    Add { left: Box<Expr>, right: Box<Expr> },
    Sub { left: Box<Expr>, right: Box<Expr> },
    Mul { left: Box<Expr>, right: Box<Expr> },
    Div { left: Box<Expr>, right: Box<Expr> },
    Mod { left: Box<Expr>, right: Box<Expr> },

    // Functions
    Floor { operand: Box<Expr> },
    Ceil { operand: Box<Expr> },
    Abs { operand: Box<Expr> },
    Min { left: Box<Expr>, right: Box<Expr> },
    Max { left: Box<Expr>, right: Box<Expr> },

    // Variables
    Var { name: String },

    // All conditions...
}
```
