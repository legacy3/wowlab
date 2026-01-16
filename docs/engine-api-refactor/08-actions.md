# Actions

What a rotation can do.

## Execution Model

Rotation is evaluated **once per GCD opportunity**. Actions execute sequentially until one **consumes the GCD**, then rotation evaluation stops for this cycle.

**GCD-consuming actions** (stop rotation evaluation when successful):

- `cast` - casts a spell
- `use_trinket` - uses trinket by slot
- `use_item` - uses item by name

**Non-GCD actions** (always continue to next action):

- `set_var` - set a variable
- `modify_var` - modify a variable
- `call` - execute sub-list (stops only if sub-list consumed GCD)
- `run` - execute sub-list (always continues after)

**GCD-cycle consuming actions** (rotation re-evaluates after):

- `wait` - pause for fixed time
- `wait_until` - pause until condition
- `pool` - wait for resources

## Action Types

| Type          | Description                          | Consumes GCD        |
| ------------- | ------------------------------------ | ------------------- |
| `cast`        | Cast a spell                         | Yes (if successful) |
| `call`        | Run a sub-list, stop if GCD consumed | Propagates          |
| `run`         | Run a sub-list, always continue      | Never               |
| `set_var`     | Set a variable                       | No                  |
| `modify_var`  | Modify a variable                    | No                  |
| `wait`        | Wait fixed time                      | Cycle               |
| `wait_until`  | Wait until condition true            | Cycle               |
| `pool`        | Pool resources                       | Cycle               |
| `use_trinket` | Use trinket by slot                  | Yes (if successful) |
| `use_item`    | Use item by name                     | Yes (if successful) |

## Action Details

### cast

Attempts to cast the specified spell.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Check spell requirements (cooldown, resources, range, etc.)
3. If requirements met: cast spell, consume GCD, stop rotation evaluation
4. If requirements NOT met: skip action, continue to next

```json
{"type": "cast", "spell": "kill_command"}
{"type": "cast", "spell": "kill_command", "condition": {...}}
```

### call

Execute a sub-list. If ANY action in the sub-list consumed the GCD, stop rotation evaluation. Otherwise, continue to next action.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Execute sub-list actions sequentially (same rules as main list)
3. If sub-list consumed GCD: stop rotation evaluation
4. If sub-list did NOT consume GCD: continue to next action

```json
{"type": "call", "list": "cooldowns"}
{"type": "call", "list": "cooldowns", "condition": {...}}
```

### run

Execute a sub-list. Always continue to next action after sub-list completes, regardless of whether GCD was consumed.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Execute sub-list actions sequentially (same rules as main list)
3. Always continue to next action (even if sub-list consumed GCD)

Use case: Execute a list for side effects (variable setup, etc.) then continue.

```json
{"type": "run", "list": "aoe"}
{"type": "run", "list": "setup", "condition": {...}}
```

### set_var

Set a variable to a new value.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Set variable to evaluated value
3. Continue to next action

```json
{
  "type": "set_var",
  "name": "pooling",
  "value": { "type": "bool", "value": true }
}
```

### modify_var

Modify a variable using an operation.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Apply operation to variable
3. Continue to next action

```json
{"type": "modify_var", "name": "count", "op": "add", "value": {"type": "int", "value": 1}}
{"type": "modify_var", "name": "pooling", "op": "reset"}
```

### wait

Pause execution for a fixed duration, then re-evaluate rotation.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Pause for specified seconds
3. Consume GCD cycle (rotation re-evaluates after wait)

```json
{"type": "wait", "seconds": 0.5}
{"type": "wait", "seconds": 1.0, "condition": {...}}
```

### wait_until

Pause execution until condition becomes true OR timeout (10 seconds max).

**Behavior:**

1. Wait until condition evaluates to true
2. Timeout after 10 seconds (whichever comes first)
3. Consume GCD cycle (rotation re-evaluates after)

```json
{
  "type": "wait_until",
  "condition": { "type": "cooldown_ready", "spell": "bestial_wrath" }
}
```

### pool

Wait for primary resource to reach (max - deficit) amount.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Wait until resource >= (max_resource - deficit)
3. `deficit` defaults to 0 (wait for full resource)
4. Timeout after 10 seconds (continues anyway)
5. Consume GCD cycle (rotation re-evaluates after)

```json
{"type": "pool"}
{"type": "pool", "deficit": 20}
{"type": "pool", "deficit": 30, "condition": {...}}
```

### use_trinket

Use a trinket by slot number (1 or 2).

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Check trinket exists and is off cooldown
3. If usable: use trinket, consume GCD, stop rotation evaluation
4. If NOT usable (empty slot, on CD): skip action silently, continue to next

```json
{"type": "use_trinket", "slot": 1}
{"type": "use_trinket", "slot": 2, "condition": {...}}
```

### use_item

Use an item by name.

**Behavior:**

1. Check `condition` (if present) - skip action if false
2. Check item exists in inventory and is off cooldown
3. If usable: use item, consume GCD, stop rotation evaluation
4. If NOT usable (not found, on CD): skip action silently, continue to next

```json
{"type": "use_item", "name": "potion_of_spectral_agility"}
{"type": "use_item", "name": "healthstone", "condition": {...}}
```

## Variable Operations

| Op      | Description             | Valid Types |
| ------- | ----------------------- | ----------- |
| `set`   | `var = value`           | all         |
| `add`   | `var += value`          | int, float  |
| `sub`   | `var -= value`          | int, float  |
| `mul`   | `var *= value`          | int, float  |
| `div`   | `var /= value`          | int, float  |
| `min`   | `var = min(var, value)` | int, float  |
| `max`   | `var = max(var, value)` | int, float  |
| `reset` | `var = initial_value`   | all         |

**Variable Scope:**

- Variables must be declared in rotation header (`variables` field)
- Variables persist across rotation cycles until explicitly modified
- `reset` operation returns variable to its initial value from header
- Type must match operation (cannot `add` to a bool)

## Validation Rules

**Parse-time errors:**

- Unknown list name in `call` or `run`
- Unknown variable name in `set_var`, `modify_var`, or expressions
- Type mismatch (e.g., `add` operation on bool variable)

**Runtime behavior:**

- Circular call references: allowed (user responsibility to avoid infinite loops)
- Max call depth: 50 levels (exceeding causes rotation to stop for cycle)

## JSON Examples

```json
{"type": "cast", "spell": "kill_command"}
{"type": "cast", "spell": "kill_command", "condition": {...}}

{"type": "call", "list": "cooldowns"}
{"type": "run", "list": "aoe"}

{"type": "set_var", "name": "pooling", "value": {"type": "bool", "value": true}}
{"type": "modify_var", "name": "count", "op": "add", "value": {"type": "int", "value": 1}}
{"type": "modify_var", "name": "pooling", "op": "reset"}

{"type": "wait", "seconds": 0.5}
{"type": "wait_until", "condition": {"type": "cooldown_ready", "spell": "bestial_wrath"}}

{"type": "pool", "deficit": 20}

{"type": "use_trinket", "slot": 1}
{"type": "use_item", "name": "potion_of_spectral_agility"}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    Cast {
        spell: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    Call {
        list: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    Run {
        list: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    SetVar {
        name: String,
        value: Expr,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    ModifyVar {
        name: String,
        op: VarOp,
        value: Expr,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    Wait {
        seconds: f64,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    WaitUntil {
        condition: Expr,
    },
    Pool {
        #[serde(skip_serializing_if = "Option::is_none")]
        deficit: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    UseTrinket {
        slot: u8,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
    UseItem {
        name: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition: Option<Expr>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VarOp {
    Set,
    Add,
    Sub,
    Mul,
    Div,
    Min,
    Max,
    Reset,
}
```

## Rotation Structure

```json
{
  "name": "BM Hunter ST",
  "variables": {
    "pooling": {"type": "bool", "value": false},
    "barbed_threshold": {"type": "float", "value": 1.4}
  },
  "lists": {
    "cooldowns": [
      {"type": "cast", "spell": "bestial_wrath"},
      {"type": "cast", "spell": "aspect_of_the_wild"}
    ],
    "st": [
      {"type": "cast", "spell": "kill_command", "condition": {...}},
      {"type": "cast", "spell": "barbed_shot", "condition": {...}},
      {"type": "cast", "spell": "cobra_shot"}
    ]
  },
  "actions": [
    {"type": "call", "list": "cooldowns"},
    {"type": "run", "list": "st"}
  ]
}
```

## Rust Rotation Struct

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rotation {
    pub name: String,
    pub variables: HashMap<String, Expr>,
    pub lists: HashMap<String, Vec<Action>>,
    pub actions: Vec<Action>,
}
```
